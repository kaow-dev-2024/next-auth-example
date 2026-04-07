import RoleFolderLayout from "@/components/role-folder-layout";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleFolderLayout requiredRole="farmer">{children}</RoleFolderLayout>;
}
