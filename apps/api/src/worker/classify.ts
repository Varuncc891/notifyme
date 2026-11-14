import axios from "axios";

export type ErrorCategory = "NETWORK_ERROR" | "TIMEOUT" | "HTTP_4XX" | "HTTP_5XX" | "DNS_FAILURE" | "SSRF_BLOCKED" | "UNKNOWN";
export interface Classification { category: ErrorCategory; httpStatus?: number; retryable: boolean }
const networkCodes = new Set(["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "EPIPE", "EHOSTDOWN", "ENETDOWN"]);

export function classify(error: unknown): Classification {
  const seen = new Set<any>();
  let current: any = error;
  let status: number | undefined;
  while (current && !seen.has(current)) {
    seen.add(current);
    status ??= current.response?.status;
    if (current.code === "ERR_SSRF_BLOCKED") return { category: "SSRF_BLOCKED", retryable: false };
    current = current.cause ?? current.error;
  }
  if (status !== undefined) {
    if (status === 408 || status === 429 || (status >= 400 && status < 500)) return { category: "HTTP_4XX", httpStatus: status, retryable: status === 408 || status === 429 };
    if (status >= 500 && status < 600) return { category: "HTTP_5XX", httpStatus: status, retryable: true };
    return { category: "UNKNOWN", httpStatus: status, retryable: false };
  }
  current = error;
  while (current) {
    const code = current.code;
    if (["ECONNABORTED", "ETIMEDOUT", "ABORT_ERR", "ERR_CANCELED"].includes(code) || current.name === "AbortError" || current.name === "TimeoutError") return { category: "TIMEOUT", retryable: true };
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return { category: "DNS_FAILURE", retryable: true };
    if (networkCodes.has(code)) return { category: "NETWORK_ERROR", retryable: true };
    current = current.cause ?? current.error;
  }
  if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") return { category: "TIMEOUT", retryable: true };
  return { category: "UNKNOWN", retryable: true };
}
