import axios, { AxiosResponse } from "axios";
import https from "node:https";
import { createGuardedHttpsAgent } from "../lib/ssrf";

export async function deliver(notification: { id: string; url: string; payload: unknown }): Promise<AxiosResponse> {
  const url = new URL(notification.url);
  const httpsAgent: https.Agent = createGuardedHttpsAgent(url);
  return axios.post(url.toString(), notification.payload, {
    headers: { "Content-Type": "application/json", "Idempotency-Key": notification.id },
    timeout: 5000,
    signal: AbortSignal.timeout(5000),
    maxRedirects: 0,
    proxy: false,
    maxContentLength: 1_048_576,
    httpsAgent,
  });
}
