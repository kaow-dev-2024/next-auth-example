import RoleFolderLayout from "@/components/role-folder-layout";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleFolderLayout requiredRole="buyer">{children}</RoleFolderLayout>;
}
