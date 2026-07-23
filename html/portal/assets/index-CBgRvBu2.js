var ue=Object.defineProperty;var me=(s,o,h)=>o in s?ue(s,o,{enumerable:!0,configurable:!0,writable:!0,value:h}):s[o]=h;var _=(s,o,h)=>me(s,typeof o!="symbol"?o+"":o,h);(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))u(i);new MutationObserver(i=>{for(const b of i)if(b.type==="childList")for(const v of b.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&u(v)}).observe(document,{childList:!0,subtree:!0});function h(i){const b={};return i.integrity&&(b.integrity=i.integrity),i.referrerPolicy&&(b.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?b.credentials="include":i.crossOrigin==="anonymous"?b.credentials="omit":b.credentials="same-origin",b}function u(i){if(i.ep)return;i.ep=!0;const b=h(i);fetch(i.href,b)}})();class U extends Error{constructor(h,u){super(h);_(this,"status");this.status=u}}async function $(s,o={}){const h=new Headers(o.headers);o.body&&!h.has("Content-Type")&&h.set("Content-Type","application/json");const u=await fetch(`/api${s}`,{...o,headers:h,credentials:"same-origin"});let i=null;const b=await u.text();if(b)try{i=JSON.parse(b)}catch{i={error:b}}if(!u.ok){let v=`Request failed (${u.status})`;throw i&&typeof i=="object"&&i!==null&&"error"in i&&typeof i.error=="string"?v=i.error:(u.status===500||u.status===504)&&(v="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),new U(v,u.status)}return i}const w={me:()=>$("/me"),login:(s,o)=>$("/login",{method:"POST",body:JSON.stringify({username:s,password:o})}),logout:()=>$("/logout",{method:"POST"}),calendars:()=>$("/calendars"),createCalendar:s=>$("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>$("/holidays/countries"),updateCalendar:(s,o)=>$(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(o)}),exportCalendar:async s=>{const o=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!o.ok){let v=`Export failed (${o.status})`;try{const m=await o.json();m.error&&(v=m.error)}catch{}throw new U(v,o.status)}const h=o.headers.get("Content-Disposition")||"",u=/filename="([^"]+)"/i.exec(h),i=(u==null?void 0:u[1])||`calendar-${s}.ics`;return{blob:await o.blob(),filename:i}},importCalendar:(s,o)=>$(`/calendars/${s}/import`,{method:"POST",body:JSON.stringify({ics:o})}),directory:()=>$("/directory"),shares:s=>$(`/calendars/${s}/shares`),share:(s,o,h)=>$(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:o,access:h})}),revoke:(s,o)=>$(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:o})}),addressbooks:()=>$("/addressbooks"),exportAddressBook:async s=>{const o=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!o.ok){let v=`Export failed (${o.status})`;try{const m=await o.json();m.error&&(v=m.error)}catch{}throw new U(v,o.status)}const h=o.headers.get("Content-Disposition")||"",u=/filename="([^"]+)"/i.exec(h),i=(u==null?void 0:u[1])||`contacts-${s}.vcf`;return{blob:await o.blob(),filename:i}},importAddressBook:(s,o)=>$(`/addressbooks/${s}/import`,{method:"POST",body:JSON.stringify({vcf:o})})},fe="0.11.1-fork.2",he="https://github.com/offsyanka99/Baikal/tree/master/docs";function d(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function P(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(s)}</span>`}function F(s){const o=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&o.push(`${s.skipped} skipped`),o.join(", ")}const ye={"my-calendars":{title:"My calendars",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal and forces shares to read-only. Some CalDAV clients may still let the owner edit events."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"My contacts",paragraphs:["Manage address books for CardDAV. Clients (Thunderbird, DAVx⁵, …) use /dav.php/ for contacts.","Use this tab to export or import vCard (.vcf) files."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to import or export contacts.","New address books are usually created when you first set up a CardDAV client, or by the admin."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards."]}};function E(s,o,h="h2"){const u=h;return`<div class="section-title-row">
    <${u}>${d(s)}</${u}>
    <button type="button" class="info-btn" data-action="info" data-info="${d(o)}"
      aria-label="About ${d(s)}" title="About ${d(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function be(){return`
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
    </div>`}function ge(s){let o=null,h=null,u="calendars",i=[],b=[],v=[],m=null,I=[],D=[],S=null,p=!1,x=null,A=null,B=!1;function g(n,t){h={type:n,message:t}}function k(){h=null}async function G(){try{o=(await w.me()).user,await L()}catch(n){n instanceof U&&n.status===401?o=null:g("error",n instanceof Error?n.message:"Failed to load")}y()}async function L(){const[n,t,a]=await Promise.all([w.calendars(),w.directory(),w.addressbooks().catch(()=>({addressbooks:[]}))]);if(i=n.calendars,b=t.users,D=a.addressbooks,v.length===0)try{v=(await w.holidayCountries()).countries}catch{v=[]}if(m!==null&&!i.some(e=>e.id===m)&&(m=null,I=[]),m===null){const e=i.find(r=>r.canShare);e&&(m=e.id,await R(e.id))}else await R(m);S!==null&&!D.some(e=>e.id===S)&&(S=null),S===null&&D.length>0&&(S=D[0].id)}async function R(n){I=(await w.shares(n)).shares}function j(n,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,e=o?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            <span class="muted">${d(o.displayname||o.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,r=h?`<div class="flash flash-${d(h.type)}" role="status">${d(h.message)}</div>`:"",c=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${d(fe)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(he)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return document.body.className=t.auth?"layout-auth":"",`${e}
      <main class="container">
        ${r}
        ${n}
      </main>
      ${c}
      ${be()}`}function V(){s.innerHTML=j(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV clients keep using <span class="mono">/dav.php/</span>. This portal is only for sharing calendars.
          </p>
        </div>
      </div>`,{auth:!0})}function X(){if(!o){V();return}const n=i.filter(l=>l.canShare),t=i.filter(l=>!l.canShare),a=i.find(l=>l.id===m)??null,e=n.map(l=>{const J=l.id===m?" is-selected":"",de=l.color?`<span class="cal-swatch" style="background:${d(l.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',pe=P(l.access)+(l.readOnly?'<span class="badge">read-only</span>':"")+(l.holidaysCountry?`<span class="badge badge-admin">holidays ${d(l.holidaysCountry)}</span>`:"");return`<button type="button" class="cal-row${J}" data-action="select-cal" data-id="${l.id}">
          ${de}
          <span class="cal-row-text">
            <span class="cal-row-title">${d(l.displayname)}</span>
            <span class="cal-row-badges">${pe}</span>
            <span class="muted small mono cal-row-uri">${d(l.uri)}</span>
          </span>
        </button>`}).join(""),r=t.map(l=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${d(l.displayname)}</span>
            <span class="cal-row-badges">${P(l.access)}</span>
            <span class="muted small">Shared with you · ${d(l.access)}</span>
          </span>
        </div>`).join(""),c=b.map(l=>`<option value="${d(l.username)}">${d(l.displayname)} (${d(l.username)})</option>`).join(""),f=I.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':I.map(l=>`<tr>
                <td>
                  <strong>${d(l.displayname||l.username||l.href)}</strong>
                  <div class="muted small mono">${d(l.username||l.href)}</div>
                </td>
                <td>${P(l.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d(l.href)}" ${p?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),T=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",C=a&&a.canShare?`<div class="card">
            ${E("Calendar details","calendar-details")}
            <form class="stack" data-form="edit-cal" style="margin-top:1rem">
              <label>
                Display name
                <input type="text" name="displayname" required maxlength="200"
                  value="${d(a.displayname)}" autocomplete="off" />
              </label>
              <label>
                Color
                <span class="color-field">
                  <input type="color" name="color_picker" value="${d(T)}"
                    title="Pick a color" aria-label="Calendar color picker" />
                  <input type="text" name="color" class="mono" maxlength="9"
                    value="${d(a.color||T)}"
                    placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                </span>
              </label>
              <label>
                Description
                <textarea name="description" rows="3" maxlength="2000"
                  placeholder="Optional notes for this calendar">${d(a.description)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Save changes</button>
                <span class="muted small mono">${d(a.uri)}</span>
              </div>
            </form>

            <div class="import-export" style="margin-top:1.35rem">
              ${E("Import / export","import-export")}
              ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
              <div class="form-actions-row" style="margin-top:0.75rem">
                <button type="button" class="btn" data-action="export-cal" ${p?"disabled":""}>Export .ics</button>
                <label class="btn btn-ghost file-btn" ${p||a.readOnly?"aria-disabled=true":""}>
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${p||a.readOnly?"disabled":""} hidden />
                </label>
              </div>
              ${x?`<div class="flash flash-${x.ok?"success":"error"} import-result" role="status">
                      <strong>Import result:</strong> ${d(x.message)}
                    </div>`:""}
            </div>
          </div>`:a&&!a.canShare?`<div class="card">
              ${E("Shared calendar","shared-with-me")}
              <div class="form-actions-row" style="margin-top:0.75rem">
                <button type="button" class="btn" data-action="export-cal" ${p?"disabled":""}>Export .ics</button>
              </div>
            </div>`:'<div class="card"><p class="muted">Select a calendar you own to edit details or sharing.</p></div>',O=!!(a&&a.readOnly),q=a&&a.canShare?`<div class="card">
            ${E(`Share “${a.displayname}”`,"share")}
            ${O?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
            <form class="form-grid" data-form="share" style="margin-top:1rem">
              <label>
                User
                <select name="username" required ${b.length===0?"disabled":""}>
                  <option value="">${b.length?"Select user…":"No other users"}</option>
                  ${c}
                </select>
              </label>
              <label>
                Access
                <select name="access" ${O?"disabled":""}>
                  <option value="read" selected>Read only</option>
                  ${O?"":'<option value="readwrite">Full access</option>'}
                </select>
                ${O?'<input type="hidden" name="access" value="read" />':""}
              </label>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" ${p||b.length===0?"disabled":""}>Share</button>
              </div>
            </form>
            <div class="table-wrap" style="margin-top:1.25rem">
              <table>
                <thead>
                  <tr><th>Shared with</th><th>Access</th><th></th></tr>
                </thead>
                <tbody>${f}</tbody>
              </table>
            </div>
          </div>`:"",ne=`
      <div class="portal-grid">
        <section class="card">
          ${E("Owned","owned")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${e||'<p class="muted">No calendars yet. Add one below.</p>'}
          </div>

          <div style="margin-top:1.35rem">
            ${E("Add calendar","add-calendar")}
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
                ${v.map(l=>`<option value="${d(l.code)}">${d(l.name)} (${d(l.code)})</option>`).join("")}
              </select>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="readOnly" />
              Read-only (for everyone)
            </label>
            <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Create calendar</button>
          </form>

          ${t.length?`<div style="margin-top:1.25rem">
                   ${E("Shared with me","shared-with-me")}
                   <div class="cal-list" style="margin-top:0.75rem">${r}</div>
                 </div>`:""}
        </section>
        <section class="stack">
          ${C}
          ${q}
        </section>
      </div>`,le=D.map(l=>`<button type="button" class="cal-row${l.id===S?" is-selected":""}" data-action="select-ab" data-id="${l.id}">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${d(l.displayname)}</span>
            <span class="muted small">${l.cardCount} contact${l.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${d(l.uri)}</span>
          </span>
        </button>`).join(""),N=D.find(l=>l.id===S)??null,ie=N?`<div class="card">
          ${E(N.displayname,"contact-import-export")}
          <p class="muted small mono" style="margin-top:0.5rem">${d(N.uri)} · ${N.cardCount} contact${N.cardCount===1?"":"s"}</p>
          <div class="import-export" style="margin-top:1rem">
            <div class="form-actions-row">
              <button type="button" class="btn" data-action="export-ab" ${p?"disabled":""}>Export .vcf</button>
              <label class="btn btn-ghost file-btn" ${p?"aria-disabled=true":""}>
                Import .vcf
                <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${p?"disabled":""} hidden />
              </label>
            </div>
            ${A?`<div class="flash flash-${A.ok?"success":"error"} import-result" role="status">
                    <strong>Import result:</strong> ${d(A.message)}
                  </div>`:""}
          </div>
        </div>`:'<div class="card"><p class="muted">Select an address book to import or export contacts.</p></div>',ce=`
      <div class="portal-grid">
        <section class="card">
          ${E("Address books","address-books")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${le||'<p class="muted">No address books yet. Connect a CardDAV client once, or create one under Admin.</p>'}
          </div>
        </section>
        <section class="stack">
          ${ie}
        </section>
      </div>`;s.innerHTML=j(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${u==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${u==="calendars"}">
            My Calendars
          </button>
          <button type="button" role="tab" class="tab-btn${u==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${u==="contacts"}">
            My Contacts
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${u==="calendars"?"my-calendars":"my-contacts"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${u==="calendars"?ne:ce}
    `)}function y(){o?X():V(),K()}function H(n){const t=n.querySelector('input[name="color_picker"]'),a=n.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let e=a.value.trim();e&&!e.startsWith("#")&&(e=`#${e}`),/^#[0-9A-Fa-f]{6}/.test(e)&&(t.value=e.slice(0,7),a.value=e.toUpperCase())}))}function K(){s.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",c=>{const f=c.target.closest("[data-action]");((f==null?void 0:f.dataset.action)==="info"||(f==null?void 0:f.dataset.action)==="info-close")&&(c.preventDefault(),c.stopPropagation()),ae(c)})}),B||(document.addEventListener("keydown",r=>{r.key==="Escape"&&M()}),B=!0);const n=s.querySelector('[data-form="login"]');n==null||n.addEventListener("submit",r=>{r.preventDefault(),z(n)});const t=s.querySelector('[data-form="share"]');t==null||t.addEventListener("submit",r=>{r.preventDefault(),Q(t)});const a=s.querySelector('[data-form="edit-cal"]');a&&(H(a),a.addEventListener("submit",r=>{r.preventDefault(),Z(a)}));const e=s.querySelector('[data-form="create-cal"]');e&&(H(e),e.addEventListener("submit",r=>{r.preventDefault(),ee(e)})),te(),Y()}function Y(){const n=s.querySelector('[data-form="create-cal"]');if(!n)return;const t=n.querySelector('input[name="holidays"]'),a=n.querySelector("#holidays-country-wrap"),e=n.querySelector('input[name="displayname"]'),r=n.querySelector('input[name="readOnly"]');if(!t||!a)return;const c=()=>{const f=t.checked;a.hidden=!f,e&&(e.required=!f,f&&!e.value.trim()?e.placeholder="Auto: Holidays (XX)":f||(e.placeholder="Work")),f&&r&&(r.checked=!0)};t.addEventListener("change",c),c()}async function z(n){const t=new FormData(n),a=String(t.get("username")??""),e=String(t.get("password")??"");p=!0,k(),y();try{o=(await w.login(a,e)).user,await L(),g("success","Signed in")}catch(r){g("error",r instanceof Error?r.message:"Login failed")}finally{p=!1,y()}}async function Q(n){if(m===null)return;const t=new FormData(n),a=String(t.get("username")??""),e=String(t.get("access")??"read");p=!0,k(),y();try{await w.share(m,a,e),await R(m),g("success",`Shared with ${a}`)}catch(r){g("error",r instanceof Error?r.message:"Share failed")}finally{p=!1,y()}}async function Z(n){if(m===null)return;const t=new FormData(n),a=String(t.get("displayname")??"").trim(),e=String(t.get("description")??""),r=String(t.get("color")??"").trim();p=!0,k(),y();try{const c=await w.updateCalendar(m,{displayname:a,description:e,color:r});await L(),m=c.calendar.id,g("success","Calendar updated")}catch(c){g("error",c instanceof Error?c.message:"Update failed")}finally{p=!1,y()}}async function ee(n){const t=new FormData(n),a=String(t.get("displayname")??"").trim(),e=String(t.get("description")??""),r=String(t.get("color")??"").trim(),c=t.get("holidays")==="on",f=String(t.get("holidayCountry")??"").trim(),T=t.get("readOnly")==="on";if(c&&!f){g("error","Select a country for the holidays calendar"),y();return}if(!c&&!a){g("error","Display name is required"),y();return}p=!0,k(),x=null,y();try{const C=await w.createCalendar({displayname:a,description:e,color:r,holidays:c,holidayCountry:c?f:void 0,readOnly:T});m=C.calendar.id,await L();let O=`Created “${C.calendar.displayname}”`;const q=C.holidayImport??C.calendar.holidayImport;q&&(O+=`. Holidays imported: ${F(q)}.`,x={ok:!0,message:F(q)}),T&&(O+=" Calendar is read-only."),g("success",O)}catch(C){g("error",C instanceof Error?C.message:"Create failed")}finally{p=!1,y()}}async function ae(n){const t=n.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a==="logout"){p=!0;try{await w.logout()}catch{}o=null,i=[],I=[],m=null,k(),p=!1,y();return}if(a==="select-cal"){const e=Number(t.dataset.id);if(!Number.isFinite(e))return;m=e,x=null,p=!0,k(),y();try{await R(e)}catch(r){g("error",r instanceof Error?r.message:"Failed to load shares")}finally{p=!1,y()}return}if(a==="info"){const e=t.dataset.info??"";oe(e);return}if(a==="info-close"){M();return}if(a==="tab"){const e=t.dataset.tab;(e==="calendars"||e==="contacts")&&(u=e,k(),y());return}if(a==="select-ab"){const e=Number(t.dataset.id);if(!Number.isFinite(e))return;S=e,A=null,k(),y();return}if(a==="export-ab"){if(S===null)return;p=!0,k(),y();try{const{blob:e,filename:r}=await w.exportAddressBook(S),c=URL.createObjectURL(e),f=document.createElement("a");f.href=c,f.download=r,f.click(),URL.revokeObjectURL(c),g("success",`Exported ${r}`)}catch(e){g("error",e instanceof Error?e.message:"Export failed")}finally{p=!1,y()}return}if(a==="revoke"){const e=t.dataset.href??"";if(!e||m===null||!confirm("Revoke access for this user?"))return;p=!0,k(),y();try{await w.revoke(m,e),await R(m),g("success","Share revoked")}catch(r){g("error",r instanceof Error?r.message:"Revoke failed")}finally{p=!1,y()}return}if(a==="export-cal"){if(m===null)return;p=!0,k(),y();try{const{blob:e,filename:r}=await w.exportCalendar(m),c=URL.createObjectURL(e),f=document.createElement("a");f.href=c,f.download=r,f.click(),URL.revokeObjectURL(c),g("success",`Exported ${r}`)}catch(e){g("error",e instanceof Error?e.message:"Export failed")}finally{p=!1,y()}}}function te(){const n=s.querySelector('input[data-action="import-cal"]');n&&n.addEventListener("change",()=>{re(n)});const t=s.querySelector('input[data-action="import-ab"]');t&&t.addEventListener("change",()=>{se(t)})}async function se(n){var a;if(S===null)return;const t=(a=n.files)==null?void 0:a[0];if(n.value="",!!t){p=!0,k(),A=null,y();try{const e=await t.text(),r=await w.importAddressBook(S,e),c=F(r);A={ok:!0,message:c},await L(),g("success",`Import finished for “${t.name}”: ${c}.`)}catch(e){const r=e instanceof Error?e.message:"Import failed";A={ok:!1,message:r},g("error",r)}finally{p=!1,y()}}}function oe(n){const t=ye[n];if(!t)return;const a=s.querySelector("#info-modal"),e=s.querySelector("#info-modal-title"),r=s.querySelector("#info-modal-body");if(!a||!e||!r)return;e.textContent=t.title,r.innerHTML=t.paragraphs.map(f=>`<p>${d(f)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const c=a.querySelector(".info-modal-close");c==null||c.focus()}function M(){const n=s.querySelector("#info-modal");n&&(n.hidden=!0,document.body.classList.remove("info-modal-open"))}async function re(n){var a;if(m===null)return;const t=(a=n.files)==null?void 0:a[0];if(n.value="",!!t){p=!0,k(),x=null,y();try{const e=await t.text(),r=await w.importCalendar(m,e),c=F(r);x={ok:!0,message:c},g("success",`Import finished for “${t.name}”: ${c}.`)}catch(e){const r=e instanceof Error?e.message:"Import failed";x={ok:!1,message:r},g("error",r)}finally{p=!1,y()}}}G()}const W=document.getElementById("app");if(!W)throw new Error("#app missing");ge(W);
//# sourceMappingURL=index-CBgRvBu2.js.map
