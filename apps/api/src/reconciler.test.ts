import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), update: vi.fn(), getJob: vi.fn(), enqueue: vi.fn() }));
vi.mock("./lib/prisma", () => ({ prisma: { notification: { findMany: mocks.findMany, update: mocks.update } } }));
vi.mock("./queue/notificationQueue", () => ({ notificationQueue: { getJob: mocks.getJob }, enqueueNotification: mocks.enqueue }));
import { reconcileOnce, stopReconciler } from "./reconciler";

describe("reconciler", () => {
  afterEach(() => { vi.clearAllMocks(); });
  it("re-enqueues a missing job", async () => {
    mocks.findMany.mockResolvedValue([{ id: "missing" }]); mocks.getJob.mockResolvedValue(null);
    await reconcileOnce(); expect(mocks.enqueue).toHaveBeenCalledWith("missing");
  });
  it("marks failed jobs failed without adding them", async () => {
    mocks.findMany.mockResolvedValue([{ id: "failed" }]); mocks.getJob.mockResolvedValue({ failedReason: "HTTP_5XX", getState: async () => "failed" });
    await reconcileOnce(); expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "failed" }, data: { status: "FAILED", lastError: "HTTP_5XX" } })); expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it("marks completed jobs successful without adding them", async () => {
    mocks.findMany.mockResolvedValue([{ id: "complete" }]); mocks.getJob.mockResolvedValue({ getState: async () => "completed" });
    await reconcileOnce(); expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "SUCCESS" } })); expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it("leaves active jobs untouched", async () => {
    mocks.findMany.mockResolvedValue([{ id: "active" }]); mocks.getJob.mockResolvedValue({ getState: async () => "active" });
    await reconcileOnce(); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  afterAll(() => stopReconciler());
});
