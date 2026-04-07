import type { NextAuthOptions } from "next-auth";
import type { Account, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import apiClient from "@/lib/axios";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

const socialGoogleLoginEndpoint =
  process.env.AUTH_SOCIAL_GOOGLE_ENDPOINT?.trim();

if (googleClientSecret.startsWith("ya29.")) {
  throw new Error(
    "Invalid GOOGLE_CLIENT_SECRET: looks like an access token (starts with ya29.). Use the OAuth Client Secret from Google Cloud Console > APIs & Services > Credentials.",
  );
}

type SocialProvider = "google";

const socialProviderConfig: Record<
  SocialProvider,
  { envEndpoint?: string; defaults: string[]; envKey: string }
> = {
  google: {
    envEndpoint: socialGoogleLoginEndpoint,
    defaults: ["/auth/oauth/google", "/auth/oauth"],
    envKey: "AUTH_SOCIAL_GOOGLE_ENDPOINT",
  },
};

type AppAuthUser = {
  id: string;
  username?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  accessToken?: string;
  auth_provider?: string | null;
  auth_provider_id?: string | null;
  role?: string | null;
  Buyer?: string[];
  Farmer?: string[];
  Deliveries?: string[];
};

function mapAuthResponse(data: any): AppAuthUser | null {
  const userData = data?.data ?? data?.user ?? data;
  const accessToken = data?.token ?? data?.accessToken ?? data?.data?.token;

  if (!userData) return null;

  return {
    id: String(userData.id ?? userData._id ?? userData.user_id ?? ""),
    name: userData.full_name ?? userData.name ?? null,
    email: userData.email,
    image: userData.avatar ?? userData.avatar_url ?? userData.image ?? null,
    accessToken,
    auth_provider: userData.auth_provider ?? null,
    auth_provider_id: userData.auth_provider_id ?? null,
    role: userData.role ?? null,
    Buyer: userData.Buyer ?? [],
    Farmer: userData.Farmer ?? [],
    Deliveries: userData.Deliveries ?? [],
  };
}

function isSocialProvider(provider: string): provider is SocialProvider {
  return provider === "google";
}

function getSocialOAuthEndpoints(provider: SocialProvider): string[] {
  const config = socialProviderConfig[provider];
  const candidates: string[] = [config.envEndpoint, ...config.defaults].filter(
    Boolean,
  ) as string[];

  return Array.from(new Set(candidates));
}

async function exchangeSocialWithBackend(params: {
  provider: SocialProvider;
  account: Account;
  user?: User;
}): Promise<AppAuthUser> {
  const { provider, account, user } = params;

  const payload = {
    provider,
    idToken: account.id_token,
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at,
    tokenType: account.token_type,
    scope: account.scope,
    profile: {
      id: String(user?.id ?? account.providerAccountId ?? ""),
      name: user?.name ?? null,
      email: user?.email ?? null,
      image: user?.image ?? null,
    },
  };

  const endpoints = getSocialOAuthEndpoints(provider);

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiClient.post(endpoint, payload);
      const mappedUser = mapAuthResponse(data);

      if (!mappedUser?.accessToken) {
        throw new Error(
          `Backend responded from ${endpoint} but did not return an application access token.`,
        );
      }

      return mappedUser;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        continue;
      }
      throw error;
    }
  }

  const config = socialProviderConfig[provider];
  throw new Error(
    `${provider.toUpperCase()} social login endpoint not found. Tried: ${endpoints.join(", ")}. Set ${config.envKey} in .env.local to your backend OAuth login route.`,
  );
}

function mapUserToTokenFields(
  user: Partial<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    accessToken: string;
    auth_provider: string | null;
    auth_provider_id: string | null;
    role: string | null;
    Buyer: string[];
    Farmer: string[];
    Deliveries: string[];
  }>,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.image ?? undefined,
    accessToken: user.accessToken,
    auth_provider: user.auth_provider ?? null,
    auth_provider_id: user.auth_provider_id ?? null,
    role: user.role ?? null,
    Buyer: user.Buyer ?? [],
    Farmer: user.Farmer ?? [],
    Deliveries: user.Deliveries ?? [],
  };
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      identifier: {
        label: "Username / Email",
        type: "text",
        placeholder: "username or you@example.com",
      },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const identifier = credentials?.identifier?.trim();
      const password = credentials?.password;
      if (!identifier || !password) return null;

      try {
        const { data } = await apiClient.post("/auth/login", {
          identifier,
          email: identifier,
          username: identifier,
          password,
        });

        const mappedUser = mapAuthResponse(data);
        if (!mappedUser) return null;

        return mappedUser;
      } catch {
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers,

  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const mappedFields = mapUserToTokenFields(user);

        token.id = mappedFields.id ?? token.id;
        token.name = mappedFields.name ?? token.name;
        token.email = mappedFields.email ?? token.email;
        token.picture = mappedFields.picture ?? token.picture;
        token.accessToken = mappedFields.accessToken ?? token.accessToken;
        token.auth_provider = mappedFields.auth_provider;
        token.auth_provider_id = mappedFields.auth_provider_id;
        token.role = mappedFields.role;
        token.Buyer = mappedFields.Buyer;
        token.Farmer = mappedFields.Farmer;
        token.Deliveries = mappedFields.Deliveries;
      }

      if (account?.provider && isSocialProvider(account.provider)) {
        const appUser = await exchangeSocialWithBackend({
          provider: account.provider,
          account,
          user,
        });

        const mappedFields = mapUserToTokenFields(appUser);

        token.id = mappedFields.id ?? token.id;
        token.name = mappedFields.name ?? token.name;
        token.email = mappedFields.email ?? token.email;
        token.picture = mappedFields.picture ?? token.picture;
        token.accessToken = mappedFields.accessToken ?? token.accessToken;
        token.auth_provider = mappedFields.auth_provider;
        token.auth_provider_id = mappedFields.auth_provider_id;
        token.role = mappedFields.role;
        token.Buyer = mappedFields.Buyer;
        token.Farmer = mappedFields.Farmer;
        token.Deliveries = mappedFields.Deliveries;
      }

      if (trigger === "update" && session?.user) {
        token.id = session.user.id ?? token.id;
        token.name = session.user.name ?? token.name;
        token.email = session.user.email ?? token.email;
        token.picture = session.user.image ?? token.picture;
        token.accessToken = session.user.accessToken ?? token.accessToken;
        token.auth_provider = session.user.auth_provider ?? token.auth_provider;
        token.auth_provider_id =
          session.user.auth_provider_id ?? token.auth_provider_id;
        token.role = session.user.role ?? token.role;
        token.Buyer = session.user.Buyer ?? token.Buyer;
        token.Farmer = session.user.Farmer ?? token.Farmer;
        token.Deliveries = session.user.Deliveries ?? token.Deliveries;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? "";
        session.user.image = token.picture ?? "";
        session.user.accessToken = token.accessToken ?? "";
        session.user.auth_provider = token.auth_provider ?? "";
        session.user.auth_provider_id = token.auth_provider_id ?? "";
        session.user.role = token.role ?? "";
        session.user.Buyer = token.Buyer ?? [];
        session.user.Farmer = token.Farmer ?? [];
        session.user.Deliveries = token.Deliveries ?? [];
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
