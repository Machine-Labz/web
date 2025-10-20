import {
  WithdrawJobRequestSchema,
  JobResponseSchema,
  JobStatusResponseSchema,
  SubmitRequestSchema,
  SubmitResponseSchema,
  ErrorSchema,
  type WithdrawJobRequest,
  type JobResponse,
  type JobStatusResponse,
  type SubmitRequest,
  type SubmitResponse,
} from "./schemas";

export class ValidatorAgentClient {
  constructor(private baseUrl: string) {}

  private async handle<T>(res: Response, schema: { parse: (x: unknown) => T }): Promise<T> {
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      try {
        const err = ErrorSchema.parse(json);
        throw Object.assign(new Error(err.message), {
          code: (err as any).code,
          details: (err as any).details,
          status: res.status,
        });
      } catch {
        throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body: json });
      }
    }
    return schema.parse(json);
  }

  // POST /jobs/withdraw
  async createWithdrawJob(body: WithdrawJobRequest): Promise<JobResponse> {
    const payload = WithdrawJobRequestSchema.parse(body);
    const res = await fetch(new URL("/jobs/withdraw", this.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 413) throw new Error("Payload too large (413). Reduce outputs or payload size.");
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const err = new Error(`Rate limited (429). Retry after ${retryAfter ?? "later"}.`);
      (err as any).retryAfter = retryAfter;
      throw err;
    }
    return this.handle(res, JobResponseSchema);
  }

  // GET /jobs/{job_id}
  async getJob(jobId: string): Promise<JobStatusResponse> {
    const url = new URL(`/jobs/${encodeURIComponent(jobId)}`, this.baseUrl);
    const res = await fetch(url, { method: "GET" });
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const err = new Error(`Rate limited (429). Retry after ${retryAfter ?? "later"}.`);
      (err as any).retryAfter = retryAfter;
      throw err;
    }
    return this.handle(res, JobStatusResponseSchema);
  }

  // POST /submit
  async submitTx(body: SubmitRequest): Promise<SubmitResponse> {
    const payload = SubmitRequestSchema.parse(body);
    const res = await fetch(new URL("/submit", this.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 413) throw new Error("Payload too large (413). Transaction too big.");
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const err = new Error(`Rate limited (429). Retry after ${retryAfter ?? "later"}.`);
      (err as any).retryAfter = retryAfter;
      throw err;
    }
    return this.handle(res, SubmitResponseSchema);
  }
}

// Convenience wrappers
export async function createWithdrawJob(baseUrl: string, body: WithdrawJobRequest) {
  return new ValidatorAgentClient(baseUrl).createWithdrawJob(body);
}

export async function getJob(baseUrl: string, jobId: string) {
  return new ValidatorAgentClient(baseUrl).getJob(jobId);
}

export async function submitTx(baseUrl: string, body: SubmitRequest) {
  return new ValidatorAgentClient(baseUrl).submitTx(body);
}

