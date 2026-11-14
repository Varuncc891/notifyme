import { describe, expect, it, vi } from "vitest";
import { createGuardedLookup, isBlockedIp, SsrfBlockedError } from "./ssrf";

describe("SSRF IP checks", () => {
  it.each(["127.0.0.1", "::1", "::ffff:127.0.0.1", "10.0.0.1", "169.254.169.254", "100.64.0.1", "172.16.0.1", "192.168.1.1", "::"])('%s is blocked', (address) => expect(isBlockedIp(address)).toBe(true));
  it("allows a public address", () => expect(isBlockedIp("8.8.8.8")).toBe(false));
  it.each([true, false])("blocks DNS rebinding to private addresses (all=%s)", (all) => {
    const lookup = vi.fn((_host: string, _opts: unknown, callback: (error: null, result: Array<{ address: string; family: number }>) => void) => callback(null, [{ address: "10.0.0.2", family: 4 }]));
    const guarded = createGuardedLookup(lookup as any);
    guarded("webhook.test", { all } as any, (error: NodeJS.ErrnoException | null) => expect(error).toBeInstanceOf(SsrfBlockedError));
  });
});
