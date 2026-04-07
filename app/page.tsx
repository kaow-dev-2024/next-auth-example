"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import apiClient from "@/lib/axios";
import RegisterCredentialsForm from "@/components/register-credentials-form";
import RegisterRoleStepper, {
  type UserRole,
} from "@/components/register-role-stepper";
import RoleUserLayout from "@/components/role-user-layout";

type SocialProvider = "google";
type Profile = {
  user_id?: string | number;
  [key: string]: unknown;
};

const findUserById = (profiles: Profile[], userId?: string | number | null) => {
  if (!userId) return null;
  return (
    profiles.find((profile) => String(profile.user_id) === String(userId)) ??
    null
  );
};

const BRAND_GREEN = "#4b7f2a";
const BRAND_GREEN_DARK = "#2f5f21";
const BRAND_GREEN_SOFT = "#95b54c";
const BRAND_GOLD = "#b9923b";

export default function HomePage() {
  const { data: session, status, update } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(
    null,
  );
  const [registerOpen, setRegisterOpen] = useState(false);

  const getRoleEndpoint = (role?: string | null) => {
    switch (role) {
      case "buyer":
        return "/buyers";
      case "farmer":
        return "/farmers";
      case "delivery":
        return "/deliveries";
      default:
        return null;
    }
  };

  const extractRows = (responseData: unknown): Profile[] => {
    if (Array.isArray(responseData)) return responseData as Profile[];
    if (
      responseData &&
      typeof responseData === "object" &&
      Array.isArray((responseData as { data?: unknown }).data)
    ) {
      return (responseData as { data: Profile[] }).data;
    }
    return [];
  };

  const checkUserRole = async (user: {
    id?: string;
    role?: string | null;
    accessToken?: string;
  }) => {
    const endpoint = getRoleEndpoint(user.role);
    if (!endpoint || !user.id || !user.accessToken) return false;

    try {
      const response = await apiClient.get(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      const rows = extractRows(response.data);
      return Boolean(findUserById(rows, user.id));
    } catch (roleCheckError) {
      console.error("Failed to check role profile:", roleCheckError);
      return false;
    }
  };

  useEffect(() => {
    if (session?.user.role === "admin") {
      return;
    }
    let mounted = true;

    const checkRegistrationStatus = async () => {
      if (!session?.user) {
        if (mounted) setRegisterOpen(false);
        return;
      }

      const hasProfile = await checkUserRole(session.user);
      console.log("hasProfile", hasProfile);

      if (mounted) setRegisterOpen(!hasProfile);
    };

    void checkRegistrationStatus();

    return () => {
      mounted = false;
    };
  }, [session]);

  const handleCredentialsLogin = async (
    event: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username/email or password");
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setError(null);
    setSocialLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
    setSocialLoading(null);
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading secure session...
          </Typography>
        </Stack>
      </main>
    );
  }

  if (session) {
    return (
      <main className="min-h-[100dvh] bg-[#f4f7ed]">
        <RoleUserLayout user={session.user} onSignOut={() => signOut()} />
        <RegisterRoleStepper
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          accessToken={session?.user?.accessToken}
          userId={session?.user?.id}
          initialRole={session?.user?.role}
          onSuccess={async (role: UserRole) => {
            await update({
              user: {
                ...session?.user,
                role,
              },
            });
            setRegisterOpen(false);
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f7ed]">
      <Box
        sx={{
          minHeight: "100dvh",
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" },
          alignItems: "stretch",
          paddingTop: {
            xs: "max(env(safe-area-inset-top), 12px)",
            md: "max(env(safe-area-inset-top), 0px)",
          },
          paddingBottom: {
            xs: "max(env(safe-area-inset-bottom), 12px)",
            md: "max(env(safe-area-inset-bottom), 0px)",
          },
          paddingLeft: {
            xs: "max(env(safe-area-inset-left), 12px)",
            md: "max(env(safe-area-inset-left), 0px)",
          },
          paddingRight: {
            xs: "max(env(safe-area-inset-right), 12px)",
            md: "max(env(safe-area-inset-right), 0px)",
          },
          gap: { xs: 0, md: 0 },
        }}
      >
        <Card
          elevation={0}
          sx={{
            display: { xs: "none", md: "block" },
            borderRadius: 0,
            border: 0,
            color: BRAND_GREEN_DARK,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f8fbf1",
            minHeight: "100dvh",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 24,
              right: 24,
              height: 18,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${BRAND_GREEN_SOFT}, ${BRAND_GREEN})`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.13,
              backgroundImage: "url('/brand/kuku-market.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <CardContent
            sx={{
              p: { md: 6, lg: 8 },
              position: "relative",
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Stack spacing={3} sx={{ maxWidth: 680, mt: 6 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{ bgcolor: BRAND_GREEN_SOFT, color: "common.white" }}
                >
                  <BusinessCenterOutlinedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Kuku Market Portal
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Premium Fruit Ecosystem Access
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="h3" fontWeight={800} lineHeight={1.2}>
                KUKU Market:
                <br />
                Premium Fruit Platform
              </Typography>

              <Typography
                variant="h6"
                sx={{ color: BRAND_GREEN_DARK, fontWeight: 700, maxWidth: 560 }}
              >
                Business Model & Operational Flow
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "text.secondary", maxWidth: 560 }}
              >
                Source to marketplace to power buyers and delivery partner with
                secure account access, exclusive products, and certified
                quality.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<ShieldOutlinedIcon />}
                  label="Token-based sessions"
                  size="small"
                  sx={{
                    color: BRAND_GREEN_DARK,
                    bgcolor: "#e7f1d1",
                    border: `1px solid ${BRAND_GREEN_SOFT}`,
                    borderRadius: 2,
                  }}
                />
                <Chip
                  label="Exclusive product network"
                  size="small"
                  sx={{
                    color: "#5c471b",
                    bgcolor: "#f6ecd1",
                    border: `1px solid ${BRAND_GOLD}`,
                    borderRadius: 2,
                  }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 0, md: 3, lg: 4 },
            py: { xs: 0, md: 4 },
            background: {
              xs: "linear-gradient(180deg, #f4f7ed 0%, #fbfcf7 100%)",
              md: "linear-gradient(180deg, #f3f8e9 0%, #fafcf5 100%)",
            },
          }}
        >
          <Card
            elevation={0}
            sx={{
              border: { xs: "1px solid", md: "1px solid" },
              borderColor: "#d6e2bf",
              borderRadius: { xs: 4, md: 3 },
              backgroundColor: "background.paper",
              boxShadow: {
                xs: "0 16px 40px rgba(75,127,42,0.12)",
                md: "0 12px 32px rgba(75,127,42,0.12)",
              },
              width: "100%",
              maxWidth: { xs: 520, md: 460 },
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color={BRAND_GREEN_DARK}
                    sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}
                  >
                    KUKU MARKET
                  </Typography>
                  {/* <Typography variant="body2" color="text.secondary" mt={0.5}>
                      KUKU Market business access for staff and power buyers.
                    </Typography> */}
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <Box component="form" onSubmit={handleCredentialsLogin}>
                  <Stack spacing={1.75}>
                    <TextField
                      label="Username / Email"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      fullWidth
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlinedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      fullWidth
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || socialLoading !== null}
                      fullWidth
                      sx={{
                        mt: 0.5,
                        py: 1.25,
                        minHeight: 48,
                        textTransform: "none",
                        fontWeight: 700,
                        backgroundColor: BRAND_GREEN,
                        "&:hover": { backgroundColor: BRAND_GREEN_DARK },
                      }}
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                  </Stack>
                </Box>

                <Divider>OR</Divider>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading || socialLoading !== null}
                  fullWidth
                  startIcon={<GoogleIcon />}
                  sx={{
                    py: 1.1,
                    minHeight: 48,
                    textTransform: "none",
                    fontWeight: 600,
                    color: BRAND_GREEN_DARK,
                    borderColor: "#bfd59a",
                    "&:hover": {
                      borderColor: BRAND_GREEN_SOFT,
                      backgroundColor: "#f4f9ea",
                    },
                  }}
                >
                  {socialLoading === "google"
                    ? "Redirecting to Google..."
                    : "Continue with Google"}
                </Button>

                <Divider>REGISTER</Divider>
                <RegisterCredentialsForm
                  disabled={loading || socialLoading !== null}
                  buttonLabel={loading ? "Signup in..." : "Sign up"}
                  onRegistered={() => setError(null)}
                />
                {/* <Alert
                    severity="info"
                    icon={<ShieldOutlinedIcon fontSize="inherit" />}
                    sx={{ mt: 0.5 }}
                  >
                    Protected access. Activity may be logged for security
                    auditing.
                  </Alert> */}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </main>
  );
}
