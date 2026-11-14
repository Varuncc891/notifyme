import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), deliver: vi.fn(), child: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() }));
vi.mock("../lib/prisma", () => ({ prisma: { notification: { findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("../lib/logger", () => ({ logger: { child: mocks.child } }));
vi.mock("./deliver", () => ({ deliver: mocks.deliver }));
import { processNotification } from "./process";

const job = (attemptsMade: number) => ({ id: "n1", data: { notificationId: "n1" }, attemptsMade, opts: { attempts: 4 } }) as any;
describe("notification processor", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.child.mockReturnValue({ warn: mocks.warn, info: mocks.info, error: mocks.error }); mocks.findUnique.mockResolvedValue({ id: "n1", status: "PENDING", url: "https://example.com", payload: {} }); mocks.update.mockResolvedValue({}); mocks.deliver.mockRejectedValue(new Error("temporary")); });
  it("keeps the third retryable failure PROCESSING", async () => {
    await expect(processNotification(job(2))).rejects.toThrow("UNKNOWN");
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ retries: 3, status: "PROCESSING" }) }));
  });
  it("marks the fourth retryable failure FAILED", async () => {
    await expect(processNotification(job(3))).rejects.toThrow("UNKNOWN");
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ retries: 4, status: "FAILED" }) }));
  });
  it.each(["SUCCESS", "FAILED"] as const)("does not deliver or update terminal %s rows", async (status) => {
    mocks.findUnique.mockResolvedValue({ id: "n1", status });
    await processNotification(job(0));
    expect(mocks.deliver).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("fails non-retryable responses immediately", async () => {
    mocks.deliver.mockRejectedValue({ response: { status: 404 } });
    await expect(processNotification(job(0))).rejects.toThrow("HTTP_4XX");
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ retries: 1, status: "FAILED", lastError: "HTTP_4XX" }) }));
  });
  it("logs only a safe error summary and never logs Axios config or agent internals", async () => {
    const axiosError = Object.assign(new Error("Request failed"), {
      code: "ERR_BAD_RESPONSE",
      config: { data: "sensitive payload", headers: { Authorization: "secret" }, httpsAgent: { secret: true } },
      request: { body: "sensitive payload" },
      response: { status: 502, data: { private: "response body" }, config: { httpsAgent: { secret: true } } },
    });
    mocks.deliver.mockRejectedValue(axiosError);
    await expect(processNotification(job(0))).rejects.toThrow("HTTP_5XX");
    expect(mocks.child).toHaveBeenCalledWith({ jobId: "n1", notificationId: "n1", attempt: 1 });
    const loggedFields = mocks.warn.mock.calls[0][0];
    expect(loggedFields).toMatchObject({
      category: "HTTP_5XX",
      httpStatus: 502,
      errorSummary: { name: "Error", message: "Request failed", code: "ERR_BAD_RESPONSE" },
    });
    const containsSensitiveKey = (value: unknown): boolean => {
      if (!value || typeof value !== "object") return false;
      return Object.entries(value).some(([key, nested]) => key === "config" || key === "httpsAgent" || containsSensitiveKey(nested));
    };
    expect(containsSensitiveKey(loggedFields)).toBe(false);
  });
});
