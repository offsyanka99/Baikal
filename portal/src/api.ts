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
  readOnly?: boolean;
  holidaysCountry?: string | null;
  holidayImport?: { imported: number; updated: number; skipped: number };
};

export type HolidayCountry = {
  code: string;
  name: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
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

export type AddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  cardCount: number;
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
    let msg = `Request failed (${res.status})`;
    if (
      data &&
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      msg = (data as { error: string }).error;
    } else if (res.status === 500 || res.status === 504) {
      msg =
        "Server error during import (often a timeout on large calendars). Try again — already imported events update faster.";
    }
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
  createCalendar: (body: {
    displayname: string;
    description?: string;
    color?: string;
    readOnly?: boolean;
    holidays?: boolean;
    holidayCountry?: string;
  }) =>
    request<{ calendar: Calendar; holidayImport?: ImportResult | null }>(
      "/calendars",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  holidayCountries: () =>
    request<{ countries: HolidayCountry[] }>("/holidays/countries"),
  updateCalendar: (
    instanceId: number,
    body: { displayname?: string; description?: string; color?: string },
  ) =>
    request<{ calendar: Calendar }>(`/calendars/${instanceId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  exportCalendar: async (instanceId: number): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/calendars/${instanceId}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `calendar-${instanceId}.ics`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importCalendar: (instanceId: number, ics: string) =>
    request<ImportResult>(`/calendars/${instanceId}/import`, {
      method: "POST",
      body: JSON.stringify({ ics }),
    }),
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

  addressbooks: () =>
    request<{ addressbooks: AddressBook[] }>("/addressbooks"),
  exportAddressBook: async (
    id: number,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/addressbooks/${id}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `contacts-${id}.vcf`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importAddressBook: (id: number, vcf: string) =>
    request<ImportResult>(`/addressbooks/${id}/import`, {
      method: "POST",
      body: JSON.stringify({ vcf }),
    }),
};

export { ApiError };
