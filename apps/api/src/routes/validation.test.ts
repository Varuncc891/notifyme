import { describe, expect, it } from "vitest";
import { validateCreateBody } from "./validation";

describe("notification creation validation", () => {
  it("rejects HTTP URLs", () => expect(validateCreateBody({ url: "http://example.com", payload: {} }).message).toContain("HTTPS"));
  it("rejects URLs without a hostname", () => expect(validateCreateBody({ url: "https://", payload: {} }).value).toBeUndefined());
  it("rejects private IP literals", () => expect(validateCreateBody({ url: "https://127.0.0.1/", payload: {} }).message).toContain("Private"));
  it("accepts a public HTTPS webhook with an object payload", () => expect(validateCreateBody({ url: "https://example.com/hook", payload: { ok: true } }).value).toMatchObject({ type: "webhook", url: "https://example.com/hook", payload: { ok: true } }));
});
