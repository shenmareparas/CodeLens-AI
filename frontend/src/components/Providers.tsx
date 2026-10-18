"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";

interface Props {
  children: ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: Props) {
  return (
    <ThemeProvider>
      <SessionProvider
        session={session}
        refetchInterval={0}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
