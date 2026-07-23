export type PortalUser = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
  csrfToken?: string;
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

/** VEVENT occurrence for the month grid (from GET /calendars/{id}/events) */
export type CalendarEvent = {
  uid: string;
  uri: string;
  summary: string;
  /** ISO datetime or YYYY-MM-DD for all-day */
  start: string;
  end: string | null;
  allDay: boolean;
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
  email?: string;
};

export type AddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  cardCount: number;
};

export type ContactPhone = {
  type: "cell" | "work" | "home" | "other" | string;
  value: string;
};

export type ContactAddress = {
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};

/** vCard X-* extension properties (custom fields) */
export type ContactCustomField = {
  name?: string;
  label: string;
  value: string;
};

export type ContactSummary = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  org: string;
  email: string;
  phone: string;
  hasPhoto: boolean;
  etag?: string;
};

export type ContactDetail = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  fullname: string;
  org: string;
  title: string;
  emails: string[];
  phones: ContactPhone[];
  address: ContactAddress;
  url: string;
  note: string;
  custom: ContactCustomField[];
  hasPhoto: boolean;
  photoDataUri?: string | null;
};

export type ContactWriteBody = {
  firstname?: string;
  lastname?: string;
  fullname?: string;
  org?: string;
  title?: string;
  emails?: string[];
  phones?: ContactPhone[];
  address?: ContactAddress;
  url?: string;
  note?: string;
  custom?: ContactCustomField[];
  photoBase64?: string | null;
  removePhoto?: boolean;
};

export type TaskItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  /** VTODO UID — used for subtask parent links (RELATED-TO) */
  uid: string;
  /** Parent task UID when this is a subtask; null for top-level */
  parentUid: string | null;
  summary: string;
  description: string;
  status: string;
  due: string | null;
  priority: number;
  percent: number;
  completed: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type NoteItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  summary: string;
  description: string;
  dtstart: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type ItemCalendarOption = {
  id: number;
  displayname: string;
  color: string;
  components: string;
};

export type TaskWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  status?: string;
  due?: string | null;
  priority?: number;
  percent?: number;
  /** Parent VTODO UID (same calendar); null/"" for top-level */
  parentUid?: string | null;
};

export type NoteWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  dtstart?: string | null;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Session CSRF token (set from login /me responses) */
let csrfToken = "";

export function setCsrfToken(token: string | null | undefined): void {
  csrfToken = token && typeof token === "string" ? token : "";
}

export function getCsrfToken(): string {
  return csrfToken;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
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

function encUri(uri: string): string {
  return encodeURIComponent(uri);
}

export const api = {
  me: async () => {
    const data = await request<{
      user: PortalUser;
      csrfToken?: string;
      version: string | null;
      davPath: string;
    }>("/me");
    setCsrfToken(data.csrfToken || data.user?.csrfToken);
    return data;
  },
  login: async (username: string, password: string) => {
    const data = await request<{ user: PortalUser }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setCsrfToken(data.user?.csrfToken);
    return data;
  },
  logout: async () => {
    try {
      return await request<{ ok: boolean }>("/logout", { method: "POST" });
    } finally {
      setCsrfToken("");
    }
  },
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
  deleteCalendar: (instanceId: number) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}`, { method: "DELETE" }),
  calendarEvents: (instanceId: number, from: string, to: string) => {
    const qs = new URLSearchParams({ from, to }).toString();
    return request<{ events: CalendarEvent[] }>(
      `/calendars/${instanceId}/events?${qs}`,
    );
  },
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
  createAddressBook: (body: {
    displayname: string;
    description?: string;
    uri?: string;
  }) =>
    request<{ addressbook: AddressBook }>("/addressbooks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAddressBook: (
    id: number,
    body: { displayname?: string; description?: string },
  ) =>
    request<{ addressbook: AddressBook }>(`/addressbooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAddressBook: (id: number, force = false) =>
    request<{ ok: boolean }>(`/addressbooks/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ force }),
    }),
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

  contacts: (abId: number, q = "") => {
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return request<{ contacts: ContactSummary[] }>(
      `/addressbooks/${abId}/contacts${qs}`,
    );
  },
  getContact: (abId: number, uri: string) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
    ),
  createContact: (abId: number, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(`/addressbooks/${abId}/contacts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateContact: (abId: number, uri: string, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  deleteContact: (abId: number, uri: string) =>
    request<{ ok: boolean }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      { method: "DELETE" },
    ),
  contactPhotoUrl: (abId: number, uri: string): string =>
    `/api/addressbooks/${abId}/contacts/${encUri(uri)}/photo`,

  tasks: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ tasks: TaskItem[]; calendars: ItemCalendarOption[] }>(
      `/tasks${qs}`,
    );
  },
  createTask: (body: TaskWriteBody) =>
    request<{ task: TaskItem }>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTask: (instanceId: number, uri: string, body: TaskWriteBody) =>
    request<{ task: TaskItem }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTask: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),
  /** Bulk delete or update selected tasks (status / due / percent). */
  bulkTasks: (body: {
    op: "delete" | "update";
    items: { instanceId: number; uri: string }[];
    fields?: { status?: string; due?: string | null; percent?: number };
  }) =>
    request<{ ok: number; failed: number; errors: string[] }>("/tasks/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  notes: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ notes: NoteItem[]; calendars: ItemCalendarOption[] }>(
      `/notes${qs}`,
    );
  },
  createNote: (body: NoteWriteBody) =>
    request<{ note: NoteItem }>("/notes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateNote: (instanceId: number, uri: string, body: NoteWriteBody) =>
    request<{ note: NoteItem }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteNote: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),
};

export { ApiError };
