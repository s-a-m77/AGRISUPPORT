const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "agrisupport_access_token";

type AuthUser = { id: string; email: string; fullName: string };
type AuthSession = { access_token: string };
type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT", session: AuthSession | null) => void;

const listeners = new Set<AuthListener>();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as { message?: string } | T | null;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : "Request failed.";
    throw new Error(message);
  }
  return body as T;
}

function saveSession(accessToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  const session = { access_token: accessToken };
  listeners.forEach((listener) => listener("SIGNED_IN", session));
  return session;
}

export const api = {
  auth: {
    async signUp(input: {
      email: string;
      password: string;
      fullName: string;
      agriculturalRole?: string;
      role?: string;
      language?: string;
      region?: string;
      zone?: string;
      latitude?: number | null;
      longitude?: number | null;
      crop?: string;
      farmSizeHectares?: number | null;
      concern?: string;
    }) {
      const result = await request<{ accessToken: string; user: AuthUser }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return { data: { session: saveSession(result.accessToken), user: result.user }, error: null };
    },
    async signIn(input: { email: string; password: string }) {
      const result = await request<{ accessToken: string; user: AuthUser }>("/auth/signin", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return { data: { session: saveSession(result.accessToken), user: result.user }, error: null };
    },
    async getSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      return { data: { session: token ? { access_token: token } : null } };
    },
    async getUser() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return { data: { user: null } };
      try {
        return { data: { user: await request<AuthUser>("/auth/me") } };
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        return { data: { user: null } };
      }
    },
    onAuthStateChange(listener: AuthListener) {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      listeners.forEach((listener) => listener("SIGNED_OUT", null));
    },
    async resetPasswordForEmail() {
      return { error: new Error("Password reset is not configured for the PostgreSQL backend.") };
    },
    async updateUser(input: { password: string }) {
      await request("/auth/password", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return { error: null };
    },
  },
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init);
}

export async function askAiAdvisor(input: {
  messages: Array<{ role: "user" | "model"; text: string }>;
  farmId?: string;
  provider?: "gemini" | "openrouter";
  conversationId?: string;
  responseLanguage?: "en" | "am" | "om";
}): Promise<{ text: string; sources: Array<{ title: string; url: string }> }> {
  return request<{ text: string; sources: Array<{ title: string; url: string }> }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAiChatHistory(): Promise<
  Array<{
    id: string;
    role: "user" | "model";
    text: string;
    createdAt: string;
    conversationId: string | null;
  }>
> {
  return request("/ai/history");
}
