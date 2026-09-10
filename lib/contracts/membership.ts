import type { WorkspaceRole } from "@/lib/auth/workspace-policy";

export type MembershipStatus = "active" | "invited" | "revoked";

export type WorkspaceMembership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
};
