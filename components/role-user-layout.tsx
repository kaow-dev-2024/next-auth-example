"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Alert,
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

type RoleType = "admin" | "buyer" | "farmer" | "delivery";

type RoleUserLayoutProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    id?: string;
    auth_provider?: string | null;
    role?: string | null;
  };
  onSignOut: () => void;
};

type RoleMenuItem = {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
};

const roleTheme: Record<
  RoleType,
  {
    color: string;
    title: string;
    description: string;
    chips: string[];
  }
> = {
  admin: {
    color: "#7c3aed",
    title: "Admin Workspace",
    description:
      "Manage platform users, approvals, and operations in one place.",
    chips: ["User Management", "Platform Control", "Audit Overview"],
  },
  buyer: {
    color: "#1d4ed8",
    title: "Buyer Workspace",
    description:
      "Browse premium fruit supply, manage purchasing, and track orders.",
    chips: ["Catalog Access", "Purchase Orders", "Delivery Tracking"],
  },
  farmer: {
    color: "#166534",
    title: "Farmer Workspace",
    description: "Publish produce, manage farm inventory, and monitor demand.",
    chips: ["Farm Inventory", "Harvest Updates", "Demand Insights"],
  },
  delivery: {
    color: "#b45309",
    title: "Delivery Workspace",
    description:
      "Handle assignments, route delivery tasks, and confirm drop-offs.",
    chips: ["Delivery Queue", "Route Status", "Proof of Delivery"],
  },
};

const roleMenus: Record<RoleType, RoleMenuItem[]> = {
  admin: [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <DashboardOutlinedIcon />,
    },
    {
      key: "users",
      label: "Manage Users",
      path: "/admin/users",
      icon: <PeopleOutlinedIcon />,
    },
    {
      key: "verify",
      label: "Role Approval",
      path: "/admin/verify",
      icon: <VerifiedUserOutlinedIcon />,
    },
    {
      key: "reports",
      label: "Reports",
      path: "/admin/reports",
      icon: <BarChartOutlinedIcon />,
    },
  ],
  buyer: [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/buyer/dashboard",
      icon: <DashboardOutlinedIcon />,
    },
    {
      key: "market",
      label: "Marketplace",
      path: "/buyer/market",
      icon: <StorefrontOutlinedIcon />,
    },
    {
      key: "orders",
      label: "My Orders",
      path: "/buyer/orders",
      icon: <ReceiptLongOutlinedIcon />,
    },
    {
      key: "deliveries",
      label: "Track Deliveries",
      path: "/buyer/deliveries",
      icon: <LocalShippingOutlinedIcon />,
    },
  ],
  farmer: [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/farmer/dashboard",
      icon: <DashboardOutlinedIcon />,
    },
    {
      key: "inventory",
      label: "My Produce",
      path: "/farmer/inventory",
      icon: <Inventory2OutlinedIcon />,
    },
    {
      key: "orders",
      label: "Incoming Orders",
      path: "/farmer/orders",
      icon: <ReceiptLongOutlinedIcon />,
    },
    {
      key: "insights",
      label: "Demand Insights",
      path: "/farmer/insights",
      icon: <BarChartOutlinedIcon />,
    },
  ],
  delivery: [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/delivery/dashboard",
      icon: <DashboardOutlinedIcon />,
    },
    {
      key: "tasks",
      label: "Delivery Tasks",
      path: "/delivery/tasks",
      icon: <AssignmentTurnedInOutlinedIcon />,
    },
    {
      key: "routes",
      label: "Route Plan",
      path: "/delivery/routes",
      icon: <RouteOutlinedIcon />,
    },
    {
      key: "history",
      label: "Delivery History",
      path: "/delivery/history",
      icon: <ReceiptLongOutlinedIcon />,
    },
  ],
};

function normalizeRole(role?: string | null): RoleType | null {
  if (role === "admin") return "admin";
  if (role === "buyer") return "buyer";
  if (role === "farmer") return "farmer";
  if (role === "delivery") return "delivery";
  return null;
}

function RoleIcon({ role }: { role: RoleType }) {
  if (role === "admin") return <AdminPanelSettingsOutlinedIcon />;
  if (role === "buyer") return <ShoppingCartOutlinedIcon />;
  if (role === "farmer") return <SpaOutlinedIcon />;
  return <LocalShippingOutlinedIcon />;
}

