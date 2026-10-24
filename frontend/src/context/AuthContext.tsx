import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  loginWithCredentials,
  registerWithCredentials,
  type BackendAuthResponse,
} from "@/lib/api-client";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  backendToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  backendToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

function getInitialToken(): string | null {
  try {
    return localStorage.getItem("codelens-token");
  } catch {
    return null;
  }
}

function getInitialUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("codelens-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [backendToken, setBackendToken] = useState<string | null>(
    getInitialToken,
  );
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = useCallback((res: BackendAuthResponse) => {
    const userData: AuthUser = {
      id: res.userId,
      email: res.email,
      name: res.name,
      avatarUrl: res.avatarUrl,
    };
    setBackendToken(res.token);
    setUser(userData);
    localStorage.setItem("codelens-token", res.token);
    localStorage.setItem("codelens-user", JSON.stringify(userData));
  }, []);

  const login = useCallback(
    async (email: string, pass: string) => {
      setIsLoading(true);
      try {
        const res = await loginWithCredentials(email, pass);
        handleAuthSuccess(res);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (name: string, email: string, pass: string) => {
      setIsLoading(true);
      try {
        await registerWithCredentials(name, email, pass);
        const loginRes = await loginWithCredentials(email, pass);
        handleAuthSuccess(loginRes);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    setBackendToken(null);
    setUser(null);
    localStorage.removeItem("codelens-token");
    localStorage.removeItem("codelens-user");
  }, []);

  const value = useMemo(
    () => ({
      user,
      backendToken,
      isAuthenticated: !!backendToken,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, backendToken, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
