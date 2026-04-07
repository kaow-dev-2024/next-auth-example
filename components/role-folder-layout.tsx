"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type RoleType = "admin" | "buyer" | "farmer" | "delivery";

type RoleFolderLayoutProps = {
  requiredRole: RoleType;
  children: React.ReactNode;
};

const knownRoles: RoleType[] = ["admin", "buyer", "farmer", "delivery"];

export default function RoleFolderLayout({
  requiredRole,
  children,
}: RoleFolderLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/");
      return;
    }

    const currentRole = session.user.role;
    if (currentRole !== requiredRole) {
      if (currentRole && knownRoles.includes(currentRole as RoleType)) {
        router.replace(`/${currentRole}/dashboard`);
        return;
      }
      router.replace("/");
    }
  }, [requiredRole, router, session, status]);

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Checking role permissions...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!session?.user || session.user.role !== requiredRole) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Redirecting to your workspace...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
