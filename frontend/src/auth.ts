import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { exchangeGoogleToken, loginWithCredentials } from "@/lib/api-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await loginWithCredentials(
            credentials.email as string,
            credentials.password as string,
          );

          return {
            id: res.userId,
            email: res.email,
            name: res.name,
            image: res.avatarUrl,
            backendToken: res.token,
            authProviders: res.authProviders,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Initial sign-in with Credentials provider
      if (user) {
        token.sub = user.id;
        token.backendToken = user.backendToken;
        token.authProviders = user.authProviders;
      }

      // 2. Initial sign-in with Google OAuth provider
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;

        if (account.id_token) {
          try {
            const backendRes = await exchangeGoogleToken(account.id_token);
            token.sub = backendRes.userId;
            token.backendToken = backendRes.token;
            token.authProviders = backendRes.authProviders;
          } catch (err) {
            console.error("Failed to exchange Google id_token with backend:", err);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string | undefined;
      session.authProviders = token.authProviders as string[] | undefined;
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
