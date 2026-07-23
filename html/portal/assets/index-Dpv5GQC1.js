var H=Object.defineProperty;var V=(t,e,i)=>e in t?H(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i;var k=(t,e,i)=>V(t,typeof e!="symbol"?e+"":e,i);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))u(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const f of a.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&u(f)}).observe(document,{childList:!0,subtree:!0});function i(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function u(s){if(s.ep)return;s.ep=!0;const a=i(s);fetch(s.href,a)}})();class L extends Error{constructor(i,u){super(i);k(this,"status");this.status=u}}async function y(t,e={}){const i=new Headers(e.headers);e.body&&!i.has("Content-Type")&&i.set("Content-Type","application/json");const u=await fetch(`/api${t}`,{...e,headers:i,credentials:"same-origin"});let s=null;const a=await u.text();if(a)try{s=JSON.parse(a)}catch{s={error:a}}if(!u.ok){const f=s&&typeof s=="object"&&s!==null&&"error"in s&&typeof s.error=="string"?s.error:`Request failed (${u.status})`;throw new L(f,u.status)}return s}const b={me:()=>y("/me"),login:(t,e)=>y("/login",{method:"POST",body:JSON.stringify({username:t,password:e})}),logout:()=>y("/logout",{method:"POST"}),calendars:()=>y("/calendars"),directory:()=>y("/directory"),shares:t=>y(`/calendars/${t}/shares`),share:(t,e,i)=>y(`/calendars/${t}/shares`,{method:"POST",body:JSON.stringify({username:e,access:i})}),revoke:(t,e)=>y(`/calendars/${t}/shares`,{method:"DELETE",body:JSON.stringify({href:e})})},M="0.11.1",I="https://sabre.io/baikal/";function d(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function A(t){return t==="readwrite"?'<span class="badge badge-admin">full access</span>':t==="read"?'<span class="badge">read-only</span>':t==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${d(t)}</span>`}function J(t){let e=null,i=null,u=[],s=[],a=null,f=[],h=!1;function g(o,l){i={type:o,message:l}}function v(){i=null}async function P(){try{e=(await b.me()).user,await S()}catch(o){o instanceof L&&o.status===401?e=null:g("error",o instanceof Error?o.message:"Failed to load")}m()}async function S(){const[o,l]=await Promise.all([b.calendars(),b.directory()]);if(u=o.calendars,s=l.users,a!==null&&!u.some(r=>r.id===a)&&(a=null,f=[]),a===null){const r=u.find(c=>c.canShare);r&&(a=r.id,await w(r.id))}else await w(a)}async function w(o){f=(await b.shares(o)).shares}function E(o,l={}){const r=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,c=e?`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
          <div class="topnav-right">
            <span class="muted">${d(e.displayname||e.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${r}</a>
        </nav>`,p=i?`<div class="flash flash-${d(i.type)}" role="status">${d(i.message)}</div>`:"",$=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${d(M)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${d(I)}" rel="noopener">Docs</a>
        </div>
      </footer>`;return document.body.className=l.auth?"layout-auth":"",`${c}
      <main class="container">
        ${p}
        ${o}
      </main>
      ${$}`}function O(){t.innerHTML=E(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${h?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV clients keep using <span class="mono">/dav.php/</span>. This portal is only for sharing calendars.
          </p>
        </div>
      </div>`,{auth:!0})}function D(){if(!e){O();return}const o=u.filter(n=>n.canShare),l=u.filter(n=>!n.canShare),r=u.find(n=>n.id===a)??null,c=o.map(n=>{const j=n.id===a?" is-selected":"",x=n.color?`<span class="cal-swatch" style="background:${d(n.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>';return`<button type="button" class="cal-row${j}" data-action="select-cal" data-id="${n.id}">
          ${x}
          <span class="cal-row-text">
            <strong>${d(n.displayname)}</strong>
            <span class="muted small mono">${d(n.uri)}</span>
          </span>
          ${A(n.access)}
        </button>`}).join(""),p=l.map(n=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <strong>${d(n.displayname)}</strong>
            <span class="muted small">Shared with you · ${d(n.access)}</span>
          </span>
        </div>`).join(""),$=s.map(n=>`<option value="${d(n.username)}">${d(n.displayname)} (${d(n.username)})</option>`).join(""),B=f.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':f.map(n=>`<tr>
                <td>
                  <strong>${d(n.displayname||n.username||n.href)}</strong>
                  <div class="muted small mono">${d(n.username||n.href)}</div>
                </td>
                <td>${A(n.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${d(n.href)}" ${h?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),F=r?r.canShare?`<div class="card">
            <div class="section-header">
              <h2>Share “${d(r.displayname)}”</h2>
            </div>
            <p class="muted small">Choose a Baïkal user and access level. Same result as the classic DAV browser, without typing mailto: addresses.</p>
            <form class="form-grid" data-form="share" style="margin-top:1rem">
              <label>
                User
                <select name="username" required ${s.length===0?"disabled":""}>
                  <option value="">${s.length?"Select user…":"No other users"}</option>
                  ${$}
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
                <button type="submit" class="btn btn-primary" ${h||s.length===0?"disabled":""}>Share</button>
              </div>
            </form>
            <div class="table-wrap" style="margin-top:1.25rem">
              <table>
                <thead>
                  <tr><th>Shared with</th><th>Access</th><th></th></tr>
                </thead>
                <tbody>${B}</tbody>
              </table>
            </div>
          </div>`:'<div class="card"><p class="muted">You can only manage shares on calendars you own.</p></div>':'<div class="card"><p class="muted">Select a calendar you own to manage sharing.</p></div>';t.innerHTML=E(`
      <header class="page-header">
        <div>
          <h1>My calendars</h1>
          <p class="muted">Share calendars with other Baïkal users. Clients keep using <span class="mono">/dav.php/</span>.</p>
        </div>
      </header>

      <div class="portal-grid">
        <section class="card">
          <h2>Owned</h2>
          <div class="cal-list">
            ${c||'<p class="muted">No calendars yet. Create one in Admin or via a CalDAV client.</p>'}
          </div>
          ${l.length?`<h2 style="margin-top:1.25rem">Shared with me</h2>
                 <div class="cal-list">${p}</div>`:""}
        </section>
        <section>${F}</section>
      </div>
    `)}function m(){e?D():O(),T()}function T(){t.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",c=>{R(c)})});const o=t.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",r=>{r.preventDefault(),q(o)});const l=t.querySelector('[data-form="share"]');l==null||l.addEventListener("submit",r=>{r.preventDefault(),C(l)})}async function q(o){const l=new FormData(o),r=String(l.get("username")??""),c=String(l.get("password")??"");h=!0,v(),m();try{e=(await b.login(r,c)).user,await S(),g("success","Signed in")}catch(p){g("error",p instanceof Error?p.message:"Login failed")}finally{h=!1,m()}}async function C(o){if(a===null)return;const l=new FormData(o),r=String(l.get("username")??""),c=String(l.get("access")??"read");h=!0,v(),m();try{await b.share(a,r,c),await w(a),g("success",`Shared with ${r}`)}catch(p){g("error",p instanceof Error?p.message:"Share failed")}finally{h=!1,m()}}async function R(o){const l=o.target.closest("[data-action]");if(!l)return;const r=l.dataset.action;if(r==="logout"){h=!0;try{await b.logout()}catch{}e=null,u=[],f=[],a=null,v(),h=!1,m();return}if(r==="select-cal"){const c=Number(l.dataset.id);if(!Number.isFinite(c))return;a=c,h=!0,v(),m();try{await w(c)}catch(p){g("error",p instanceof Error?p.message:"Failed to load shares")}finally{h=!1,m()}return}if(r==="revoke"){const c=l.dataset.href??"";if(!c||a===null||!confirm("Revoke access for this user?"))return;h=!0,v(),m();try{await b.revoke(a,c),await w(a),g("success","Share revoked")}catch(p){g("error",p instanceof Error?p.message:"Revoke failed")}finally{h=!1,m()}}}P()}const N=document.getElementById("app");if(!N)throw new Error("#app missing");J(N);
//# sourceMappingURL=index-Dpv5GQC1.js.map
