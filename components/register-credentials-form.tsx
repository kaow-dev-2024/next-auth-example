"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import apiClient from "@/lib/axios";

type RegisterCredentialsFormProps = {
  disabled?: boolean;
  buttonLabel?: string;
  onRegistered?: () => void;
};

type RegisterFormState = {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const defaultState: RegisterFormState = {
  full_name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const endpointCandidates = [
  process.env.NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT,
  "/auth/register",
  "/auth/signup",
].filter(Boolean) as string[];

export default function RegisterCredentialsForm({
  disabled,
  buttonLabel = "Sign up",
  onRegistered,
}: RegisterCredentialsFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<RegisterFormState>(defaultState);

  const canSubmit = useMemo(() => {
    return (
      form.full_name.trim() !== "" &&
      form.username.trim() !== "" &&
      form.email.trim() !== "" &&
      form.password.trim() !== "" &&
      form.confirmPassword.trim() !== ""
    );
  }, [form]);

  const handleOpen = () => {
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    setError(null);
    setSuccess(null);
    setForm(defaultState);
  };

  const handleChange = (field: keyof RegisterFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const registerViaBackend = async () => {
    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    for (const endpoint of endpointCandidates) {
      try {
        await apiClient.post(endpoint, payload, {
          headers: { "Content-Type": "application/json" },
        });
        return;
      } catch (requestError: any) {
        const status = requestError?.response?.status;
        if (status === 404) continue;
        const message =
          requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Registration failed.";
        throw new Error(message);
      }
    }

    throw new Error(
      `Register endpoint not found. Tried: ${endpointCandidates.join(", ")}`,
    );
  };

  const handleSubmit = async (
    event: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await registerViaBackend();

      const loginResult = await signIn("credentials", {
        identifier: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (loginResult?.error) {
        setSuccess("Registration completed. Please sign in with your account.");
        onRegistered?.();
        return;
      }

      onRegistered?.();
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        size="large"
        disabled={disabled}
        fullWidth
        onClick={handleOpen}
        sx={{
          mt: 0.5,
          py: 1.25,
          minHeight: 48,
          textTransform: "none",
          fontWeight: 700,
          backgroundColor: "#b9923b",
          "&:hover": { backgroundColor: "#a6802f" },
        }}
      >
        {buttonLabel}
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Create your account</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Register with credentials to access KUKU Market.
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={1.5}>
                <TextField
                  label="Full name"
                  value={form.full_name}
                  onChange={(event) =>
                    handleChange("full_name", event.target.value)
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Username"
                  value={form.username}
                  onChange={(event) =>
                    handleChange("username", event.target.value)
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    handleChange("confirmPassword", event.target.value)
                  }
                  required
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
