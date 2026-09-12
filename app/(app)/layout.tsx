import { WorkspaceShell } from "@/components/workspace-shell";

export default function AppWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}