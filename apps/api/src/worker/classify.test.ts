import { describe, expect, it } from "vitest";
import { classify } from "./classify";

describe("delivery error classification", () => {
  it.each([[500, true, "HTTP_5XX"], [429, true, "HTTP_4XX"], [408, true, "HTTP_4XX"], [404, false, "HTTP_4XX"], [302, false, "UNKNOWN"]] as const)("classifies HTTP %i", (status, retryable, category) => {
    expect(classify({ response: { status } })).toMatchObject({ retryable, category, httpStatus: status });
  });
  it("classifies timeout and DNS failures", () => {
    expect(classify(Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }))).toMatchObject({ category: "TIMEOUT", retryable: true });
    expect(classify(Object.assign(new Error("missing"), { code: "ENOTFOUND" }))).toMatchObject({ category: "DNS_FAILURE", retryable: true });
  });
});