export default function RoleUserLayout({
  user,
  onSignOut,
}: RoleUserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = normalizeRole(user?.role);
  const config = role ? roleTheme[role] : null;
  const safeRole: RoleType = role ?? "buyer";
  const drawerWidth = 280;
  const menuItems = useMemo(() => roleMenus[safeRole], [safeRole]);
  const activeMenu = useMemo(
    () =>
      menuItems.find((menu) => pathname.startsWith(menu.path)) ?? menuItems[0],
    [menuItems, pathname],
  );

  if (!config) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="success">Signed in successfully.</Alert>
        <Typography variant="h6" fontWeight={700}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Name: {user?.name || user?.email || "-"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email: {user?.email || "-"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User ID: {user?.id || "N/A"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Provider: {user?.auth_provider || "credentials"}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onSignOut}
          sx={{
            minHeight: 48,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#b9923b",
            "&:hover": { backgroundColor: "#a6802f" },
          }}
        >
          Sign out
        </Button>
      </Stack>
    );
  }

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar sx={{ bgcolor: `${config.color}22`, color: config.color }}>
            <RoleIcon role={safeRole} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              KUKU Market
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {config.title}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider />

      <List sx={{ px: 1.2, py: 1 }}>
        {menuItems.map((menu) => (
          <ListItemButton
            key={menu.key}
            selected={activeMenu?.key === menu.key}
            onClick={() => router.push(menu.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: `${config.color}18`,
                color: config.color,
              },
              "&.Mui-selected .MuiListItemIcon-root": { color: config.color },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{menu.icon}</ListItemIcon>
            <ListItemText primary={menu.label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="inherit"
          startIcon={<LogoutOutlinedIcon />}
          onClick={onSignOut}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#b9923b",
            color: "#fff",
            "&:hover": { backgroundColor: "#a6802f" },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", bgcolor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          color: "#1f2937",
          borderBottom: "1px solid #e5e7eb",
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
            {config.title}
          </Typography>
          {/* <Button
            variant="outlined"
            onClick={onSignOut}
            startIcon={<LogoutOutlinedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#d1d5db",
              color: "#374151",
            }}
          >
            Logout
          </Button> */}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid #e5e7eb",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      {/* 
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pb: { xs: 11, md: 3 },
          mt: "64px",
        }}
      >
        <Stack spacing={2.5}>
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              background: `linear-gradient(135deg, ${config.color}16 0%, #ffffff 100%)`,
              border: `1px solid ${config.color}33`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  color: config.color,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <RoleIcon role={safeRole} />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                Welcome back
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.primary" mt={0.8}>
              {user?.name || user?.email}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: config.color, fontWeight: 700, mt: 0.3 }}
            >
              Role: {safeRole}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.8}>
              {config.description}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {config.chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                size="small"
                sx={{
                  borderRadius: 2,
                  color: config.color,
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${config.color}33`,
                }}
              />
            ))}
          </Stack>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Active Menu: {activeMenu?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Email: {user?.email || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              User ID: {user?.id || "N/A"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provider: {user?.auth_provider || "credentials"}
            </Typography>
          </Box>
        </Stack>
      </Box> */}

      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: { xs: "block", md: "none" },
          borderTop: "1px solid #e5e7eb",
          zIndex: 1201,
        }}
      >
        <BottomNavigation
          showLabels
          value={activeMenu?.path}
          onChange={(_, value) => {
            if (value === "logout") {
              onSignOut();
              return;
            }
            router.push(String(value));
          }}
          sx={{
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              maxWidth: "none",
              fontSize: 12,
            },
          }}
        >
          {menuItems.map((menu) => (
            <BottomNavigationAction
              key={menu.key}
              value={menu.path}
              label={menu.label}
              icon={menu.icon}
              sx={{
                color: "#6b7280",
                "&.Mui-selected": { color: config.color },
              }}
            />
          ))}
          <BottomNavigationAction
            value="logout"
            label="Logout"
            icon={<LogoutOutlinedIcon />}
            sx={{ color: "#b91c1c" }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
