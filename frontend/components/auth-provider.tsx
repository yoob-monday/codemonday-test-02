"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import {
  AUTH_STORAGE_KEY,
  clearPersistedAuth,
  login as loginRequest,
  persistAuth,
  register as registerRequest,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload
} from "@/lib/auth";

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (raw) {
      try {
        const stored = JSON.parse(raw) as AuthResponse;
        setToken(stored.accessToken);
        setUser(stored.user);
      } catch {
        clearPersistedAuth();
      }
    }

    setIsReady(true);
  }, []);

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload);
    persist(response);
    return response;
  }

  async function register(payload: RegisterPayload) {
    const response = await registerRequest(payload);
    persist(response);
    return response;
  }

  function logout() {
    clearPersistedAuth();
    setToken(null);
    setUser(null);
  }

  function persist(response: AuthResponse) {
    persistAuth(response);
    setToken(response.accessToken);
    setUser(response.user);
  }

  return (
    <AuthContext.Provider
      value={{
        isReady,
        token,
        user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
