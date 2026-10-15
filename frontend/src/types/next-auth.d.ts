import NextAuth, { type DefaultSession } from "next-auth";

// Augment the Session type to include backendToken and user metadata
declare module "next-auth" {
  interface Session {
    backendToken?: string;
    authProviders?: string[];
    user: {
      id: string;
      authProviders?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    backendToken?: string;
    authProviders?: string[];
  }
}

// Augment the JWT type to include backendToken, authProviders, and idToken
declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    authProviders?: string[];
    idToken?: string;
    accessToken?: string;
  }
}
