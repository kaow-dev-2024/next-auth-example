import RoleFolderLayout from "@/components/role-folder-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleFolderLayout requiredRole="admin">{children}</RoleFolderLayout>;
}
