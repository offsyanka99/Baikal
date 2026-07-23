export type PortalUser = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
};

export type Calendar = {
  id: number;
  calendarId: number;
  instanceId: number;
  uri: string;
  displayname: string;
  description: string;
  color: string;
  access: string;
  accessCode: number;
  canShare: boolean;
  components: string;
};

export type Share = {
  href: string;
  principal: string;
  username: string;
  displayname: string;
  access: string;
  accessCode: number;
  status: number;
};

export type DirectoryUser = {
  username: string;
  displayname: string;
  email: string;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    const msg =
      data &&
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const api = {
  me: () =>
    request<{ user: PortalUser; version: string | null; davPath: string }>(
      "/me",
    ),
  login: (username: string, password: string) =>
    request<{ user: PortalUser }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/logout", { method: "POST" }),
  calendars: () => request<{ calendars: Calendar[] }>("/calendars"),
  directory: () => request<{ users: DirectoryUser[] }>("/directory"),
  shares: (instanceId: number) =>
    request<{ shares: Share[] }>(`/calendars/${instanceId}/shares`),
  share: (instanceId: number, username: string, access: "read" | "readwrite") =>
    request<{ share: Share }>(`/calendars/${instanceId}/shares`, {
      method: "POST",
      body: JSON.stringify({ username, access }),
    }),
  revoke: (instanceId: number, href: string) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}/shares`, {
      method: "DELETE",
      body: JSON.stringify({ href }),
    }),
};

export { ApiError };
