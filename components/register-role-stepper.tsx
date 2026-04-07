"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";

import apiClient from "@/lib/axios";

export type UserRole = "buyer" | "farmer" | "delivery";

type RegisterRoleStepperProps = {
  open: boolean;
  onClose: () => void;
  accessToken?: string;
  userId?: string;
  initialRole?: string | null;
  onSuccess?: (role: UserRole) => void | Promise<void>;
};

type CommonForm = {
  name: string;
  phone: string;
  address: string;
};

type BuyerForm = {
  company_name: string;
  tax_id: string;
};

type FarmerForm = {
  farm_name: string;
  farm_size: string;
  main_crop: string;
};

type DeliveryForm = {
  vehicle_type: string;
  license_plate: string;
  service_area: string;
};

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "buyer", label: "Buyer" },
  { value: "farmer", label: "Farmer" },
  { value: "delivery", label: "Delivery" },
];

const endpointByRole: Record<UserRole, string> = {
  buyer: "/buyers",
  farmer: "/farmers",
  delivery: "/deliveries",
};

const mapInitialRole = (role?: string | null): UserRole => {
  if (role === "buyer" || role === "farmer" || role === "delivery") return role;
  return "buyer";
};

export default function RegisterRoleStepper({
  open,
  onClose,
  accessToken,
  userId,
  initialRole,
  onSuccess,
}: RegisterRoleStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [role, setRole] = useState<UserRole>(mapInitialRole(initialRole));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commonForm, setCommonForm] = useState<CommonForm>({
    name: "",
    phone: "",
    address: "",
  });
  const [buyerForm, setBuyerForm] = useState<BuyerForm>({
    company_name: "",
    tax_id: "",
  });
  const [farmerForm, setFarmerForm] = useState<FarmerForm>({
    farm_name: "",
    farm_size: "",
    main_crop: "",
  });
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>({
    vehicle_type: "",
    license_plate: "",
    service_area: "",
  });

  const steps = useMemo(
    () => ["Select role", "Basic profile", "Role details", "Review & submit"],
    [],
  );

  const resetForm = () => {
    setActiveStep(0);
    setRole(mapInitialRole(initialRole));
    setError(null);
    setSubmitting(false);
    setCommonForm({ name: "", phone: "", address: "" });
    setBuyerForm({ company_name: "", tax_id: "" });
    setFarmerForm({ farm_name: "", farm_size: "", main_crop: "" });
    setDeliveryForm({ vehicle_type: "", license_plate: "", service_area: "" });
  };

  const closeDialog = () => {
    resetForm();
    onClose();
  };

  const validateStep = () => {
    if (activeStep === 0) return !!role;
    if (activeStep === 1) {
      return (
        commonForm.name.trim() !== "" &&
        commonForm.phone.trim() !== "" &&
        commonForm.address.trim() !== ""
      );
    }
    if (activeStep === 2) {
      if (role === "buyer") {
        return (
          buyerForm.company_name.trim() !== "" && buyerForm.tax_id.trim() !== ""
        );
      }
      if (role === "farmer") {
        return (
          farmerForm.farm_name.trim() !== "" &&
          farmerForm.farm_size.trim() !== "" &&
          farmerForm.main_crop.trim() !== ""
        );
      }
      return (
        deliveryForm.vehicle_type.trim() !== "" &&
        deliveryForm.license_plate.trim() !== "" &&
        deliveryForm.service_area.trim() !== ""
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError(
        "Please complete required fields before moving to the next step.",
      );
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const buildPayload = () => {
    const basePayload = {
      user_id: userId,
      role,
      name: commonForm.name.trim(),
      phone: commonForm.phone.trim(),
      address: commonForm.address.trim(),
    };

    if (role === "buyer") {
      return {
        ...basePayload,
        company_name: buyerForm.company_name.trim(),
        tax_id: buyerForm.tax_id.trim(),
      };
    }

    if (role === "farmer") {
      return {
        ...basePayload,
        farm_name: farmerForm.farm_name.trim(),
        farm_size: farmerForm.farm_size.trim(),
        main_crop: farmerForm.main_crop.trim(),
      };
    }

    return {
      ...basePayload,
      vehicle_type: deliveryForm.vehicle_type.trim(),
      license_plate: deliveryForm.license_plate.trim(),
      service_area: deliveryForm.service_area.trim(),
    };
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError("Missing user id. Please sign in again.");
      return;
    }
    if (!accessToken) {
      setError("Missing access token. Please sign in again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = buildPayload();
      await apiClient.post(endpointByRole[role], payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      await onSuccess?.(role);
      closeDialog();
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRoleSpecificFields = () => {
    if (role === "buyer") {
      return (
        <>
          <TextField
            label="Company name"
            value={buyerForm.company_name}
            onChange={(event) =>
              setBuyerForm((prev) => ({
                ...prev,
                company_name: event.target.value,
              }))
            }
            required
            fullWidth
          />
          <TextField
            label="Tax ID"
            value={buyerForm.tax_id}
            onChange={(event) =>
              setBuyerForm((prev) => ({ ...prev, tax_id: event.target.value }))
            }
            required
            fullWidth
          />
        </>
      );
    }

    if (role === "farmer") {
      return (
        <>
          <TextField
            label="Farm name"
            value={farmerForm.farm_name}
            onChange={(event) =>
              setFarmerForm((prev) => ({
                ...prev,
                farm_name: event.target.value,
              }))
            }
            required
            fullWidth
          />
          <TextField
            label="Farm size"
            value={farmerForm.farm_size}
            onChange={(event) =>
              setFarmerForm((prev) => ({
                ...prev,
                farm_size: event.target.value,
              }))
            }
            required
            fullWidth
            helperText="Example: 2 hectares"
          />
          <TextField
            label="Main crop"
            value={farmerForm.main_crop}
            onChange={(event) =>
              setFarmerForm((prev) => ({
                ...prev,
                main_crop: event.target.value,
              }))
            }
            required
            fullWidth
          />
        </>
      );
    }

    return (
      <>
        <TextField
          label="Vehicle type"
          value={deliveryForm.vehicle_type}
          onChange={(event) =>
            setDeliveryForm((prev) => ({
              ...prev,
              vehicle_type: event.target.value,
            }))
          }
          required
          fullWidth
        />
        <TextField
          label="License plate"
          value={deliveryForm.license_plate}
          onChange={(event) =>
            setDeliveryForm((prev) => ({
              ...prev,
              license_plate: event.target.value,
            }))
          }
          required
          fullWidth
        />
        <TextField
          label="Service area"
          value={deliveryForm.service_area}
          onChange={(event) =>
            setDeliveryForm((prev) => ({
              ...prev,
              service_area: event.target.value,
            }))
          }
          required
          fullWidth
        />
      </>
    );
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <TextField
          select
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          fullWidth
        >
          {roleOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (activeStep === 1) {
      return (
        <>
          <TextField
            label="Full name"
            value={commonForm.name}
            onChange={(event) =>
              setCommonForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
            fullWidth
          />
          <TextField
            label="Phone"
            value={commonForm.phone}
            onChange={(event) =>
              setCommonForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            required
            fullWidth
          />
          <TextField
            label="Address"
            value={commonForm.address}
            onChange={(event) =>
              setCommonForm((prev) => ({
                ...prev,
                address: event.target.value,
              }))
            }
            required
            fullWidth
            multiline
            minRows={2}
          />
        </>
      );
    }

    if (activeStep === 2) {
      return <>{renderRoleSpecificFields()}</>;
    }

    const roleDetail =
      role === "buyer"
        ? `Company: ${buyerForm.company_name || "-"} | Tax ID: ${buyerForm.tax_id || "-"}`
        : role === "farmer"
          ? `Farm: ${farmerForm.farm_name || "-"} | Size: ${farmerForm.farm_size || "-"} | Crop: ${farmerForm.main_crop || "-"}`
          : `Vehicle: ${deliveryForm.vehicle_type || "-"} | Plate: ${deliveryForm.license_plate || "-"} | Area: ${deliveryForm.service_area || "-"}`;

    return (
      <Stack spacing={1.2}>
        <Typography variant="body2">
          <strong>Role:</strong> {role}
        </Typography>
        <Typography variant="body2">
          <strong>Name:</strong> {commonForm.name || "-"}
        </Typography>
        <Typography variant="body2">
          <strong>Phone:</strong> {commonForm.phone || "-"}
        </Typography>
        <Typography variant="body2">
          <strong>Address:</strong> {commonForm.address || "-"}
        </Typography>
        <Typography variant="body2">
          <strong>Details:</strong> {roleDetail}
        </Typography>
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Complete your role registration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step}>
                <StepLabel>{step}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>{renderStepContent()}</Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0 || submitting}>
          Back
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={submitting}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit registration"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
