export type AuditEvent = {
  id: string;
  workspaceId: string | null;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  correlationId: string | null;
  createdAt: string;
};
