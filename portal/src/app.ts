import {
  api,
  ApiError,
  type AddressBook,
  type Calendar,
  type ContactCustomField,
  type ContactDetail,
  type ContactPhone,
  type ContactSummary,
  type DirectoryUser,
  type HolidayCountry,
  type ImportResult,
  type PortalUser,
  type Share,
} from "./api";

type TabId = "calendars" | "contacts";

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
    title: "My calendars",
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
    title: "My contacts",
    paragraphs: [
      "Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.",
      "Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files.",
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
    }
    if (selectedId === null) {
      const firstOwn = calendars.find((c) => c.canShare);
      if (firstOwn) {
        selectedId = firstOwn.id;
        await loadShares(firstOwn.id);
      }
    } else {
      await loadShares(selectedId);
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

    const flashHtml = flash
      ? `<div class="flash flash-${esc(flash.type)}" role="status">${esc(flash.message)}</div>`
      : "";

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
        return `<button type="button" class="cal-row${active}" data-action="select-cal" data-id="${c.id}">
          ${color}
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(c.displayname)}</span>
            <span class="cal-row-badges">${badges}</span>
            <span class="muted small mono cal-row-uri">${esc(c.uri)}</span>
          </span>
        </button>`;
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

    const detailsPanel =
      selected && selected.canShare
        ? `<div class="card">
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
          </div>`
        : selected && !selected.canShare
          ? `<div class="card">
              ${infoTitle("Shared calendar", "shared-with-me")}
              <div class="form-actions-row" style="margin-top:0.75rem">
                <button type="button" class="btn" data-action="export-cal" ${busy ? "disabled" : ""}>Export .ics</button>
              </div>
            </div>`
          : `<div class="card"><p class="muted">Select a calendar you own to edit details or sharing.</p></div>`;

    const shareReadOnlyForced = !!(selected && selected.readOnly);
    const sharePanel =
      selected && selected.canShare
        ? `<div class="card">
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
          </div>`
        : "";

    const calendarsTab = `
      <div class="portal-grid">
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
        <section class="stack">
          ${detailsPanel}
          ${sharePanel}
        </section>
      </div>`;

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

    root.innerHTML = shell(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${activeTab === "calendars" ? " is-active" : ""}"
            data-action="tab" data-tab="calendars" aria-selected="${activeTab === "calendars"}">
            My Calendars
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "contacts" ? " is-active" : ""}"
            data-action="tab" data-tab="contacts" aria-selected="${activeTab === "contacts"}">
            My Contacts
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${activeTab === "calendars" ? "my-calendars" : "my-contacts"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${activeTab === "calendars" ? calendarsTab : contactsTab}
    `);
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
    // Keyboard activation for contacts table rows
    root.querySelectorAll<HTMLElement>("tr.contact-table-row[data-action]").forEach((row) => {
      row.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          row.click();
        }
      });
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
    bindImportInput();
    bindHolidaysToggle();
    bindContactPhotoInput();
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
      await loadHome();
      selectedId = res.calendar.id;
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
        await loadShares(id);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load shares");
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
    if (action === "tab") {
      const tab = t.dataset.tab as TabId | undefined;
      if (tab === "calendars" || tab === "contacts") {
        activeTab = tab;
        clearFlash();
        if (tab === "contacts" && selectedAbId !== null) {
          busy = true;
          render();
          try {
            await loadContacts(selectedAbId);
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Failed to load contacts");
          } finally {
            busy = false;
            render();
          }
        } else {
          render();
        }
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
    busy = true;
    clearFlash();
    lastImportResult = null;
    render();
    try {
      const ics = await file.text();
      const res = await api.importCalendar(selectedId, ics);
      const detail = formatImportResult(res);
      lastImportResult = { ok: true, message: detail };
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
