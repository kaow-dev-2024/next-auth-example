import RoleFolderLayout from "@/components/role-folder-layout";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleFolderLayout requiredRole="delivery">{children}</RoleFolderLayout>
  );
}
