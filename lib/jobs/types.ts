/**
 * Background-job adapter seam. Sprint 0 defines the interface only.
 * Long-running work must not run inside an HTTP request lifecycle.
 */
export type JobPayload = Record<string, unknown>;

export type JobEnqueueInput = {
  name: string;
  workspaceId: string;
  payload: JobPayload;
  idempotencyKey?: string;
  runAt?: string;
};

export type JobHandle = {
  id: string;
  name: string;
  workspaceId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
};

export interface JobQueue {
  enqueue(input: JobEnqueueInput): Promise<JobHandle>;
  get(jobId: string): Promise<JobHandle | null>;
  cancel(jobId: string): Promise<void>;
}
