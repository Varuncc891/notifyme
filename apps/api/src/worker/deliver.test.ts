import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ post: vi.fn(), agent: vi.fn() }));
vi.mock("axios", () => ({ default: { post: mocks.post } }));
vi.mock("../lib/ssrf", () => ({ createGuardedHttpsAgent: mocks.agent }));
import { deliver } from "./deliver";

describe("webhook request configuration", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.agent.mockReturnValue({}); mocks.post.mockResolvedValue({ status: 204 }); });
  it("disables redirects and environment proxy and sets the idempotency header", async () => {
    await deliver({ id: "abc", url: "https://example.com/hook", payload: { ok: true } });
    const [, , options] = mocks.post.mock.calls[0];
    expect(options).toMatchObject({ maxRedirects: 0, proxy: false, headers: { "Idempotency-Key": "abc", "Content-Type": "application/json" }, timeout: 5000, maxContentLength: 1_048_576 });
  });
});
