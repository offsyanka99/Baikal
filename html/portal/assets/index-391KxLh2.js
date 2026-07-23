var M=Object.defineProperty;var I=(t,r,u)=>r in t?M(t,r,{enumerable:!0,configurable:!0,writable:!0,value:u}):t[r]=u;var x=(t,r,u)=>I(t,typeof r!="symbol"?r+"":r,u);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))m(l);new MutationObserver(l=>{for(const s of l)if(s.type==="childList")for(const g of s.addedNodes)g.tagName==="LINK"&&g.rel==="modulepreload"&&m(g)}).observe(document,{childList:!0,subtree:!0});function u(l){const s={};return l.integrity&&(s.integrity=l.integrity),l.referrerPolicy&&(s.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?s.credentials="include":l.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function m(l){if(l.ep)return;l.ep=!0;const s=u(l);fetch(l.href,s)}})();class A extends Error{constructor(u,m){super(u);x(this,"status");this.status=m}}async function b(t,r={}){const u=new Headers(r.headers);r.body&&!u.has("Content-Type")&&u.set("Content-Type","application/json");const m=await fetch(`/api${t}`,{...r,headers:u,credentials:"same-origin"});let l=null;const s=await m.text();if(s)try{l=JSON.parse(s)}catch{l={error:s}}if(!m.ok){const g=l&&typeof l=="object"&&l!==null&&"error"in l&&typeof l.error=="string"?l.error:`Request failed (${m.status})`;throw new A(g,m.status)}return l}const v={me:()=>b("/me"),login:(t,r)=>b("/login",{method:"POST",body:JSON.stringify({username:t,password:r})}),logout:()=>b("/logout",{method:"POST"}),calendars:()=>b("/calendars"),createCalendar:t=>b("/calendars",{method:"POST",body:JSON.stringify(t)}),updateCalendar:(t,r)=>b(`/calendars/${t}`,{method:"PATCH",body:JSON.stringify(r)}),directory:()=>b("/directory"),shares:t=>b(`/calendars/${t}/shares`),share:(t,r,u)=>b(`/calendars/${t}/shares`,{method:"POST",body:JSON.stringify({username:r,access:u})}),revoke:(t,r)=>b(`/calendars/${t}/shares`,{method:"DELETE",body:JSON.stringify({href:r})})},W="0.11.1-fork.1",K="https://github.com/offsyanka99/Baikal/tree/master/docs";function d(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function D(t){return t==="readwrite"?'<span class="badge badge-admin">full access</span>':t==="read"?'<span class="badge">read-only</span>':t==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(t)}</span>`}function z(t){let r=null,u=null,m=[],l=[],s=null,g=[],p=!1;function y(n,a){u={type:n,message:a}}function w(){u=null}async function F(){try{r=(await v.me()).user,await S()}catch(n){n instanceof A&&n.status===401?r=null:y("error",n instanceof Error?n.message:"Failed to load")}h()}async function S(){const[n,a]=await Promise.all([v.calendars(),v.directory()]);if(m=n.calendars,l=a.users,s!==null&&!m.some(e=>e.id===s)&&(s=null,g=[]),s===null){const e=m.find(o=>o.canShare);e&&(s=e.id,await $(e.id))}else await $(s)}async function $(n){g=(await v.shares(n)).shares}function k(n,a={}){const e=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,o=r?`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
          <div class="topnav-right">
            <span class="muted">${d(r.displayname||r.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
        </nav>`,i=u?`<div class="flash flash-${d(u.type)}" role="status">${d(u.message)}</div>`:"",f=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${d(W)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(K)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return document.body.className=a.auth?"layout-auth":"",`${o}
      <main class="container">
        ${i}
        ${n}
      </main>
      ${f}`}function C(){t.innerHTML=k(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function P(){if(!r){C();return}const n=m.filter(c=>c.canShare),a=m.filter(c=>!c.canShare),e=m.find(c=>c.id===s)??null,o=n.map(c=>{const J=c.id===s?" is-selected":"",_=c.color?`<span class="cal-swatch" style="background:${d(c.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>';return`<button type="button" class="cal-row${J}" data-action="select-cal" data-id="${c.id}">
          ${_}
          <span class="cal-row-text">
            <strong>${d(c.displayname)}</strong>
            <span class="muted small mono">${d(c.uri)}</span>
          </span>
          ${D(c.access)}
        </button>`}).join(""),i=a.map(c=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <strong>${d(c.displayname)}</strong>
            <span class="muted small">Shared with you · ${d(c.access)}</span>
          </span>
        </div>`).join(""),f=l.map(c=>`<option value="${d(c.username)}">${d(c.displayname)} (${d(c.username)})</option>`).join(""),H=g.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':g.map(c=>`<tr>
                <td>
                  <strong>${d(c.displayname||c.username||c.href)}</strong>
                  <div class="muted small mono">${d(c.username||c.href)}</div>
                </td>
                <td>${D(c.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d(c.href)}" ${p?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),O=e!=null&&e.color&&e.color.length>=7?e.color.slice(0,7):"#3B82F6",V=e&&e.canShare?`<div class="card">
            <div class="section-header">
              <h2>Calendar details</h2>
            </div>
            <p class="muted small">Display name, color, and description are visible to CalDAV clients.</p>
            <form class="stack" data-form="edit-cal" style="margin-top:1rem">
              <label>
                Display name
                <input type="text" name="displayname" required maxlength="200"
                  value="${d(e.displayname)}" autocomplete="off" />
              </label>
              <label>
                Color
                <span class="color-field">
                  <input type="color" name="color_picker" value="${d(O)}"
                    title="Pick a color" aria-label="Calendar color picker" />
                  <input type="text" name="color" class="mono" maxlength="9"
                    value="${d(e.color||O)}"
                    placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                </span>
              </label>
              <label>
                Description
                <textarea name="description" rows="3" maxlength="2000"
                  placeholder="Optional notes for this calendar">${d(e.description)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Save changes</button>
                <span class="muted small mono">${d(e.uri)}</span>
              </div>
            </form>
          </div>`:e&&!e.canShare?'<div class="card"><p class="muted">Shared calendars are read-only here. Ask the owner to change name, color, or description.</p></div>':'<div class="card"><p class="muted">Select a calendar you own to edit details or sharing.</p></div>',j=e&&e.canShare?`<div class="card">
            <div class="section-header">
              <h2>Share “${d(e.displayname)}”</h2>
            </div>
            <p class="muted small">Choose a Baïkal user and access level. Same result as the classic DAV browser, without typing mailto: addresses.</p>
            <form class="form-grid" data-form="share" style="margin-top:1rem">
              <label>
                User
                <select name="username" required ${l.length===0?"disabled":""}>
                  <option value="">${l.length?"Select user…":"No other users"}</option>
                  ${f}
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
                <button type="submit" class="btn btn-primary" ${p||l.length===0?"disabled":""}>Share</button>
              </div>
            </form>
            <div class="table-wrap" style="margin-top:1.25rem">
              <table>
                <thead>
                  <tr><th>Shared with</th><th>Access</th><th></th></tr>
                </thead>
                <tbody>${H}</tbody>
              </table>
            </div>
          </div>`:"";t.innerHTML=k(`
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
            ${o||'<p class="muted">No calendars yet. Add one below.</p>'}
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
            <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Create calendar</button>
          </form>

          ${a.length?`<h2 style="margin-top:1.25rem">Shared with me</h2>
                 <div class="cal-list">${i}</div>`:""}
        </section>
        <section class="stack">
          ${V}
          ${j}
        </section>
      </div>
    `)}function h(){r?P():C(),N()}function E(n){const a=n.querySelector('input[name="color_picker"]'),e=n.querySelector('input[name="color"]');!a||!e||(a.addEventListener("input",()=>{e.value=a.value.toUpperCase()}),e.addEventListener("change",()=>{let o=e.value.trim();o&&!o.startsWith("#")&&(o=`#${o}`),/^#[0-9A-Fa-f]{6}/.test(o)&&(a.value=o.slice(0,7),e.value=o.toUpperCase())}))}function N(){t.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",f=>{U(f)})});const n=t.querySelector('[data-form="login"]');n==null||n.addEventListener("submit",i=>{i.preventDefault(),q(n)});const a=t.querySelector('[data-form="share"]');a==null||a.addEventListener("submit",i=>{i.preventDefault(),B(a)});const e=t.querySelector('[data-form="edit-cal"]');e&&(E(e),e.addEventListener("submit",i=>{i.preventDefault(),T(e)}));const o=t.querySelector('[data-form="create-cal"]');o&&(E(o),o.addEventListener("submit",i=>{i.preventDefault(),R(o)}))}async function q(n){const a=new FormData(n),e=String(a.get("username")??""),o=String(a.get("password")??"");p=!0,w(),h();try{r=(await v.login(e,o)).user,await S(),y("success","Signed in")}catch(i){y("error",i instanceof Error?i.message:"Login failed")}finally{p=!1,h()}}async function B(n){if(s===null)return;const a=new FormData(n),e=String(a.get("username")??""),o=String(a.get("access")??"read");p=!0,w(),h();try{await v.share(s,e,o),await $(s),y("success",`Shared with ${e}`)}catch(i){y("error",i instanceof Error?i.message:"Share failed")}finally{p=!1,h()}}async function T(n){if(s===null)return;const a=new FormData(n),e=String(a.get("displayname")??"").trim(),o=String(a.get("description")??""),i=String(a.get("color")??"").trim();p=!0,w(),h();try{const f=await v.updateCalendar(s,{displayname:e,description:o,color:i});await S(),s=f.calendar.id,y("success","Calendar updated")}catch(f){y("error",f instanceof Error?f.message:"Update failed")}finally{p=!1,h()}}async function R(n){const a=new FormData(n),e=String(a.get("displayname")??"").trim(),o=String(a.get("description")??""),i=String(a.get("color")??"").trim();p=!0,w(),h();try{const f=await v.createCalendar({displayname:e,description:o,color:i});s=f.calendar.id,await S(),y("success",`Created “${f.calendar.displayname}”`)}catch(f){y("error",f instanceof Error?f.message:"Create failed")}finally{p=!1,h()}}async function U(n){const a=n.target.closest("[data-action]");if(!a)return;const e=a.dataset.action;if(e==="logout"){p=!0;try{await v.logout()}catch{}r=null,m=[],g=[],s=null,w(),p=!1,h();return}if(e==="select-cal"){const o=Number(a.dataset.id);if(!Number.isFinite(o))return;s=o,p=!0,w(),h();try{await $(o)}catch(i){y("error",i instanceof Error?i.message:"Failed to load shares")}finally{p=!1,h()}return}if(e==="revoke"){const o=a.dataset.href??"";if(!o||s===null||!confirm("Revoke access for this user?"))return;p=!0,w(),h();try{await v.revoke(s,o),await $(s),y("success","Share revoked")}catch(i){y("error",i instanceof Error?i.message:"Revoke failed")}finally{p=!1,h()}}}F()}const L=document.getElementById("app");if(!L)throw new Error("#app missing");z(L);
//# sourceMappingURL=index-391KxLh2.js.map
