export type WorkspaceStatus = "active" | "suspended" | "archived";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
};
