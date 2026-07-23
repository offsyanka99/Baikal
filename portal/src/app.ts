import {
  api,
  ApiError,
  type Calendar,
  type DirectoryUser,
  type PortalUser,
  type Share,
} from "./api";

const APP_VERSION = "0.11.1-fork.1";
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

export function mountApp(root: HTMLElement): void {
  let user: PortalUser | null = null;
  let flash: Flash = null;
  let calendars: Calendar[] = [];
  let directory: DirectoryUser[] = [];
  let selectedId: number | null = null;
  let shares: Share[] = [];
  let busy = false;

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
    const [cals, dir] = await Promise.all([api.calendars(), api.directory()]);
    calendars = cals.calendars;
    directory = dir.users;
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
      ${footer}`;
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
        return `<button type="button" class="cal-row${active}" data-action="select-cal" data-id="${c.id}">
          ${color}
          <span class="cal-row-text">
            <strong>${esc(c.displayname)}</strong>
            <span class="muted small mono">${esc(c.uri)}</span>
          </span>
          ${accessBadge(c.access)}
        </button>`;
      })
      .join("");

    const sharedRows = sharedWithMe
      .map(
        (c) => `<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <strong>${esc(c.displayname)}</strong>
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
            <div class="section-header">
              <h2>Calendar details</h2>
            </div>
            <p class="muted small">Display name, color, and description are visible to CalDAV clients.</p>
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
          </div>`
        : selected && !selected.canShare
          ? `<div class="card"><p class="muted">Shared calendars are read-only here. Ask the owner to change name, color, or description.</p></div>`
          : `<div class="card"><p class="muted">Select a calendar you own to edit details or sharing.</p></div>`;

    const sharePanel =
      selected && selected.canShare
        ? `<div class="card">
            <div class="section-header">
              <h2>Share “${esc(selected.displayname)}”</h2>
            </div>
            <p class="muted small">Choose a Baïkal user and access level. Same result as the classic DAV browser, without typing mailto: addresses.</p>
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
                <select name="access">
                  <option value="read">Read only</option>
                  <option value="readwrite">Full access</option>
                </select>
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

    root.innerHTML = shell(`
      <header class="page-header">
        <div>
          <h1>My calendars</h1>
          <p class="muted">Create and edit calendars, then share with other Baïkal users. Clients use <span class="mono">/dav.php/</span>.</p>
        </div>
      </header>

      <div class="portal-grid">
        <section class="card">
          <h2>Owned</h2>
          <div class="cal-list">
            ${calRows || '<p class="muted">No calendars yet. Add one below.</p>'}
          </div>

          <h2 style="margin-top:1.35rem">Add calendar</h2>
          <form class="stack stack-tight" data-form="create-cal">
            <label>
              Display name
              <input type="text" name="displayname" required maxlength="200" placeholder="Work" autocomplete="off" />
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
            <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create calendar</button>
          </form>

          ${
            sharedWithMe.length
              ? `<h2 style="margin-top:1.25rem">Shared with me</h2>
                 <div class="cal-list">${sharedRows}</div>`
              : ""
          }
        </section>
        <section class="stack">
          ${detailsPanel}
          ${sharePanel}
        </section>
      </div>
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
        void onAction(ev);
      });
    });
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
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.createCalendar({ displayname, description, color });
      selectedId = res.calendar.id;
      await loadHome();
      setFlash("success", `Created “${res.calendar.displayname}”`);
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
    }
  }

  void bootstrap();
}
