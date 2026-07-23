var Xt=Object.defineProperty;var zt=(s,r,y)=>r in s?Xt(s,r,{enumerable:!0,configurable:!0,writable:!0,value:y}):s[r]=y;var pt=(s,r,y)=>zt(s,typeof r!="symbol"?r+"":r,y);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const g of document.querySelectorAll('link[rel="modulepreload"]'))$(g);new MutationObserver(g=>{for(const S of g)if(S.type==="childList")for(const D of S.addedNodes)D.tagName==="LINK"&&D.rel==="modulepreload"&&$(D)}).observe(document,{childList:!0,subtree:!0});function y(g){const S={};return g.integrity&&(S.integrity=g.integrity),g.referrerPolicy&&(S.referrerPolicy=g.referrerPolicy),g.crossOrigin==="use-credentials"?S.credentials="include":g.crossOrigin==="anonymous"?S.credentials="omit":S.credentials="same-origin",S}function $(g){if(g.ep)return;g.ep=!0;const S=y(g);fetch(g.href,S)}})();class Q extends Error{constructor(y,$){super(y);pt(this,"status");this.status=$}}let rt="";function nt(s){rt=s&&typeof s=="string"?s:""}async function k(s,r={}){const y=new Headers(r.headers);r.body&&!y.has("Content-Type")&&y.set("Content-Type","application/json");const $=(r.method||"GET").toUpperCase();$!=="GET"&&$!=="HEAD"&&$!=="OPTIONS"&&rt&&y.set("X-CSRF-Token",rt);const g=await fetch(`/api${s}`,{...r,headers:y,credentials:"same-origin"});let S=null;const D=await g.text();if(D)try{S=JSON.parse(D)}catch{S={error:D}}if(!g.ok){let v=`Request failed (${g.status})`;throw S&&typeof S=="object"&&S!==null&&"error"in S&&typeof S.error=="string"?v=S.error:(g.status===500||g.status===504)&&(v="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),new Q(v,g.status)}return S}function Y(s){return encodeURIComponent(s)}const x={me:async()=>{var r;const s=await k("/me");return nt(s.csrfToken||((r=s.user)==null?void 0:r.csrfToken)),s},login:async(s,r)=>{var $;const y=await k("/login",{method:"POST",body:JSON.stringify({username:s,password:r})});return nt(($=y.user)==null?void 0:$.csrfToken),y},logout:async()=>{try{return await k("/logout",{method:"POST"})}finally{nt("")}},calendars:()=>k("/calendars"),createCalendar:s=>k("/calendars",{method:"POST",body:JSON.stringify(s)}),holidayCountries:()=>k("/holidays/countries"),updateCalendar:(s,r)=>k(`/calendars/${s}`,{method:"PATCH",body:JSON.stringify(r)}),exportCalendar:async s=>{const r=await fetch(`/api/calendars/${s}/export`,{credentials:"same-origin"});if(!r.ok){let D=`Export failed (${r.status})`;try{const v=await r.json();v.error&&(D=v.error)}catch{}throw new Q(D,r.status)}const y=r.headers.get("Content-Disposition")||"",$=/filename="([^"]+)"/i.exec(y),g=($==null?void 0:$[1])||`calendar-${s}.ics`;return{blob:await r.blob(),filename:g}},importCalendar:(s,r)=>k(`/calendars/${s}/import`,{method:"POST",body:JSON.stringify({ics:r})}),directory:()=>k("/directory"),shares:s=>k(`/calendars/${s}/shares`),share:(s,r,y)=>k(`/calendars/${s}/shares`,{method:"POST",body:JSON.stringify({username:r,access:y})}),revoke:(s,r)=>k(`/calendars/${s}/shares`,{method:"DELETE",body:JSON.stringify({href:r})}),addressbooks:()=>k("/addressbooks"),createAddressBook:s=>k("/addressbooks",{method:"POST",body:JSON.stringify(s)}),updateAddressBook:(s,r)=>k(`/addressbooks/${s}`,{method:"PATCH",body:JSON.stringify(r)}),deleteAddressBook:(s,r=!1)=>k(`/addressbooks/${s}`,{method:"DELETE",body:JSON.stringify({force:r})}),exportAddressBook:async s=>{const r=await fetch(`/api/addressbooks/${s}/export`,{credentials:"same-origin"});if(!r.ok){let D=`Export failed (${r.status})`;try{const v=await r.json();v.error&&(D=v.error)}catch{}throw new Q(D,r.status)}const y=r.headers.get("Content-Disposition")||"",$=/filename="([^"]+)"/i.exec(y),g=($==null?void 0:$[1])||`contacts-${s}.vcf`;return{blob:await r.blob(),filename:g}},importAddressBook:(s,r)=>k(`/addressbooks/${s}/import`,{method:"POST",body:JSON.stringify({vcf:r})}),contacts:(s,r="")=>{const y=r.trim()?`?q=${encodeURIComponent(r.trim())}`:"";return k(`/addressbooks/${s}/contacts${y}`)},getContact:(s,r)=>k(`/addressbooks/${s}/contacts/${Y(r)}`),createContact:(s,r)=>k(`/addressbooks/${s}/contacts`,{method:"POST",body:JSON.stringify(r)}),updateContact:(s,r,y)=>k(`/addressbooks/${s}/contacts/${Y(r)}`,{method:"PATCH",body:JSON.stringify(y)}),deleteContact:(s,r)=>k(`/addressbooks/${s}/contacts/${Y(r)}`,{method:"DELETE"}),contactPhotoUrl:(s,r)=>`/api/addressbooks/${s}/contacts/${Y(r)}/photo`},Wt="0.11.1-fork.3",Yt="https://github.com/offsyanka99/Baikal/tree/master/docs";function i(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ot(s){return s==="readwrite"?'<span class="badge badge-admin">full access</span>':s==="read"?'<span class="badge">read-only</span>':s==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(s)}</span>`}function K(s){const r=[`${s.imported} new`,`${s.updated} updated`];return s.skipped>0&&r.push(`${s.skipped} skipped`),r.join(", ")}const Kt={"my-calendars":{title:"My calendars",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"My contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards."]}};function N(s,r,y="h2"){const $=y;return`<div class="section-title-row">
    <${$}>${i(s)}</${$}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(r)}"
      aria-label="About ${i(s)}" title="About ${i(s)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Qt(){return`
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
    </div>`}function Zt(s){let r=null,y=null,$="calendars",g=[],S=[],D=[],v=null,J=[],B=[],p=null,j=[],M="",T=null,d=null,L=!1,_=null,q=null,F=!1,c=!1,U=null,H=null,lt=!1,Z=null;function h(n,e){y={type:n,message:e}}function C(){y=null}async function ht(){try{r=(await x.me()).user,await I()}catch(n){n instanceof Q&&n.status===401?r=null:h("error",n instanceof Error?n.message:"Failed to load")}u()}async function I(){const[n,e,a]=await Promise.all([x.calendars(),x.directory().catch(()=>({users:[]})),x.addressbooks()]);if(g=n.calendars,S=e.users,B=a.addressbooks,D.length===0)try{D=(await x.holidayCountries()).countries}catch{D=[]}if(v!==null&&!g.some(t=>t.id===v)&&(v=null,J=[]),v===null){const t=g.find(o=>o.canShare);t&&(v=t.id,await G(t.id))}else await G(v);p!==null&&!B.some(t=>t.id===p)&&(p=null,j=[],T=null,d=null,L=!1),p===null&&B.length>0&&(p=B[0].id),p!==null&&$==="contacts"&&await X(p)}async function G(n){J=(await x.shares(n)).shares}async function X(n){j=(await x.contacts(n,M)).contacts,T!==null&&!j.some(a=>a.uri===T)&&(T=null,L||(d=null,_=null,q=null,F=!1))}async function bt(n){if(p===null)return;const e=await x.getContact(p,n);T=n,L=!1;const a=e.contact;d={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??it()},_=a.photoDataUri??(a.hasPhoto&&p!==null?`${x.contactPhotoUrl(p,n)}?t=${Date.now()}`:null),q=null,F=!1}function yt(){L=!0,T=null,d={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},_=null,q=null,F=!1}function it(){return{street:"",city:"",region:"",postal:"",country:""}}function gt(n){return new Promise((e,a)=>{const t=new FileReader;t.onload=()=>{const o=String(t.result??""),m=o.indexOf(",");e(m>=0?o.slice(m+1):o)},t.onerror=()=>a(new Error("Failed to read photo file")),t.readAsDataURL(n)})}function ct(n,e={}){const a=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,t=r?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            <span class="muted">${i(r.displayname||r.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,o=y?`<div class="flash flash-${i(y.type)}" role="status">${i(y.message)}</div>`:"",m=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${i(Wt)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(Yt)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return document.body.className=e.auth?"layout-auth":"",`${t}
      <main class="container">
        ${o}
        ${n}
      </main>
      ${m}
      ${Qt()}`}function dt(){s.innerHTML=ct(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function vt(){if(!r){dt();return}const n=g.filter(l=>l.canShare),e=g.filter(l=>!l.canShare),a=g.find(l=>l.id===v)??null,t=n.map(l=>{const O=l.id===v?" is-selected":"",V=l.color?`<span class="cal-swatch" style="background:${i(l.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',st=ot(l.access)+(l.readOnly?'<span class="badge">read-only</span>':"")+(l.holidaysCountry?`<span class="badge badge-admin">holidays ${i(l.holidaysCountry)}</span>`:"");return`<button type="button" class="cal-row${O}" data-action="select-cal" data-id="${l.id}">
          ${V}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(l.displayname)}</span>
            <span class="cal-row-badges">${st}</span>
            <span class="muted small mono cal-row-uri">${i(l.uri)}</span>
          </span>
        </button>`}).join(""),o=e.map(l=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(l.displayname)}</span>
            <span class="cal-row-badges">${ot(l.access)}</span>
            <span class="muted small">Shared with you · ${i(l.access)}</span>
          </span>
        </div>`).join(""),m=S.map(l=>`<option value="${i(l.username)}">${i(l.displayname)} (${i(l.username)})</option>`).join(""),b=J.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':J.map(l=>`<tr>
                <td>
                  <strong>${i(l.displayname||l.username||l.href)}</strong>
                  <div class="muted small mono">${i(l.username||l.href)}</div>
                </td>
                <td>${ot(l.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(l.href)}" ${c?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),A=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",f=a&&a.canShare?`<div class="card">
            ${N("Calendar details","calendar-details")}
            <form class="stack" data-form="edit-cal" style="margin-top:1rem">
              <label>
                Display name
                <input type="text" name="displayname" required maxlength="200"
                  value="${i(a.displayname)}" autocomplete="off" />
              </label>
              <label>
                Color
                <span class="color-field">
                  <input type="color" name="color_picker" value="${i(A)}"
                    title="Pick a color" aria-label="Calendar color picker" />
                  <input type="text" name="color" class="mono" maxlength="9"
                    value="${i(a.color||A)}"
                    placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                </span>
              </label>
              <label>
                Description
                <textarea name="description" rows="3" maxlength="2000"
                  placeholder="Optional notes for this calendar">${i(a.description)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                <span class="muted small mono">${i(a.uri)}</span>
              </div>
            </form>

            <div class="import-export" style="margin-top:1.35rem">
              ${N("Import / export","import-export")}
              ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
              <div class="form-actions-row" style="margin-top:0.75rem">
                <button type="button" class="btn" data-action="export-cal" ${c?"disabled":""}>Export .ics</button>
                <label class="btn btn-ghost file-btn" ${c||a.readOnly?"aria-disabled=true":""}>
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${c||a.readOnly?"disabled":""} hidden />
                </label>
              </div>
              ${U?`<div class="flash flash-${U.ok?"success":"error"} import-result" role="status">
                      <strong>Import result:</strong> ${i(U.message)}
                    </div>`:""}
            </div>
          </div>`:a&&!a.canShare?`<div class="card">
              ${N("Shared calendar","shared-with-me")}
              <div class="form-actions-row" style="margin-top:0.75rem">
                <button type="button" class="btn" data-action="export-cal" ${c?"disabled":""}>Export .ics</button>
              </div>
            </div>`:'<div class="card"><p class="muted">Select a calendar you own to edit details or sharing.</p></div>',E=!!(a&&a.readOnly),P=a&&a.canShare?`<div class="card">
            ${N(`Share “${a.displayname}”`,"share")}
            ${E?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
            <form class="form-grid" data-form="share" style="margin-top:1rem">
              <label>
                User
                <select name="username" required ${S.length===0?"disabled":""}>
                  <option value="">${S.length?"Select user…":"No other users"}</option>
                  ${m}
                </select>
              </label>
              <label>
                Access
                <select name="access" ${E?"disabled":""}>
                  <option value="read" selected>Read only</option>
                  ${E?"":'<option value="readwrite">Full access</option>'}
                </select>
                ${E?'<input type="hidden" name="access" value="read" />':""}
              </label>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" ${c||S.length===0?"disabled":""}>Share</button>
              </div>
            </form>
            <div class="table-wrap" style="margin-top:1.25rem">
              <table>
                <thead>
                  <tr><th>Shared with</th><th>Access</th><th></th></tr>
                </thead>
                <tbody>${b}</tbody>
              </table>
            </div>
          </div>`:"",Rt=`
      <div class="portal-grid">
        <section class="card">
          ${N("Owned","owned")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${t||'<p class="muted">No calendars yet. Add one below.</p>'}
          </div>

          <div style="margin-top:1.35rem">
            ${N("Add calendar","add-calendar")}
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
                ${D.map(l=>`<option value="${i(l.code)}">${i(l.name)} (${i(l.code)})</option>`).join("")}
              </select>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="readOnly" />
              Read-only (for everyone)
            </label>
            <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create calendar</button>
          </form>

          ${e.length?`<div style="margin-top:1.25rem">
                   ${N("Shared with me","shared-with-me")}
                   <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                 </div>`:""}
        </section>
        <section class="stack">
          ${f}
          ${P}
        </section>
      </div>`,Ut=B.map(l=>`<button type="button" class="cal-row${l.id===p?" is-selected":""}" data-action="select-ab" data-id="${l.id}">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(l.displayname)}</span>
            <span class="muted small">${l.cardCount} contact${l.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(l.uri)}</span>
          </span>
        </button>`).join(""),R=B.find(l=>l.id===p)??null,Bt=j.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${M?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:j.map(l=>{const O=!L&&l.uri===T?" is-selected":"",V=i((l.displayname||"?").slice(0,1).toUpperCase()),st=l.hasPhoto&&p!==null?`<img class="contact-avatar" src="${i(x.contactPhotoUrl(p,l.uri))}" alt="" loading="lazy" data-avatar-fallback="${V}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${V}</span>`;return`<tr class="contact-table-row${O}" data-action="select-contact" data-uri="${i(l.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${st}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(l.displayname)}</span>
                      ${l.org?`<span class="muted small contact-name-secondary">${i(l.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(l.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(l.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(l.org||"—")}</span></td>
              </tr>`}).join(""),w=d,tt=Array.isArray(w==null?void 0:w.emails)&&w.emails.length>0?w.emails:[""],et=Array.isArray(w==null?void 0:w.phones)&&w.phones.length>0?w.phones:[{type:"cell",value:""}],z=(w==null?void 0:w.address)??it(),jt=tt.map((l,O)=>`<div class="multi-row" data-multi="email" data-idx="${O}">
          <input type="email" name="email_${O}" value="${i(l??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${O}" ${tt.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Vt=et.map((l,O)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${O}">
          <select name="phone_type_${O}" aria-label="Phone type">
            ${["cell","work","home","other"].map(V=>`<option value="${V}" ${((l==null?void 0:l.type)??"other")===V?"selected":""}>${V}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${O}" value="${i((l==null?void 0:l.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${O}" ${et.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),at=Array.isArray(w==null?void 0:w.custom)?w.custom:[],Ht=at.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':at.map((l,O)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${O}">
                <input type="text" name="custom_label_${O}" value="${i(l.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${O}" value="${i(l.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${O}" title="Remove">×</button>
              </div>`).join(""),Mt=w&&R?`<div class="card">
            ${N(L?"New contact":"Edit contact","contacts")}
            <form class="stack" data-form="contact" style="margin-top:1rem">
              <div class="contact-photo-row">
                <div class="contact-photo-preview">
                  ${_?`<img src="${i(_)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((w.fullname||w.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                </div>
                <div class="stack stack-tight" style="flex:1">
                  <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                    ${_?"Change photo":"Upload photo"}
                    <input type="file" accept="image/*" data-action="contact-photo" ${c?"disabled":""} hidden />
                  </label>
                  ${_||w.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${c?"disabled":""}>Remove photo</button>`:""}
                  <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                </div>
              </div>
              <div class="form-grid form-grid-2">
                <label>First name
                  <input type="text" name="firstname" value="${i(w.firstname)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Last name
                  <input type="text" name="lastname" value="${i(w.lastname)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <label>Full name
                <input type="text" name="fullname" value="${i(w.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
              </label>
              <div class="form-grid form-grid-2">
                <label>Organization
                  <input type="text" name="org" value="${i(w.org)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Title
                  <input type="text" name="title" value="${i(w.title)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <div class="form-grid form-grid-2 contact-email-phone">
                <fieldset class="fieldset">
                  <legend>Emails</legend>
                  ${jt}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${tt.length>=10?"disabled":""}>+ Email</button>
                </fieldset>
                <fieldset class="fieldset">
                  <legend>Phones</legend>
                  ${Vt}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${et.length>=10?"disabled":""}>+ Phone</button>
                </fieldset>
              </div>
              <fieldset class="fieldset fieldset-address">
                <legend>Address</legend>
                <label>Street
                  <input type="text" name="street" value="${i(z.street)}" maxlength="300" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>City
                    <input type="text" name="city" value="${i(z.city)}" maxlength="120" autocomplete="off" />
                  </label>
                  <label>Region
                    <input type="text" name="region" value="${i(z.region)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2">
                  <label>Postal code
                    <input type="text" name="postal" value="${i(z.postal)}" maxlength="40" autocomplete="off" />
                  </label>
                  <label>Country
                    <input type="text" name="country" value="${i(z.country)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
              </fieldset>
              <label>Website
                <input type="url" name="url" value="${i(w.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
              </label>
              <fieldset class="fieldset fieldset-custom">
                <legend>Custom fields</legend>
                ${Ht}
                <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${at.length>=30?"disabled":""}>+ Custom field</button>
              </fieldset>
              <label>Notes
                <textarea name="note" rows="3" maxlength="4000">${i(w.note)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>${L?"Create contact":"Save contact"}</button>
                ${L?`<button type="button" class="btn btn-ghost" data-action="cancel-contact" ${c?"disabled":""}>Cancel</button>`:`<button type="button" class="btn btn-danger" data-action="delete-contact" ${c?"disabled":""}>Delete</button>`}
                ${!L&&w.uri?`<span class="muted small mono">${i(w.uri)}</span>`:""}
              </div>
            </form>
          </div>`:R?'<div class="card"><p class="muted">Select a contact or click <strong>Add contact</strong>.</p></div>':'<div class="card"><p class="muted">Select or create an address book first.</p></div>',Jt=R?`<section class="card ab-manage">
          ${N(R.displayname,"address-books")}
          <p class="muted small mono" style="margin:0.25rem 0 0.65rem">${i(R.uri)} · ${R.cardCount} contact${R.cardCount===1?"":"s"}</p>
          <form class="stack stack-tight" data-form="edit-ab">
            <label>Display name
              <input type="text" name="displayname" required maxlength="200" value="${i(R.displayname)}" />
            </label>
            <label>Description
              <textarea name="description" rows="2" maxlength="2000">${i(R.description)}</textarea>
            </label>
            <div class="form-actions-row form-actions-wrap">
              <button type="submit" class="btn btn-primary btn-small" ${c?"disabled":""}>Save</button>
              <button type="button" class="btn btn-danger btn-small" data-action="delete-ab" ${c?"disabled":""}>Delete</button>
            </div>
          </form>
          <div class="section-divider" style="margin:1rem 0"></div>
          <div class="import-export">
            ${N("Import / export","contact-import-export")}
            <div class="form-actions-row form-actions-wrap" style="margin-top:0.55rem">
              <button type="button" class="btn btn-small" data-action="export-ab" ${c?"disabled":""}>Export .vcf</button>
              <label class="btn btn-ghost btn-small file-btn" ${c?"aria-disabled=true":""}>
                Import .vcf
                <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${c?"disabled":""} hidden />
              </label>
            </div>
            ${H?`<div class="flash flash-${H.ok?"success":"error"} import-result" role="status">
                    <strong>Import:</strong> ${i(H.message)}
                  </div>`:""}
          </div>
        </section>`:"",Gt=`
      <div class="portal-grid portal-grid-contacts">
        <div class="contacts-sidebar stack">
          <section class="card">
            ${N("Address books","address-books")}
            <div class="cal-list" style="margin-top:0.75rem">
              ${Ut||'<p class="muted">No address books yet. Create one below.</p>'}
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
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
          ${Jt}
        </div>
        <section class="stack">
          ${R?`<div class="card contacts-main-card">
                  ${N("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${i(M)}" aria-label="Search contacts" ${c?"disabled":""} />
                    <button type="button" class="btn btn-primary" data-action="new-contact" ${c?"disabled":""}>Add contact</button>
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
                        ${Bt}
                      </tbody>
                    </table>
                  </div>
                </div>`:'<div class="card"><p class="muted">Select an address book to manage contacts.</p></div>'}
          ${Mt}
        </section>
      </div>`;s.innerHTML=ct(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${$==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${$==="calendars"}">
            My Calendars
          </button>
          <button type="button" role="tab" class="tab-btn${$==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${$==="contacts"}">
            My Contacts
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${$==="calendars"?"my-calendars":"my-contacts"}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${$==="calendars"?Rt:Gt}
    `)}function $t(){const n=s.querySelector(".contacts-table-wrap"),e=s.querySelector(".contacts-sidebar");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(n==null?void 0:n.scrollTop)??null,sidebarTop:(e==null?void 0:e.scrollTop)??null}}function wt(n){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(n.windowX,n.windowY),n.tableTop!==null){const e=s.querySelector(".contacts-table-wrap");e&&(e.scrollTop=n.tableTop)}if(n.sidebarTop!==null){const e=s.querySelector(".contacts-sidebar");e&&(e.scrollTop=n.sidebarTop)}})})}function u(){const n=$t();r?vt():dt(),St(),wt(n)}function ut(n){const e=n.querySelector('input[name="color_picker"]'),a=n.querySelector('input[name="color"]');!e||!a||(e.addEventListener("input",()=>{a.value=e.value.toUpperCase()}),a.addEventListener("change",()=>{let t=a.value.trim();t&&!t.startsWith("#")&&(t=`#${t}`),/^#[0-9A-Fa-f]{6}/.test(t)&&(e.value=t.slice(0,7),a.value=t.toUpperCase())}))}function St(){s.querySelectorAll("[data-action]").forEach(f=>{f.addEventListener("click",E=>{const P=E.target.closest("[data-action]");((P==null?void 0:P.dataset.action)==="info"||(P==null?void 0:P.dataset.action)==="info-close")&&(E.preventDefault(),E.stopPropagation()),Tt(E)})}),s.querySelectorAll("tr.contact-table-row[data-action]").forEach(f=>{f.addEventListener("keydown",E=>{(E.key==="Enter"||E.key===" ")&&(E.preventDefault(),f.click())})}),s.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(f=>{f.addEventListener("error",()=>{const E=f.dataset.avatarFallback||"?",P=document.createElement("span");P.className="contact-avatar contact-avatar-fallback",P.setAttribute("aria-hidden","true"),P.textContent=E,f.replaceWith(P)})}),lt||(document.addEventListener("keydown",f=>{f.key==="Escape"&&mt()}),lt=!0);const n=s.querySelector('[data-form="login"]');n==null||n.addEventListener("submit",f=>{f.preventDefault(),Ct(n)});const e=s.querySelector('[data-form="share"]');e==null||e.addEventListener("submit",f=>{f.preventDefault(),At(e)});const a=s.querySelector('[data-form="edit-cal"]');a&&(ut(a),a.addEventListener("submit",f=>{f.preventDefault(),Et(a)}));const t=s.querySelector('[data-form="create-cal"]');t&&(ut(t),t.addEventListener("submit",f=>{f.preventDefault(),Dt(t)}));const o=s.querySelector('[data-form="create-ab"]');o==null||o.addEventListener("submit",f=>{f.preventDefault(),Nt(o)});const m=s.querySelector('[data-form="edit-ab"]');m==null||m.addEventListener("submit",f=>{f.preventDefault(),qt(m)});const b=s.querySelector('[data-form="contact"]');b==null||b.addEventListener("submit",f=>{f.preventDefault(),_t(b)});const A=s.querySelector('input[data-action="contact-search"]');A==null||A.addEventListener("input",()=>{Z&&clearTimeout(Z),Z=setTimeout(()=>{M=A.value,p!==null&&(async()=>{try{await X(p),u()}catch(f){h("error",f instanceof Error?f.message:"Search failed"),u()}})()},250)}),Ot(),kt(),xt()}function xt(){const n=s.querySelector('input[data-action="contact-photo"]');n&&n.addEventListener("change",()=>{(async()=>{var a;const e=(a=n.files)==null?void 0:a[0];if(n.value="",!!e){if(e.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),u();return}try{const t=await gt(e);q=t,_=`data:${e.type||"image/jpeg"};base64,${t}`,F=!1,u()}catch(t){h("error",t instanceof Error?t.message:"Failed to read photo"),u()}}})()})}function kt(){const n=s.querySelector('[data-form="create-cal"]');if(!n)return;const e=n.querySelector('input[name="holidays"]'),a=n.querySelector("#holidays-country-wrap"),t=n.querySelector('input[name="displayname"]'),o=n.querySelector('input[name="readOnly"]');if(!e||!a)return;const m=()=>{const b=e.checked;a.hidden=!b,t&&(t.required=!b,b&&!t.value.trim()?t.placeholder="Auto: Holidays (XX)":b||(t.placeholder="Work")),b&&o&&(o.checked=!0)};e.addEventListener("change",m),m()}async function Ct(n){const e=new FormData(n),a=String(e.get("username")??""),t=String(e.get("password")??"");c=!0,C(),u();try{r=(await x.login(a,t)).user,await I(),h("success","Signed in")}catch(o){h("error",o instanceof Error?o.message:"Login failed")}finally{c=!1,u()}}async function At(n){if(v===null)return;const e=new FormData(n),a=String(e.get("username")??""),t=String(e.get("access")??"read");c=!0,C(),u();try{await x.share(v,a,t),await G(v),h("success",`Shared with ${a}`)}catch(o){h("error",o instanceof Error?o.message:"Share failed")}finally{c=!1,u()}}async function Et(n){if(v===null)return;const e=new FormData(n),a=String(e.get("displayname")??"").trim(),t=String(e.get("description")??""),o=String(e.get("color")??"").trim();c=!0,C(),u();try{const m=await x.updateCalendar(v,{displayname:a,description:t,color:o});await I(),v=m.calendar.id,h("success","Calendar updated")}catch(m){h("error",m instanceof Error?m.message:"Update failed")}finally{c=!1,u()}}async function Dt(n){const e=new FormData(n),a=String(e.get("displayname")??"").trim(),t=String(e.get("description")??""),o=String(e.get("color")??"").trim(),m=e.get("holidays")==="on",b=String(e.get("holidayCountry")??"").trim(),A=e.get("readOnly")==="on";if(m&&!b){h("error","Select a country for the holidays calendar"),u();return}if(!m&&!a){h("error","Display name is required"),u();return}c=!0,C(),U=null,u();try{const f=await x.createCalendar({displayname:a,description:t,color:o,holidays:m,holidayCountry:m?b:void 0,readOnly:A});v=f.calendar.id,await I();let E=`Created “${f.calendar.displayname}”`;const P=f.holidayImport??f.calendar.holidayImport;P&&(E+=`. Holidays imported: ${K(P)}.`,U={ok:!0,message:K(P)}),A&&(E+=" Calendar is read-only."),h("success",E)}catch(f){h("error",f instanceof Error?f.message:"Create failed")}finally{c=!1,u()}}async function Tt(n){const e=n.target.closest("[data-action]");if(!e)return;const a=e.dataset.action;if(a==="logout"){c=!0;try{await x.logout()}catch{}r=null,g=[],J=[],v=null,B=[],p=null,j=[],T=null,d=null,L=!1,C(),c=!1,u();return}if(a==="select-cal"){const t=Number(e.dataset.id);if(!Number.isFinite(t))return;v=t,U=null,c=!0,C(),u();try{await G(t)}catch(o){h("error",o instanceof Error?o.message:"Failed to load shares")}finally{c=!1,u()}return}if(a==="info"){const t=e.dataset.info??"";Ft(t);return}if(a==="info-close"){mt();return}if(a==="tab"){const t=e.dataset.tab;if(t==="calendars"||t==="contacts")if($=t,C(),t==="contacts"&&p!==null){c=!0,u();try{await X(p)}catch(o){h("error",o instanceof Error?o.message:"Failed to load contacts")}finally{c=!1,u()}}else u();return}if(a==="select-ab"){const t=Number(e.dataset.id);if(!Number.isFinite(t))return;p=t,H=null,T=null,d=null,L=!1,M="",j=[],_=null,q=null,F=!1,C(),c=!0,u();try{await X(t)}catch(o){h("error",o instanceof Error?o.message:"Failed to load contacts")}finally{c=!1,u()}return}if(a==="select-contact"){const t=e.dataset.uri??"";if(!t)return;C();try{await bt(t)}catch(o){h("error",o instanceof Error?o.message:"Failed to load contact")}u();return}if(a==="new-contact"){if(p===null)return;yt(),C(),u();return}if(a==="cancel-contact"){L=!1,d=null,T=null,_=null,q=null,F=!1,u();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!d)return;W(),Array.isArray(d.emails)||(d.emails=[""]),Array.isArray(d.phones)||(d.phones=[{type:"cell",value:""}]),Array.isArray(d.custom)||(d.custom=[]),a==="add-email"?d.emails.length<10&&d.emails.push(""):a==="add-phone"?d.phones.length<10&&d.phones.push({type:"other",value:""}):d.custom.length<30&&d.custom.push({label:"",value:""}),u();return}if(a==="remove-email"){if(!d)return;W();const t=Number(e.dataset.idx);if(!Number.isFinite(t))return;const o=Array.isArray(d.emails)?d.emails:[""];d.emails=o.filter((m,b)=>b!==t),d.emails.length===0&&(d.emails=[""]),u();return}if(a==="remove-phone"){if(!d)return;W();const t=Number(e.dataset.idx);if(!Number.isFinite(t))return;const o=Array.isArray(d.phones)?d.phones:[{type:"cell",value:""}];d.phones=o.filter((m,b)=>b!==t),d.phones.length===0&&(d.phones=[{type:"cell",value:""}]),u();return}if(a==="remove-custom"){if(!d)return;W();const t=Number(e.dataset.idx);if(!Number.isFinite(t))return;d.custom=(Array.isArray(d.custom)?d.custom:[]).filter((o,m)=>m!==t),u();return}if(a==="remove-photo"){_=null,q=null,F=!0,d&&(d.hasPhoto=!1),u();return}if(a==="delete-contact"){if(p===null||!T||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;c=!0,C(),u();try{await x.deleteContact(p,T),T=null,d=null,L=!1,await I(),h("success","Contact deleted")}catch(t){h("error",t instanceof Error?t.message:"Delete failed")}finally{c=!1,u()}return}if(a==="delete-ab"){if(p===null)return;const t=B.find(b=>b.id===p),o=((t==null?void 0:t.cardCount)??0)>0,m=o?`Delete address book “${(t==null?void 0:t.displayname)??""}” and all ${t==null?void 0:t.cardCount} contacts? This cannot be undone.`:`Delete empty address book “${(t==null?void 0:t.displayname)??""}”?`;if(!confirm(m))return;c=!0,C(),u();try{await x.deleteAddressBook(p,o),p=null,j=[],d=null,await I(),h("success","Address book deleted")}catch(b){h("error",b instanceof Error?b.message:"Delete failed")}finally{c=!1,u()}return}if(a==="export-ab"){if(p===null)return;c=!0,C(),u();try{const{blob:t,filename:o}=await x.exportAddressBook(p),m=URL.createObjectURL(t),b=document.createElement("a");b.href=m,b.download=o,b.click(),URL.revokeObjectURL(m),h("success",`Exported ${o}`)}catch(t){h("error",t instanceof Error?t.message:"Export failed")}finally{c=!1,u()}return}if(a==="revoke"){const t=e.dataset.href??"";if(!t||v===null||!confirm("Revoke access for this user?"))return;c=!0,C(),u();try{await x.revoke(v,t),await G(v),h("success","Share revoked")}catch(o){h("error",o instanceof Error?o.message:"Revoke failed")}finally{c=!1,u()}return}if(a==="export-cal"){if(v===null)return;c=!0,C(),u();try{const{blob:t,filename:o}=await x.exportCalendar(v),m=URL.createObjectURL(t),b=document.createElement("a");b.href=m,b.download=o,b.click(),URL.revokeObjectURL(m),h("success",`Exported ${o}`)}catch(t){h("error",t instanceof Error?t.message:"Export failed")}finally{c=!1,u()}}}function Ot(){const n=s.querySelector('input[data-action="import-cal"]');n&&n.addEventListener("change",()=>{It(n)});const e=s.querySelector('input[data-action="import-ab"]');e&&e.addEventListener("change",()=>{Pt(e)})}async function Pt(n){var a;if(p===null)return;const e=(a=n.files)==null?void 0:a[0];if(n.value="",!!e){c=!0,C(),H=null,u();try{const t=await e.text(),o=await x.importAddressBook(p,t),m=K(o);H={ok:!0,message:m},await I(),h("success",`Import finished for “${e.name}”: ${m}.`)}catch(t){const o=t instanceof Error?t.message:"Import failed";H={ok:!1,message:o},h("error",o)}finally{c=!1,u()}}}function W(){if(!d)return;const n=s.querySelector('[data-form="contact"]');if(!n)return;const e=new FormData(n);d.firstname=String(e.get("firstname")??""),d.lastname=String(e.get("lastname")??""),d.fullname=String(e.get("fullname")??""),d.org=String(e.get("org")??""),d.title=String(e.get("title")??""),d.url=String(e.get("url")??""),d.note=String(e.get("note")??""),d.address={street:String(e.get("street")??""),city:String(e.get("city")??""),region:String(e.get("region")??""),postal:String(e.get("postal")??""),country:String(e.get("country")??"")};const a=[];let t=0;for(;e.has(`email_${t}`);)a.push(String(e.get(`email_${t}`)??"")),t++;a.length&&(d.emails=a);const o=[];for(t=0;e.has(`phone_value_${t}`);)o.push({type:String(e.get(`phone_type_${t}`)??"other"),value:String(e.get(`phone_value_${t}`)??"")}),t++;o.length&&(d.phones=o);const m=[];for(t=0;e.has(`custom_label_${t}`)||e.has(`custom_value_${t}`);)m.push({label:String(e.get(`custom_label_${t}`)??""),value:String(e.get(`custom_value_${t}`)??"")}),t++;d.custom=m}function Lt(n){const e=new FormData(n),a=[];let t=0;for(;e.has(`email_${t}`);){const A=String(e.get(`email_${t}`)??"").trim();A&&a.push(A),t++}const o=[];for(t=0;e.has(`phone_value_${t}`);){const A=String(e.get(`phone_value_${t}`)??"").trim();A&&o.push({type:String(e.get(`phone_type_${t}`)??"other"),value:A}),t++}const m=[];for(t=0;e.has(`custom_label_${t}`)||e.has(`custom_value_${t}`);){const A=String(e.get(`custom_label_${t}`)??"").trim(),f=String(e.get(`custom_value_${t}`)??"").trim();(A||f)&&m.push({label:A,value:f}),t++}const b={firstname:String(e.get("firstname")??"").trim(),lastname:String(e.get("lastname")??"").trim(),fullname:String(e.get("fullname")??"").trim(),org:String(e.get("org")??"").trim(),title:String(e.get("title")??"").trim(),emails:a,phones:o,address:{street:String(e.get("street")??"").trim(),city:String(e.get("city")??"").trim(),region:String(e.get("region")??"").trim(),postal:String(e.get("postal")??"").trim(),country:String(e.get("country")??"").trim()},url:String(e.get("url")??"").trim(),note:String(e.get("note")??"").trim(),custom:m};return F?b.removePhoto=!0:q&&(b.photoBase64=q),b}async function _t(n){if(p===null)return;const e=Lt(n);c=!0,C(),u();try{if(L){const a=await x.createContact(p,e);L=!1,T=a.contact.uri,d=a.contact,_=a.contact.photoDataUri??(a.contact.hasPhoto?`${x.contactPhotoUrl(p,a.contact.uri)}?t=${Date.now()}`:null),q=null,F=!1,h("success","Contact created")}else if(T){const a=await x.updateContact(p,T,e);T=a.contact.uri,d=a.contact,_=a.contact.photoDataUri??(a.contact.hasPhoto?`${x.contactPhotoUrl(p,a.contact.uri)}?t=${Date.now()}`:null),q=null,F=!1,h("success","Contact saved")}try{await I()}catch(a){if(console.error(a),p!==null)try{await X(p)}catch{}}}catch(a){h("error",a instanceof Error?a.message:"Save failed")}finally{c=!1,u()}}async function Nt(n){const e=new FormData(n),a=String(e.get("displayname")??"").trim(),t=String(e.get("description")??"").trim();if(a){c=!0,C(),u();try{const o=await x.createAddressBook({displayname:a,description:t});p=o.addressbook.id,T=null,d=null,L=!1,M="",await I(),h("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){h("error",o instanceof Error?o.message:"Create failed")}finally{c=!1,u()}}}async function qt(n){if(p===null)return;const e=new FormData(n),a=String(e.get("displayname")??"").trim(),t=String(e.get("description")??"").trim();c=!0,C(),u();try{await x.updateAddressBook(p,{displayname:a,description:t}),await I(),h("success","Address book updated")}catch(o){h("error",o instanceof Error?o.message:"Update failed")}finally{c=!1,u()}}function Ft(n){const e=Kt[n];if(!e)return;const a=s.querySelector("#info-modal"),t=s.querySelector("#info-modal-title"),o=s.querySelector("#info-modal-body");if(!a||!t||!o)return;t.textContent=e.title,o.innerHTML=e.paragraphs.map(b=>`<p>${i(b)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const m=a.querySelector(".info-modal-close");m==null||m.focus()}function mt(){const n=s.querySelector("#info-modal");n&&(n.hidden=!0,document.body.classList.remove("info-modal-open"))}async function It(n){var a;if(v===null)return;const e=(a=n.files)==null?void 0:a[0];if(n.value="",!!e){c=!0,C(),U=null,u();try{const t=await e.text(),o=await x.importCalendar(v,t),m=K(o);U={ok:!0,message:m},h("success",`Import finished for “${e.name}”: ${m}.`)}catch(t){const o=t instanceof Error?t.message:"Import failed";U={ok:!1,message:o},h("error",o)}finally{c=!1,u()}}}ht()}const ft=document.getElementById("app");if(!ft)throw new Error("#app missing");Zt(ft);
