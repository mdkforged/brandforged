export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceMembershipRef = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

const ROLE_RANK: Record<WorkspaceRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function roleAtLeast(
  role: WorkspaceRole,
  minimum: WorkspaceRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/**
 * Membership in workspace A never grants access to workspace B.
 * Access requires an explicit membership whose workspaceId matches.
 */
export function canAccessWorkspace(
  memberships: readonly WorkspaceMembershipRef[],
  userId: string,
  workspaceId: string,
  minimumRole: WorkspaceRole = "viewer",
): boolean {
  return memberships.some(
    (m) =>
      m.userId === userId &&
      m.workspaceId === workspaceId &&
      roleAtLeast(m.role, minimumRole),
  );
}

export function assertSameWorkspace(
  expectedWorkspaceId: string,
  actualWorkspaceId: string,
): void {
  if (expectedWorkspaceId !== actualWorkspaceId) {
    throw new Error("Workspace isolation violation: identifiers do not match");
  }
}
