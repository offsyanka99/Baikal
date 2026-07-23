import {
  api,
  ApiError,
  type AddressBook,
  type Calendar,
  type CalendarEvent,
  type ContactCustomField,
  type ContactDetail,
  type ContactPhone,
  type ContactSummary,
  type DirectoryUser,
  type HolidayCountry,
  type ImportResult,
  type ItemCalendarOption,
  type NoteItem,
  type PortalUser,
  type Share,
  type TaskItem,
} from "./api";

type TabId = "calendars" | "contacts" | "tasks" | "notes";

const APP_VERSION = "0.11.1-fork.3";
const DOCS_URL = "https://github.com/offsyanka99/Baikal/tree/master/docs";

type Flash = { type: "error" | "success" | "info"; message: string } | null;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function accessBadge(access: string): string {
  if (access === "readwrite") {
    return '<span class="badge badge-admin">full access</span>';
  }
  if (access === "read") {
    return '<span class="badge">read-only</span>';
  }
  if (access === "owner") {
    return '<span class="badge badge-ok">owner</span>';
  }
  return `<span class="badge">${esc(access)}</span>`;
}

function formatImportResult(r: ImportResult): string {
  const parts = [
    `${r.imported} new`,
    `${r.updated} updated`,
  ];
  if (r.skipped > 0) parts.push(`${r.skipped} skipped`);
  return parts.join(", ");
}

/** Section help texts shown in (i) info modals */
const SECTION_INFO: Record<string, { title: string; paragraphs: string[] }> = {
  "my-calendars": {
    title: "Calendar",
    paragraphs: [
      "Create and edit calendars, then share them with other Baïkal users.",
      "CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only.",
    ],
  },
  owned: {
    title: "Owned",
    paragraphs: [
      "Calendars you own appear here. Select one to edit details, import/export, or share.",
      "Badges show ownership, read-only mode, and holiday calendars.",
    ],
  },
  "add-calendar": {
    title: "Add calendar",
    paragraphs: [
      "Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).",
      "Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant.",
    ],
  },
  "shared-with-me": {
    title: "Shared with me",
    paragraphs: [
      "Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner.",
    ],
  },
  "calendar-details": {
    title: "Calendar details",
    paragraphs: [
      "Display name, color, and description are stored on the calendar and are visible to CalDAV clients.",
      "The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name.",
    ],
  },
  "import-export": {
    title: "Import / export",
    paragraphs: [
      "Export downloads a standard .ics file of the whole calendar.",
      "Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.",
      "Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact.",
    ],
  },
  share: {
    title: "Share",
    paragraphs: [
      "Share this calendar with another Baïkal user. Choose read-only or full access.",
      "This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.",
      "If the calendar is marked read-only, shares are always read-only for everyone.",
    ],
  },
  "my-contacts": {
    title: "Contacts",
    paragraphs: [
      "Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.",
      "Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files.",
    ],
  },
  tasks: {
    title: "Tasks",
    paragraphs: [
      "Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.",
      "Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.",
      "Click a column header to sort. Create tasks on any writable calendar that allows VTODO components.",
    ],
  },
  notes: {
    title: "Notes",
    paragraphs: [
      "Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.",
      "Click a column header to sort. Pick a writable calendar when creating a note.",
    ],
  },
  "address-books": {
    title: "Address books",
    paragraphs: [
      "Address books you own. Select one to manage its contacts.",
      "You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation.",
    ],
  },
  contacts: {
    title: "Contacts",
    paragraphs: [
      "Search filters by name, email, phone, org, notes, and custom fields.",
      "Add or select a contact to edit fields. Multiple emails and phones are supported.",
      "Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.",
      "Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them.",
    ],
  },
  "contact-import-export": {
    title: "Import / export contacts",
    paragraphs: [
      "Export downloads a multi-vCard .vcf file of every contact in the address book.",
      "Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.",
    ],
  },
};

function infoTitle(title: string, infoKey: string, tag: "h1" | "h2" = "h2"): string {
  const Tag = tag;
  return `<div class="section-title-row">
    <${Tag}>${esc(title)}</${Tag}>
    <button type="button" class="info-btn" data-action="info" data-info="${esc(infoKey)}"
      aria-label="About ${esc(title)}" title="About ${esc(title)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`;
}

function infoModalHtml(): string {
  return `
    <div class="info-modal" id="info-modal" hidden role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-backdrop" data-action="info-close"></div>
      <div class="info-modal-card">
        <header class="info-modal-header">
          <h3 id="info-modal-title"></h3>
          <button type="button" class="info-modal-close" data-action="info-close" aria-label="Close">×</button>
        </header>
        <div class="info-modal-body muted small" id="info-modal-body"></div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="info-close">Got it</button>
        </footer>
      </div>
    </div>`;
}

