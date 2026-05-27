export type AuthRole = "member" | "librarian";

export type AuthUser = {
  sub: string;
  email?: string;
  username?: string;
  role: AuthRole;
  name: string;
  membershipNumber?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export const AUTH_STORAGE_KEY = "lantern-library-auth";
export const AUTH_COOKIE_NAME = "lantern-library-token";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export async function login(payload: LoginPayload) {
  return post<AuthResponse>("/auth/login", payload);
}

export async function register(payload: RegisterPayload) {
  return post<AuthResponse>("/auth/signup", payload);
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(`Backend API is unavailable at ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    const error = await safeJson(response);
    const message =
      typeof error?.message === "string"
        ? error.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function persistAuth(response: AuthResponse) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
  document.cookie = `${AUTH_COOKIE_NAME}=${response.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function clearPersistedAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export async function authorizedJsonRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {})
      }
    });
  } catch {
    throw new Error(`Backend API is unavailable at ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    const error = await safeJson(response);
    const message =
      typeof error?.message === "string"
        ? error.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function authorizedBlobRequest(path: string, token: string) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch {
    throw new Error(`Backend API is unavailable at ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    const error = await safeJson(response);
    const message =
      typeof error?.message === "string"
        ? error.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return response.blob();
}
