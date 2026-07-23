import {
  api,
  ApiError,
  type AddressBook,
  type Calendar,
  type DirectoryUser,
  type HolidayCountry,
  type ImportResult,
  type PortalUser,
  type Share,
} from "./api";

type TabId = "calendars" | "contacts";

const APP_VERSION = "0.11.1-fork.2";
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
      "Read-only (for everyone) blocks import in the portal and forces shares to read-only. Some CalDAV clients may still let the owner edit events.",
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
      "Manage address books for CardDAV. Clients (Thunderbird, DAVx⁵, …) use /dav.php/ for contacts.",
      "Use this tab to export or import vCard (.vcf) files.",
    ],
  },
  "address-books": {
    title: "Address books",
    paragraphs: [
      "Address books you own. Select one to import or export contacts.",
      "New address books are usually created when you first set up a CardDAV client, or by the admin.",
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
  let busy = false;
  /** Shown under Import/export until the next import/export or calendar change */
  let lastImportResult: { ok: boolean; message: string } | null = null;
  let lastContactImportResult: { ok: boolean; message: string } | null = null;
  let escapeBound = false;

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
      api.directory(),
      api.addressbooks().catch(() => ({ addressbooks: [] as AddressBook[] })),
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
    }
    if (selectedAbId === null && addressBooks.length > 0) {
      selectedAbId = addressBooks[0].id;
    }
  }

  async function loadShares(id: number) {
    const res = await api.shares(id);
    shares = res.shares;
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
            CalDAV clients keep using <span class="mono">/dav.php/</span>. This portal is only for sharing calendars.
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
    const contactsDetails = selectedAb
      ? `<div class="card">
          ${infoTitle(selectedAb.displayname, "contact-import-export")}
          <p class="muted small mono" style="margin-top:0.5rem">${esc(selectedAb.uri)} · ${selectedAb.cardCount} contact${selectedAb.cardCount === 1 ? "" : "s"}</p>
          <div class="import-export" style="margin-top:1rem">
            <div class="form-actions-row">
              <button type="button" class="btn" data-action="export-ab" ${busy ? "disabled" : ""}>Export .vcf</button>
              <label class="btn btn-ghost file-btn" ${busy ? "aria-disabled=true" : ""}>
                Import .vcf
                <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${busy ? "disabled" : ""} hidden />
              </label>
            </div>
            ${
              lastContactImportResult
                ? `<div class="flash flash-${lastContactImportResult.ok ? "success" : "error"} import-result" role="status">
                    <strong>Import result:</strong> ${esc(lastContactImportResult.message)}
                  </div>`
                : ""
            }
          </div>
        </div>`
      : `<div class="card"><p class="muted">Select an address book to import or export contacts.</p></div>`;

    const contactsTab = `
      <div class="portal-grid">
        <section class="card">
          ${infoTitle("Address books", "address-books")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${abRows || '<p class="muted">No address books yet. Connect a CardDAV client once, or create one under Admin.</p>'}
          </div>
        </section>
        <section class="stack">
          ${contactsDetails}
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

  function render() {
    if (!user) {
      renderLogin();
    } else {
      renderHome();
    }
    bind();
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
    bindImportInput();
    bindHolidaysToggle();
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
        render();
      }
      return;
    }
    if (action === "select-ab") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      selectedAbId = id;
      lastContactImportResult = null;
      clearFlash();
      render();
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
