import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      accessToken?: string;
      auth_provider?: string | null;
      auth_provider_id?: string | null;
      role?: string | null;
      Buyer?: string[];
      Farmer?: string[];
      Deliveries?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    accessToken?: string;
    auth_provider?: string | null;
    auth_provider_id?: string | null;
    role?: string | null;
    Buyer?: string[];
    Farmer?: string[];
    Deliveries?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    auth_provider?: string | null;
    auth_provider_id?: string | null;
    role?: string | null;
    Buyer?: string[];
    Farmer?: string[];
    Deliveries?: string[];
  }
}
