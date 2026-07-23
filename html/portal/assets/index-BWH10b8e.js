var je=Object.defineProperty;var He=(o,u,w)=>u in o?je(o,u,{enumerable:!0,configurable:!0,writable:!0,value:w}):o[u]=w;var se=(o,u,w)=>He(o,typeof u!="symbol"?u+"":u,w);(function(){const u=document.createElement("link").relList;if(u&&u.supports&&u.supports("modulepreload"))return;for(const N of document.querySelectorAll('link[rel="modulepreload"]'))S(N);new MutationObserver(N=>{for(const L of N)if(L.type==="childList")for(const U of L.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&S(U)}).observe(document,{childList:!0,subtree:!0});function w(N){const L={};return N.integrity&&(L.integrity=N.integrity),N.referrerPolicy&&(L.referrerPolicy=N.referrerPolicy),N.crossOrigin==="use-credentials"?L.credentials="include":N.crossOrigin==="anonymous"?L.credentials="omit":L.credentials="same-origin",L}function S(N){if(N.ep)return;N.ep=!0;const L=w(N);fetch(N.href,L)}})();class Rt extends Error{constructor(w,S){super(w);se(this,"status");this.status=S}}let Yt="";function Jt(o){Yt=o&&typeof o=="string"?o:""}async function O(o,u={}){const w=new Headers(u.headers);u.body&&!w.has("Content-Type")&&w.set("Content-Type","application/json");const S=(u.method||"GET").toUpperCase();S!=="GET"&&S!=="HEAD"&&S!=="OPTIONS"&&Yt&&w.set("X-CSRF-Token",Yt);const N=await fetch(`/api${o}`,{...u,headers:w,credentials:"same-origin"});let L=null;const U=await N.text();if(U)try{L=JSON.parse(U)}catch{L={error:U}}if(!N.ok){let k=`Request failed (${N.status})`;throw L&&typeof L=="object"&&L!==null&&"error"in L&&typeof L.error=="string"?k=L.error:(N.status===500||N.status===504)&&(k="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),new Rt(k,N.status)}return L}function pt(o){return encodeURIComponent(o)}const D={me:async()=>{var u;const o=await O("/me");return Jt(o.csrfToken||((u=o.user)==null?void 0:u.csrfToken)),o},login:async(o,u)=>{var S;const w=await O("/login",{method:"POST",body:JSON.stringify({username:o,password:u})});return Jt((S=w.user)==null?void 0:S.csrfToken),w},logout:async()=>{try{return await O("/logout",{method:"POST"})}finally{Jt("")}},calendars:()=>O("/calendars"),createCalendar:o=>O("/calendars",{method:"POST",body:JSON.stringify(o)}),holidayCountries:()=>O("/holidays/countries"),updateCalendar:(o,u)=>O(`/calendars/${o}`,{method:"PATCH",body:JSON.stringify(u)}),deleteCalendar:o=>O(`/calendars/${o}`,{method:"DELETE"}),calendarEvents:(o,u,w)=>{const S=new URLSearchParams({from:u,to:w}).toString();return O(`/calendars/${o}/events?${S}`)},exportCalendar:async o=>{const u=await fetch(`/api/calendars/${o}/export`,{credentials:"same-origin"});if(!u.ok){let U=`Export failed (${u.status})`;try{const k=await u.json();k.error&&(U=k.error)}catch{}throw new Rt(U,u.status)}const w=u.headers.get("Content-Disposition")||"",S=/filename="([^"]+)"/i.exec(w),N=(S==null?void 0:S[1])||`calendar-${o}.ics`;return{blob:await u.blob(),filename:N}},importCalendar:(o,u)=>O(`/calendars/${o}/import`,{method:"POST",body:JSON.stringify({ics:u})}),directory:()=>O("/directory"),shares:o=>O(`/calendars/${o}/shares`),share:(o,u,w)=>O(`/calendars/${o}/shares`,{method:"POST",body:JSON.stringify({username:u,access:w})}),revoke:(o,u)=>O(`/calendars/${o}/shares`,{method:"DELETE",body:JSON.stringify({href:u})}),addressbooks:()=>O("/addressbooks"),createAddressBook:o=>O("/addressbooks",{method:"POST",body:JSON.stringify(o)}),updateAddressBook:(o,u)=>O(`/addressbooks/${o}`,{method:"PATCH",body:JSON.stringify(u)}),deleteAddressBook:(o,u=!1)=>O(`/addressbooks/${o}`,{method:"DELETE",body:JSON.stringify({force:u})}),exportAddressBook:async o=>{const u=await fetch(`/api/addressbooks/${o}/export`,{credentials:"same-origin"});if(!u.ok){let U=`Export failed (${u.status})`;try{const k=await u.json();k.error&&(U=k.error)}catch{}throw new Rt(U,u.status)}const w=u.headers.get("Content-Disposition")||"",S=/filename="([^"]+)"/i.exec(w),N=(S==null?void 0:S[1])||`contacts-${o}.vcf`;return{blob:await u.blob(),filename:N}},importAddressBook:(o,u)=>O(`/addressbooks/${o}/import`,{method:"POST",body:JSON.stringify({vcf:u})}),contacts:(o,u="")=>{const w=u.trim()?`?q=${encodeURIComponent(u.trim())}`:"";return O(`/addressbooks/${o}/contacts${w}`)},getContact:(o,u)=>O(`/addressbooks/${o}/contacts/${pt(u)}`),createContact:(o,u)=>O(`/addressbooks/${o}/contacts`,{method:"POST",body:JSON.stringify(u)}),updateContact:(o,u,w)=>O(`/addressbooks/${o}/contacts/${pt(u)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteContact:(o,u)=>O(`/addressbooks/${o}/contacts/${pt(u)}`,{method:"DELETE"}),contactPhotoUrl:(o,u)=>`/api/addressbooks/${o}/contacts/${pt(u)}/photo`,tasks:(o={})=>{const u=new URLSearchParams;o.q&&u.set("q",o.q),o.sort&&u.set("sort",o.sort),o.order&&u.set("order",o.order);const w=u.toString()?`?${u}`:"";return O(`/tasks${w}`)},createTask:o=>O("/tasks",{method:"POST",body:JSON.stringify(o)}),updateTask:(o,u,w)=>O(`/tasks/${o}/${pt(u)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteTask:(o,u)=>O(`/tasks/${o}/${pt(u)}`,{method:"DELETE"}),bulkTasks:o=>O("/tasks/bulk",{method:"POST",body:JSON.stringify(o)}),notes:(o={})=>{const u=new URLSearchParams;o.q&&u.set("q",o.q),o.sort&&u.set("sort",o.sort),o.order&&u.set("order",o.order);const w=u.toString()?`?${u}`:"";return O(`/notes${w}`)},createNote:o=>O("/notes",{method:"POST",body:JSON.stringify(o)}),updateNote:(o,u,w)=>O(`/notes/${o}/${pt(u)}`,{method:"PATCH",body:JSON.stringify(w)}),deleteNote:(o,u)=>O(`/notes/${o}/${pt(u)}`,{method:"DELETE"})},Je="0.11.1-fork.3",We="https://github.com/offsyanka99/Baikal/tree/master/docs";function i(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Wt(o){return o==="readwrite"?'<span class="badge badge-admin">full access</span>':o==="read"?'<span class="badge">read-only</span>':o==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${i(o)}</span>`}function Ft(o){const u=[`${o.imported} new`,`${o.updated} updated`];return o.skipped>0&&u.push(`${o.skipped} skipped`),u.join(", ")}const Ye={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards."]}};function J(o,u,w="h2"){const S=w;return`<div class="section-title-row">
    <${S}>${i(o)}</${S}>
    <button type="button" class="info-btn" data-action="info" data-info="${i(u)}"
      aria-label="About ${i(o)}" title="About ${i(o)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Ke(){return`
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
    </div>`}function Ge(o){let u=null,w=null,S="calendars",N=[],L=[],U=[],k=null,ft=[],j=!1,Z=null,rt={y:new Date().getFullYear(),m:new Date().getMonth()},St=[],_t=!1,it=[],C=null,ct=[],$t="",F=null,v=null,V=!1,X=null,z=null,tt=!1,c=!1,et=null,bt=null,Kt=!1,st=null,H=[],Ct=[],ht=[],yt=[],Tt="",At="",dt="due",ot="asc",kt="dtstart",gt="desc",W=null,at=null,I=null,Y=null,P=!1,B=!1,R=[];function h(n,t){w={type:n,message:t}}function x(){w=null}async function le(){try{u=(await D.me()).user,await Q()}catch(n){n instanceof Rt&&n.status===401?u=null:h("error",n instanceof Error?n.message:"Failed to load")}m()}async function Q(){const[n,t,e]=await Promise.all([D.calendars(),D.directory().catch(()=>({users:[]})),D.addressbooks()]);if(N=n.calendars,L=t.users,it=e.addressbooks,U.length===0)try{U=(await D.holidayCountries()).countries}catch{U=[]}if(k!==null&&!N.some(s=>s.id===k)&&(k=null,ft=[],j=!1,Z=null),k===null){const s=Gt();s&&(k=s.id)}k!==null&&j?await Et(k):k!==null&&(ft=[]),S==="calendars"&&await lt(),C!==null&&!it.some(s=>s.id===C)&&(C=null,ct=[],F=null,v=null,V=!1),C===null&&it.length>0&&(C=it[0].id),C!==null&&S==="contacts"&&await Nt(C)}async function Et(n){ft=(await D.shares(n)).shares}function Gt(){const n=N.filter(e=>e.canShare);if(n.length===0)return null;const t=e=>{const s=e.uri.toLowerCase(),d=e.displayname.toLowerCase();return s==="default"||d==="default"||d==="default calendar"};return n.find(t)??n[0]??null}function Dt(n){const t=n.getFullYear(),e=String(n.getMonth()+1).padStart(2,"0"),s=String(n.getDate()).padStart(2,"0");return`${t}-${e}-${s}`}function re(n,t){const e=new Date(n,t,1),s=new Date(n,t+1,0);return{from:Dt(e),to:Dt(s)}}function ie(n){if(n.allDay||/^\d{4}-\d{2}-\d{2}$/.test(n.start))return n.start.slice(0,10);const t=new Date(n.start);return Number.isNaN(t.getTime())?n.start.slice(0,10):Dt(t)}async function lt(){if(k===null){St=[];return}const{from:n,to:t}=re(rt.y,rt.m);_t=!0;try{St=(await D.calendarEvents(k,n,t)).events}catch{St=[]}finally{_t=!1}}function ce(n,t){return new Date(n,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function de(){const n=k!==null?N.find(A=>A.id===k):null,t=(n==null?void 0:n.displayname)??"Calendar",e=n!=null&&n.color?n.color.length>=7?n.color.slice(0,7):n.color:"#3B82F6",s=rt.y,d=rt.m,r=(new Date(s,d,1).getDay()+6)%7,l=new Date(s,d+1,0).getDate(),f=new Date(s,d,0).getDate(),E=Dt(new Date),T=new Map;for(const A of St){const y=ie(A),M=T.get(y)??[];M.push(A),T.set(y,M)}const $=[],K=Math.ceil((r+l)/7)*7;for(let A=0;A<K;A++){let y,M=!0,G;A<r?(y=f-r+A+1,M=!1,G=new Date(s,d-1,y)):A>=r+l?(y=A-(r+l)+1,M=!1,G=new Date(s,d+1,y)):(y=A-r+1,G=new Date(s,d,y));const nt=Dt(G),wt=nt===E,It=M?T.get(nt)??[]:[],Pt=It.slice(0,3),qt=It.length-Pt.length,Mt=Pt.map(Ut=>`<span class="month-event" title="${i(Ut.summary)}" style="--ev-color:${i(e)}">${i(Ut.summary)}</span>`).join(""),Vt=qt>0?`<span class="month-event-more">+${qt} more</span>`:"",jt=!M&&(y===1||A===r+l)?G.toLocaleString(void 0,{month:"short",day:"numeric"}):String(y);$.push(`<div class="month-cell${M?"":" is-outside"}${wt?" is-today":""}">
        <div class="month-daynum${wt?" is-today-num":""}">${i(jt)}</div>
        <div class="month-events">${Mt}${Vt}</div>
      </div>`)}const g=n?_t?'<p class="muted small month-empty-hint">Loading events…</p>':"":'<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${c?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${c?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${c?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${i(ce(s,d))}</h2>
        <span class="month-cal-name muted small" title="${i(t)}">
          <span class="cal-swatch" style="background:${i(e)};margin-top:0"></span>
          ${i(t)}
        </span>
      </div>
      ${g}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          <div class="month-dow">Mon</div><div class="month-dow">Tue</div><div class="month-dow">Wed</div>
          <div class="month-dow">Thu</div><div class="month-dow">Fri</div><div class="month-dow">Sat</div>
          <div class="month-dow">Sun</div>
        </div>
        <div class="month-grid" role="rowgroup">
          ${$.join("")}
        </div>
      </div>
    </section>`}async function Nt(n){ct=(await D.contacts(n,$t)).contacts,F!==null&&!ct.some(e=>e.uri===F)&&(F=null,V||(v=null,X=null,z=null,tt=!1))}async function vt(){const n=await D.tasks({q:Tt,sort:dt,order:ot});H=n.tasks,ht=n.calendars;const t=new Set(H.map(e=>q(e.instanceId,e.uri)));R=R.filter(e=>t.has(e)),W!==null&&!H.some(e=>`${e.instanceId}|${e.uri}`===W)&&(W=null,P||(I=null))}async function xt(){const n=await D.notes({q:At,sort:kt,order:gt});Ct=n.notes,yt=n.calendars,at!==null&&!Ct.some(t=>`${t.instanceId}|${t.uri}`===at)&&(at=null,B||(Y=null))}function q(n,t){return`${n}|${t}`}function Xt(n){if(!n)return"—";try{const t=new Date(n);return Number.isNaN(t.getTime())?n:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return n}}function zt(n){if(!n)return"";try{const t=new Date(n);if(Number.isNaN(t.getTime()))return"";const e=s=>String(s).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}catch{return""}}function ut(n,t,e,s,d,a=""){const r=e===t,l=r?s==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${r?" is-sorted":""}${a?" "+a:""}`}" data-action="sort-${d}" data-sort="${i(t)}" role="columnheader" tabindex="0">${i(n)}${l}</th>`}async function ue(n){if(C===null)return;const t=await D.getContact(C,n);F=n,V=!1;const e=t.contact;v={...e,emails:Array.isArray(e.emails)?e.emails:[],phones:Array.isArray(e.phones)?e.phones:[],custom:Array.isArray(e.custom)?e.custom:[],address:e.address??Qt()},X=e.photoDataUri??(e.hasPhoto&&C!==null?`${D.contactPhotoUrl(C,n)}?t=${Date.now()}`:null),z=null,tt=!1}function me(){V=!0,F=null,v={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},X=null,z=null,tt=!1}function Qt(){return{street:"",city:"",region:"",postal:"",country:""}}function pe(n){return new Promise((t,e)=>{const s=new FileReader;s.onload=()=>{const d=String(s.result??""),a=d.indexOf(",");t(a>=0?d.slice(a+1):d)},s.onerror=()=>e(new Error("Failed to read photo file")),s.readAsDataURL(n)})}function Zt(n,t={}){const e=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,s=u?`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
          <div class="topnav-right">
            <span class="muted">${i(u.displayname||u.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
        </nav>`,a=!(j||Z!==null)?Bt():"",r=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${i(Je)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${i(We)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return document.body.className=t.auth?"layout-auth":"",`${s}
      <main class="container">
        ${a}
        ${n}
      </main>
      ${r}
      ${Ke()}`}function Bt(){return w?`<div class="flash flash-${i(w.type)}" role="status">
      <span class="flash-text">${i(w.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function te(){o.innerHTML=Zt(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function fe(){if(!u){te();return}const n=N.filter(b=>b.canShare),t=N.filter(b=>!b.canShare),e=N.find(b=>b.id===k)??null,s=n.map(b=>{const _=b.id===k?" is-selected":"",mt=b.color?`<span class="cal-swatch" style="background:${i(b.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ht=Wt(b.access)+(b.readOnly?'<span class="badge">read-only</span>':"")+(b.holidaysCountry?`<span class="badge badge-admin">holidays ${i(b.holidaysCountry)}</span>`:"");return`<div class="cal-row${_}" data-action="select-cal" data-id="${b.id}" role="button" tabindex="0">
          ${mt}
          <span class="cal-row-text">
            <span class="cal-row-title">${i(b.displayname)}</span>
            <span class="cal-row-badges">${Ht}</span>
            <span class="muted small mono cal-row-uri">${i(b.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${b.id}" ${c?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${b.id}" ${c?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),d=t.map(b=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(b.displayname)}</span>
            <span class="cal-row-badges">${Wt(b.access)}</span>
            <span class="muted small">Shared with you · ${i(b.access)}</span>
          </span>
        </div>`).join(""),a=L.map(b=>`<option value="${i(b.username)}">${i(b.displayname)} (${i(b.username)})</option>`).join(""),r=ft.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':ft.map(b=>`<tr>
                <td>
                  <strong>${i(b.displayname||b.username||b.href)}</strong>
                  <div class="muted small mono">${i(b.username||b.href)}</div>
                </td>
                <td>${Wt(b.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${i(b.href)}" ${c?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),l=e!=null&&e.color&&e.color.length>=7?e.color.slice(0,7):"#3B82F6",f=!!(e&&e.readOnly),p=j&&e&&e.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Bt()}
                <section>
                  ${J("Calendar details","calendar-details")}
                  <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                    <label>
                      Display name
                      <input type="text" name="displayname" required maxlength="200"
                        value="${i(e.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${i(l)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${i(e.color||l)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${i(e.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${i(e.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${J("Import / export","import-export")}
                    ${e.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                    <div class="form-actions-row" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-cal" ${c?"disabled":""}>Export .ics</button>
                      <label class="btn btn-ghost file-btn" ${c||e.readOnly?"aria-disabled=true":""}>
                        Import .ics
                        <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${c||e.readOnly?"disabled":""} hidden />
                      </label>
                    </div>
                    ${et?`<div class="flash flash-${et.ok?"success":"error"} import-result" role="status">
                            <strong>Import result:</strong> ${i(et.message)}
                          </div>`:""}
                  </div>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${J(`Share “${e.displayname}”`,"share")}
                  ${f?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${L.length===0?"disabled":""}>
                        <option value="">${L.length?"Select user…":"No other users"}</option>
                        ${a}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${f?"disabled":""}>
                        <option value="read" selected>Read only</option>
                        ${f?"":'<option value="readwrite">Full access</option>'}
                      </select>
                      ${f?'<input type="hidden" name="access" value="read" />':""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${c||L.length===0?"disabled":""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${r}</tbody>
                    </table>
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",E=Z!==null?N.find(b=>b.id===Z&&b.canShare)??null:null,T=E?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Bt()}
              <p>You are about to permanently delete <strong>${i(E.displayname)}</strong>
                <span class="muted small mono">(${i(E.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${c?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${E.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",$=`
      <div class="portal-grid portal-grid-calendars">
        <section class="card">
          ${J("Owned","owned")}
          <div class="cal-list" style="margin-top:0.75rem">
            ${s||'<p class="muted">No calendars yet. Add one below.</p>'}
          </div>

          <div style="margin-top:1.35rem">
            ${J("Add calendar","add-calendar")}
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
                ${U.map(b=>`<option value="${i(b.code)}">${i(b.name)} (${i(b.code)})</option>`).join("")}
              </select>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="readOnly" />
              Read-only (for everyone)
            </label>
            <button type="submit" class="btn btn-primary" ${c?"disabled":""}>Create calendar</button>
          </form>

          ${t.length?`<div style="margin-top:1.25rem">
                   ${J("Shared with me","shared-with-me")}
                   <div class="cal-list" style="margin-top:0.75rem">${d}</div>
                 </div>`:""}
        </section>
        ${de()}
      </div>
      ${p}
      ${T}`,K=it.map(b=>`<button type="button" class="cal-row${b.id===C?" is-selected":""}" data-action="select-ab" data-id="${b.id}">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${i(b.displayname)}</span>
            <span class="muted small">${b.cardCount} contact${b.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${i(b.uri)}</span>
          </span>
        </button>`).join(""),g=it.find(b=>b.id===C)??null,A=ct.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${$t?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:ct.map(b=>{const _=!V&&b.uri===F?" is-selected":"",mt=i((b.displayname||"?").slice(0,1).toUpperCase()),Ht=b.hasPhoto&&C!==null?`<img class="contact-avatar" src="${i(D.contactPhotoUrl(C,b.uri))}" alt="" loading="lazy" data-avatar-fallback="${mt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${mt}</span>`;return`<tr class="contact-table-row${_}" data-action="select-contact" data-uri="${i(b.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ht}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${i(b.displayname)}</span>
                      ${b.org?`<span class="muted small contact-name-secondary">${i(b.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${i(b.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${i(b.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${i(b.org||"—")}</span></td>
              </tr>`}).join(""),y=v,M=Array.isArray(y==null?void 0:y.emails)&&y.emails.length>0?y.emails:[""],G=Array.isArray(y==null?void 0:y.phones)&&y.phones.length>0?y.phones:[{type:"cell",value:""}],nt=(y==null?void 0:y.address)??Qt(),wt=M.map((b,_)=>`<div class="multi-row" data-multi="email" data-idx="${_}">
          <input type="email" name="email_${_}" value="${i(b??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${_}" ${M.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),It=G.map((b,_)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${_}">
          <select name="phone_type_${_}" aria-label="Phone type">
            ${["cell","work","home","other"].map(mt=>`<option value="${mt}" ${((b==null?void 0:b.type)??"other")===mt?"selected":""}>${mt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${_}" value="${i((b==null?void 0:b.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${_}" ${G.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Lt=Array.isArray(y==null?void 0:y.custom)?y.custom:[],Pt=Lt.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':Lt.map((b,_)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${_}">
                <input type="text" name="custom_label_${_}" value="${i(b.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${_}" value="${i(b.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${_}" title="Remove">×</button>
              </div>`).join(""),qt=y&&g?`<div class="card">
            ${J(V?"New contact":"Edit contact","contacts")}
            <form class="stack" data-form="contact" style="margin-top:1rem">
              <div class="contact-photo-row">
                <div class="contact-photo-preview">
                  ${X?`<img src="${i(X)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${i((y.fullname||y.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                </div>
                <div class="stack stack-tight" style="flex:1">
                  <label class="btn btn-ghost file-btn" ${c?"aria-disabled=true":""}>
                    ${X?"Change photo":"Upload photo"}
                    <input type="file" accept="image/*" data-action="contact-photo" ${c?"disabled":""} hidden />
                  </label>
                  ${X||y.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${c?"disabled":""}>Remove photo</button>`:""}
                  <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                </div>
              </div>
              <div class="form-grid form-grid-2">
                <label>First name
                  <input type="text" name="firstname" value="${i(y.firstname)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Last name
                  <input type="text" name="lastname" value="${i(y.lastname)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <label>Full name
                <input type="text" name="fullname" value="${i(y.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
              </label>
              <div class="form-grid form-grid-2">
                <label>Organization
                  <input type="text" name="org" value="${i(y.org)}" maxlength="200" autocomplete="off" />
                </label>
                <label>Title
                  <input type="text" name="title" value="${i(y.title)}" maxlength="200" autocomplete="off" />
                </label>
              </div>
              <div class="form-grid form-grid-2 contact-email-phone">
                <fieldset class="fieldset">
                  <legend>Emails</legend>
                  ${wt}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${M.length>=10?"disabled":""}>+ Email</button>
                </fieldset>
                <fieldset class="fieldset">
                  <legend>Phones</legend>
                  ${It}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${G.length>=10?"disabled":""}>+ Phone</button>
                </fieldset>
              </div>
              <fieldset class="fieldset fieldset-address">
                <legend>Address</legend>
                <label>Street
                  <input type="text" name="street" value="${i(nt.street)}" maxlength="300" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>City
                    <input type="text" name="city" value="${i(nt.city)}" maxlength="120" autocomplete="off" />
                  </label>
                  <label>Region
                    <input type="text" name="region" value="${i(nt.region)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2">
                  <label>Postal code
                    <input type="text" name="postal" value="${i(nt.postal)}" maxlength="40" autocomplete="off" />
                  </label>
                  <label>Country
                    <input type="text" name="country" value="${i(nt.country)}" maxlength="120" autocomplete="off" />
                  </label>
                </div>
              </fieldset>
              <label>Website
                <input type="url" name="url" value="${i(y.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
              </label>
              <fieldset class="fieldset fieldset-custom">
                <legend>Custom fields</legend>
                ${Pt}
                <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${Lt.length>=30?"disabled":""}>+ Custom field</button>
              </fieldset>
              <label>Notes
                <textarea name="note" rows="3" maxlength="4000">${i(y.note)}</textarea>
              </label>
              <div class="form-actions-row">
                <button type="submit" class="btn btn-primary" ${c?"disabled":""}>${V?"Create contact":"Save contact"}</button>
                ${V?`<button type="button" class="btn btn-ghost" data-action="cancel-contact" ${c?"disabled":""}>Cancel</button>`:`<button type="button" class="btn btn-danger" data-action="delete-contact" ${c?"disabled":""}>Delete</button>`}
                ${!V&&y.uri?`<span class="muted small mono">${i(y.uri)}</span>`:""}
              </div>
            </form>
          </div>`:g?'<div class="card"><p class="muted">Select a contact or click <strong>Add contact</strong>.</p></div>':'<div class="card"><p class="muted">Select or create an address book first.</p></div>',Mt=g?`<section class="card ab-manage">
          ${J(g.displayname,"address-books")}
          <p class="muted small mono" style="margin:0.25rem 0 0.65rem">${i(g.uri)} · ${g.cardCount} contact${g.cardCount===1?"":"s"}</p>
          <form class="stack stack-tight" data-form="edit-ab">
            <label>Display name
              <input type="text" name="displayname" required maxlength="200" value="${i(g.displayname)}" />
            </label>
            <label>Description
              <textarea name="description" rows="2" maxlength="2000">${i(g.description)}</textarea>
            </label>
            <div class="form-actions-row form-actions-wrap">
              <button type="submit" class="btn btn-primary btn-small" ${c?"disabled":""}>Save</button>
              <button type="button" class="btn btn-danger btn-small" data-action="delete-ab" ${c?"disabled":""}>Delete</button>
            </div>
          </form>
          <div class="section-divider" style="margin:1rem 0"></div>
          <div class="import-export">
            ${J("Import / export","contact-import-export")}
            <div class="form-actions-row form-actions-wrap" style="margin-top:0.55rem">
              <button type="button" class="btn btn-small" data-action="export-ab" ${c?"disabled":""}>Export .vcf</button>
              <label class="btn btn-ghost btn-small file-btn" ${c?"aria-disabled=true":""}>
                Import .vcf
                <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${c?"disabled":""} hidden />
              </label>
            </div>
            ${bt?`<div class="flash flash-${bt.ok?"success":"error"} import-result" role="status">
                    <strong>Import:</strong> ${i(bt.message)}
                  </div>`:""}
          </div>
        </section>`:"",Vt=`
      <div class="portal-grid portal-grid-contacts">
        <div class="contacts-sidebar stack">
          <section class="card">
            ${J("Address books","address-books")}
            <div class="cal-list" style="margin-top:0.75rem">
              ${K||'<p class="muted">No address books yet. Create one below.</p>'}
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
          ${Mt}
        </div>
        <section class="stack">
          ${g?`<div class="card contacts-main-card">
                  ${J("Contacts","contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${i($t)}" aria-label="Search contacts" ${c?"disabled":""} />
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
                        ${A}
                      </tbody>
                    </table>
                  </div>
                </div>`:'<div class="card"><p class="muted">Select an address book to manage contacts.</p></div>'}
          ${qt}
        </section>
      </div>`,jt=S==="calendars"?"my-calendars":S==="contacts"?"my-contacts":S==="tasks"?"tasks":"notes",Ut=ge(),Me=ve(),Ve=S==="calendars"?$:S==="contacts"?Vt:S==="tasks"?Ut:Me;o.innerHTML=Zt(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${S==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${S==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${S==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${S==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${S==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${S==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${S==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${S==="notes"}">
            Notes
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${jt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${Ve}
    `),document.body.classList.toggle("cal-modal-open",j||Z!==null)}function be(n){const t=new Map;for(const p of n)p.uid&&t.set(p.uid,p);const e=new Map(n.map((p,E)=>[q(p.instanceId,p.uri),E])),s=new Map,d=[];for(const p of n){const E=p.parentUid;if(E&&t.has(E)&&E!==p.uid){const T=s.get(E)??[];T.push(p),s.set(E,T)}else d.push(p)}const a=(p,E)=>(e.get(q(p.instanceId,p.uri))??0)-(e.get(q(E.instanceId,E.uri))??0);d.sort(a);for(const[,p]of s)p.sort(a);const r=[],l=new Set,f=(p,E)=>{const T=p.uid||q(p.instanceId,p.uri);if(!l.has(T)){l.add(T),r.push({task:p,depth:Math.min(E,8)});for(const $ of s.get(p.uid)??[])f($,E+1);l.delete(T)}};for(const p of d)f(p,0);for(const p of n)r.some(E=>E.task===p)||r.push({task:p,depth:0});return r}function he(n){const t=new Set([n]);if(!n)return t;let e=!0;for(;e;){e=!1;for(const s of H)s.parentUid&&t.has(s.parentUid)&&s.uid&&!t.has(s.uid)&&(t.add(s.uid),e=!0)}return t}function ye(n,t){const e=n.instanceId,s=t||!n.uid?new Set:he(n.uid),d=H.filter(l=>l.uid&&l.instanceId===e&&!s.has(l.uid)&&l.uid!==n.uid),a=n.parentUid||"",r=['<option value="">None (top-level)</option>',...d.map(l=>`<option value="${i(l.uid)}" ${l.uid===a?"selected":""}>${i(l.summary||l.uid)}</option>`)];if(a&&!d.some(l=>l.uid===a)){const l=H.find(f=>f.uid===a);r.push(`<option value="${i(a)}" selected>${i((l==null?void 0:l.summary)||a)} (current)</option>`)}return r.join("")}function ee(){const n=new Set(R);return H.filter(t=>n.has(q(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function ge(){const n=$=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[$]||$,t=be(H),e=H.filter($=>$.canWrite&&!$.readOnly).map($=>q($.instanceId,$.uri)),s=e.length>0&&e.every($=>R.includes($)),d=R.length>0,r=ee().length,l=H.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${Tt?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:$,depth:K})=>{const g=q($.instanceId,$.uri),A=!P&&g===W?" is-selected":"",y=R.includes(g),M=$.status==="COMPLETED"?"badge-ok":$.status==="CANCELLED"?"":"badge-admin",G=K>0?` style="--task-depth:${K}"`:"",nt=K>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",wt=$.canWrite&&!$.readOnly;return`<tr class="contact-table-row task-row${K>0?" is-subtask":""}${A}${y?" is-checked":""}" data-action="select-task" data-instance="${$.instanceId}" data-uri="${i($.uri)}" tabindex="0" role="button"${G}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${$.instanceId}" data-uri="${i($.uri)}"
                    ${y?"checked":""} ${wt?"":"disabled"} aria-label="Select ${i($.summary||$.uri)}" ${c?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${nt}<span class="contact-name-primary">${i($.summary||$.uri)}</span></span>
                  ${$.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${M}">${i(n($.status))}</span></td>
                <td class="col-task-due muted small">${i(Xt($.due))}</td>
                <td class="col-task-cal muted small">${i($.calendarName)}</td>
                <td class="col-task-pct muted small">${$.percent?i(String($.percent))+"%":"—"}</td>
              </tr>`}).join(""),f=d?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-count">
              <strong>${r}</strong><span class="bulk-bar-count-label">selected</span>${R.length!==r?`<span class="muted small bulk-bar-count-extra">(${R.length-r} read-only skipped)</span>`:""}
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Status
                <select id="bulk-task-status" ${c||r===0?"disabled":""}>
                  <option value="">—</option>
                  <option value="NEEDS-ACTION">To do</option>
                  <option value="IN-PROCESS">In progress</option>
                  <option value="COMPLETED">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-status" ${c||r===0?"disabled":""}>Apply status</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field">Due
                <input type="datetime-local" id="bulk-task-due" ${c||r===0?"disabled":""} />
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-due" ${c||r===0?"disabled":""}>Apply due</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${c||r===0?"disabled":""} title="Clear due date">Clear due</button>
            </div>
            <div class="bulk-group">
              <label class="bulk-field bulk-field-pct">%
                <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${c||r===0?"disabled":""} />
              </label>
              <button type="button" class="btn btn-small" data-action="bulk-task-percent" ${c||r===0?"disabled":""}>Apply %</button>
            </div>
            <div class="bulk-group bulk-group-end">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${c||r===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${c?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",p=I,E=ht.map($=>`<option value="${$.id}" ${p&&p.instanceId===$.id?"selected":""}>${i($.displayname)}</option>`).join(""),T=p?`<div class="card">
            ${J(P?p.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${P?`<label>Calendar
                      <select name="instanceId" required ${ht.length===0?"disabled":""}>
                        <option value="">${ht.length?"Select calendar…":"No writable calendars"}</option>
                        ${E}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(p.calendarName)}</strong>${p.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(p.summary)}" ${p.readOnly&&!P?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${p.readOnly&&!P?"readonly":""}>${i(p.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${p.readOnly&&!P?"disabled":""}>
                  ${ye(p,P)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${p.readOnly&&!P?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map($=>`<option value="${$}" ${p.status===$?"selected":""}>${i(n($))}</option>`).join("")}
                  </select>
                </label>
                <label>Due
                  <input type="datetime-local" name="due" value="${i(zt(p.due))}" ${p.readOnly&&!P?"readonly":""} />
                </label>
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${i(String(p.priority||0))}" ${p.readOnly&&!P?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${i(String(p.percent||0))}" ${p.readOnly&&!P?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${P||p.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${P?"Create task":"Save task"}</button>`:""}
                ${!P&&p.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${c?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${c?"disabled":""}>Delete</button>`:P?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${J("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${i(Tt)}" aria-label="Search tasks" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${c||ht.length===0?"disabled":""}>Add task</button>
        </div>
        ${f}
        ${ht.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${s?"checked":""} ${e.length===0||c?"disabled":""} />
                </th>
                ${ut("Title","summary",dt,ot,"task","col-task-title")}
                ${ut("Status","status",dt,ot,"task","col-task-status")}
                ${ut("Due","due",dt,ot,"task","col-task-due")}
                ${ut("Calendar","calendar",dt,ot,"task","col-task-cal")}
                ${ut("%","percent",dt,ot,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function ve(){const n=Ct.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${At?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Ct.map(d=>{const a=q(d.instanceId,d.uri),r=!B&&a===at?" is-selected":"",l=(d.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${r}" data-action="select-note" data-instance="${d.instanceId}" data-uri="${i(d.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${i(d.summary||d.uri)}</span>
                  ${l?`<span class="muted small contact-name-secondary">${i(l)}${d.description.length>80?"…":""}</span>`:""}
                  ${d.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${i(Xt(d.dtstart))}</td>
                <td class="col-note-cal muted small">${i(d.calendarName)}</td>
              </tr>`}).join(""),t=Y,e=yt.map(d=>`<option value="${d.id}" ${t&&t.instanceId===d.id?"selected":""}>${i(d.displayname)}</option>`).join(""),s=t?`<div class="card">
            ${J(B?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${B?`<label>Calendar
                      <select name="instanceId" required ${yt.length===0?"disabled":""}>
                        <option value="">${yt.length?"Select calendar…":"No writable calendars"}</option>
                        ${e}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${i(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${i(t.summary)}" ${t.readOnly&&!B?"readonly":""} />
              </label>
              <label>Date
                <input type="datetime-local" name="dtstart" value="${i(zt(t.dtstart))}" ${t.readOnly&&!B?"readonly":""} />
              </label>
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!B?"readonly":""}>${i(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${B||t.canWrite?`<button type="submit" class="btn btn-primary" ${c?"disabled":""}>${B?"Create note":"Save note"}</button>`:""}
                ${!B&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${c?"disabled":""}>Delete</button>`:B?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${J("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${i(At)}" aria-label="Search notes" ${c?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${c||yt.length===0?"disabled":""}>Add note</button>
        </div>
        ${yt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${ut("Title","summary",kt,gt,"note","col-note-title")}
                ${ut("Date","dtstart",kt,gt,"note","col-note-date")}
                ${ut("Calendar","calendar",kt,gt,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${n}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${s}
      </section>
    </div>`}function $e(){const n=o.querySelector(".contacts-table-wrap"),t=o.querySelector(".contacts-sidebar");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(n==null?void 0:n.scrollTop)??null,sidebarTop:(t==null?void 0:t.scrollTop)??null}}function ke(n){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(n.windowX,n.windowY),n.tableTop!==null){const t=o.querySelector(".contacts-table-wrap");t&&(t.scrollTop=n.tableTop)}if(n.sidebarTop!==null){const t=o.querySelector(".contacts-sidebar");t&&(t.scrollTop=n.sidebarTop)}})})}function m(){const n=$e();u?fe():te(),we(),ke(n)}function ae(n){const t=n.querySelector('input[name="color_picker"]'),e=n.querySelector('input[name="color"]');!t||!e||(t.addEventListener("input",()=>{e.value=t.value.toUpperCase()}),e.addEventListener("change",()=>{let s=e.value.trim();s&&!s.startsWith("#")&&(s=`#${s}`),/^#[0-9A-Fa-f]{6}/.test(s)&&(t.value=s.slice(0,7),e.value=s.toUpperCase())}))}function we(){o.querySelectorAll("[data-action]").forEach(g=>{g.addEventListener("click",A=>{const y=A.target.closest("[data-action]");((y==null?void 0:y.dataset.action)==="info"||(y==null?void 0:y.dataset.action)==="info-close")&&(A.preventDefault(),A.stopPropagation()),Ie(A)})}),o.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action]").forEach(g=>{g.addEventListener("keydown",A=>{(A.key==="Enter"||A.key===" ")&&(A.preventDefault(),g.click())})});const n=o.querySelector("#delete-cal-confirm"),t=o.querySelector("#delete-cal-submit");n==null||n.addEventListener("change",()=>{t&&(t.disabled=!n.checked||c)}),o.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(g=>{g.addEventListener("error",()=>{const A=g.dataset.avatarFallback||"?",y=document.createElement("span");y.className="contact-avatar contact-avatar-fallback",y.setAttribute("aria-hidden","true"),y.textContent=A,g.replaceWith(y)})}),Kt||(document.addEventListener("keydown",g=>{g.key==="Escape"&&ne()}),Kt=!0);const e=o.querySelector('[data-form="login"]');e==null||e.addEventListener("submit",g=>{g.preventDefault(),xe(e)});const s=o.querySelector('[data-form="share"]');s==null||s.addEventListener("submit",g=>{g.preventDefault(),Te(s)});const d=o.querySelector('[data-form="edit-cal"]');d&&(ae(d),d.addEventListener("submit",g=>{g.preventDefault(),Ae(d)}));const a=o.querySelector('[data-form="create-cal"]');a&&(ae(a),a.addEventListener("submit",g=>{g.preventDefault(),Oe(a)}));const r=o.querySelector('[data-form="create-ab"]');r==null||r.addEventListener("submit",g=>{g.preventDefault(),Fe(r)});const l=o.querySelector('[data-form="edit-ab"]');l==null||l.addEventListener("submit",g=>{g.preventDefault(),Re(l)});const f=o.querySelector('[data-form="contact"]');f==null||f.addEventListener("submit",g=>{g.preventDefault(),Ue(f)});const p=o.querySelector('[data-form="task"]');if(p==null||p.addEventListener("submit",g=>{g.preventDefault(),Ce(p)}),p){const g=p.querySelector('select[name="instanceId"]');g==null||g.addEventListener("change",()=>{if(!P||!I)return;const A=Number(g.value);if(!Number.isFinite(A)||A<=0)return;const y=new FormData(p),M=String(y.get("due")??"").trim();I={...I,instanceId:A,parentUid:I.parentUid&&H.some(G=>G.uid===I.parentUid&&G.instanceId===A)?I.parentUid:null,summary:String(y.get("summary")??""),description:String(y.get("description")??""),status:String(y.get("status")??"NEEDS-ACTION"),due:M?new Date(M).toISOString():null,priority:Number(y.get("priority")??0),percent:Number(y.get("percent")??0)},m()})}const E=o.querySelector('[data-form="note"]');E==null||E.addEventListener("submit",g=>{g.preventDefault(),Ee(E)});const T=o.querySelector('input[data-action="contact-search"]');T==null||T.addEventListener("input",()=>{st&&clearTimeout(st),st=setTimeout(()=>{$t=T.value,C!==null&&(async()=>{try{await Nt(C),m()}catch(g){h("error",g instanceof Error?g.message:"Search failed"),m()}})()},250)});const $=o.querySelector('input[data-action="task-search"]');$==null||$.addEventListener("input",()=>{st&&clearTimeout(st),st=setTimeout(()=>{Tt=$.value,(async()=>{try{await vt(),m()}catch(g){h("error",g instanceof Error?g.message:"Search failed"),m()}})()},250)});const K=o.querySelector('input[data-action="note-search"]');K==null||K.addEventListener("input",()=>{st&&clearTimeout(st),st=setTimeout(()=>{At=K.value,(async()=>{try{await xt(),m()}catch(g){h("error",g instanceof Error?g.message:"Search failed"),m()}})()},250)}),Le(),Ne(),De()}async function Se(n){var d,a,r;const t=ee();if(t.length===0){h("error","No writable tasks selected"),m();return}const e=t.map(l=>({instanceId:l.instanceId,uri:l.uri}));if(n==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;c=!0,x(),m();try{const l=await D.bulkTasks({op:"delete",items:e});R=[],W&&t.some(f=>q(f.instanceId,f.uri)===W)&&(W=null,I=null,P=!1),await vt(),l.failed>0?h("error",`Deleted ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):h("success",`Deleted ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){h("error",l instanceof Error?l.message:"Bulk delete failed")}finally{c=!1,m()}return}let s={};if(n==="bulk-task-status"){const l=o.querySelector("#bulk-task-status"),f=((d=l==null?void 0:l.value)==null?void 0:d.trim())??"";if(!f){h("error","Choose a status to apply"),m();return}s={status:f}}else if(n==="bulk-task-due"){const l=o.querySelector("#bulk-task-due"),f=((a=l==null?void 0:l.value)==null?void 0:a.trim())??"";if(!f){h("error","Choose a due date to apply"),m();return}s={due:new Date(f).toISOString()}}else if(n==="bulk-task-clear-due")s={due:null};else if(n==="bulk-task-percent"){const l=o.querySelector("#bulk-task-percent"),f=((r=l==null?void 0:l.value)==null?void 0:r.trim())??"";if(f===""){h("error","Enter a percent complete (0–100)"),m();return}const p=Number(f);if(!Number.isFinite(p)||p<0||p>100){h("error","Percent must be between 0 and 100"),m();return}s={percent:Math.round(p)}}c=!0,x(),m();try{const l=await D.bulkTasks({op:"update",items:e,fields:s});if(await vt(),I&&!P){const p=q(I.instanceId,I.uri),E=H.find(T=>q(T.instanceId,T.uri)===p);E&&(I={...E})}const f=n==="bulk-task-status"?"status":n==="bulk-task-due"||n==="bulk-task-clear-due"?"due date":"percent";l.failed>0?h("error",`Updated ${f} on ${l.ok}, failed ${l.failed}${l.errors[0]?`: ${l.errors[0]}`:""}`):h("success",`Updated ${f} on ${l.ok} task${l.ok===1?"":"s"}`)}catch(l){h("error",l instanceof Error?l.message:"Bulk update failed")}finally{c=!1,m()}}async function Ce(n){const t=new FormData(n),e=String(t.get("summary")??"").trim(),s=String(t.get("description")??"").trim(),d=String(t.get("status")??"NEEDS-ACTION"),a=String(t.get("due")??"").trim(),r=a?new Date(a).toISOString():null,l=Number(t.get("priority")??0),f=Number(t.get("percent")??0),p=String(t.get("parentUid")??"").trim(),E=p===""?null:p;c=!0,x(),m();try{if(P){const T=Number(t.get("instanceId"));if(!Number.isFinite(T)||T<=0)throw new Error("Select a calendar");const $=await D.createTask({instanceId:T,summary:e,description:s,status:d,due:r,priority:l,percent:f,parentUid:E});P=!1,W=q($.task.instanceId,$.task.uri),I=$.task,h("success",E?"Subtask created":"Task created")}else if(I){const T=await D.updateTask(I.instanceId,I.uri,{summary:e,description:s,status:d,due:r,priority:l,percent:f,parentUid:E});I=T.task,W=q(T.task.instanceId,T.task.uri),h("success","Task saved")}await vt()}catch(T){h("error",T instanceof Error?T.message:"Save failed")}finally{c=!1,m()}}async function Ee(n){const t=new FormData(n),e=String(t.get("summary")??"").trim(),s=String(t.get("description")??"").trim(),d=String(t.get("dtstart")??"").trim(),a=d?new Date(d).toISOString():null;c=!0,x(),m();try{if(B){const r=Number(t.get("instanceId"));if(!Number.isFinite(r)||r<=0)throw new Error("Select a calendar");const l=await D.createNote({instanceId:r,summary:e,description:s,dtstart:a});B=!1,at=q(l.note.instanceId,l.note.uri),Y=l.note,h("success","Note created")}else if(Y){const r=await D.updateNote(Y.instanceId,Y.uri,{summary:e,description:s,dtstart:a});Y=r.note,at=q(r.note.instanceId,r.note.uri),h("success","Note saved")}await xt()}catch(r){h("error",r instanceof Error?r.message:"Save failed")}finally{c=!1,m()}}function De(){const n=o.querySelector('input[data-action="contact-photo"]');n&&n.addEventListener("change",()=>{(async()=>{var e;const t=(e=n.files)==null?void 0:e[0];if(n.value="",!!t){if(t.size>2.5*1024*1024){h("error","Photo is too large (max ~2 MB)"),m();return}try{const s=await pe(t);z=s,X=`data:${t.type||"image/jpeg"};base64,${s}`,tt=!1,m()}catch(s){h("error",s instanceof Error?s.message:"Failed to read photo"),m()}}})()})}function Ne(){const n=o.querySelector('[data-form="create-cal"]');if(!n)return;const t=n.querySelector('input[name="holidays"]'),e=n.querySelector("#holidays-country-wrap"),s=n.querySelector('input[name="displayname"]'),d=n.querySelector('input[name="readOnly"]');if(!t||!e)return;const a=()=>{const r=t.checked;e.hidden=!r,s&&(s.required=!r,r&&!s.value.trim()?s.placeholder="Auto: Holidays (XX)":r||(s.placeholder="Work")),r&&d&&(d.checked=!0)};t.addEventListener("change",a),a()}async function xe(n){const t=new FormData(n),e=String(t.get("username")??""),s=String(t.get("password")??"");c=!0,x(),m();try{u=(await D.login(e,s)).user,await Q(),h("success","Signed in")}catch(d){h("error",d instanceof Error?d.message:"Login failed")}finally{c=!1,m()}}async function Te(n){if(k===null)return;const t=new FormData(n),e=String(t.get("username")??""),s=String(t.get("access")??"read");j=!0,c=!0,x(),m();try{await D.share(k,e,s),await Et(k),h("success",`Shared with ${e}`)}catch(d){h("error",d instanceof Error?d.message:"Share failed")}finally{c=!1,m()}}async function Ae(n){if(k===null)return;const t=new FormData(n),e=String(t.get("displayname")??"").trim(),s=String(t.get("description")??""),d=String(t.get("color")??"").trim();c=!0,x(),m();try{const a=await D.updateCalendar(k,{displayname:e,description:s,color:d});j=!0,await Q(),k=a.calendar.id,await Et(k),await lt(),h("success","Calendar updated")}catch(a){h("error",a instanceof Error?a.message:"Update failed")}finally{c=!1,m()}}async function Oe(n){const t=new FormData(n),e=String(t.get("displayname")??"").trim(),s=String(t.get("description")??""),d=String(t.get("color")??"").trim(),a=t.get("holidays")==="on",r=String(t.get("holidayCountry")??"").trim(),l=t.get("readOnly")==="on";if(a&&!r){h("error","Select a country for the holidays calendar"),m();return}if(!a&&!e){h("error","Display name is required"),m();return}c=!0,x(),et=null,m();try{const f=await D.createCalendar({displayname:e,description:s,color:d,holidays:a,holidayCountry:a?r:void 0,readOnly:l});k=f.calendar.id,await Q();let p=`Created “${f.calendar.displayname}”`;const E=f.holidayImport??f.calendar.holidayImport;E&&(p+=`. Holidays imported: ${Ft(E)}.`,et={ok:!0,message:Ft(E)}),l&&(p+=" Calendar is read-only."),h("success",p)}catch(f){h("error",f instanceof Error?f.message:"Create failed")}finally{c=!1,m()}}async function Ie(n){var s,d;const t=n.target.closest("[data-action]");if(!t)return;const e=t.dataset.action;if(e==="logout"){c=!0;try{await D.logout()}catch{}u=null,N=[],ft=[],k=null,it=[],C=null,ct=[],F=null,v=null,V=!1,x(),c=!1,m();return}if(e==="select-cal"){const a=Number(t.dataset.id);if(!Number.isFinite(a))return;k=a,et=null,c=!0,x(),m();try{await lt()}catch(r){h("error",r instanceof Error?r.message:"Failed to load calendar")}finally{c=!1,m()}return}if(e==="edit-cal"){const a=Number(t.dataset.id);if(!Number.isFinite(a)||!N.find(l=>l.id===a&&l.canShare))return;k=a,j=!0,Z=null,et=null,c=!0,x(),m();try{await Et(a),await lt()}catch(l){h("error",l instanceof Error?l.message:"Failed to open calendar")}finally{c=!1,m()}return}if(e==="close-cal-modal"){j=!1,m();return}if(e==="delete-cal"){const a=Number(t.dataset.id);if(!Number.isFinite(a)||!N.find(l=>l.id===a&&l.canShare))return;Z=a,j=!1,x(),m();return}if(e==="cancel-delete-cal"){Z=null,m();return}if(e==="confirm-delete-cal"){const a=Number(t.dataset.id),r=o.querySelector("#delete-cal-confirm");if(!Number.isFinite(a)||!(r!=null&&r.checked))return;c=!0,x(),m();try{if(await D.deleteCalendar(a),k===a&&(k=null),Z=null,j=!1,ft=[],St=[],await Q(),k===null){const l=Gt();l&&(k=l.id,await lt())}h("success","Calendar deleted")}catch(l){h("error",l instanceof Error?l.message:"Delete failed")}finally{c=!1,m()}return}if(e==="month-today"){const a=new Date;rt={y:a.getFullYear(),m:a.getMonth()},c=!0,m();try{await lt()}finally{c=!1,m()}return}if(e==="month-prev"||e==="month-next"){const a=e==="month-prev"?-1:1,r=new Date(rt.y,rt.m+a,1);rt={y:r.getFullYear(),m:r.getMonth()},c=!0,m();try{await lt()}finally{c=!1,m()}return}if(e==="info"){const a=t.dataset.info??"";_e(a);return}if(e==="info-close"){ne();return}if(e==="flash-close"){x(),m();return}if(e==="tab"){const a=t.dataset.tab;if(a==="calendars"||a==="contacts"||a==="tasks"||a==="notes"){S=a,a!=="calendars"&&(j=!1,Z=null),x(),c=!0,m();try{a==="contacts"&&C!==null?await Nt(C):a==="calendars"?await lt():a==="tasks"?await vt():a==="notes"&&await xt()}catch(r){h("error",r instanceof Error?r.message:"Failed to load")}finally{c=!1,m()}}return}if(e==="sort-task"||e==="sort-note"){const a=t.dataset.sort||"";if(!a)return;if(e==="sort-task"){dt===a?ot=ot==="asc"?"desc":"asc":(dt=a,ot=a==="due"||a==="summary"?"asc":"desc"),c=!0,m();try{await vt()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{c=!1,m()}}else{kt===a?gt=gt==="asc"?"desc":"asc":(kt=a,gt="asc"),c=!0,m();try{await xt()}catch(r){h("error",r instanceof Error?r.message:"Sort failed")}finally{c=!1,m()}}return}if(e==="select-task"){if(n.target.closest("[data-stop-row], .task-check"))return;const a=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(a)||!r)return;const l=H.find(f=>f.instanceId===a&&f.uri===r)??null;P=!1,W=q(a,r),I=l?{...l}:null,x(),m();return}if(e==="task-check"){n.preventDefault(),n.stopPropagation();const a=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(a)||!r)return;const l=q(a,r),f=H.find(p=>q(p.instanceId,p.uri)===l);if(!f||!f.canWrite||f.readOnly)return;R.includes(l)?R=R.filter(p=>p!==l):R=[...R,l],m();return}if(e==="task-select-all"){n.preventDefault();const a=H.filter(l=>l.canWrite&&!l.readOnly);a.length>0&&a.every(l=>R.includes(q(l.instanceId,l.uri)))?R=[]:R=a.map(l=>q(l.instanceId,l.uri)),m();return}if(e==="bulk-task-clear"){R=[],m();return}if(e==="bulk-task-status"||e==="bulk-task-due"||e==="bulk-task-clear-due"||e==="bulk-task-percent"||e==="bulk-task-delete"){Se(e);return}if(e==="select-note"){const a=Number(t.dataset.instance),r=t.dataset.uri??"";if(!Number.isFinite(a)||!r)return;const l=Ct.find(f=>f.instanceId===a&&f.uri===r)??null;B=!1,at=q(a,r),Y=l?{...l}:null,x(),m();return}if(e==="new-task"){P=!0,W=null,I={uri:"",instanceId:((s=ht[0])==null?void 0:s.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},x(),m();return}if(e==="new-subtask"){if(!I||P||!I.uid||!I.canWrite)return;const a=I;P=!0,W=null,I={uri:"",instanceId:a.instanceId,calendarId:a.calendarId,calendarName:a.calendarName,calendarUri:a.calendarUri,uid:"",parentUid:a.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},x(),m();return}if(e==="new-note"){B=!0,at=null,Y={uri:"",instanceId:((d=yt[0])==null?void 0:d.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},x(),m();return}if(e==="cancel-task"){P=!1,I=null,W=null,m();return}if(e==="cancel-note"){B=!1,Y=null,at=null,m();return}if(e==="delete-task"){if(!I||P||!confirm("Delete this task? CalDAV clients will sync the removal."))return;c=!0,x(),m();try{await D.deleteTask(I.instanceId,I.uri),W=null,I=null,await vt(),h("success","Task deleted")}catch(a){h("error",a instanceof Error?a.message:"Delete failed")}finally{c=!1,m()}return}if(e==="delete-note"){if(!Y||B||!confirm("Delete this note? CalDAV clients will sync the removal."))return;c=!0,x(),m();try{await D.deleteNote(Y.instanceId,Y.uri),at=null,Y=null,await xt(),h("success","Note deleted")}catch(a){h("error",a instanceof Error?a.message:"Delete failed")}finally{c=!1,m()}return}if(e==="select-ab"){const a=Number(t.dataset.id);if(!Number.isFinite(a))return;C=a,bt=null,F=null,v=null,V=!1,$t="",ct=[],X=null,z=null,tt=!1,x(),c=!0,m();try{await Nt(a)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contacts")}finally{c=!1,m()}return}if(e==="select-contact"){const a=t.dataset.uri??"";if(!a)return;x();try{await ue(a)}catch(r){h("error",r instanceof Error?r.message:"Failed to load contact")}m();return}if(e==="new-contact"){if(C===null)return;me(),x(),m();return}if(e==="cancel-contact"){V=!1,v=null,F=null,X=null,z=null,tt=!1,m();return}if(e==="add-email"||e==="add-phone"||e==="add-custom"){if(!v)return;Ot(),Array.isArray(v.emails)||(v.emails=[""]),Array.isArray(v.phones)||(v.phones=[{type:"cell",value:""}]),Array.isArray(v.custom)||(v.custom=[]),e==="add-email"?v.emails.length<10&&v.emails.push(""):e==="add-phone"?v.phones.length<10&&v.phones.push({type:"other",value:""}):v.custom.length<30&&v.custom.push({label:"",value:""}),m();return}if(e==="remove-email"){if(!v)return;Ot();const a=Number(t.dataset.idx);if(!Number.isFinite(a))return;const r=Array.isArray(v.emails)?v.emails:[""];v.emails=r.filter((l,f)=>f!==a),v.emails.length===0&&(v.emails=[""]),m();return}if(e==="remove-phone"){if(!v)return;Ot();const a=Number(t.dataset.idx);if(!Number.isFinite(a))return;const r=Array.isArray(v.phones)?v.phones:[{type:"cell",value:""}];v.phones=r.filter((l,f)=>f!==a),v.phones.length===0&&(v.phones=[{type:"cell",value:""}]),m();return}if(e==="remove-custom"){if(!v)return;Ot();const a=Number(t.dataset.idx);if(!Number.isFinite(a))return;v.custom=(Array.isArray(v.custom)?v.custom:[]).filter((r,l)=>l!==a),m();return}if(e==="remove-photo"){X=null,z=null,tt=!0,v&&(v.hasPhoto=!1),m();return}if(e==="delete-contact"){if(C===null||!F||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;c=!0,x(),m();try{await D.deleteContact(C,F),F=null,v=null,V=!1,await Q(),h("success","Contact deleted")}catch(a){h("error",a instanceof Error?a.message:"Delete failed")}finally{c=!1,m()}return}if(e==="delete-ab"){if(C===null)return;const a=it.find(f=>f.id===C),r=((a==null?void 0:a.cardCount)??0)>0,l=r?`Delete address book “${(a==null?void 0:a.displayname)??""}” and all ${a==null?void 0:a.cardCount} contacts? This cannot be undone.`:`Delete empty address book “${(a==null?void 0:a.displayname)??""}”?`;if(!confirm(l))return;c=!0,x(),m();try{await D.deleteAddressBook(C,r),C=null,ct=[],v=null,await Q(),h("success","Address book deleted")}catch(f){h("error",f instanceof Error?f.message:"Delete failed")}finally{c=!1,m()}return}if(e==="export-ab"){if(C===null)return;c=!0,x(),m();try{const{blob:a,filename:r}=await D.exportAddressBook(C),l=URL.createObjectURL(a),f=document.createElement("a");f.href=l,f.download=r,f.click(),URL.revokeObjectURL(l),h("success",`Exported ${r}`)}catch(a){h("error",a instanceof Error?a.message:"Export failed")}finally{c=!1,m()}return}if(e==="revoke"){const a=t.dataset.href??"";if(!a||k===null||!confirm("Revoke access for this user?"))return;j=!0,c=!0,x(),m();try{await D.revoke(k,a),await Et(k),h("success","Share revoked")}catch(r){h("error",r instanceof Error?r.message:"Revoke failed")}finally{c=!1,m()}return}if(e==="export-cal"){if(k===null)return;j=!0,c=!0,x(),m();try{const{blob:a,filename:r}=await D.exportCalendar(k),l=URL.createObjectURL(a),f=document.createElement("a");f.href=l,f.download=r,f.click(),URL.revokeObjectURL(l),h("success",`Exported ${r}`)}catch(a){h("error",a instanceof Error?a.message:"Export failed")}finally{c=!1,m()}}}function Le(){const n=o.querySelector('input[data-action="import-cal"]');n&&n.addEventListener("change",()=>{Be(n)});const t=o.querySelector('input[data-action="import-ab"]');t&&t.addEventListener("change",()=>{Pe(t)})}async function Pe(n){var e;if(C===null)return;const t=(e=n.files)==null?void 0:e[0];if(n.value="",!!t){c=!0,x(),bt=null,m();try{const s=await t.text(),d=await D.importAddressBook(C,s),a=Ft(d);bt={ok:!0,message:a},await Q(),h("success",`Import finished for “${t.name}”: ${a}.`)}catch(s){const d=s instanceof Error?s.message:"Import failed";bt={ok:!1,message:d},h("error",d)}finally{c=!1,m()}}}function Ot(){if(!v)return;const n=o.querySelector('[data-form="contact"]');if(!n)return;const t=new FormData(n);v.firstname=String(t.get("firstname")??""),v.lastname=String(t.get("lastname")??""),v.fullname=String(t.get("fullname")??""),v.org=String(t.get("org")??""),v.title=String(t.get("title")??""),v.url=String(t.get("url")??""),v.note=String(t.get("note")??""),v.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const e=[];let s=0;for(;t.has(`email_${s}`);)e.push(String(t.get(`email_${s}`)??"")),s++;e.length&&(v.emails=e);const d=[];for(s=0;t.has(`phone_value_${s}`);)d.push({type:String(t.get(`phone_type_${s}`)??"other"),value:String(t.get(`phone_value_${s}`)??"")}),s++;d.length&&(v.phones=d);const a=[];for(s=0;t.has(`custom_label_${s}`)||t.has(`custom_value_${s}`);)a.push({label:String(t.get(`custom_label_${s}`)??""),value:String(t.get(`custom_value_${s}`)??"")}),s++;v.custom=a}function qe(n){const t=new FormData(n),e=[];let s=0;for(;t.has(`email_${s}`);){const l=String(t.get(`email_${s}`)??"").trim();l&&e.push(l),s++}const d=[];for(s=0;t.has(`phone_value_${s}`);){const l=String(t.get(`phone_value_${s}`)??"").trim();l&&d.push({type:String(t.get(`phone_type_${s}`)??"other"),value:l}),s++}const a=[];for(s=0;t.has(`custom_label_${s}`)||t.has(`custom_value_${s}`);){const l=String(t.get(`custom_label_${s}`)??"").trim(),f=String(t.get(`custom_value_${s}`)??"").trim();(l||f)&&a.push({label:l,value:f}),s++}const r={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:e,phones:d,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),custom:a};return tt?r.removePhoto=!0:z&&(r.photoBase64=z),r}async function Ue(n){if(C===null)return;const t=qe(n);c=!0,x(),m();try{if(V){const e=await D.createContact(C,t);V=!1,F=e.contact.uri,v=e.contact,X=e.contact.photoDataUri??(e.contact.hasPhoto?`${D.contactPhotoUrl(C,e.contact.uri)}?t=${Date.now()}`:null),z=null,tt=!1,h("success","Contact created")}else if(F){const e=await D.updateContact(C,F,t);F=e.contact.uri,v=e.contact,X=e.contact.photoDataUri??(e.contact.hasPhoto?`${D.contactPhotoUrl(C,e.contact.uri)}?t=${Date.now()}`:null),z=null,tt=!1,h("success","Contact saved")}try{await Q()}catch(e){if(console.error(e),C!==null)try{await Nt(C)}catch{}}}catch(e){h("error",e instanceof Error?e.message:"Save failed")}finally{c=!1,m()}}async function Fe(n){const t=new FormData(n),e=String(t.get("displayname")??"").trim(),s=String(t.get("description")??"").trim();if(e){c=!0,x(),m();try{const d=await D.createAddressBook({displayname:e,description:s});C=d.addressbook.id,F=null,v=null,V=!1,$t="",await Q(),h("success",`Address book “${d.addressbook.displayname}” created`)}catch(d){h("error",d instanceof Error?d.message:"Create failed")}finally{c=!1,m()}}}async function Re(n){if(C===null)return;const t=new FormData(n),e=String(t.get("displayname")??"").trim(),s=String(t.get("description")??"").trim();c=!0,x(),m();try{await D.updateAddressBook(C,{displayname:e,description:s}),await Q(),h("success","Address book updated")}catch(d){h("error",d instanceof Error?d.message:"Update failed")}finally{c=!1,m()}}function _e(n){const t=Ye[n];if(!t)return;const e=o.querySelector("#info-modal"),s=o.querySelector("#info-modal-title"),d=o.querySelector("#info-modal-body");if(!e||!s||!d)return;s.textContent=t.title,d.innerHTML=t.paragraphs.map(r=>`<p>${i(r)}</p>`).join(""),e.hidden=!1,document.body.classList.add("info-modal-open");const a=e.querySelector(".info-modal-close");a==null||a.focus()}function ne(){const n=o.querySelector("#info-modal");n&&(n.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Be(n){var e;if(k===null)return;const t=(e=n.files)==null?void 0:e[0];if(n.value="",!!t){j=!0,c=!0,x(),et=null,m();try{const s=await t.text(),d=await D.importCalendar(k,s),a=Ft(d);et={ok:!0,message:a},await lt(),h("success",`Import finished for “${t.name}”: ${a}.`)}catch(s){const d=s instanceof Error?s.message:"Import failed";et={ok:!1,message:d},h("error",d)}finally{c=!1,m()}}}le()}const oe=document.getElementById("app");if(!oe)throw new Error("#app missing");Ge(oe);
