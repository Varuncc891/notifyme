import dns from "node:dns";
import https from "node:https";
import ipaddr from "ipaddr.js";
import { config } from "../config";

const blockedV4: Array<[string, number]> = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16],
];
const blockedV6: Array<[string, number]> = [["::1", 128], ["fc00::", 7], ["fe80::", 10], ["::", 128]];

export class SsrfBlockedError extends Error {
  readonly code = "ERR_SSRF_BLOCKED";
  constructor() { super("Webhook target resolved to a blocked IP address"); this.name = "SsrfBlockedError"; }
}

export function isBlockedIp(address: string): boolean {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try { parsed = ipaddr.parse(address); } catch { return true; }
  if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
    return isBlockedIp((parsed as ipaddr.IPv6).toIPv4Address().toString());
  }
  if (parsed.kind() === "ipv4") return blockedV4.some(([base, prefix]) => (parsed as ipaddr.IPv4).match(ipaddr.parse(base), prefix));
  return blockedV6.some(([base, prefix]) => (parsed as ipaddr.IPv6).match(ipaddr.parse(base), prefix));
}

export function assertPublicWebhookTarget(url: URL): void {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (ipaddr.isValid(hostname) && isBlockedIp(hostname) && !(config.allowPrivateWebhookTargets && config.nodeEnv !== "production")) throw new SsrfBlockedError();
}

export function createGuardedLookup(lookup: typeof dns.lookup = dns.lookup) {
  const guarded = (host: string, options: dns.LookupOptions, callback: (error: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void) => {
    const done = (error: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => {
      if (error) return callback(error);
      if (addresses.some(({ address }) => isBlockedIp(address))) return callback(new SsrfBlockedError());
      if (options && typeof options === "object" && "all" in options && options.all) return callback(null, addresses);
      const first = addresses[0];
      if (!first) return callback(Object.assign(new Error("DNS returned no addresses"), { code: "ENOTFOUND" }));
      return callback(null, first.address, first.family);
    };
    lookup(host, { all: true, verbatim: true }, done as any);
  };
  return guarded as NonNullable<https.AgentOptions["lookup"]>;
}

export function createGuardedHttpsAgent(url: URL): https.Agent {
  if (config.allowPrivateWebhookTargets && config.nodeEnv !== "production") {
    return new https.Agent();
  }
  assertPublicWebhookTarget(url);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (ipaddr.isValid(hostname)) return new https.Agent();
  return new https.Agent({ lookup: createGuardedLookup() });
}