export function mountApp(root: HTMLElement): void {
  let user: PortalUser | null = null;
  let flash: Flash = null;
  let activeTab: TabId = "calendars";
  let calendars: Calendar[] = [];
  let directory: DirectoryUser[] = [];
  let holidayCountries: HolidayCountry[] = [];
  let selectedId: number | null = null;
  let shares: Share[] = [];
  /** Calendar details + share live in a modal (not the right column). */
  let calModalOpen = false;
  /** Owned calendar pending delete confirmation. */
  let deleteConfirmId: number | null = null;
  /** Month grid cursor (local calendar). */
  let monthCursor = { y: new Date().getFullYear(), m: new Date().getMonth() };
  let monthEvents: CalendarEvent[] = [];
  let monthEventsLoading = false;
  let addressBooks: AddressBook[] = [];
  let selectedAbId: number | null = null;
  let contacts: ContactSummary[] = [];
  let contactSearch = "";
  let selectedContactUri: string | null = null;
  let editingContact: ContactDetail | null = null;
  /** When true, form is for a new contact (no uri yet). */
  let creatingContact = false;
  let photoPreview: string | null = null;
  let photoBase64Pending: string | null = null;
  let removePhotoPending = false;
  let busy = false;
  /** Shown under Import/export until the next import/export or calendar change */
  let lastImportResult: { ok: boolean; message: string } | null = null;
  let lastContactImportResult: { ok: boolean; message: string } | null = null;
  let escapeBound = false;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Tasks / Notes (CalDAV VTODO / VJOURNAL)
  let tasks: TaskItem[] = [];
  let notes: NoteItem[] = [];
  let taskCalendars: ItemCalendarOption[] = [];
  let noteCalendars: ItemCalendarOption[] = [];
  let taskSearch = "";
  let noteSearch = "";
  let taskSort = "due";
  let taskOrder: "asc" | "desc" = "asc";
  let noteSort = "dtstart";
  let noteOrder: "asc" | "desc" = "desc";
  let selectedTaskKey: string | null = null; // instanceId|uri
  let selectedNoteKey: string | null = null;
  let editingTask: TaskItem | null = null;
  let editingNote: NoteItem | null = null;
  let creatingTask = false;
  let creatingNote = false;
  /** Multi-select keys (instanceId|uri) for bulk actions on Tasks */
  let checkedTaskKeys: string[] = [];

  function setFlash(type: Flash extends null ? never : NonNullable<Flash>["type"], message: string) {
    flash = { type, message };
  }

  function clearFlash() {
    flash = null;
  }

  async function bootstrap() {
    try {
      const me = await api.me();
      user = me.user;
      await loadHome();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        user = null;
      } else {
        setFlash("error", e instanceof Error ? e.message : "Failed to load");
      }
    }
    render();
  }

  async function loadHome() {
    const [cals, dir, abs] = await Promise.all([
      api.calendars(),
      api.directory().catch(() => ({ users: [] as DirectoryUser[] })),
      api.addressbooks(),
    ]);
    calendars = cals.calendars;
    directory = dir.users;
    addressBooks = abs.addressbooks;
    if (holidayCountries.length === 0) {
      try {
        const hc = await api.holidayCountries();
        holidayCountries = hc.countries;
      } catch {
        holidayCountries = [];
      }
    }
    if (selectedId !== null && !calendars.some((c) => c.id === selectedId)) {
      selectedId = null;
      shares = [];
      calModalOpen = false;
      deleteConfirmId = null;
    }
    if (selectedId === null) {
      const def = pickDefaultCalendar();
      if (def) {
        selectedId = def.id;
      }
    }
    if (selectedId !== null && calModalOpen) {
      await loadShares(selectedId);
    } else if (selectedId !== null) {
      shares = [];
    }
    if (activeTab === "calendars") {
      await loadMonthEvents();
    }
    if (selectedAbId !== null && !addressBooks.some((a) => a.id === selectedAbId)) {
      selectedAbId = null;
      contacts = [];
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
    }
    if (selectedAbId === null && addressBooks.length > 0) {
      selectedAbId = addressBooks[0].id;
    }
    if (selectedAbId !== null && activeTab === "contacts") {
      await loadContacts(selectedAbId);
    }
  }

  async function loadShares(id: number) {
    const res = await api.shares(id);
    shares = res.shares;
  }

  /** Prefer uri/name "default", else first owned calendar. */
  function pickDefaultCalendar(): Calendar | null {
    const own = calendars.filter((c) => c.canShare);
    if (own.length === 0) return null;
    const isDefault = (c: Calendar) => {
      const u = c.uri.toLowerCase();
      const n = c.displayname.toLowerCase();
      return u === "default" || n === "default" || n === "default calendar";
    };
    return own.find(isDefault) ?? own[0] ?? null;
  }

  function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function monthRange(y: number, m: number): { from: string; to: string } {
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    return { from: ymd(from), to: ymd(to) };
  }

  function eventDayKey(ev: CalendarEvent): string {
    if (ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
      return ev.start.slice(0, 10);
    }
    const d = new Date(ev.start);
    if (Number.isNaN(d.getTime())) return ev.start.slice(0, 10);
    return ymd(d);
  }

  async function loadMonthEvents() {
    if (selectedId === null) {
      monthEvents = [];
      return;
    }
    const { from, to } = monthRange(monthCursor.y, monthCursor.m);
    monthEventsLoading = true;
    try {
      const res = await api.calendarEvents(selectedId, from, to);
      monthEvents = res.events;
    } catch {
      monthEvents = [];
    } finally {
      monthEventsLoading = false;
    }
  }

  function monthTitle(y: number, m: number): string {
    return new Date(y, m, 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  function renderMonthGrid(): string {
    const selected = selectedId !== null ? calendars.find((c) => c.id === selectedId) : null;
    const calName = selected?.displayname ?? "Calendar";
    const color = selected?.color
      ? selected.color.length >= 7
        ? selected.color.slice(0, 7)
        : selected.color
      : "#3B82F6";

    const y = monthCursor.y;
    const m = monthCursor.m;
    const first = new Date(y, m, 1);
    // Monday-first (match common EU / screenshot layout)
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const today = new Date();
    const todayKey = ymd(today);

    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of monthEvents) {
      const key = eventDayKey(ev);
      const list = byDay.get(key) ?? [];
      list.push(ev);
      byDay.set(key, list);
    }

    const cells: string[] = [];
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      let dayNum: number;
      let inMonth = true;
      let cellDate: Date;
      if (i < startPad) {
        dayNum = prevDays - startPad + i + 1;
        inMonth = false;
        cellDate = new Date(y, m - 1, dayNum);
      } else if (i >= startPad + daysInMonth) {
        dayNum = i - (startPad + daysInMonth) + 1;
        inMonth = false;
        cellDate = new Date(y, m + 1, dayNum);
      } else {
        dayNum = i - startPad + 1;
        cellDate = new Date(y, m, dayNum);
      }
      const key = ymd(cellDate);
      const isToday = key === todayKey;
      const dayEvents = inMonth ? byDay.get(key) ?? [] : [];
      const maxShow = 3;
      const shown = dayEvents.slice(0, maxShow);
      const more = dayEvents.length - shown.length;
      const chips = shown
        .map(
          (ev) =>
            `<span class="month-event" title="${esc(ev.summary)}" style="--ev-color:${esc(color)}">${esc(ev.summary)}</span>`,
        )
        .join("");
      const moreHtml =
        more > 0 ? `<span class="month-event-more">+${more} more</span>` : "";
      const dayLabel =
        !inMonth && (dayNum === 1 || i === startPad + daysInMonth)
          ? cellDate.toLocaleString(undefined, { month: "short", day: "numeric" })
          : String(dayNum);
      cells.push(`<div class="month-cell${inMonth ? "" : " is-outside"}${isToday ? " is-today" : ""}">
        <div class="month-daynum${isToday ? " is-today-num" : ""}">${esc(dayLabel)}</div>
        <div class="month-events">${chips}${moreHtml}</div>
      </div>`);
    }

    const emptyHint =
      !selected
        ? `<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>`
        : monthEventsLoading
          ? `<p class="muted small month-empty-hint">Loading events…</p>`
          : "";

    return `<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${busy ? "disabled" : ""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${busy ? "disabled" : ""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${busy ? "disabled" : ""}>›</button>
        </div>
        <h2 class="month-cal-title">${esc(monthTitle(y, m))}</h2>
        <span class="month-cal-name muted small" title="${esc(calName)}">
          <span class="cal-swatch" style="background:${esc(color)};margin-top:0"></span>
          ${esc(calName)}
        </span>
      </div>
      ${emptyHint}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          <div class="month-dow">Mon</div><div class="month-dow">Tue</div><div class="month-dow">Wed</div>
          <div class="month-dow">Thu</div><div class="month-dow">Fri</div><div class="month-dow">Sat</div>
          <div class="month-dow">Sun</div>
        </div>
        <div class="month-grid" role="rowgroup">
          ${cells.join("")}
        </div>
      </div>
    </section>`;
  }

  async function loadContacts(abId: number) {
    const res = await api.contacts(abId, contactSearch);
    contacts = res.contacts;
    if (
      selectedContactUri !== null &&
      !contacts.some((c) => c.uri === selectedContactUri)
    ) {
      selectedContactUri = null;
      if (!creatingContact) {
        editingContact = null;
        photoPreview = null;
        photoBase64Pending = null;
        removePhotoPending = false;
      }
    }
  }

  async function loadTasks() {
    const res = await api.tasks({ q: taskSearch, sort: taskSort, order: taskOrder });
    tasks = res.tasks;
    taskCalendars = res.calendars;
    const keySet = new Set(tasks.map((t) => itemKey(t.instanceId, t.uri)));
    checkedTaskKeys = checkedTaskKeys.filter((k) => keySet.has(k));
    if (
      selectedTaskKey !== null &&
      !tasks.some((t) => `${t.instanceId}|${t.uri}` === selectedTaskKey)
    ) {
      selectedTaskKey = null;
      if (!creatingTask) editingTask = null;
    }
  }

  async function loadNotes() {
    const res = await api.notes({ q: noteSearch, sort: noteSort, order: noteOrder });
    notes = res.notes;
    noteCalendars = res.calendars;
    if (
      selectedNoteKey !== null &&
      !notes.some((n) => `${n.instanceId}|${n.uri}` === selectedNoteKey)
    ) {
      selectedNoteKey = null;
      if (!creatingNote) editingNote = null;
    }
  }

  function itemKey(instanceId: number, uri: string): string {
    return `${instanceId}|${uri}`;
  }

  function formatWhen(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function toLocalInputValue(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  }

  function sortHeader(
    label: string,
    col: string,
    current: string,
    order: "asc" | "desc",
    kind: "task" | "note",
    colClass = "",
  ): string {
    const active = current === col;
    const arrow = active ? (order === "asc" ? " ▲" : " ▼") : "";
    const cls = `sortable-th${active ? " is-sorted" : ""}${colClass ? " " + colClass : ""}`;
    return `<th class="${cls}" data-action="sort-${kind}" data-sort="${esc(col)}" role="columnheader" tabindex="0">${esc(label)}${arrow}</th>`;
  }

  async function openContact(uri: string) {
    if (selectedAbId === null) return;
    const res = await api.getContact(selectedAbId, uri);
    selectedContactUri = uri;
    creatingContact = false;
    const contact = res.contact;
    // Normalize optional arrays so the form never crashes on incomplete payloads
    editingContact = {
      ...contact,
      emails: Array.isArray(contact.emails) ? contact.emails : [],
      phones: Array.isArray(contact.phones) ? contact.phones : [],
      custom: Array.isArray(contact.custom) ? contact.custom : [],
      address: contact.address ?? emptyAddress(),
    };
    // Prefer photo endpoint over embedded data URI (smaller JSON, consistent cache)
    photoPreview =
      contact.photoDataUri ??
      (contact.hasPhoto && selectedAbId !== null
        ? `${api.contactPhotoUrl(selectedAbId, uri)}?t=${Date.now()}`
        : null);
    photoBase64Pending = null;
    removePhotoPending = false;
  }

  function startNewContact() {
    creatingContact = true;
    selectedContactUri = null;
    editingContact = {
      uri: "",
      displayname: "",
      firstname: "",
      lastname: "",
      fullname: "",
      org: "",
      title: "",
      emails: [""],
      phones: [{ type: "cell", value: "" }],
      address: { street: "", city: "", region: "", postal: "", country: "" },
      url: "",
      note: "",
      custom: [],
      hasPhoto: false,
      photoDataUri: null,
    };
    photoPreview = null;
    photoBase64Pending = null;
    removePhotoPending = false;
  }

  function emptyAddress() {
    return { street: "", city: "", region: "", postal: "", country: "" };
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const r = String(reader.result ?? "");
        const comma = r.indexOf(",");
        resolve(comma >= 0 ? r.slice(comma + 1) : r);
      };
      reader.onerror = () => reject(new Error("Failed to read photo file"));
      reader.readAsDataURL(file);
    });
  }

  function shell(body: string, opts: { auth?: boolean } = {}): string {
    const brand = `
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`;
    const nav = user
      ? `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
          <div class="topnav-right">
            <span class="muted">${esc(user.displayname || user.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`
      : `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
        </nav>`;

    // When calendar edit modal is open, flash is rendered inside the modal instead
    const flashOnMain = !(calModalOpen || deleteConfirmId !== null);
    const flashHtml = flashOnMain ? renderFlashBanner() : "";

    const footer = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${esc(APP_VERSION)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${esc(DOCS_URL)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;

    document.body.className = opts.auth ? "layout-auth" : "";

    return `${nav}
      <main class="container">
        ${flashHtml}
        ${body}
      </main>
      ${footer}
      ${infoModalHtml()}`;
  }

  /** Success/error banner; shown on main page or inside open calendar modal. */
  function renderFlashBanner(): string {
    if (!flash) return "";
    return `<div class="flash flash-${esc(flash.type)}" role="status">
      <span class="flash-text">${esc(flash.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`;
  }

  function renderLogin() {
    root.innerHTML = shell(
      `<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          <p class="muted">Use your Baïkal <strong>DAV user</strong> credentials (not the admin password).</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required />
            </label>
            <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,
      { auth: true },
    );
  }

  function renderHome() {
    if (!user) {
      renderLogin();
      return;
    }

    const own = calendars.filter((c) => c.canShare);
    const sharedWithMe = calendars.filter((c) => !c.canShare);
    const selected = calendars.find((c) => c.id === selectedId) ?? null;

    const calRows = own
      .map((c) => {
        const active = c.id === selectedId ? " is-selected" : "";
        const color = c.color
          ? `<span class="cal-swatch" style="background:${esc(c.color)}"></span>`
          : `<span class="cal-swatch cal-swatch-empty"></span>`;
        const badges =
          accessBadge(c.access) +
          (c.readOnly ? '<span class="badge">read-only</span>' : "") +
          (c.holidaysCountry
            ? `<span class="badge badge-admin">holidays ${esc(c.holidaysCountry)}</span>`
            : "");
        return `<div class="cal-row${active}" data-action="select-cal" data-id="${c.id}" role="button" tabindex="0">
          ${color}
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(c.displayname)}</span>
            <span class="cal-row-badges">${badges}</span>
            <span class="muted small mono cal-row-uri">${esc(c.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${c.id}" ${busy ? "disabled" : ""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${c.id}" ${busy ? "disabled" : ""}>Delete</button>
          </span>
        </div>`;
      })
      .join("");

    const sharedRows = sharedWithMe
      .map(
        (c) => `<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(c.displayname)}</span>
            <span class="cal-row-badges">${accessBadge(c.access)}</span>
            <span class="muted small">Shared with you · ${esc(c.access)}</span>
          </span>
        </div>`,
      )
      .join("");

    const userOptions = directory
      .map(
        (u) =>
          `<option value="${esc(u.username)}">${esc(u.displayname)} (${esc(u.username)})</option>`,
      )
      .join("");

    const shareRows =
      shares.length === 0
        ? `<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>`
        : shares
            .map(
              (s) => `<tr>
                <td>
                  <strong>${esc(s.displayname || s.username || s.href)}</strong>
                  <div class="muted small mono">${esc(s.username || s.href)}</div>
                </td>
                <td>${accessBadge(s.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${esc(s.href)}" ${busy ? "disabled" : ""}>Revoke</button>
                </td>
              </tr>`,
            )
            .join("");

    const colorValue = selected?.color
      ? selected.color.length >= 7
        ? selected.color.slice(0, 7)
        : "#3B82F6"
      : "#3B82F6";

    const shareReadOnlyForced = !!(selected && selected.readOnly);
    const calModal =
      calModalOpen && selected && selected.canShare
        ? `<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${renderFlashBanner()}
                <section>
                  ${infoTitle("Calendar details", "calendar-details")}
                  <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                    <label>
                      Display name
                      <input type="text" name="displayname" required maxlength="200"
                        value="${esc(selected.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${esc(colorValue)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${esc(selected.color || colorValue)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${esc(selected.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Save changes</button>
                      <span class="muted small mono">${esc(selected.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${infoTitle("Import / export", "import-export")}
                    ${
                      selected.readOnly
                        ? `<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>`
                        : ""
                    }
                    <div class="form-actions-row" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-cal" ${busy ? "disabled" : ""}>Export .ics</button>
                      <label class="btn btn-ghost file-btn" ${busy || selected.readOnly ? "aria-disabled=true" : ""}>
                        Import .ics
                        <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${busy || selected.readOnly ? "disabled" : ""} hidden />
                      </label>
                    </div>
                    ${
                      lastImportResult
                        ? `<div class="flash flash-${lastImportResult.ok ? "success" : "error"} import-result" role="status">
                            <strong>Import result:</strong> ${esc(lastImportResult.message)}
                          </div>`
                        : ""
                    }
                  </div>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${infoTitle(`Share “${selected.displayname}”`, "share")}
                  ${
                    shareReadOnlyForced
                      ? `<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>`
                      : ""
                  }
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${directory.length === 0 ? "disabled" : ""}>
                        <option value="">${directory.length ? "Select user…" : "No other users"}</option>
                        ${userOptions}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${shareReadOnlyForced ? "disabled" : ""}>
                        <option value="read" selected>Read only</option>
                        ${shareReadOnlyForced ? "" : '<option value="readwrite">Full access</option>'}
                      </select>
                      ${shareReadOnlyForced ? '<input type="hidden" name="access" value="read" />' : ""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${busy || directory.length === 0 ? "disabled" : ""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${shareRows}</tbody>
                    </table>
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`
        : "";

    const deleteTarget =
      deleteConfirmId !== null
        ? calendars.find((c) => c.id === deleteConfirmId && c.canShare) ?? null
        : null;
    const deleteModal = deleteTarget
      ? `<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${renderFlashBanner()}
              <p>You are about to permanently delete <strong>${esc(deleteTarget.displayname)}</strong>
                <span class="muted small mono">(${esc(deleteTarget.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${busy ? "disabled" : ""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${deleteTarget.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`
      : "";

    const calendarsTab = `
      <div class="portal-grid portal-grid-calendars">
        <section class="card">
          ${infoTitle("Owned", "owned")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${calRows || '<p class="muted">No calendars yet. Add one below.</p>'}
          </div>

          <div style="margin-top:1.35rem">
            ${infoTitle("Add calendar", "add-calendar")}
          </div>
          <form class="stack stack-tight" data-form="create-cal" style="margin-top:0.75rem">
            <label>
              Display name
              <input type="text" name="displayname" id="create-displayname" maxlength="200" placeholder="Work" autocomplete="off" />
            </label>
            <label>
              Color
              <span class="color-field">
                <input type="color" name="color_picker" value="#3B82F6" aria-label="New calendar color" />
                <input type="text" name="color" class="mono" maxlength="9" value="#3B82F6" placeholder="#3B82F6" />
              </span>
            </label>
            <label>
              Description
              <textarea name="description" rows="2" maxlength="2000" placeholder="Optional"></textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="holidays" data-action="toggle-holidays" />
              Holidays calendar
            </label>
            <label class="holidays-country" id="holidays-country-wrap" hidden>
              Country
              <select name="holidayCountry" id="holiday-country">
                <option value="">Select country…</option>
                ${holidayCountries
                  .map(
                    (c) =>
                      `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.code)})</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="readOnly" />
              Read-only (for everyone)
            </label>
            <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create calendar</button>
          </form>

          ${
            sharedWithMe.length
              ? `<div style="margin-top:1.25rem">
                   ${infoTitle("Shared with me", "shared-with-me")}
                   <div class="cal-list" style="margin-top:0.75rem">${sharedRows}</div>
                 </div>`
              : ""
          }
        </section>
        ${renderMonthGrid()}
      </div>
      ${calModal}
      ${deleteModal}`;

    const abRows = addressBooks
      .map((a) => {
        const active = a.id === selectedAbId ? " is-selected" : "";
        return `<button type="button" class="cal-row${active}" data-action="select-ab" data-id="${a.id}">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(a.displayname)}</span>
            <span class="muted small">${a.cardCount} contact${a.cardCount === 1 ? "" : "s"}</span>
            <span class="muted small mono cal-row-uri">${esc(a.uri)}</span>
          </span>
        </button>`;
      })
      .join("");

    const selectedAb = addressBooks.find((a) => a.id === selectedAbId) ?? null;

    const contactTableBody =
      contacts.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="4" class="muted">${
            contactSearch
              ? "No contacts match your search."
              : "No contacts yet. Add one or import a .vcf file."
          }</td></tr>`
        : contacts
            .map((ct) => {
              const active =
                !creatingContact && ct.uri === selectedContactUri
                  ? " is-selected"
                  : "";
              const initial = esc((ct.displayname || "?").slice(0, 1).toUpperCase());
              const avatar =
                ct.hasPhoto && selectedAbId !== null
                  ? `<img class="contact-avatar" src="${esc(api.contactPhotoUrl(selectedAbId, ct.uri))}" alt="" loading="lazy" data-avatar-fallback="${initial}" />`
                  : `<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${initial}</span>`;
              return `<tr class="contact-table-row${active}" data-action="select-contact" data-uri="${esc(ct.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${avatar}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${esc(ct.displayname)}</span>
                      ${ct.org ? `<span class="muted small contact-name-secondary">${esc(ct.org)}</span>` : ""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${esc(ct.email || "—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${esc(ct.phone || "—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${esc(ct.org || "—")}</span></td>
              </tr>`;
            })
            .join("");

    const c = editingContact;
    const emails = Array.isArray(c?.emails) && c.emails.length > 0 ? c.emails : [""];
    const phones: ContactPhone[] =
      Array.isArray(c?.phones) && c.phones.length > 0
        ? c.phones
        : [{ type: "cell", value: "" }];
    const addr = c?.address ?? emptyAddress();

    const emailRows = emails
      .map(
        (e, i) => `<div class="multi-row" data-multi="email" data-idx="${i}">
          <input type="email" name="email_${i}" value="${esc(e ?? "")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${i}" ${emails.length <= 1 ? "disabled" : ""} title="Remove">×</button>
        </div>`,
      )
      .join("");

    const phoneRows = phones
      .map(
        (p, i) => `<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${i}">
          <select name="phone_type_${i}" aria-label="Phone type">
            ${(["cell", "work", "home", "other"] as const)
              .map(
                (t) =>
                  `<option value="${t}" ${(p?.type ?? "other") === t ? "selected" : ""}>${t}</option>`,
              )
              .join("")}
          </select>
          <input type="tel" name="phone_value_${i}" value="${esc(p?.value ?? "")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${i}" ${phones.length <= 1 ? "disabled" : ""} title="Remove">×</button>
        </div>`,
      )
      .join("");

    const customFields: ContactCustomField[] = Array.isArray(c?.custom) ? c.custom : [];
    const customRows =
      customFields.length === 0
        ? `<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>`
        : customFields
            .map(
              (cf, i) => `<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${i}">
                <input type="text" name="custom_label_${i}" value="${esc(cf.label || "")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${i}" value="${esc(cf.value || "")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${i}" title="Remove">×</button>
              </div>`,
            )
            .join("");

    const contactForm =
      c && selectedAb
        ? `<div class="card">
            ${infoTitle(creatingContact ? "New contact" : "Edit contact", "contacts")}
            <form class="stack" data-form="contact" style="margin-top:1rem">
              <div class="contact-photo-row">
                <div class="contact-photo-preview">
                  ${
                    photoPreview
                      ? `<img src="${esc(photoPreview)}" alt="Contact photo" />`
                      : `<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${esc((c.fullname || c.firstname || "?").slice(0, 1).toUpperCase())}</span>`
                  }
                </div>
                <div class="stack stack-tight" style="flex:1">
                  <label class="btn btn-ghost file-btn" ${busy ? "aria-disabled=true" : ""}>
                    ${photoPreview ? "Change photo" : "Upload photo"}
                    <input type="file" accept="image/*" data-action="contact-photo" ${busy ? "disabled" : ""} hidden />
                  </label>
                  ${
                    photoPreview || c.hasPhoto
                      ? `<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${busy ? "disabled" : ""}>Remove photo</button>`
                      : ""
                  }
                  <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                </div>
              </div>
              <div class="form-grid form-grid-2">
                <label>First name
                  <input type="text" name="firstname" value="${esc(c.firstname)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Last name
                  <input type="text" name="lastname" value="${esc(c.lastname)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <label>Full name
                <input type="text" name="fullname" value="${esc(c.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
              </label>
              <div class="form-grid form-grid-2">
                <label>Organization
                  <input type="text" name="org" value="${esc(c.org)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Title
                  <input type="text" name="title" value="${esc(c.title)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <div class="form-grid form-grid-2 contact-email-phone">
                <fieldset class="fieldset">
                  <legend>Emails</legend>
                  ${emailRows}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${emails.length >= 10 ? "disabled" : ""}>+ Email</button>
                </fieldset>
                <fieldset class="fieldset">
                  <legend>Phones</legend>
                  ${phoneRows}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${phones.length >= 10 ? "disabled" : ""}>+ Phone</button>
                </fieldset>
              </div>
              <fieldset class="fieldset fieldset-address">
                <legend>Address</legend>
                <label>Street
                  <input type="text" name="street" value="${esc(addr.street)}" maxlength="300" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>City
                    <input type="text" name="city" value="${esc(addr.city)}" maxlength="120" autocomplete="off" />
                  </label>
                  <label>Region
                    <input type="text" name="region" value="${esc(addr.region)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2">
                  <label>Postal code
                    <input type="text" name="postal" value="${esc(addr.postal)}" maxlength="40" autocomplete="off" />
                  </label>
                  <label>Country
                    <input type="text" name="country" value="${esc(addr.country)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
              </fieldset>
              <label>Website
                <input type="url" name="url" value="${esc(c.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
              </label>
              <fieldset class="fieldset fieldset-custom">
                <legend>Custom fields</legend>
                ${customRows}
                <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${customFields.length >= 30 ? "disabled" : ""}>+ Custom field</button>
              </fieldset>
              <label>Notes
                <textarea name="note" rows="3" maxlength="4000">${esc(c.note)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingContact ? "Create contact" : "Save contact"}</button>
                ${
                  !creatingContact
                    ? `<button type="button" class="btn btn-danger" data-action="delete-contact" ${busy ? "disabled" : ""}>Delete</button>`
                    : `<button type="button" class="btn btn-ghost" data-action="cancel-contact" ${busy ? "disabled" : ""}>Cancel</button>`
                }
                ${
                  !creatingContact && c.uri
                    ? `<span class="muted small mono">${esc(c.uri)}</span>`
                    : ""
                }
              </div>
            </form>
          </div>`
        : selectedAb
          ? `<div class="card"><p class="muted">Select a contact or click <strong>Add contact</strong>.</p></div>`
          : `<div class="card"><p class="muted">Select or create an address book first.</p></div>`;

    const abManage = selectedAb
      ? `<section class="card ab-manage">
          ${infoTitle(selectedAb.displayname, "address-books")}
          <p class="muted small mono" style="margin:0.25rem 0 0.65rem">${esc(selectedAb.uri)} · ${selectedAb.cardCount} contact${selectedAb.cardCount === 1 ? "" : "s"}</p>
          <form class="stack stack-tight" data-form="edit-ab">
            <label>Display name
              <input type="text" name="displayname" required maxlength="200" value="${esc(selectedAb.displayname)}" />
            </label>
            <label>Description
              <textarea name="description" rows="2" maxlength="2000">${esc(selectedAb.description)}</textarea>
            </label>
            <div class="form-actions-row form-actions-wrap">
              <button type="submit" class="btn btn-primary btn-small" ${busy ? "disabled" : ""}>Save</button>
              <button type="button" class="btn btn-danger btn-small" data-action="delete-ab" ${busy ? "disabled" : ""}>Delete</button>
            </div>
          </form>
          <div class="section-divider" style="margin:1rem 0"></div>
          <div class="import-export">
            ${infoTitle("Import / export", "contact-import-export")}
            <div class="form-actions-row form-actions-wrap" style="margin-top:0.55rem">
              <button type="button" class="btn btn-small" data-action="export-ab" ${busy ? "disabled" : ""}>Export .vcf</button>
              <label class="btn btn-ghost btn-small file-btn" ${busy ? "aria-disabled=true" : ""}>
                Import .vcf
                <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${busy ? "disabled" : ""} hidden />
              </label>
            </div>
            ${
              lastContactImportResult
                ? `<div class="flash flash-${lastContactImportResult.ok ? "success" : "error"} import-result" role="status">
                    <strong>Import:</strong> ${esc(lastContactImportResult.message)}
                  </div>`
                : ""
            }
          </div>
        </section>`
      : "";

    const contactsTab = `
      <div class="portal-grid portal-grid-contacts">
        <div class="contacts-sidebar stack">
          <section class="card">
            ${infoTitle("Address books", "address-books")}
            <div class="cal-list" style="margin-top:0.75rem">
              ${abRows || '<p class="muted">No address books yet. Create one below.</p>'}
            </div>
            <div style="margin-top:1.25rem">
              <h3 class="h3-inline">Add address book</h3>
              <form class="stack stack-tight" data-form="create-ab" style="margin-top:0.5rem">
                <label>Display name
                  <input type="text" name="displayname" required maxlength="200" placeholder="Personal" autocomplete="off" />
                </label>
                <label>Description
                  <input type="text" name="description" maxlength="2000" placeholder="Optional" />
                </label>
                <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create</button>
              </form>
            </div>
          </section>
          ${abManage}
        </div>
        <section class="stack">
          ${
            selectedAb
              ? `<div class="card contacts-main-card">
                  ${infoTitle("Contacts", "contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${esc(contactSearch)}" aria-label="Search contacts" ${busy ? "disabled" : ""} />
                    <button type="button" class="btn btn-primary" data-action="new-contact" ${busy ? "disabled" : ""}>Add contact</button>
                  </div>
                  <div class="contacts-table-wrap" style="margin-top:0.75rem">
                    <table class="contacts-table">
                      <thead>
                        <tr>
                          <th class="contact-col-name">Name</th>
                          <th class="contact-col-email">Email</th>
                          <th class="contact-col-phone">Phone</th>
                          <th class="contact-col-org hide-sm">Organization</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${contactTableBody}
                      </tbody>
                    </table>
                  </div>
                </div>`
              : `<div class="card"><p class="muted">Select an address book to manage contacts.</p></div>`
          }
          ${contactForm}
        </section>
      </div>`;

    const tabInfoKey =
      activeTab === "calendars"
        ? "my-calendars"
        : activeTab === "contacts"
          ? "my-contacts"
          : activeTab === "tasks"
            ? "tasks"
            : "notes";

    const tasksTab = renderTasksTab();
    const notesTab = renderNotesTab();
    const mainTab =
      activeTab === "calendars"
        ? calendarsTab
        : activeTab === "contacts"
          ? contactsTab
          : activeTab === "tasks"
            ? tasksTab
            : notesTab;

    root.innerHTML = shell(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${activeTab === "calendars" ? " is-active" : ""}"
            data-action="tab" data-tab="calendars" aria-selected="${activeTab === "calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "contacts" ? " is-active" : ""}"
            data-action="tab" data-tab="contacts" aria-selected="${activeTab === "contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "tasks" ? " is-active" : ""}"
            data-action="tab" data-tab="tasks" aria-selected="${activeTab === "tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "notes" ? " is-active" : ""}"
            data-action="tab" data-tab="notes" aria-selected="${activeTab === "notes"}">
            Notes
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${tabInfoKey}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${mainTab}
    `);
    document.body.classList.toggle(
      "cal-modal-open",
      calModalOpen || deleteConfirmId !== null,
    );
  }

  /** Flatten tasks as a tree (subtasks under parent via RELATED-TO parentUid). */
  function tasksInTreeOrder(list: TaskItem[]): { task: TaskItem; depth: number }[] {
    const byUid = new Map<string, TaskItem>();
    for (const t of list) {
      if (t.uid) byUid.set(t.uid, t);
    }
    const orderIndex = new Map(list.map((t, i) => [itemKey(t.instanceId, t.uri), i]));
    const children = new Map<string, TaskItem[]>();
    const roots: TaskItem[] = [];
    for (const t of list) {
      const p = t.parentUid;
      if (p && byUid.has(p) && p !== t.uid) {
        const arr = children.get(p) ?? [];
        arr.push(t);
        children.set(p, arr);
      } else {
        roots.push(t);
      }
    }
    const byOrder = (a: TaskItem, b: TaskItem) =>
      (orderIndex.get(itemKey(a.instanceId, a.uri)) ?? 0) -
      (orderIndex.get(itemKey(b.instanceId, b.uri)) ?? 0);
    roots.sort(byOrder);
    for (const [, kids] of children) kids.sort(byOrder);

    const out: { task: TaskItem; depth: number }[] = [];
    const visiting = new Set<string>();
    const walk = (t: TaskItem, depth: number) => {
      const id = t.uid || itemKey(t.instanceId, t.uri);
      if (visiting.has(id)) return;
      visiting.add(id);
      out.push({ task: t, depth: Math.min(depth, 8) });
      for (const c of children.get(t.uid) ?? []) {
        walk(c, depth + 1);
      }
      visiting.delete(id);
    };
    for (const r of roots) walk(r, 0);
    // Any unvisited (shouldn't happen) — append flat
    for (const t of list) {
      if (!out.some((x) => x.task === t)) out.push({ task: t, depth: 0 });
    }
    return out;
  }

  /** UIDs that cannot be chosen as parent of `self` (self + descendants). */
  function taskDescendantUids(selfUid: string): Set<string> {
    const blocked = new Set<string>([selfUid]);
    if (!selfUid) return blocked;
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of tasks) {
        if (t.parentUid && blocked.has(t.parentUid) && t.uid && !blocked.has(t.uid)) {
          blocked.add(t.uid);
          grew = true;
        }
      }
    }
    return blocked;
  }

  function parentTaskOptions(forTask: TaskItem, creating: boolean): string {
    const calInstance = forTask.instanceId;
    const blocked = creating || !forTask.uid ? new Set<string>() : taskDescendantUids(forTask.uid);
    const candidates = tasks.filter(
      (x) =>
        x.uid &&
        x.instanceId === calInstance &&
        !blocked.has(x.uid) &&
        x.uid !== forTask.uid,
    );
    const selected = forTask.parentUid || "";
    const opts = [
      `<option value="">None (top-level)</option>`,
      ...candidates.map(
        (x) =>
          `<option value="${esc(x.uid)}" ${x.uid === selected ? "selected" : ""}>${esc(x.summary || x.uid)}</option>`,
      ),
    ];
    // Keep selected parent visible even if filtered out of list (e.g. other calendar)
    if (selected && !candidates.some((x) => x.uid === selected)) {
      const orphan = tasks.find((x) => x.uid === selected);
      opts.push(
        `<option value="${esc(selected)}" selected>${esc(orphan?.summary || selected)} (current)</option>`,
      );
    }
    return opts.join("");
  }

  function writableCheckedTasks(): TaskItem[] {
    const set = new Set(checkedTaskKeys);
    return tasks.filter((t) => set.has(itemKey(t.instanceId, t.uri)) && t.canWrite && !t.readOnly);
  }

  function renderTasksTab(): string {
    const statusLabel = (s: string) => {
      const m: Record<string, string> = {
        "NEEDS-ACTION": "To do",
        "IN-PROCESS": "In progress",
        COMPLETED: "Done",
        CANCELLED: "Cancelled",
      };
      return m[s] || s;
    };
    const tree = tasksInTreeOrder(tasks);
    const writableKeys = tasks
      .filter((t) => t.canWrite && !t.readOnly)
      .map((t) => itemKey(t.instanceId, t.uri));
    const allWritableChecked =
      writableKeys.length > 0 && writableKeys.every((k) => checkedTaskKeys.includes(k));
    const someChecked = checkedTaskKeys.length > 0;
    const checkedWritable = writableCheckedTasks();
    const nChecked = checkedWritable.length;

    const rows =
      tasks.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="6" class="muted">${
            taskSearch ? "No tasks match your search." : "No tasks yet. Add one below."
          }</td></tr>`
        : tree
            .map(({ task: t, depth }) => {
              const key = itemKey(t.instanceId, t.uri);
              const active = !creatingTask && key === selectedTaskKey ? " is-selected" : "";
              const checked = checkedTaskKeys.includes(key);
              const st = t.status === "COMPLETED" ? "badge-ok" : t.status === "CANCELLED" ? "" : "badge-admin";
              const indent = depth > 0 ? ` style="--task-depth:${depth}"` : "";
              const marker =
                depth > 0
                  ? `<span class="task-subtask-marker" aria-hidden="true">↳</span>`
                  : "";
              const canCheck = t.canWrite && !t.readOnly;
              return `<tr class="contact-table-row task-row${depth > 0 ? " is-subtask" : ""}${active}${checked ? " is-checked" : ""}" data-action="select-task" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}" tabindex="0" role="button"${indent}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}"
                    ${checked ? "checked" : ""} ${canCheck ? "" : "disabled"} aria-label="Select ${esc(t.summary || t.uri)}" ${busy ? "disabled" : ""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${marker}<span class="contact-name-primary">${esc(t.summary || t.uri)}</span></span>
                  ${t.readOnly ? '<span class="badge">read-only</span>' : ""}</td>
                <td class="col-task-status"><span class="badge ${st}">${esc(statusLabel(t.status))}</span></td>
                <td class="col-task-due muted small">${esc(formatWhen(t.due))}</td>
                <td class="col-task-cal muted small">${esc(t.calendarName)}</td>
                <td class="col-task-pct muted small">${t.percent ? esc(String(t.percent)) + "%" : "—"}</td>
              </tr>`;
            })
            .join("");

    const bulkBar =
      someChecked
        ? `<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-count">
              <strong>${nChecked}</strong><span class="bulk-bar-count-label">selected</span>${
                checkedTaskKeys.length !== nChecked
                  ? `<span class="muted small bulk-bar-count-extra">(${checkedTaskKeys.length - nChecked} read-only skipped)</span>`
                  : ""
              }
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Status
                <select id="bulk-task-status" ${busy || nChecked === 0 ? "disabled" : ""}>
                  <option value="">—</option>
                  <option value="NEEDS-ACTION">To do</option>
                  <option value="IN-PROCESS">In progress</option>
                  <option value="COMPLETED">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-status" ${busy || nChecked === 0 ? "disabled" : ""}>Apply status</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Due
                <input type="datetime-local" id="bulk-task-due" ${busy || nChecked === 0 ? "disabled" : ""} />
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-due" ${busy || nChecked === 0 ? "disabled" : ""}>Apply due</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${busy || nChecked === 0 ? "disabled" : ""} title="Clear due date">Clear due</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field bulk-field-pct">%
                <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${busy || nChecked === 0 ? "disabled" : ""} />
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-percent" ${busy || nChecked === 0 ? "disabled" : ""}>Apply %</button>
            </div>
            <div class="bulk-group bulk-group-end">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${busy || nChecked === 0 ? "disabled" : ""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${busy ? "disabled" : ""}>Clear selection</button>
            </div>
          </div>`
        : "";

    const t = editingTask;
    const calOpts = taskCalendars
      .map(
        (c) =>
          `<option value="${c.id}" ${t && t.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
      )
      .join("");
    const form =
      t
        ? `<div class="card">
            ${infoTitle(creatingTask ? (t.parentUid ? "New subtask" : "New task") : "Edit task", "tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${
                creatingTask
                  ? `<label>Calendar
                      <select name="instanceId" required ${taskCalendars.length === 0 ? "disabled" : ""}>
                        <option value="">${taskCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                        ${calOpts}
                      </select>
                    </label>`
                  : `<p class="muted small">Calendar: <strong>${esc(t.calendarName)}</strong>${t.readOnly ? " · read-only" : ""}</p>`
              }
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${esc(t.summary)}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${t.readOnly && !creatingTask ? "readonly" : ""}>${esc(t.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${t.readOnly && !creatingTask ? "disabled" : ""}>
                  ${parentTaskOptions(t, creatingTask)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${t.readOnly && !creatingTask ? "disabled" : ""}>
                    ${["NEEDS-ACTION", "IN-PROCESS", "COMPLETED", "CANCELLED"]
                      .map(
                        (s) =>
                          `<option value="${s}" ${t.status === s ? "selected" : ""}>${esc(statusLabel(s))}</option>`,
                      )
                      .join("")}
                  </select>
                </label>
                <label>Due
                  <input type="datetime-local" name="due" value="${esc(toLocalInputValue(t.due))}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
                </label>
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${esc(String(t.priority || 0))}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${esc(String(t.percent || 0))}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${
                  creatingTask || t.canWrite
                    ? `<button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingTask ? "Create task" : "Save task"}</button>`
                    : ""
                }
                ${
                  !creatingTask && t.canWrite
                    ? `<button type="button" class="btn btn-ghost" data-action="new-subtask" ${busy ? "disabled" : ""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${busy ? "disabled" : ""}>Delete</button>`
                    : creatingTask
                      ? `<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>`
                      : ""
                }
              </div>
            </form>
          </div>`
        : `<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>`;

    return `<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${infoTitle("Tasks", "tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${esc(taskSearch)}" aria-label="Search tasks" ${busy ? "disabled" : ""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${busy || taskCalendars.length === 0 ? "disabled" : ""}>Add task</button>
        </div>
        ${bulkBar}
        ${
          taskCalendars.length === 0
            ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>`
            : ""
        }
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${allWritableChecked ? "checked" : ""} ${writableKeys.length === 0 || busy ? "disabled" : ""} />
                </th>
                ${sortHeader("Title", "summary", taskSort, taskOrder, "task", "col-task-title")}
                ${sortHeader("Status", "status", taskSort, taskOrder, "task", "col-task-status")}
                ${sortHeader("Due", "due", taskSort, taskOrder, "task", "col-task-due")}
                ${sortHeader("Calendar", "calendar", taskSort, taskOrder, "task", "col-task-cal")}
                ${sortHeader("%", "percent", taskSort, taskOrder, "task", "col-task-pct")}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${form}
      </section>
    </div>`;
  }

  function renderNotesTab(): string {
    const rows =
      notes.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="3" class="muted">${
            noteSearch ? "No notes match your search." : "No notes yet. Add one below."
          }</td></tr>`
        : notes
            .map((n) => {
              const key = itemKey(n.instanceId, n.uri);
              const active = !creatingNote && key === selectedNoteKey ? " is-selected" : "";
              const preview = (n.description || "").replace(/\s+/g, " ").slice(0, 80);
              return `<tr class="contact-table-row${active}" data-action="select-note" data-instance="${n.instanceId}" data-uri="${esc(n.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${esc(n.summary || n.uri)}</span>
                  ${preview ? `<span class="muted small contact-name-secondary">${esc(preview)}${n.description.length > 80 ? "…" : ""}</span>` : ""}
                  ${n.readOnly ? '<span class="badge">read-only</span>' : ""}
                </td>
                <td class="col-note-date muted small">${esc(formatWhen(n.dtstart))}</td>
                <td class="col-note-cal muted small">${esc(n.calendarName)}</td>
              </tr>`;
            })
            .join("");

    const n = editingNote;
    const calOpts = noteCalendars
      .map(
        (c) =>
          `<option value="${c.id}" ${n && n.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
      )
      .join("");
    const form =
      n
        ? `<div class="card">
            ${infoTitle(creatingNote ? "New note" : "Edit note", "notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${
                creatingNote
                  ? `<label>Calendar
                      <select name="instanceId" required ${noteCalendars.length === 0 ? "disabled" : ""}>
                        <option value="">${noteCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                        ${calOpts}
                      </select>
                    </label>`
                  : `<p class="muted small">Calendar: <strong>${esc(n.calendarName)}</strong>${n.readOnly ? " · read-only" : ""}</p>`
              }
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${esc(n.summary)}" ${n.readOnly && !creatingNote ? "readonly" : ""} />
              </label>
              <label>Date
                <input type="datetime-local" name="dtstart" value="${esc(toLocalInputValue(n.dtstart))}" ${n.readOnly && !creatingNote ? "readonly" : ""} />
              </label>
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${n.readOnly && !creatingNote ? "readonly" : ""}>${esc(n.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${
                  creatingNote || n.canWrite
                    ? `<button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingNote ? "Create note" : "Save note"}</button>`
                    : ""
                }
                ${
                  !creatingNote && n.canWrite
                    ? `<button type="button" class="btn btn-danger" data-action="delete-note" ${busy ? "disabled" : ""}>Delete</button>`
                    : creatingNote
                      ? `<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>`
                      : ""
                }
              </div>
            </form>
          </div>`
        : `<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>`;

    return `<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${infoTitle("Notes", "notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${esc(noteSearch)}" aria-label="Search notes" ${busy ? "disabled" : ""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${busy || noteCalendars.length === 0 ? "disabled" : ""}>Add note</button>
        </div>
        ${
          noteCalendars.length === 0
            ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>`
            : ""
        }
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${sortHeader("Title", "summary", noteSort, noteOrder, "note", "col-note-title")}
                ${sortHeader("Date", "dtstart", noteSort, noteOrder, "note", "col-note-date")}
                ${sortHeader("Calendar", "calendar", noteSort, noteOrder, "note", "col-note-cal")}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${form}
      </section>
    </div>`;
  }

  /** Full re-render replaces DOM and would reset scroll; capture/restore so contact clicks stay put. */
  function captureScroll() {
    const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
    const sidebar = root.querySelector<HTMLElement>(".contacts-sidebar");
    return {
      windowX: window.scrollX,
      windowY: window.scrollY,
      tableTop: table?.scrollTop ?? null,
      sidebarTop: sidebar?.scrollTop ?? null,
    };
  }

  function restoreScroll(s: {
    windowX: number;
    windowY: number;
    tableTop: number | null;
    sidebarTop: number | null;
  }) {
    // Double rAF: after layout of the newly injected contact form
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(s.windowX, s.windowY);
        if (s.tableTop !== null) {
          const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
          if (table) table.scrollTop = s.tableTop;
        }
        if (s.sidebarTop !== null) {
          const sidebar = root.querySelector<HTMLElement>(".contacts-sidebar");
          if (sidebar) sidebar.scrollTop = s.sidebarTop;
        }
      });
    });
  }

  function render() {
    const scroll = captureScroll();
    if (!user) {
      renderLogin();
    } else {
      renderHome();
    }
    bind();
    restoreScroll(scroll);
  }

  function bindColorPair(form: HTMLFormElement) {
    const picker = form.querySelector<HTMLInputElement>('input[name="color_picker"]');
    const text = form.querySelector<HTMLInputElement>('input[name="color"]');
    if (!picker || !text) return;
    picker.addEventListener("input", () => {
      text.value = picker.value.toUpperCase();
    });
    text.addEventListener("change", () => {
      let v = text.value.trim();
      if (v && !v.startsWith("#")) v = `#${v}`;
      if (/^#[0-9A-Fa-f]{6}/.test(v)) {
        picker.value = v.slice(0, 7);
        text.value = v.toUpperCase();
      }
    });
  }

  function bind() {
    root.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        // Don't let info button clicks select calendar rows etc.
        const target = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
        if (target?.dataset.action === "info" || target?.dataset.action === "info-close") {
          ev.preventDefault();
          ev.stopPropagation();
        }
        void onAction(ev);
      });
    });
    // Keyboard activation for contacts table rows and calendar list rows
    root.querySelectorAll<HTMLElement>("tr.contact-table-row[data-action], .cal-row[data-action]").forEach((row) => {
      row.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          row.click();
        }
      });
    });
    const delConfirm = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
    const delSubmit = root.querySelector<HTMLButtonElement>("#delete-cal-submit");
    delConfirm?.addEventListener("change", () => {
      if (delSubmit) delSubmit.disabled = !delConfirm.checked || busy;
    });
    // Avatar photo 404 → initials (no inline onerror — CSP script-src 'self')
    root.querySelectorAll<HTMLImageElement>("img.contact-avatar[data-avatar-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        const letter = img.dataset.avatarFallback || "?";
        const span = document.createElement("span");
        span.className = "contact-avatar contact-avatar-fallback";
        span.setAttribute("aria-hidden", "true");
        span.textContent = letter;
        img.replaceWith(span);
      });
    });
    if (!escapeBound) {
      document.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Escape") closeInfoModal();
      });
      escapeBound = true;
    }
    const loginForm = root.querySelector<HTMLFormElement>('[data-form="login"]');
    loginForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onLogin(loginForm);
    });
    const shareForm = root.querySelector<HTMLFormElement>('[data-form="share"]');
    shareForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onShare(shareForm);
    });
    const editForm = root.querySelector<HTMLFormElement>('[data-form="edit-cal"]');
    if (editForm) {
      bindColorPair(editForm);
      editForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        void onEditCal(editForm);
      });
    }
    const createForm = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
    if (createForm) {
      bindColorPair(createForm);
      createForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        void onCreateCal(createForm);
      });
    }
    const createAb = root.querySelector<HTMLFormElement>('[data-form="create-ab"]');
    createAb?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onCreateAb(createAb);
    });
    const editAb = root.querySelector<HTMLFormElement>('[data-form="edit-ab"]');
    editAb?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onEditAb(editAb);
    });
    const contactForm = root.querySelector<HTMLFormElement>('[data-form="contact"]');
    contactForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveContact(contactForm);
    });
    const taskForm = root.querySelector<HTMLFormElement>('[data-form="task"]');
    taskForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveTask(taskForm);
    });
    // When calendar changes on create, refresh parent options for that calendar
    if (taskForm) {
      const calSelect = taskForm.querySelector<HTMLSelectElement>('select[name="instanceId"]');
      calSelect?.addEventListener("change", () => {
        if (!creatingTask || !editingTask) return;
        const id = Number(calSelect.value);
        if (!Number.isFinite(id) || id <= 0) return;
        const fd = new FormData(taskForm);
        const dueLocal = String(fd.get("due") ?? "").trim();
        editingTask = {
          ...editingTask,
          instanceId: id,
          // Parent must be on the same calendar — clear if mismatch
          parentUid:
            editingTask.parentUid &&
            tasks.some((x) => x.uid === editingTask!.parentUid && x.instanceId === id)
              ? editingTask.parentUid
              : null,
          summary: String(fd.get("summary") ?? ""),
          description: String(fd.get("description") ?? ""),
          status: String(fd.get("status") ?? "NEEDS-ACTION"),
          due: dueLocal ? new Date(dueLocal).toISOString() : null,
          priority: Number(fd.get("priority") ?? 0),
          percent: Number(fd.get("percent") ?? 0),
        };
        render();
      });
    }
    const noteForm = root.querySelector<HTMLFormElement>('[data-form="note"]');
    noteForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveNote(noteForm);
    });
    const searchInput = root.querySelector<HTMLInputElement>('input[data-action="contact-search"]');
    searchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        contactSearch = searchInput.value;
        if (selectedAbId === null) return;
        void (async () => {
          try {
            await loadContacts(selectedAbId);
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    const taskSearchInput = root.querySelector<HTMLInputElement>('input[data-action="task-search"]');
    taskSearchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        taskSearch = taskSearchInput.value;
        void (async () => {
          try {
            await loadTasks();
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    const noteSearchInput = root.querySelector<HTMLInputElement>('input[data-action="note-search"]');
    noteSearchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        noteSearch = noteSearchInput.value;
        void (async () => {
          try {
            await loadNotes();
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    bindImportInput();
    bindHolidaysToggle();
    bindContactPhotoInput();
  }

  async function runBulkTaskAction(
    action:
      | "bulk-task-status"
      | "bulk-task-due"
      | "bulk-task-clear-due"
      | "bulk-task-percent"
      | "bulk-task-delete",
  ) {
    const selected = writableCheckedTasks();
    if (selected.length === 0) {
      setFlash("error", "No writable tasks selected");
      render();
      return;
    }
    const items = selected.map((t) => ({ instanceId: t.instanceId, uri: t.uri }));

    if (action === "bulk-task-delete") {
      if (
        !confirm(
          `Delete ${selected.length} task${selected.length === 1 ? "" : "s"}? CalDAV clients will sync the removal.`,
        )
      ) {
        return;
      }
      busy = true;
      clearFlash();
      render();
      try {
        const res = await api.bulkTasks({ op: "delete", items });
        checkedTaskKeys = [];
        if (selectedTaskKey && selected.some((t) => itemKey(t.instanceId, t.uri) === selectedTaskKey)) {
          selectedTaskKey = null;
          editingTask = null;
          creatingTask = false;
        }
        await loadTasks();
        if (res.failed > 0) {
          setFlash(
            "error",
            `Deleted ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
          );
        } else {
          setFlash("success", `Deleted ${res.ok} task${res.ok === 1 ? "" : "s"}`);
        }
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Bulk delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }

    let fields: { status?: string; due?: string | null; percent?: number } = {};
    if (action === "bulk-task-status") {
      const sel = root.querySelector<HTMLSelectElement>("#bulk-task-status");
      const status = sel?.value?.trim() ?? "";
      if (!status) {
        setFlash("error", "Choose a status to apply");
        render();
        return;
      }
      fields = { status };
    } else if (action === "bulk-task-due") {
      const input = root.querySelector<HTMLInputElement>("#bulk-task-due");
      const raw = input?.value?.trim() ?? "";
      if (!raw) {
        setFlash("error", "Choose a due date to apply");
        render();
        return;
      }
      fields = { due: new Date(raw).toISOString() };
    } else if (action === "bulk-task-clear-due") {
      fields = { due: null };
    } else if (action === "bulk-task-percent") {
      const input = root.querySelector<HTMLInputElement>("#bulk-task-percent");
      const raw = input?.value?.trim() ?? "";
      if (raw === "") {
        setFlash("error", "Enter a percent complete (0–100)");
        render();
        return;
      }
      const pct = Number(raw);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        setFlash("error", "Percent must be between 0 and 100");
        render();
        return;
      }
      fields = { percent: Math.round(pct) };
    }

    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.bulkTasks({ op: "update", items, fields });
      await loadTasks();
      // Refresh open editor if it was in the bulk set
      if (editingTask && !creatingTask) {
        const key = itemKey(editingTask.instanceId, editingTask.uri);
        const refreshed = tasks.find((x) => itemKey(x.instanceId, x.uri) === key);
        if (refreshed) editingTask = { ...refreshed };
      }
      const label =
        action === "bulk-task-status"
          ? "status"
          : action === "bulk-task-due"
            ? "due date"
            : action === "bulk-task-clear-due"
              ? "due date"
              : "percent";
      if (res.failed > 0) {
        setFlash(
          "error",
          `Updated ${label} on ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
        );
      } else {
        setFlash(
          "success",
          `Updated ${label} on ${res.ok} task${res.ok === 1 ? "" : "s"}`,
        );
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onSaveTask(form: HTMLFormElement) {
    const fd = new FormData(form);
    const summary = String(fd.get("summary") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const status = String(fd.get("status") ?? "NEEDS-ACTION");
    const dueLocal = String(fd.get("due") ?? "").trim();
    const due = dueLocal ? new Date(dueLocal).toISOString() : null;
    const priority = Number(fd.get("priority") ?? 0);
    const percent = Number(fd.get("percent") ?? 0);
    const parentRaw = String(fd.get("parentUid") ?? "").trim();
    const parentUid = parentRaw === "" ? null : parentRaw;
    busy = true;
    clearFlash();
    render();
    try {
      if (creatingTask) {
        const instanceId = Number(fd.get("instanceId"));
        if (!Number.isFinite(instanceId) || instanceId <= 0) {
          throw new Error("Select a calendar");
        }
        const res = await api.createTask({
          instanceId,
          summary,
          description,
          status,
          due,
          priority,
          percent,
          parentUid,
        });
        creatingTask = false;
        selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
        editingTask = res.task;
        setFlash("success", parentUid ? "Subtask created" : "Task created");
      } else if (editingTask) {
        const res = await api.updateTask(editingTask.instanceId, editingTask.uri, {
          summary,
          description,
          status,
          due,
          priority,
          percent,
          parentUid,
        });
        editingTask = res.task;
        selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
        setFlash("success", "Task saved");
      }
      await loadTasks();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onSaveNote(form: HTMLFormElement) {
    const fd = new FormData(form);
    const summary = String(fd.get("summary") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const dtLocal = String(fd.get("dtstart") ?? "").trim();
    const dtstart = dtLocal ? new Date(dtLocal).toISOString() : null;
    busy = true;
    clearFlash();
    render();
    try {
      if (creatingNote) {
        const instanceId = Number(fd.get("instanceId"));
        if (!Number.isFinite(instanceId) || instanceId <= 0) {
          throw new Error("Select a calendar");
        }
        const res = await api.createNote({
          instanceId,
          summary,
          description,
          dtstart,
        });
        creatingNote = false;
        selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
        editingNote = res.note;
        setFlash("success", "Note created");
      } else if (editingNote) {
        const res = await api.updateNote(editingNote.instanceId, editingNote.uri, {
          summary,
          description,
          dtstart,
        });
        editingNote = res.note;
        selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
        setFlash("success", "Note saved");
      }
      await loadNotes();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  function bindContactPhotoInput() {
    const input = root.querySelector<HTMLInputElement>('input[data-action="contact-photo"]');
    if (!input) return;
    input.addEventListener("change", () => {
      void (async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        if (file.size > 2.5 * 1024 * 1024) {
          setFlash("error", "Photo is too large (max ~2 MB)");
          render();
          return;
        }
        try {
          const b64 = await fileToBase64(file);
          photoBase64Pending = b64;
          photoPreview = `data:${file.type || "image/jpeg"};base64,${b64}`;
          removePhotoPending = false;
          render();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Failed to read photo");
          render();
        }
      })();
    });
  }

  function bindHolidaysToggle() {
    const form = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
    if (!form) return;
    const cb = form.querySelector<HTMLInputElement>('input[name="holidays"]');
    const wrap = form.querySelector<HTMLElement>("#holidays-country-wrap");
    const nameInput = form.querySelector<HTMLInputElement>('input[name="displayname"]');
    const readOnly = form.querySelector<HTMLInputElement>('input[name="readOnly"]');
    if (!cb || !wrap) return;

    const sync = () => {
      const on = cb.checked;
      wrap.hidden = !on;
      if (nameInput) {
        nameInput.required = !on;
        if (on && !nameInput.value.trim()) {
          nameInput.placeholder = "Auto: Holidays (XX)";
        } else if (!on) {
          nameInput.placeholder = "Work";
        }
      }
      if (on && readOnly) {
        readOnly.checked = true;
      }
    };
    cb.addEventListener("change", sync);
    sync();
  }

  async function onLogin(form: HTMLFormElement) {
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "");
    const password = String(fd.get("password") ?? "");
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.login(username, password);
      user = res.user;
      await loadHome();
      setFlash("success", "Signed in");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Login failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onShare(form: HTMLFormElement) {
    if (selectedId === null) return;
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "");
    const access = String(fd.get("access") ?? "read") as "read" | "readwrite";
    calModalOpen = true;
    busy = true;
    clearFlash();
    render();
    try {
      await api.share(selectedId, username, access);
      await loadShares(selectedId);
      setFlash("success", `Shared with ${username}`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Share failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onEditCal(form: HTMLFormElement) {
    if (selectedId === null) return;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "");
    const color = String(fd.get("color") ?? "").trim();
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.updateCalendar(selectedId, {
        displayname,
        description,
        color,
      });
      calModalOpen = true;
      await loadHome();
      selectedId = res.calendar.id;
      await loadShares(selectedId);
      await loadMonthEvents();
      setFlash("success", "Calendar updated");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onCreateCal(form: HTMLFormElement) {
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "");
    const color = String(fd.get("color") ?? "").trim();
    const holidays = fd.get("holidays") === "on";
    const holidayCountry = String(fd.get("holidayCountry") ?? "").trim();
    const readOnly = fd.get("readOnly") === "on";

    if (holidays && !holidayCountry) {
      setFlash("error", "Select a country for the holidays calendar");
      render();
      return;
    }
    if (!holidays && !displayname) {
      setFlash("error", "Display name is required");
      render();
      return;
    }

    busy = true;
    clearFlash();
    lastImportResult = null;
    render();
    try {
      const res = await api.createCalendar({
        displayname,
        description,
        color,
        holidays,
        holidayCountry: holidays ? holidayCountry : undefined,
        readOnly,
      });
      selectedId = res.calendar.id;
      await loadHome();
      let msg = `Created “${res.calendar.displayname}”`;
      const hi = res.holidayImport ?? res.calendar.holidayImport;
      if (hi) {
        msg += `. Holidays imported: ${formatImportResult(hi)}.`;
        lastImportResult = {
          ok: true,
          message: formatImportResult(hi),
        };
      }
      if (readOnly) {
        msg += " Calendar is read-only.";
      }
      setFlash("success", msg);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Create failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onAction(ev: Event) {
    const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const action = t.dataset.action;
    if (action === "logout") {
      busy = true;
      try {
        await api.logout();
      } catch {
        /* ignore */
      }
      user = null;
      calendars = [];
      shares = [];
      selectedId = null;
      addressBooks = [];
      selectedAbId = null;
      contacts = [];
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
      clearFlash();
      busy = false;
      render();
      return;
    }
    if (action === "select-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      selectedId = id;
      lastImportResult = null;
      busy = true;
      clearFlash();
      render();
      try {
        await loadMonthEvents();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "edit-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      const cal = calendars.find((c) => c.id === id && c.canShare);
      if (!cal) return;
      selectedId = id;
      calModalOpen = true;
      deleteConfirmId = null;
      lastImportResult = null;
      busy = true;
      clearFlash();
      render();
      try {
        await loadShares(id);
        await loadMonthEvents();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to open calendar");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "close-cal-modal") {
      calModalOpen = false;
      render();
      return;
    }
    if (action === "delete-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      const cal = calendars.find((c) => c.id === id && c.canShare);
      if (!cal) return;
      deleteConfirmId = id;
      calModalOpen = false;
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-delete-cal") {
      deleteConfirmId = null;
      render();
      return;
    }
    if (action === "confirm-delete-cal") {
      const id = Number(t.dataset.id);
      const cb = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
      if (!Number.isFinite(id) || !cb?.checked) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteCalendar(id);
        if (selectedId === id) selectedId = null;
        deleteConfirmId = null;
        calModalOpen = false;
        shares = [];
        monthEvents = [];
        await loadHome();
        if (selectedId === null) {
          const def = pickDefaultCalendar();
          if (def) {
            selectedId = def.id;
            await loadMonthEvents();
          }
        }
        setFlash("success", "Calendar deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "month-today") {
      const n = new Date();
      monthCursor = { y: n.getFullYear(), m: n.getMonth() };
      busy = true;
      render();
      try {
        await loadMonthEvents();
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "month-prev" || action === "month-next") {
      const delta = action === "month-prev" ? -1 : 1;
      const d = new Date(monthCursor.y, monthCursor.m + delta, 1);
      monthCursor = { y: d.getFullYear(), m: d.getMonth() };
      busy = true;
      render();
      try {
        await loadMonthEvents();
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "info") {
      const key = t.dataset.info ?? "";
      openInfoModal(key);
      return;
    }
    if (action === "info-close") {
      closeInfoModal();
      return;
    }
    if (action === "flash-close") {
      clearFlash();
      render();
      return;
    }
    if (action === "tab") {
      const tab = t.dataset.tab as TabId | undefined;
      if (tab === "calendars" || tab === "contacts" || tab === "tasks" || tab === "notes") {
        activeTab = tab;
        if (tab !== "calendars") {
          calModalOpen = false;
          deleteConfirmId = null;
        }
        clearFlash();
        busy = true;
        render();
        try {
          if (tab === "contacts" && selectedAbId !== null) {
            await loadContacts(selectedAbId);
          } else if (tab === "calendars") {
            await loadMonthEvents();
          } else if (tab === "tasks") {
            await loadTasks();
          } else if (tab === "notes") {
            await loadNotes();
          }
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Failed to load");
        } finally {
          busy = false;
          render();
        }
      }
      return;
    }
    if (action === "sort-task" || action === "sort-note") {
      const col = t.dataset.sort || "";
      if (!col) return;
      if (action === "sort-task") {
        if (taskSort === col) taskOrder = taskOrder === "asc" ? "desc" : "asc";
        else {
          taskSort = col;
          taskOrder = col === "due" || col === "summary" ? "asc" : "desc";
        }
        busy = true;
        render();
        try {
          await loadTasks();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Sort failed");
        } finally {
          busy = false;
          render();
        }
      } else {
        if (noteSort === col) noteOrder = noteOrder === "asc" ? "desc" : "asc";
        else {
          noteSort = col;
          noteOrder = "asc";
        }
        busy = true;
        render();
        try {
          await loadNotes();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Sort failed");
        } finally {
          busy = false;
          render();
        }
      }
      return;
    }
    if (action === "select-task") {
      // Ignore clicks on the checkbox cell
      if ((ev.target as HTMLElement).closest("[data-stop-row], .task-check")) return;
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const found = tasks.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
      creatingTask = false;
      selectedTaskKey = itemKey(instanceId, uri);
      editingTask = found ? { ...found } : null;
      clearFlash();
      render();
      return;
    }
    if (action === "task-check") {
      ev.preventDefault();
      ev.stopPropagation();
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const key = itemKey(instanceId, uri);
      const task = tasks.find((x) => itemKey(x.instanceId, x.uri) === key);
      if (!task || !task.canWrite || task.readOnly) return;
      if (checkedTaskKeys.includes(key)) {
        checkedTaskKeys = checkedTaskKeys.filter((k) => k !== key);
      } else {
        checkedTaskKeys = [...checkedTaskKeys, key];
      }
      render();
      return;
    }
    if (action === "task-select-all") {
      ev.preventDefault();
      const writable = tasks.filter((x) => x.canWrite && !x.readOnly);
      const allOn =
        writable.length > 0 &&
        writable.every((x) => checkedTaskKeys.includes(itemKey(x.instanceId, x.uri)));
      if (allOn) {
        checkedTaskKeys = [];
      } else {
        checkedTaskKeys = writable.map((x) => itemKey(x.instanceId, x.uri));
      }
      render();
      return;
    }
    if (action === "bulk-task-clear") {
      checkedTaskKeys = [];
      render();
      return;
    }
    if (
      action === "bulk-task-status" ||
      action === "bulk-task-due" ||
      action === "bulk-task-clear-due" ||
      action === "bulk-task-percent" ||
      action === "bulk-task-delete"
    ) {
      void runBulkTaskAction(action);
      return;
    }
    if (action === "select-note") {
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const found = notes.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
      creatingNote = false;
      selectedNoteKey = itemKey(instanceId, uri);
      editingNote = found ? { ...found } : null;
      clearFlash();
      render();
      return;
    }
    if (action === "new-task") {
      creatingTask = true;
      selectedTaskKey = null;
      editingTask = {
        uri: "",
        instanceId: taskCalendars[0]?.id ?? 0,
        calendarId: 0,
        calendarName: "",
        calendarUri: "",
        uid: "",
        parentUid: null,
        summary: "",
        description: "",
        status: "NEEDS-ACTION",
        due: null,
        priority: 0,
        percent: 0,
        completed: null,
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "new-subtask") {
      if (!editingTask || creatingTask || !editingTask.uid) return;
      if (!editingTask.canWrite) return;
      const parent = editingTask;
      creatingTask = true;
      selectedTaskKey = null;
      editingTask = {
        uri: "",
        instanceId: parent.instanceId,
        calendarId: parent.calendarId,
        calendarName: parent.calendarName,
        calendarUri: parent.calendarUri,
        uid: "",
        parentUid: parent.uid,
        summary: "",
        description: "",
        status: "NEEDS-ACTION",
        due: null,
        priority: 0,
        percent: 0,
        completed: null,
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "new-note") {
      creatingNote = true;
      selectedNoteKey = null;
      editingNote = {
        uri: "",
        instanceId: noteCalendars[0]?.id ?? 0,
        calendarId: 0,
        calendarName: "",
        calendarUri: "",
        summary: "",
        description: "",
        dtstart: new Date().toISOString(),
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-task") {
      creatingTask = false;
      editingTask = null;
      selectedTaskKey = null;
      render();
      return;
    }
    if (action === "cancel-note") {
      creatingNote = false;
      editingNote = null;
      selectedNoteKey = null;
      render();
      return;
    }
    if (action === "delete-task") {
      if (!editingTask || creatingTask) return;
      if (!confirm("Delete this task? CalDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteTask(editingTask.instanceId, editingTask.uri);
        selectedTaskKey = null;
        editingTask = null;
        await loadTasks();
        setFlash("success", "Task deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "delete-note") {
      if (!editingNote || creatingNote) return;
      if (!confirm("Delete this note? CalDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteNote(editingNote.instanceId, editingNote.uri);
        selectedNoteKey = null;
        editingNote = null;
        await loadNotes();
        setFlash("success", "Note deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "select-ab") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      selectedAbId = id;
      lastContactImportResult = null;
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
      contactSearch = "";
      // Clear list immediately so we never paint previous AB contacts with the new AB id
      // (that caused /addressbooks/{newId}/contacts/{oldUri}/photo → 404).
      contacts = [];
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = false;
      clearFlash();
      busy = true;
      render();
      try {
        await loadContacts(id);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load contacts");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "select-contact") {
      const uri = t.dataset.uri ?? "";
      if (!uri) return;
      // Avoid intermediate busy re-render (that jumps scroll); load then paint once.
      clearFlash();
      try {
        await openContact(uri);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load contact");
      }
      render();
      return;
    }
    if (action === "new-contact") {
      if (selectedAbId === null) return;
      startNewContact();
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-contact") {
      creatingContact = false;
      editingContact = null;
      selectedContactUri = null;
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = false;
      render();
      return;
    }
    if (action === "add-email" || action === "add-phone" || action === "add-custom") {
      if (!editingContact) return;
      syncContactFormFromDom();
      if (!Array.isArray(editingContact.emails)) editingContact.emails = [""];
      if (!Array.isArray(editingContact.phones)) {
        editingContact.phones = [{ type: "cell", value: "" }];
      }
      if (!Array.isArray(editingContact.custom)) editingContact.custom = [];
      if (action === "add-email") {
        if (editingContact.emails.length < 10) editingContact.emails.push("");
      } else if (action === "add-phone") {
        if (editingContact.phones.length < 10) {
          editingContact.phones.push({ type: "other", value: "" });
        }
      } else if (editingContact.custom.length < 30) {
        editingContact.custom.push({ label: "", value: "" });
      }
      render();
      return;
    }
    if (action === "remove-email") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      const list = Array.isArray(editingContact.emails) ? editingContact.emails : [""];
      editingContact.emails = list.filter((_, i) => i !== idx);
      if (editingContact.emails.length === 0) editingContact.emails = [""];
      render();
      return;
    }
    if (action === "remove-phone") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      const list = Array.isArray(editingContact.phones)
        ? editingContact.phones
        : [{ type: "cell", value: "" }];
      editingContact.phones = list.filter((_, i) => i !== idx);
      if (editingContact.phones.length === 0) {
        editingContact.phones = [{ type: "cell", value: "" }];
      }
      render();
      return;
    }
    if (action === "remove-custom") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      editingContact.custom = (Array.isArray(editingContact.custom) ? editingContact.custom : []).filter(
        (_, i) => i !== idx,
      );
      render();
      return;
    }
    if (action === "remove-photo") {
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = true;
      if (editingContact) editingContact.hasPhoto = false;
      render();
      return;
    }
    if (action === "delete-contact") {
      if (selectedAbId === null || !selectedContactUri) return;
      if (!confirm("Delete this contact? CardDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteContact(selectedAbId, selectedContactUri);
        selectedContactUri = null;
        editingContact = null;
        creatingContact = false;
        await loadHome();
        setFlash("success", "Contact deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "delete-ab") {
      if (selectedAbId === null) return;
      const ab = addressBooks.find((a) => a.id === selectedAbId);
      const force = (ab?.cardCount ?? 0) > 0;
      const msg = force
        ? `Delete address book “${ab?.displayname ?? ""}” and all ${ab?.cardCount} contacts? This cannot be undone.`
        : `Delete empty address book “${ab?.displayname ?? ""}”?`;
      if (!confirm(msg)) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteAddressBook(selectedAbId, force);
        selectedAbId = null;
        contacts = [];
        editingContact = null;
        await loadHome();
        setFlash("success", "Address book deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "export-ab") {
      if (selectedAbId === null) return;
      busy = true;
      clearFlash();
      render();
      try {
        const { blob, filename } = await api.exportAddressBook(selectedAbId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setFlash("success", `Exported ${filename}`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Export failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "revoke") {
      const href = t.dataset.href ?? "";
      if (!href || selectedId === null) return;
      if (!confirm("Revoke access for this user?")) return;
      calModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        await api.revoke(selectedId, href);
        await loadShares(selectedId);
        setFlash("success", "Share revoked");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Revoke failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "export-cal") {
      if (selectedId === null) return;
      calModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        const { blob, filename } = await api.exportCalendar(selectedId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setFlash("success", `Exported ${filename}`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Export failed");
      } finally {
        busy = false;
        render();
      }
    }
  }

  function bindImportInput() {
    const input = root.querySelector<HTMLInputElement>('input[data-action="import-cal"]');
    if (input) {
      input.addEventListener("change", () => {
        void onImportFile(input);
      });
    }
    const abInput = root.querySelector<HTMLInputElement>('input[data-action="import-ab"]');
    if (abInput) {
      abInput.addEventListener("change", () => {
        void onImportContacts(abInput);
      });
    }
  }

  async function onImportContacts(input: HTMLInputElement) {
    if (selectedAbId === null) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    busy = true;
    clearFlash();
    lastContactImportResult = null;
    render();
    try {
      const vcf = await file.text();
      const res = await api.importAddressBook(selectedAbId, vcf);
      const detail = formatImportResult(res);
      lastContactImportResult = { ok: true, message: detail };
      await loadHome();
      setFlash("success", `Import finished for “${file.name}”: ${detail}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      lastContactImportResult = { ok: false, message: msg };
      setFlash("error", msg);
    } finally {
      busy = false;
      render();
    }
  }

  /** Pull live form values into editingContact before re-render (multi email/phone). */
  function syncContactFormFromDom() {
    if (!editingContact) return;
    const form = root.querySelector<HTMLFormElement>('[data-form="contact"]');
    if (!form) return;
    const fd = new FormData(form);
    editingContact.firstname = String(fd.get("firstname") ?? "");
    editingContact.lastname = String(fd.get("lastname") ?? "");
    editingContact.fullname = String(fd.get("fullname") ?? "");
    editingContact.org = String(fd.get("org") ?? "");
    editingContact.title = String(fd.get("title") ?? "");
    editingContact.url = String(fd.get("url") ?? "");
    editingContact.note = String(fd.get("note") ?? "");
    editingContact.address = {
      street: String(fd.get("street") ?? ""),
      city: String(fd.get("city") ?? ""),
      region: String(fd.get("region") ?? ""),
      postal: String(fd.get("postal") ?? ""),
      country: String(fd.get("country") ?? ""),
    };
    const emails: string[] = [];
    let i = 0;
    while (fd.has(`email_${i}`)) {
      emails.push(String(fd.get(`email_${i}`) ?? ""));
      i++;
    }
    if (emails.length) editingContact.emails = emails;
    const phones: ContactPhone[] = [];
    i = 0;
    while (fd.has(`phone_value_${i}`)) {
      phones.push({
        type: String(fd.get(`phone_type_${i}`) ?? "other"),
        value: String(fd.get(`phone_value_${i}`) ?? ""),
      });
      i++;
    }
    if (phones.length) editingContact.phones = phones;
    const custom: ContactCustomField[] = [];
    i = 0;
    while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
      custom.push({
        label: String(fd.get(`custom_label_${i}`) ?? ""),
        value: String(fd.get(`custom_value_${i}`) ?? ""),
      });
      i++;
    }
    editingContact.custom = custom;
  }

  function contactBodyFromForm(form: HTMLFormElement) {
    const fd = new FormData(form);
    const emails: string[] = [];
    let i = 0;
    while (fd.has(`email_${i}`)) {
      const v = String(fd.get(`email_${i}`) ?? "").trim();
      if (v) emails.push(v);
      i++;
    }
    const phones: ContactPhone[] = [];
    i = 0;
    while (fd.has(`phone_value_${i}`)) {
      const value = String(fd.get(`phone_value_${i}`) ?? "").trim();
      if (value) {
        phones.push({
          type: String(fd.get(`phone_type_${i}`) ?? "other"),
          value,
        });
      }
      i++;
    }
    const custom: ContactCustomField[] = [];
    i = 0;
    while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
      const label = String(fd.get(`custom_label_${i}`) ?? "").trim();
      const value = String(fd.get(`custom_value_${i}`) ?? "").trim();
      if (label || value) {
        custom.push({ label, value });
      }
      i++;
    }
    const body: Parameters<typeof api.createContact>[1] = {
      firstname: String(fd.get("firstname") ?? "").trim(),
      lastname: String(fd.get("lastname") ?? "").trim(),
      fullname: String(fd.get("fullname") ?? "").trim(),
      org: String(fd.get("org") ?? "").trim(),
      title: String(fd.get("title") ?? "").trim(),
      emails,
      phones,
      address: {
        street: String(fd.get("street") ?? "").trim(),
        city: String(fd.get("city") ?? "").trim(),
        region: String(fd.get("region") ?? "").trim(),
        postal: String(fd.get("postal") ?? "").trim(),
        country: String(fd.get("country") ?? "").trim(),
      },
      url: String(fd.get("url") ?? "").trim(),
      note: String(fd.get("note") ?? "").trim(),
      custom,
    };
    if (removePhotoPending) {
      body.removePhoto = true;
    } else if (photoBase64Pending) {
      body.photoBase64 = photoBase64Pending;
    }
    return body;
  }

  async function onSaveContact(form: HTMLFormElement) {
    if (selectedAbId === null) return;
    const body = contactBodyFromForm(form);
    busy = true;
    clearFlash();
    render();
    try {
      if (creatingContact) {
        const res = await api.createContact(selectedAbId, body);
        creatingContact = false;
        selectedContactUri = res.contact.uri;
        editingContact = res.contact;
        photoPreview =
          res.contact.photoDataUri ??
          (res.contact.hasPhoto
            ? `${api.contactPhotoUrl(selectedAbId, res.contact.uri)}?t=${Date.now()}`
            : null);
        photoBase64Pending = null;
        removePhotoPending = false;
        setFlash("success", "Contact created");
      } else if (selectedContactUri) {
        const res = await api.updateContact(selectedAbId, selectedContactUri, body);
        selectedContactUri = res.contact.uri;
        editingContact = res.contact;
        photoPreview =
          res.contact.photoDataUri ??
          (res.contact.hasPhoto
            ? `${api.contactPhotoUrl(selectedAbId, res.contact.uri)}?t=${Date.now()}`
            : null);
        photoBase64Pending = null;
        removePhotoPending = false;
        setFlash("success", "Contact saved");
      }
      // Reload list; keep selection if list fails
      try {
        await loadHome();
      } catch (reloadErr) {
        console.error(reloadErr);
        if (selectedAbId !== null) {
          try {
            await loadContacts(selectedAbId);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onCreateAb(form: HTMLFormElement) {
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    if (!displayname) return;
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.createAddressBook({ displayname, description });
      selectedAbId = res.addressbook.id;
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
      contactSearch = "";
      await loadHome();
      setFlash("success", `Address book “${res.addressbook.displayname}” created`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Create failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onEditAb(form: HTMLFormElement) {
    if (selectedAbId === null) return;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    busy = true;
    clearFlash();
    render();
    try {
      await api.updateAddressBook(selectedAbId, { displayname, description });
      await loadHome();
      setFlash("success", "Address book updated");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      busy = false;
      render();
    }
  }

  function openInfoModal(key: string) {
    const info = SECTION_INFO[key];
    if (!info) return;
    const modal = root.querySelector<HTMLElement>("#info-modal");
    const titleEl = root.querySelector<HTMLElement>("#info-modal-title");
    const bodyEl = root.querySelector<HTMLElement>("#info-modal-body");
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.textContent = info.title;
    bodyEl.innerHTML = info.paragraphs
      .map((p) => `<p>${esc(p)}</p>`)
      .join("");
    modal.hidden = false;
    document.body.classList.add("info-modal-open");
    const closeBtn = modal.querySelector<HTMLButtonElement>(".info-modal-close");
    closeBtn?.focus();
  }

  function closeInfoModal() {
    const modal = root.querySelector<HTMLElement>("#info-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("info-modal-open");
  }

  async function onImportFile(input: HTMLInputElement) {
    if (selectedId === null) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    calModalOpen = true;
    busy = true;
    clearFlash();
    lastImportResult = null;
    render();
    try {
      const ics = await file.text();
      const res = await api.importCalendar(selectedId, ics);
      const detail = formatImportResult(res);
      lastImportResult = { ok: true, message: detail };
      await loadMonthEvents();
      setFlash(
        "success",
        `Import finished for “${file.name}”: ${detail}.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      lastImportResult = { ok: false, message: msg };
      setFlash("error", msg);
    } finally {
      busy = false;
      render();
    }
  }

  void bootstrap();
}
