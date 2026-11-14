import { assertPublicWebhookTarget } from "../lib/ssrf";
import { Prisma } from "@prisma/client";

export interface ValidCreateBody { type: "webhook"; url: string; payload: Prisma.InputJsonObject }
export function validateCreateBody(body: unknown): { value?: ValidCreateBody; message?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Body must be a JSON object" };
  const input = body as Record<string, unknown>;
  const type = input.type ?? "webhook";
  if (type !== "webhook") return { message: "type must be webhook" };
  if (typeof input.url !== "string") return { message: "url must be a valid HTTPS URL" };
  let url: URL;
  try { url = new URL(input.url); } catch { return { message: "url must be a valid HTTPS URL" }; }
  if (url.protocol !== "https:" || !url.hostname) return { message: "url must use HTTPS and include a hostname" };
  try { assertPublicWebhookTarget(url); } catch { return { message: "Private webhook IP addresses are not allowed" }; }
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) return { message: "payload must be a JSON object" };
  return { value: { type: "webhook", url: url.toString(), payload: input.payload as Prisma.InputJsonObject } };
}
