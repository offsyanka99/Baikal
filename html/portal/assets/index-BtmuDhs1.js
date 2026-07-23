var Oa=Object.defineProperty;var Aa=(r,f,N)=>f in r?Oa(r,f,{enumerable:!0,configurable:!0,writable:!0,value:N}):r[f]=N;var Me=(r,f,N)=>Aa(r,typeof f!="symbol"?f+"":f,N);(function(){const f=document.createElement("link").relList;if(f&&f.supports&&f.supports("modulepreload"))return;for(const O of document.querySelectorAll('link[rel="modulepreload"]'))E(O);new MutationObserver(O=>{for(const U of O)if(U.type==="childList")for(const K of U.addedNodes)K.tagName==="LINK"&&K.rel==="modulepreload"&&E(K)}).observe(document,{childList:!0,subtree:!0});function N(O){const U={};return O.integrity&&(U.integrity=O.integrity),O.referrerPolicy&&(U.referrerPolicy=O.referrerPolicy),O.crossOrigin==="use-credentials"?U.credentials="include":O.crossOrigin==="anonymous"?U.credentials="omit":U.credentials="same-origin",U}function E(O){if(O.ep)return;O.ep=!0;const U=N(O);fetch(O.href,U)}})();class ae extends Error{constructor(N,E){super(N);Me(this,"status");this.status=E}}let De="";function ke(r){De=r&&typeof r=="string"?r:""}async function R(r,f={}){const N=new Headers(f.headers);f.body&&!N.has("Content-Type")&&N.set("Content-Type","application/json");const E=(f.method||"GET").toUpperCase();E!=="GET"&&E!=="HEAD"&&E!=="OPTIONS"&&De&&N.set("X-CSRF-Token",De);const O=await fetch(`/api${r}`,{...f,headers:N,credentials:"same-origin"});let U=null;const K=await O.text();if(K)try{U=JSON.parse(K)}catch{U={error:K}}if(!O.ok){let D=`Request failed (${O.status})`;throw U&&typeof U=="object"&&U!==null&&"error"in U&&typeof U.error=="string"?D=U.error:(O.status===500||O.status===504)&&(D="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),new ae(D,O.status)}return U}function ct(r){return encodeURIComponent(r)}const L={me:async()=>{var f;const r=await R("/me");return ke(r.csrfToken||((f=r.user)==null?void 0:f.csrfToken)),r},login:async(r,f)=>{var E;const N=await R("/login",{method:"POST",body:JSON.stringify({username:r,password:f})});return ke((E=N.user)==null?void 0:E.csrfToken),N},logout:async()=>{try{return await R("/logout",{method:"POST"})}finally{ke("")}},calendars:()=>R("/calendars"),createCalendar:r=>R("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>R("/holidays/countries"),updateCalendar:(r,f)=>R(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(f)}),deleteCalendar:r=>R(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,f,N)=>{const E=new URLSearchParams({from:f,to:N}).toString();return R(`/calendars/${r}/events?${E}`)},getEvent:(r,f)=>R(`/calendars/${r}/events/${ct(f)}`),createEvent:(r,f)=>R(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(f)}),updateEvent:(r,f,N)=>R(`/calendars/${r}/events/${ct(f)}`,{method:"PATCH",body:JSON.stringify(N)}),deleteEvent:(r,f)=>R(`/calendars/${r}/events/${ct(f)}`,{method:"DELETE"}),exportCalendar:async r=>{const f=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!f.ok){let K=`Export failed (${f.status})`;try{const D=await f.json();D.error&&(K=D.error)}catch{}throw new ae(K,f.status)}const N=f.headers.get("Content-Disposition")||"",E=/filename="([^"]+)"/i.exec(N),O=(E==null?void 0:E[1])||`calendar-${r}.ics`;return{blob:await f.blob(),filename:O}},importCalendar:(r,f)=>R(`/calendars/${r}/import`,{method:"POST",body:JSON.stringify({ics:f})}),directory:()=>R("/directory"),shares:r=>R(`/calendars/${r}/shares`),share:(r,f,N)=>R(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:f,access:N})}),revoke:(r,f)=>R(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:f})}),addressbooks:()=>R("/addressbooks"),createAddressBook:r=>R("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,f)=>R(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(f)}),deleteAddressBook:(r,f=!1)=>R(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:f})}),exportAddressBook:async r=>{const f=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!f.ok){let K=`Export failed (${f.status})`;try{const D=await f.json();D.error&&(K=D.error)}catch{}throw new ae(K,f.status)}const N=f.headers.get("Content-Disposition")||"",E=/filename="([^"]+)"/i.exec(N),O=(E==null?void 0:E[1])||`contacts-${r}.vcf`;return{blob:await f.blob(),filename:O}},importAddressBook:(r,f)=>R(`/addressbooks/${r}/import`,{method:"POST",body:JSON.stringify({vcf:f})}),contacts:(r,f="")=>{const N=f.trim()?`?q=${encodeURIComponent(f.trim())}`:"";return R(`/addressbooks/${r}/contacts${N}`)},getContact:(r,f)=>R(`/addressbooks/${r}/contacts/${ct(f)}`),createContact:(r,f)=>R(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(f)}),updateContact:(r,f,N)=>R(`/addressbooks/${r}/contacts/${ct(f)}`,{method:"PATCH",body:JSON.stringify(N)}),deleteContact:(r,f)=>R(`/addressbooks/${r}/contacts/${ct(f)}`,{method:"DELETE"}),exportContact:async(r,f)=>{const N=await fetch(`/api/addressbooks/${r}/contacts/${ct(f)}/export`,{credentials:"same-origin"});if(!N.ok){let D=`Export failed (${N.status})`;try{const yt=await N.json();yt.error&&(D=yt.error)}catch{}throw new ae(D,N.status)}const E=N.headers.get("Content-Disposition")||"",O=/filename="([^"]+)"/i.exec(E),U=(O==null?void 0:O[1])||"contact.vcf";return{blob:await N.blob(),filename:U}},contactPhotoUrl:(r,f)=>`/api/addressbooks/${r}/contacts/${ct(f)}/photo`,tasks:(r={})=>{const f=new URLSearchParams;r.q&&f.set("q",r.q),r.sort&&f.set("sort",r.sort),r.order&&f.set("order",r.order);const N=f.toString()?`?${f}`:"";return R(`/tasks${N}`)},createTask:r=>R("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,f,N)=>R(`/tasks/${r}/${ct(f)}`,{method:"PATCH",body:JSON.stringify(N)}),deleteTask:(r,f)=>R(`/tasks/${r}/${ct(f)}`,{method:"DELETE"}),bulkTasks:r=>R("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const f=new URLSearchParams;r.q&&f.set("q",r.q),r.sort&&f.set("sort",r.sort),r.order&&f.set("order",r.order);const N=f.toString()?`?${f}`:"";return R(`/notes${N}`)},createNote:r=>R("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,f,N)=>R(`/notes/${r}/${ct(f)}`,{method:"PATCH",body:JSON.stringify(N)}),deleteNote:(r,f)=>R(`/notes/${r}/${ct(f)}`,{method:"DELETE"})},Ia="0.11.1-fork.4",La="https://github.com/offsyanka99/Baikal/tree/master/docs";function c(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Se(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(r)}</span>`}function ue(r){const f=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&f.push(`${r.skipped} skipped`),f.join(", ")}const qa={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards."]}};function bt(r,f,N="h2"){const E=N;return`<div class="section-title-row">
    <${E}>${c(r)}</${E}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(f)}"
      aria-label="About ${c(r)}" title="About ${c(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Fa(){return`
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
    </div>`}function Ma(r){let f=null,N=null,E="calendars",O=[],U=[],K=[],D=null,yt=[],z=!1,$t=!1,rt=null,dt=null,Nt={y:new Date().getFullYear(),m:new Date().getMonth()},Wt=[],me=!1,wt=!1,y=null,ht=!1,C=null,ne="",Ht=null,nt=[],T=null,kt=[],qt="",j=null,w=null,Y=!1,Q=!1,ot=!1,et=null,it=null,ut=!1,u=!1,gt=null,Et=null,Ce=!1,Yt={timeFormat:"auto",weekStart:"auto"},St=null,at=[],Jt=[],Ft=[],Mt=[],se="",le="",Tt="due",Dt="asc",Bt="dtstart",Rt="desc",st=null,vt=null,q=null,V=null,B=!1,Z=!1,G=[];function g(a,t){N={type:a,message:t}}function A(){N=null}async function Ue(){var a,t;try{const e=await L.me();f=e.user;const l=(((a=e.ui)==null?void 0:a.timeFormat)||"auto").toLowerCase(),o=(((t=e.ui)==null?void 0:t.weekStart)||"auto").toLowerCase();Yt={timeFormat:l==="12h"||l==="24h"?l:"auto",weekStart:o==="monday"||o==="sunday"?o:"auto"},await mt()}catch(e){e instanceof ae&&e.status===401?f=null:g("error",e instanceof Error?e.message:"Failed to load")}d()}async function mt(){const[a,t,e]=await Promise.all([L.calendars(),L.directory().catch(()=>({users:[]})),L.addressbooks()]);if(O=a.calendars,U=t.users,nt=e.addressbooks,K.length===0)try{K=(await L.holidayCountries()).countries}catch{K=[]}if(D!==null&&!O.some(l=>l.id===D)&&(D=null,yt=[],z=!1,rt=null),D===null){const l=Ne();l&&(D=l.id)}D!==null&&z?await Kt(D):D!==null&&(yt=[]),E==="calendars"&&await pt(),T!==null&&!nt.some(l=>l.id===T)&&(T=null,kt=[],j=null,w=null,Y=!1),dt!==null&&!nt.some(l=>l.id===dt)&&(dt=null),T===null&&nt.length>0&&(T=nt[0].id),T!==null&&E==="contacts"&&await Ot(T)}async function Kt(a){yt=(await L.shares(a)).shares}function Ne(){const a=O.filter(e=>e.canShare);if(a.length===0)return null;const t=e=>{const l=e.uri.toLowerCase(),o=e.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return a.find(t)??a[0]??null}function J(a){const t=a.getFullYear(),e=String(a.getMonth()+1).padStart(2,"0"),l=String(a.getDate()).padStart(2,"0");return`${t}-${e}-${l}`}function Pe(a,t){const e=new Date(a,t,1),l=new Date(a,t+1,0);return{from:J(e),to:J(l)}}function pe(a){if(/^\d{4}-\d{2}-\d{2}$/.test(a)){const[e,l,o]=a.split("-").map(Number);return new Date(e,l-1,o)}const t=new Date(a);if(Number.isNaN(t.getTime())){const[e,l,o]=a.slice(0,10).split("-").map(Number);return new Date(e,(l||1)-1,o||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function _e(a){const t=pe(a.start);if(!a.end)return[J(t)];let e=pe(a.end);if(!a.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(a.end)){const s=new Date(a.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(a.start).getTime()&&(e=new Date(e.getFullYear(),e.getMonth(),e.getDate()-1))}if(e<t)return[J(t)];const l=[],o=new Date(t.getFullYear(),t.getMonth(),t.getDate()),m=new Date(e.getFullYear(),e.getMonth(),e.getDate());let n=0;for(;o<=m&&n++<370;)l.push(J(o)),o.setDate(o.getDate()+1);return l.length?l:[J(t)]}function fe(a,t){const e=a.slice(0,10),l=(t||e).slice(0,10);if(e===l){const M=Gt(e);return{start:M.start,end:M.end}}const[o,m,n]=e.split("-").map(Number),[s,i,p]=l.split("-").map(Number),h=xt(new Date(o,m-1,n,9,0,0,0)),v=xt(new Date(s,i-1,p,17,0,0,0));return{start:h,end:v}}function Be(a,t){const e=Ut(a);let l=t?Ut(t):e;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const o=new Date(t);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(a).getTime()){const m=pe(t);m.setDate(m.getDate()-1),l=J(m)}}return{start:e,end:l}}async function pt(){if(D===null){Wt=[];return}const{from:a,to:t}=Pe(Nt.y,Nt.m);me=!0;try{Wt=(await L.calendarEvents(D,a,t)).events}catch{Wt=[]}finally{me=!1}}function Ve(a,t){return new Date(a,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function je(a){const t=a.summary||"(No title)";if(a.allDay||/^\d{4}-\d{2}-\d{2}$/.test(a.start))return t;const e=new Date(a.start);return Number.isNaN(e.getTime())?t:`${e.toLocaleTimeString(void 0,be())} ${t}`}function We(){const a=D!==null?O.find(b=>b.id===D):null,t=(a==null?void 0:a.displayname)??"Calendar",e=a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6",l=Nt.y,o=Nt.m,m=new Date(l,o,1),n=ye(),s=(m.getDay()-n+7)%7,i=new Date(l,o+1,0).getDate(),p=new Date(l,o,0).getDate(),v=J(new Date),M=Ee(),x=new Map;for(const b of Wt)for(const F of _e(b)){const S=x.get(F)??[];S.push(b),x.set(F,S)}const k=[],I=Math.ceil((s+i)/7)*7;for(let b=0;b<I;b++){let F,S=!0,P;b<s?(F=p-s+b+1,S=!1,P=new Date(l,o-1,F)):b>=s+i?(F=b-(s+i)+1,S=!1,P=new Date(l,o+1,F)):(F=b-s+1,P=new Date(l,o,F));const _=J(P),H=_===v,lt=S?x.get(_)??[]:[],te=Ht===_?50:3,jt=lt.slice(0,te),ie=lt.length-jt.length,Ct=jt.map(ee=>{const $e=D??0,de=je(ee);return`<button type="button" class="month-event${ee.allDay?"":" is-timed"}" title="${c(de)}" style="--ev-color:${c(e)}"
            data-action="open-event" data-instance="${$e}" data-uri="${c(ee.uri)}" ${u?"disabled":""}>${c(de)}</button>`}).join(""),ge=ie>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(_)}" title="Show all events this day" ${u?"disabled":""}>+${ie} more</button>`:"",ve=!S&&(F===1||b===s+i)?P.toLocaleString(void 0,{month:"short",day:"numeric"}):String(F),ce=!!(a&&!a.readOnly&&(a.canShare||a.access==="readwrite"));k.push(`<div class="month-cell${S?"":" is-outside"}${H?" is-today":""}${ce?" is-clickable":""}"${ce?` data-action="new-event-day" data-day="${c(_)}" role="button" tabindex="0" title="Add event on ${c(_)}"`:""}>
        <div class="month-daynum${H?" is-today-num":""}">${c(ve)}</div>
        <div class="month-events">${Ct}${ge}</div>
      </div>`)}const tt=a?me?'<p class="muted small month-empty-hint">Loading events…</p>':"":'<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${u?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${u?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${u?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(Ve(l,o))}</h2>
        <span class="month-cal-name muted small" title="${c(t)}">
          <span class="cal-swatch" style="background:${c(e)};margin-top:0"></span>
          ${c(t)}
        </span>
      </div>
      ${tt}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${M.map(b=>`<div class="month-dow">${c(b)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${k.join("")}
        </div>
      </div>
    </section>`}function Ut(a){if(!a)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;const t=new Date(a);return Number.isNaN(t.getTime())?a.slice(0,10):J(t)}function He(){if(Yt.timeFormat==="24h")return!1;if(Yt.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const a=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(a)}function be(){return He()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function ye(){var e;if(Yt.weekStart==="monday")return 1;if(Yt.weekStart==="sunday")return 0;const a=[...(e=navigator.languages)!=null&&e.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of a)try{const o=new Intl.Locale(l),m=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=m==null?void 0:m.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Ee(){const a=ye(),t=new Date(2024,0,7+a),e=[];for(let l=0;l<7;l++){const o=new Date(t);o.setDate(t.getDate()+l),e.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return e}function Te(a,t=15){const e=t*60*1e3,l=a.getTime();return l%e===0?new Date(l):new Date(Math.ceil(l/e)*e)}function xt(a){const t=e=>String(e).padStart(2,"0");return`${a.getFullYear()}-${t(a.getMonth()+1)}-${t(a.getDate())}T${t(a.getHours())}:${t(a.getMinutes())}`}function Ye(a,t){if(!a)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(a)){const l=a.slice(0,10),[o,m,n]=l.split("-").map(Number);return new Date(o,m-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const e=new Date((a.includes("T")&&a.length===16,a));return Number.isNaN(e.getTime())?a:e.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...be()})}function zt(a){if(!a){const e=Te(new Date);return{date:J(e),hm:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(a))return{date:a,hm:"09:00"};const t=new Date((a.length===16,a));return Number.isNaN(t.getTime())?{date:a.slice(0,10),hm:"09:00"}:{date:J(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Gt(a){const t=new Date,e=J(t);if(a&&a!==e){const[m,n,s]=a.split("-").map(Number),i=new Date(m,n-1,s,9,0,0,0),p=new Date(m,n-1,s,10,0,0,0);return{start:xt(i),end:xt(p)}}const l=Te(t,15),o=new Date(l.getTime()+3600*1e3);return{start:xt(l),end:xt(o)}}function Je(){const a=[];for(let t=0;t<24;t++)for(let e=0;e<60;e+=15)a.push(`${String(t).padStart(2,"0")}:${String(e).padStart(2,"0")}`);return a}function Pt(a){const{field:t,name:e,label:l,value:o,dateOnly:m=!1,required:n,disabled:s,allowClear:i=!0}=a,p=(C==null?void 0:C.field)===t,h=Ye(o,m);return`<div class="dt-field${p?" is-open":""}" data-dt-id="${c(t)}">
      <span class="dt-field-label">${c(l)}</span>
      <input type="hidden" name="${c(e)}" value="${c(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(t)}"
        data-dt-name="${c(e)}" data-dt-date-only="${m?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${p}">
        <span class="dt-trigger-text">${c(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${p&&!s?Ke(t,o,m,i):""}
    </div>`}function he(a){var t;return a==="start"?String((y==null?void 0:y.start)||""):a==="end"?String((y==null?void 0:y.end)||""):a==="until"?((t=y==null?void 0:y.repeat)==null?void 0:t.until)||Ut(y==null?void 0:y.start)||J(new Date):a==="due"?Vt(q==null?void 0:q.due):a==="dtstart"?Vt(V==null?void 0:V.dtstart):a==="bulk-due"?ne:a==="birthday"?String((w==null?void 0:w.birthday)||""):""}function ft(a,t){if(a==="start"&&y){y={...y,start:t||""};return}if(a==="end"&&y){y={...y,end:t};return}if(a==="until"&&y){y={...y,repeat:{...y.repeat??re(),until:t,endMode:"until"}};return}if(a==="due"&&q){if(t===null||t==="")q={...q,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))q={...q,due:new Date(t+"T00:00:00").toISOString()};else{const e=new Date((t.length===16,t));q={...q,due:Number.isNaN(e.getTime())?t:e.toISOString()}}return}if(a==="dtstart"&&V){if(t===null||t==="")V={...V,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))V={...V,dtstart:new Date(t+"T00:00:00").toISOString()};else{const e=new Date((t.length===16,t));V={...V,dtstart:Number.isNaN(e.getTime())?t:e.toISOString()}}return}if(a==="birthday"&&w){w={...w,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}a==="bulk-due"&&(ne=t||"")}function Ke(a,t,e,l){const o=zt(t),m=(C==null?void 0:C.viewY)??Number(o.date.slice(0,4)),n=(C==null?void 0:C.viewM)??Number(o.date.slice(5,7))-1,s=ye(),i=Ee(),h=(new Date(m,n,1).getDay()-s+7)%7,v=new Date(m,n+1,0).getDate(),M=new Date(m,n,0).getDate(),x=o.date,k=o.hm,I=new Date(m,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),tt=[],b=Math.ceil((h+v)/7)*7;for(let S=0;S<b;S++){let P,_,H=!1;S<h?(P=M-h+S+1,_=new Date(m,n-1,P),H=!0):S>=h+v?(P=S-(h+v)+1,_=new Date(m,n+1,P),H=!0):(P=S-h+1,_=new Date(m,n,P));const lt=J(_),te=lt===x,jt=lt===J(new Date);tt.push(`<button type="button" class="dt-day${H?" is-outside":""}${te?" is-selected":""}${jt?" is-today":""}" data-action="dt-pick-day" data-dt-field="${a}" data-day="${c(lt)}">${P}</button>`)}const F=e?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${Je().map(S=>{const P=(()=>{const[_,H]=S.split(":").map(Number);return new Date(2e3,0,1,_,H).toLocaleTimeString(void 0,be())})();return`<button type="button" class="dt-time${S===k?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${a}" data-hm="${S}" role="option" aria-selected="${S===k}">${c(P)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${a}" role="dialog" aria-label="Choose date${e?"":" and time"}">
      <div class="dt-popover-inner${e?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${a}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(I)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${a}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(S=>`<span class="dt-dow">${c(S)}</span>`).join("")}</div>
          <div class="dt-days">${tt.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(a)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${a}">Today</button>
          </div>
        </div>
        ${F}
      </div>
    </div>`}function ze(){r.querySelectorAll(".dt-field.is-open").forEach(a=>{const t=a.querySelector(".dt-trigger"),e=a.querySelector(".dt-popover");if(!t||!e)return;const l=t.getBoundingClientRect(),o=8;e.style.position="fixed",e.style.visibility="hidden",e.style.top="0",e.style.left="0";const m=e.offsetWidth||320,n=e.offsetHeight||300;let s=l.bottom+6;s+n>window.innerHeight-o&&(s=Math.max(o,l.top-n-6));let i=l.left;i+m>window.innerWidth-o&&(i=Math.max(o,window.innerWidth-m-o)),i<o&&(i=o),e.style.top=`${Math.round(s)}px`,e.style.left=`${Math.round(i)}px`,e.style.right="auto",e.style.visibility="visible",e.style.zIndex="200"})}function re(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function Ge(a){return a.endMode==="until"||a.endMode==="count"||a.endMode==="never"?a.endMode:a.until?"until":a.count?"count":"never"}function Xe(){if(!wt||!y)return"";const a=y,t=a.repeat??re(),e=(t.freq||"").toUpperCase(),l=O.filter(x=>x.canShare||x.access==="readwrite"),o=O.filter(x=>x.id===a.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===a.instanceId?"selected":""}>${c(x.displayname)}</option>`).join(""),m=a.readOnly||!a.canWrite;let n,s;if(a.allDay)n=Ut(a.start),s=Ut(a.end);else{const x=a.start||"",k=a.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const I=fe(x,k||null);n=I.start,s=I.end||""}else n=Vt(a.start),s=Vt(a.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],p=new Set((t.byDay||[]).map(x=>x.toUpperCase())),h=Ge(t),v=!!e&&h==="until",M=t.until||(h==="until"?Ut(a.start)||J(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${ht?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${It()}
          ${!ht&&(a.hasRrule||e)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${m?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${m||l.length===0?"disabled":""}>
                ${o||`<option value="${a.instanceId}">${c(a.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(a.summary)}" ${m?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(a.location)}" ${m?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${m?"readonly":""}>${c(a.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${a.allDay?"checked":""} ${m?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${Pt({field:"start",name:"start",label:"Start",value:n,dateOnly:a.allDay,required:!0,disabled:m,allowClear:!1})}
              ${Pt({field:"end",name:"end",label:"End",value:s,dateOnly:a.allDay,disabled:m||v,allowClear:!v})}
            </div>
            <fieldset class="event-repeat" ${m?"disabled":""}>
              <legend class="event-repeat-legend">Repeat</legend>
              <div class="form-grid form-grid-2">
                <label>Frequency
                  <select name="repeatFreq" data-action="event-repeat-freq">
                    <option value="" ${e?"":"selected"}>Does not repeat</option>
                    <option value="DAILY" ${e==="DAILY"?"selected":""}>Daily</option>
                    <option value="WEEKLY" ${e==="WEEKLY"?"selected":""}>Weekly</option>
                    <option value="MONTHLY" ${e==="MONTHLY"?"selected":""}>Monthly</option>
                    <option value="YEARLY" ${e==="YEARLY"?"selected":""}>Yearly</option>
                  </select>
                </label>
                <label>Every
                  <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(t.interval||1))}" ${e?"":"disabled"} />
                </label>
              </div>
              ${e==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${i.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${p.has(x.code)?"checked":""} />
                              ${x.label}
                            </label>`).join("")}
                    </div>`:""}
              ${e?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${h==="never"?"selected":""}>Never</option>
                          <option value="until" ${h==="until"?"selected":""}>On date</option>
                          <option value="count" ${h==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${h==="until"?Pt({field:"until",name:"repeatUntil",label:"Until",value:M,dateOnly:!0,disabled:m,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${m?"":`<button type="submit" class="btn btn-primary" ${u?"disabled":""}>${ht?"Create event":"Save event"}</button>
                     ${ht?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${u?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function Qe(a,t){const e=O.find(l=>l.id===t);return{uri:"",instanceId:t,calendarId:(e==null?void 0:e.calendarId)??0,calendarName:(e==null?void 0:e.displayname)??"Calendar",calendarUri:(e==null?void 0:e.uri)??"",uid:"",summary:"",description:"",location:"",start:a,end:a,allDay:!0,hasRrule:!1,repeat:re(),readOnly:!1,canWrite:!0}}async function Ot(a){kt=(await L.contacts(a,qt)).contacts,j!==null&&!kt.some(e=>e.uri===j)&&(j=null,Y||(w=null,et=null,it=null,ut=!1))}async function _t(){const a=await L.tasks({q:se,sort:Tt,order:Dt});at=a.tasks,Ft=a.calendars;const t=new Set(at.map(e=>W(e.instanceId,e.uri)));G=G.filter(e=>t.has(e)),st!==null&&!at.some(e=>`${e.instanceId}|${e.uri}`===st)&&(st=null,B||(q=null))}async function Xt(){const a=await L.notes({q:le,sort:Bt,order:Rt});Jt=a.notes,Mt=a.calendars,vt!==null&&!Jt.some(t=>`${t.instanceId}|${t.uri}`===vt)&&(vt=null,Z||(V=null))}function W(a,t){return`${a}|${t}`}function xe(a){if(!a)return"—";try{const t=new Date(a);return Number.isNaN(t.getTime())?a:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return a}}function Vt(a){if(!a)return"";try{const t=new Date(a);if(Number.isNaN(t.getTime()))return"";const e=l=>String(l).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}catch{return""}}function At(a,t,e,l,o,m=""){const n=e===t,s=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${m?" "+m:""}`}" data-action="sort-${o}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(a)}${s}</th>`}async function Ze(a){if(T===null)return;const t=await L.getContact(T,a);j=a,Y=!1;const e=t.contact;w={...e,emails:Array.isArray(e.emails)?e.emails:[],phones:Array.isArray(e.phones)?e.phones:[],custom:Array.isArray(e.custom)?e.custom:[],address:e.address??Oe(),birthday:e.birthday??null},et=e.photoDataUri??(e.hasPhoto&&T!==null?`${L.contactPhotoUrl(T,a)}?t=${Date.now()}`:null),it=null,ut=!1,Q=!0}function ta(){Y=!0,j=null,Q=!0,w={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},et=null,it=null,ut=!1}function Oe(){return{street:"",city:"",region:"",postal:"",country:""}}function ea(a){return new Promise((t,e)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),m=o.indexOf(",");t(m>=0?o.slice(m+1):o)},l.onerror=()=>e(new Error("Failed to read photo file")),l.readAsDataURL(a)})}function Ae(a,t={}){const e=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,l=f?`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
          <div class="topnav-right">
            <span class="muted">${c(f.displayname||f.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
        </nav>`,m=!(z||$t||rt!==null||dt!==null||wt||Q||ot)?It():"",n=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${c(Ia)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(La)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${l}
      <main class="container">
        ${m}
        ${a}
      </main>
      ${n}
      ${Fa()}`}function It(){return N?`<div class="flash flash-${c(N.type)}" role="status">
      <span class="flash-text">${c(N.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function Ie(){r.innerHTML=Ae(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${u?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function aa(){if(!f){Ie();return}const a=O.filter($=>$.canShare),t=O.filter($=>!$.canShare),e=O.find($=>$.id===D)??null,l=a.map($=>{const X=$.id===D?" is-selected":"",Lt=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',we=Se($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${X}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${Lt}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${we}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${u?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${u?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=t.map($=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${Se($.access)}</span>
            <span class="muted small">Shared with you · ${c($.access)}</span>
          </span>
        </div>`).join(""),m=U.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=yt.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':yt.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${Se($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${u?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=e!=null&&e.color&&e.color.length>=7?e.color.slice(0,7):"#3B82F6",i=!!(e&&e.readOnly),p=z&&e&&e.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${It()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(e.uri)}
                    <button type="button" class="info-btn" data-action="info" data-info="calendar-details"
                      aria-label="About calendar details" title="About calendar details"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                    <label>
                      Display name
                      <input type="text" name="displayname" required maxlength="200"
                        value="${c(e.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${c(s)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${c(e.color||s)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${c(e.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${u?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(e.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${bt(`Share “${e.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${U.length===0?"disabled":""}>
                        <option value="">${U.length?"Select user…":"No other users"}</option>
                        ${m}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${i?"disabled":""}>
                        <option value="read" selected>Read only</option>
                        ${i?"":'<option value="readwrite">Full access</option>'}
                      </select>
                      ${i?'<input type="hidden" name="access" value="read" />':""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${u||U.length===0?"disabled":""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${n}</tbody>
                    </table>
                  </div>
                </section>
                <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${bt("Import / export","import-export")}
                  ${e.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${u?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${u||e.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${u||e.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                  ${gt?`<div class="flash flash-${gt.ok?"success":"error"} import-result" role="status">
                          <strong>Import result:</strong> ${c(gt.message)}
                        </div>`:""}
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",h=rt!==null?O.find($=>$.id===rt&&$.canShare)??null:null,v=h?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${It()}
              <p>You are about to permanently delete <strong>${c(h.displayname)}</strong>
                <span class="muted small mono">(${c(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${u?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${h.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",M=$t?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${It()}
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a personal calendar, optional holidays feed, or a read-only calendar.
                <button type="button" class="info-btn" data-action="info" data-info="add-calendar"
                  aria-label="About add calendar" title="About add calendar"
                  style="vertical-align:middle;margin-left:0.25rem">
                  <span aria-hidden="true">i</span>
                </button>
              </p>
              <form class="stack" data-form="create-cal">
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
                    ${K.map($=>`<option value="${c($.code)}">${c($.name)} (${c($.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${u?"disabled":""}>Create calendar</button>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${u?"disabled":""}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>`:"",x=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${bt("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${bt("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${u?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${We()}
      </div>
      ${M}
      ${p}
      ${v}
      ${Xe()}`,k=nt.map($=>`<div class="cal-row${$.id===T?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${u?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${u?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),I=nt.find($=>$.id===T)??null,tt=kt.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${qt?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:kt.map($=>{const X=!Y&&$.uri===j?" is-selected":"",Lt=c(($.displayname||"?").slice(0,1).toUpperCase()),we=$.hasPhoto&&T!==null?`<img class="contact-avatar" src="${c(L.contactPhotoUrl(T,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${Lt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Lt}</span>`;return`<tr class="contact-table-row${X}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${we}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),b=w,F=Array.isArray(b==null?void 0:b.emails)&&b.emails.length>0?b.emails:[""],S=Array.isArray(b==null?void 0:b.phones)&&b.phones.length>0?b.phones:[{type:"cell",value:""}],P=(b==null?void 0:b.address)??Oe(),_=F.map(($,X)=>`<div class="multi-row" data-multi="email" data-idx="${X}">
          <input type="email" name="email_${X}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${X}" ${F.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),H=S.map(($,X)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${X}">
          <select name="phone_type_${X}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Lt=>`<option value="${Lt}" ${(($==null?void 0:$.type)??"other")===Lt?"selected":""}>${Lt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${X}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${X}" ${S.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),lt=Array.isArray(b==null?void 0:b.custom)?b.custom:[],te=lt.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':lt.map(($,X)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${X}">
                <input type="text" name="custom_label_${X}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${X}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${X}" title="Remove">×</button>
              </div>`).join(""),jt=Q&&b&&I?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${Y?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${It()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${et?`<img src="${c(et)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((b.fullname||b.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${u?"aria-disabled=true":""}>
                        ${et?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${u?"disabled":""} hidden />
                      </label>
                      ${et||b.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${u?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${c(b.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${c(b.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${c(b.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${c(b.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${c(b.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${_}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${F.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${H}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${S.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${c(P.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${c(P.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${c(P.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${c(P.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${c(P.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${c(b.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${Pt({field:"birthday",name:"birthday",label:"Birthday",value:b.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${te}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${lt.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(b.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${u?"disabled":""}>${Y?"Create contact":"Save contact"}</button>
                    ${!Y&&b.uri?`<button type="button" class="btn" data-action="export-contact" ${u?"disabled":""}>Export .vcf</button>`:""}
                    ${Y?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${u?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${u?"disabled":""}>Cancel</button>
                    ${!Y&&b.uri?`<span class="muted small mono">${c(b.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",ie=ot&&I?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${It()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(I.uri)} · ${I.cardCount} contact${I.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${c(I.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(I.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${u?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(I.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${bt("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${u?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${u?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${u?"disabled":""} hidden />
                      </label>
                    </div>
                    ${Et?`<div class="flash flash-${Et.ok?"success":"error"} import-result" role="status">
                            <strong>Import:</strong> ${c(Et.message)}
                          </div>`:""}
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Ct=dt!==null?nt.find($=>$.id===dt)??null:null,ge=Ct?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${It()}
              <p>You are about to permanently delete <strong>${c(Ct.displayname)}</strong>
                <span class="muted small mono">(${c(Ct.uri)})</span>.</p>
              <p class="muted small">${(Ct.cardCount??0)>0?`All ${Ct.cardCount} contact${Ct.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${u?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Ct.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",ve=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${bt("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${k||'<p class="muted">No address books yet. Create one below.</p>'}
            </div>
            <div class="contacts-sidebar-create">
              <h3 class="h3-inline">Add address book</h3>
              <form class="stack stack-tight" data-form="create-ab" style="margin-top:0.5rem">
                <label>Display name
                  <input type="text" name="displayname" required maxlength="200" placeholder="Personal" autocomplete="off" />
                </label>
                <label>Description
                  <input type="text" name="description" maxlength="2000" placeholder="Optional" />
                </label>
                <button type="submit" class="btn btn-primary" ${u?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${I?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${bt("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(qt)}" aria-label="Search contacts" ${u?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${u?"disabled":""}>Add contact</button>
                    </div>
                  </div>
                  <div class="contacts-table-wrap contacts-table-wrap-tall">
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
                        ${tt}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${ge}
      ${ie}
      ${jt}`,ce=E==="calendars"?"my-calendars":E==="contacts"?"my-contacts":E==="tasks"?"tasks":"notes",ee=ra(),$e=oa(),de=E==="calendars"?x:E==="contacts"?ve:E==="tasks"?ee:$e;r.innerHTML=Ae(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${E==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${E==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${E==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${E==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${E==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${E==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${E==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${E==="notes"}">
            Notes
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${ce}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${de}
    `),document.body.classList.toggle("cal-modal-open",z||$t||rt!==null||dt!==null||wt||Q||ot),document.body.classList.toggle("layout-contacts",E==="contacts"),document.body.classList.toggle("layout-calendars",E==="calendars"),document.body.classList.toggle("layout-tasks",E==="tasks"||E==="notes")}function na(a){const t=new Map;for(const p of a)p.uid&&t.set(p.uid,p);const e=new Map(a.map((p,h)=>[W(p.instanceId,p.uri),h])),l=new Map,o=[];for(const p of a){const h=p.parentUid;if(h&&t.has(h)&&h!==p.uid){const v=l.get(h)??[];v.push(p),l.set(h,v)}else o.push(p)}const m=(p,h)=>(e.get(W(p.instanceId,p.uri))??0)-(e.get(W(h.instanceId,h.uri))??0);o.sort(m);for(const[,p]of l)p.sort(m);const n=[],s=new Set,i=(p,h)=>{const v=p.uid||W(p.instanceId,p.uri);if(!s.has(v)){s.add(v),n.push({task:p,depth:Math.min(h,8)});for(const M of l.get(p.uid)??[])i(M,h+1);s.delete(v)}};for(const p of o)i(p,0);for(const p of a)n.some(h=>h.task===p)||n.push({task:p,depth:0});return n}function sa(a){const t=new Set([a]);if(!a)return t;let e=!0;for(;e;){e=!1;for(const l of at)l.parentUid&&t.has(l.parentUid)&&l.uid&&!t.has(l.uid)&&(t.add(l.uid),e=!0)}return t}function la(a,t){const e=a.instanceId,l=t||!a.uid?new Set:sa(a.uid),o=at.filter(s=>s.uid&&s.instanceId===e&&!l.has(s.uid)&&s.uid!==a.uid),m=a.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(s=>`<option value="${c(s.uid)}" ${s.uid===m?"selected":""}>${c(s.summary||s.uid)}</option>`)];if(m&&!o.some(s=>s.uid===m)){const s=at.find(i=>i.uid===m);n.push(`<option value="${c(m)}" selected>${c((s==null?void 0:s.summary)||m)} (current)</option>`)}return n.join("")}function Le(){const a=new Set(G);return at.filter(t=>a.has(W(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function ra(){const a=k=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[k]||k,t=na(at),e=at.filter(k=>k.canWrite&&!k.readOnly).map(k=>W(k.instanceId,k.uri)),l=e.length>0&&e.every(k=>G.includes(k)),o=G.length>0,n=Le().length,s=at.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${se?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:k,depth:I})=>{const tt=W(k.instanceId,k.uri),b=!B&&tt===st?" is-selected":"",F=G.includes(tt),S=k.status==="COMPLETED"?"badge-ok":k.status==="CANCELLED"?"":"badge-admin",P=I>0?` style="--task-depth:${I}"`:"",_=I>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",H=k.canWrite&&!k.readOnly;return`<tr class="contact-table-row task-row${I>0?" is-subtask":""}${b}${F?" is-checked":""}" data-action="select-task" data-instance="${k.instanceId}" data-uri="${c(k.uri)}" tabindex="0" role="button"${P}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${k.instanceId}" data-uri="${c(k.uri)}"
                    ${F?"checked":""} ${H?"":"disabled"} aria-label="Select ${c(k.summary||k.uri)}" ${u?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${_}<span class="contact-name-primary">${c(k.summary||k.uri)}</span></span>
                  ${k.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${S}">${c(a(k.status))}</span></td>
                <td class="col-task-due muted small">${c(xe(k.due))}</td>
                <td class="col-task-cal muted small">${c(k.calendarName)}</td>
                <td class="col-task-pct muted small">${k.percent?c(String(k.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,p=(k,I)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${k}"
        title="${c(I)}" aria-label="${c(I)}" ${u||n===0?"disabled":""}>${i}</button>`,h=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${G.length!==n?`<span class="muted small bulk-bar-count-extra">(${G.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${u||n===0?"disabled":""}>
                    <option value="">—</option>
                    <option value="NEEDS-ACTION">To do</option>
                    <option value="IN-PROCESS">In progress</option>
                    <option value="COMPLETED">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
                ${p("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${Pt({field:"bulk-due",name:"bulkDue",label:"Due",value:ne,dateOnly:!1,disabled:u||n===0,allowClear:!0})}
                ${p("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${u||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${u||n===0?"disabled":""} />
                </label>
                ${p("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${u||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${u?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",v=q,M=Ft.map(k=>`<option value="${k.id}" ${v&&v.instanceId===k.id?"selected":""}>${c(k.displayname)}</option>`).join(""),x=v?`<div class="card">
            ${bt(B?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${B?`<label>Calendar
                      <select name="instanceId" required ${Ft.length===0?"disabled":""}>
                        <option value="">${Ft.length?"Select calendar…":"No writable calendars"}</option>
                        ${M}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(v.calendarName)}</strong>${v.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(v.summary)}" ${v.readOnly&&!B?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${v.readOnly&&!B?"readonly":""}>${c(v.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${v.readOnly&&!B?"disabled":""}>
                  ${la(v,B)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${v.readOnly&&!B?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(k=>`<option value="${k}" ${v.status===k?"selected":""}>${c(a(k))}</option>`).join("")}
                  </select>
                </label>
                ${Pt({field:"due",name:"due",label:"Due",value:Vt(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!B),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${c(String(v.priority||0))}" ${v.readOnly&&!B?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${c(String(v.percent||0))}" ${v.readOnly&&!B?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${B||v.canWrite?`<button type="submit" class="btn btn-primary" ${u?"disabled":""}>${B?"Create task":"Save task"}</button>`:""}
                ${!B&&v.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${u?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${u?"disabled":""}>Delete</button>`:B?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${bt("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(se)}" aria-label="Search tasks" ${u?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${u||Ft.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Ft.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${e.length===0||u?"disabled":""} />
                </th>
                ${At("Title","summary",Tt,Dt,"task","col-task-title")}
                ${At("Status","status",Tt,Dt,"task","col-task-status")}
                ${At("Due","due",Tt,Dt,"task","col-task-due")}
                ${At("Calendar","calendar",Tt,Dt,"task","col-task-cal")}
                ${At("%","percent",Tt,Dt,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function oa(){const a=Jt.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${le?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Jt.map(o=>{const m=W(o.instanceId,o.uri),n=!Z&&m===vt?" is-selected":"",s=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${c(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(o.summary||o.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${c(s)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(xe(o.dtstart))}</td>
                <td class="col-note-cal muted small">${c(o.calendarName)}</td>
              </tr>`}).join(""),t=V,e=Mt.map(o=>`<option value="${o.id}" ${t&&t.instanceId===o.id?"selected":""}>${c(o.displayname)}</option>`).join(""),l=t?`<div class="card">
            ${bt(Z?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${Z?`<label>Calendar
                      <select name="instanceId" required ${Mt.length===0?"disabled":""}>
                        <option value="">${Mt.length?"Select calendar…":"No writable calendars"}</option>
                        ${e}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${t.readOnly&&!Z?"readonly":""} />
              </label>
              ${Pt({field:"dtstart",name:"dtstart",label:"Date",value:Vt(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!Z),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!Z?"readonly":""}>${c(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${Z||t.canWrite?`<button type="submit" class="btn btn-primary" ${u?"disabled":""}>${Z?"Create note":"Save note"}</button>`:""}
                ${!Z&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${u?"disabled":""}>Delete</button>`:Z?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${bt("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(le)}" aria-label="Search notes" ${u?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${u||Mt.length===0?"disabled":""}>Add note</button>
        </div>
        ${Mt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${At("Title","summary",Bt,Rt,"note","col-note-title")}
                ${At("Date","dtstart",Bt,Rt,"note","col-note-date")}
                ${At("Calendar","calendar",Bt,Rt,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${a}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function ia(){const a=r.querySelector(".contacts-table-wrap"),t=r.querySelector(".contacts-ab-list"),e=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(a==null?void 0:a.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(e==null?void 0:e.scrollTop)??null}}function ca(a){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(a.windowX,a.windowY),a.tableTop!==null){const t=r.querySelector(".contacts-table-wrap");t&&(t.scrollTop=a.tableTop)}if(a.abListTop!==null){const t=r.querySelector(".contacts-ab-list");t&&(t.scrollTop=a.abListTop)}if(a.calListTop!==null){const t=r.querySelector(".calendars-owned-list");t&&(t.scrollTop=a.calListTop)}})})}function d(){const a=ia();f?aa():Ie(),da(),ca(a),requestAnimationFrame(()=>{var t;ze(),(t=r.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function qe(a){const t=a.querySelector('input[name="color_picker"]'),e=a.querySelector('input[name="color"]');!t||!e||(t.addEventListener("input",()=>{e.value=t.value.toUpperCase()}),e.addEventListener("change",()=>{let l=e.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(t.value=l.slice(0,7),e.value=l.toUpperCase())}))}function da(){r.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",F=>{const S=F.target.closest("[data-action]");((S==null?void 0:S.dataset.action)==="info"||(S==null?void 0:S.dataset.action)==="info-close")&&(F.preventDefault(),F.stopPropagation()),wa(F)})}),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(b=>{b.addEventListener("keydown",F=>{(F.key==="Enter"||F.key===" ")&&(F.preventDefault(),b.click())})});const a=r.querySelector("#delete-cal-confirm"),t=r.querySelector("#delete-cal-submit");a==null||a.addEventListener("change",()=>{t&&(t.disabled=!a.checked||u)});const e=r.querySelector("#delete-ab-confirm"),l=r.querySelector("#delete-ab-submit");e==null||e.addEventListener("change",()=>{l&&(l.disabled=!e.checked||u)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(b=>{b.addEventListener("error",()=>{const F=b.dataset.avatarFallback||"?",S=document.createElement("span");S.className="contact-avatar contact-avatar-fallback",S.setAttribute("aria-hidden","true"),S.textContent=F,b.replaceWith(S)})}),Ce||(document.addEventListener("keydown",b=>{b.key==="Escape"&&Fe()}),Ce=!0);const o=r.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",b=>{b.preventDefault(),ya(o)});const m=r.querySelector('[data-form="share"]');m==null||m.addEventListener("submit",b=>{b.preventDefault(),ha(m)});const n=r.querySelector('[data-form="edit-cal"]');n&&(qe(n),n.addEventListener("submit",b=>{b.preventDefault(),va(n)}));const s=r.querySelector('[data-form="edit-event"]');s==null||s.addEventListener("submit",b=>{b.preventDefault(),ga(s)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(b=>{b.addEventListener("change",()=>{if(!y)return;const F=r.querySelector('[data-form="edit-event"]');if(!F)return;const S=new FormData(F),P=F.querySelector('input[name="allDay"]'),_=Zt(S);_.endMode==="until"&&!_.until&&(_.until=Ut(String(S.get("start")??y.start??""))||J(new Date)),y={...y,summary:String(S.get("summary")??y.summary),description:String(S.get("description")??y.description),location:String(S.get("location")??y.location),instanceId:Number(S.get("instanceId"))||y.instanceId,allDay:(P==null?void 0:P.checked)??y.allDay,start:String(S.get("start")??y.start??""),end:String(S.get("end")??y.end??"")||null,repeat:_,hasRrule:!!String(S.get("repeatFreq")??"").trim()},_.freq&&_.endMode==="until"&&(C==null?void 0:C.field)==="end"&&(C=null),d(),_.endMode==="until"&&requestAnimationFrame(()=>{var lt;const H=r.querySelector('input[name="repeatUntil"]');H==null||H.focus();try{(lt=H==null?void 0:H.showPicker)==null||lt.call(H)}catch{}})})});const i=r.querySelector('[data-form="create-cal"]');i&&(qe(i),i.addEventListener("submit",b=>{b.preventDefault(),$a(i)}));const p=r.querySelector('[data-form="create-ab"]');p==null||p.addEventListener("submit",b=>{b.preventDefault(),Na(p)});const h=r.querySelector('[data-form="edit-ab"]');h==null||h.addEventListener("submit",b=>{b.preventDefault(),Ea(h)});const v=r.querySelector('[data-form="contact"]');v==null||v.addEventListener("submit",b=>{b.preventDefault(),Ca(v)});const M=r.querySelector('[data-form="task"]');if(M==null||M.addEventListener("submit",b=>{b.preventDefault(),ma(M)}),M){const b=M.querySelector('select[name="instanceId"]');b==null||b.addEventListener("change",()=>{if(!B||!q)return;const F=Number(b.value);if(!Number.isFinite(F)||F<=0)return;const S=new FormData(M),P=String(S.get("due")??"").trim();q={...q,instanceId:F,parentUid:q.parentUid&&at.some(_=>_.uid===q.parentUid&&_.instanceId===F)?q.parentUid:null,summary:String(S.get("summary")??""),description:String(S.get("description")??""),status:String(S.get("status")??"NEEDS-ACTION"),due:P?new Date(P).toISOString():null,priority:Number(S.get("priority")??0),percent:Number(S.get("percent")??0)},d()})}const x=r.querySelector('[data-form="note"]');x==null||x.addEventListener("submit",b=>{b.preventDefault(),pa(x)});const k=r.querySelector('input[data-action="contact-search"]');k==null||k.addEventListener("input",()=>{St&&clearTimeout(St),St=setTimeout(()=>{qt=k.value,T!==null&&(async()=>{try{await Ot(T),d()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),d()}})()},250)});const I=r.querySelector('input[data-action="task-search"]');I==null||I.addEventListener("input",()=>{St&&clearTimeout(St),St=setTimeout(()=>{se=I.value,(async()=>{try{await _t(),d()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),d()}})()},250)});const tt=r.querySelector('input[data-action="note-search"]');tt==null||tt.addEventListener("input",()=>{St&&clearTimeout(St),St=setTimeout(()=>{le=tt.value,(async()=>{try{await Xt(),d()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),d()}})()},250)}),ka(),ba(),fa()}async function ua(a){var o,m;const t=Le();if(t.length===0){g("error","No writable tasks selected"),d();return}const e=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(a==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;u=!0,A(),d();try{const n=await L.bulkTasks({op:"delete",items:e});G=[],st&&t.some(s=>W(s.instanceId,s.uri)===st)&&(st=null,q=null,B=!1),await _t(),n.failed>0?g("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk delete failed")}finally{u=!1,d()}return}let l={};if(a==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!s){g("error","Choose a status to apply"),d();return}l={status:s}}else if(a==="bulk-task-due"){const n=ne.trim();if(!n){g("error","Choose a due date to apply"),d();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){g("error","Invalid due date"),d();return}l={due:s.toISOString()}}else if(a==="bulk-task-clear-due")l={due:null};else if(a==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((m=n==null?void 0:n.value)==null?void 0:m.trim())??"";if(s===""){g("error","Enter a percent complete (0–100)"),d();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){g("error","Percent must be between 0 and 100"),d();return}l={percent:Math.round(i)}}u=!0,A(),d();try{const n=await L.bulkTasks({op:"update",items:e,fields:l});if(await _t(),q&&!B){const i=W(q.instanceId,q.uri),p=at.find(h=>W(h.instanceId,h.uri)===i);p&&(q={...p})}const s=a==="bulk-task-status"?"status":a==="bulk-task-due"||a==="bulk-task-clear-due"?"due date":"percent";n.failed>0?g("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk update failed")}finally{u=!1,d()}}async function ma(a){const t=new FormData(a),e=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("status")??"NEEDS-ACTION"),m=String(t.get("due")??"").trim(),n=m?new Date(m).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),p=String(t.get("parentUid")??"").trim(),h=p===""?null:p;u=!0,A(),d();try{if(B){const v=Number(t.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const M=await L.createTask({instanceId:v,summary:e,description:l,status:o,due:n,priority:s,percent:i,parentUid:h});B=!1,st=W(M.task.instanceId,M.task.uri),q=M.task,g("success",h?"Subtask created":"Task created")}else if(q){const v=await L.updateTask(q.instanceId,q.uri,{summary:e,description:l,status:o,due:n,priority:s,percent:i,parentUid:h});q=v.task,st=W(v.task.instanceId,v.task.uri),g("success","Task saved")}await _t()}catch(v){g("error",v instanceof Error?v.message:"Save failed")}finally{u=!1,d()}}async function pa(a){const t=new FormData(a),e=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("dtstart")??"").trim(),m=o?new Date(o).toISOString():null;u=!0,A(),d();try{if(Z){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await L.createNote({instanceId:n,summary:e,description:l,dtstart:m});Z=!1,vt=W(s.note.instanceId,s.note.uri),V=s.note,g("success","Note created")}else if(V){const n=await L.updateNote(V.instanceId,V.uri,{summary:e,description:l,dtstart:m});V=n.note,vt=W(n.note.instanceId,n.note.uri),g("success","Note saved")}await Xt()}catch(n){g("error",n instanceof Error?n.message:"Save failed")}finally{u=!1,d()}}function fa(){const a=r.querySelector('input[data-action="contact-photo"]');a&&a.addEventListener("change",()=>{(async()=>{var e;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){if(t.size>2.5*1024*1024){g("error","Photo is too large (max ~2 MB)"),d();return}try{const l=await ea(t);it=l,et=`data:${t.type||"image/jpeg"};base64,${l}`,ut=!1,d()}catch(l){g("error",l instanceof Error?l.message:"Failed to read photo"),d()}}})()})}function ba(){const a=r.querySelector('[data-form="create-cal"]');if(!a)return;const t=a.querySelector('input[name="holidays"]'),e=a.querySelector("#holidays-country-wrap"),l=a.querySelector('input[name="displayname"]'),o=a.querySelector('input[name="readOnly"]');if(!t||!e)return;const m=()=>{const n=t.checked;e.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};t.addEventListener("change",m),m()}async function ya(a){const t=new FormData(a),e=String(t.get("username")??""),l=String(t.get("password")??"");u=!0,A(),d();try{f=(await L.login(e,l)).user,await mt(),g("success","Signed in")}catch(o){g("error",o instanceof Error?o.message:"Login failed")}finally{u=!1,d()}}async function ha(a){if(D===null)return;const t=new FormData(a),e=String(t.get("username")??""),l=String(t.get("access")??"read");z=!0,u=!0,A(),d();try{await L.share(D,e,l),await Kt(D),g("success",`Shared with ${e}`)}catch(o){g("error",o instanceof Error?o.message:"Share failed")}finally{u=!1,d()}}function Qt(a){if(!y)return;const t=new FormData(a),e=a.querySelector('input[name="allDay"]');y={...y,summary:String(t.get("summary")??y.summary),description:String(t.get("description")??y.description),location:String(t.get("location")??y.location),instanceId:Number(t.get("instanceId"))||y.instanceId,allDay:(e==null?void 0:e.checked)??y.allDay,start:String(t.get("start")??y.start??""),end:String(t.get("end")??y.end??"")||null,repeat:Zt(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function Zt(a){const t=String(a.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const e=Math.max(1,Math.min(99,Number(a.get("repeatInterval")??1)||1)),l=String(a.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let m=null,n=null;if(o==="until"){const i=String(a.get("repeatUntil")??"").trim();m=i?i.slice(0,10):null}else if(o==="count"){const i=Number(a.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=a.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:e,until:m,count:n,byDay:s,endMode:o}}async function ga(a){if(!y||!y.canWrite)return;const t=new FormData(a),e=String(t.get("summary")??"").trim(),l=String(t.get("description")??"").trim(),o=String(t.get("location")??"").trim(),m=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||y.instanceId,p=Zt(t);if(!e){g("error","Title is required"),d();return}if(!n){g("error","Start is required"),d();return}let h,v;if(m)h=n.slice(0,10),v=s?s.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const I=fe(n,s||null);h=new Date(I.start).toISOString(),v=I.end?new Date(I.end).toISOString():null}else h=new Date(n).toISOString(),v=s?new Date(s).toISOString():null;const M=y.instanceId,x=y.uri,k=ht;u=!0,A(),wt=!0,d();try{const I={summary:e,description:l,location:o,allDay:m,start:h,end:v,instanceId:i,repeat:p},tt=k?await L.createEvent(i,I):await L.updateEvent(M,x,I);(D===null||tt.event.instanceId!==D)&&(D=tt.event.instanceId),await pt(),wt=!1,y=null,ht=!1,C=null,g("success",k?"Event created":"Event saved")}catch(I){g("error",I instanceof Error?I.message:"Save failed")}finally{u=!1,d()}}async function va(a){if(D===null)return;const t=new FormData(a),e=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim();u=!0,A(),d();try{const m=await L.updateCalendar(D,{displayname:e,description:l,color:o});z=!0,await mt(),D=m.calendar.id,await Kt(D),await pt(),g("success","Calendar updated")}catch(m){g("error",m instanceof Error?m.message:"Update failed")}finally{u=!1,d()}}async function $a(a){const t=new FormData(a),e=String(t.get("displayname")??"").trim(),l=String(t.get("description")??""),o=String(t.get("color")??"").trim(),m=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if($t=!0,m&&!n){g("error","Select a country for the holidays calendar"),d();return}if(!m&&!e){g("error","Display name is required"),d();return}u=!0,A(),gt=null,d();try{const i=await L.createCalendar({displayname:e,description:l,color:o,holidays:m,holidayCountry:m?n:void 0,readOnly:s});D=i.calendar.id,$t=!1,await mt();let p=`Created “${i.calendar.displayname}”`;const h=i.holidayImport??i.calendar.holidayImport;h&&(p+=`. Holidays imported: ${ue(h)}.`,gt={ok:!0,message:ue(h)}),s&&(p+=" Calendar is read-only."),g("success",p)}catch(i){$t=!0,g("error",i instanceof Error?i.message:"Create failed")}finally{u=!1,d()}}async function wa(a){var l,o,m;const t=a.target.closest("[data-action]");if(!t)return;const e=t.dataset.action;if(e==="logout"){u=!0;try{await L.logout()}catch{}f=null,O=[],yt=[],D=null,nt=[],T=null,kt=[],j=null,w=null,Y=!1,Q=!1,ot=!1,$t=!1,A(),u=!1,d();return}if(e==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;D=n,gt=null,u=!0,A(),d();try{await pt()}catch(s){g("error",s instanceof Error?s.message:"Failed to load calendar")}finally{u=!1,d()}return}if(e==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!O.find(i=>i.id===n&&i.canShare))return;D=n,z=!0,rt=null,gt=null,u=!0,A(),d();try{await Kt(n),await pt()}catch(i){g("error",i instanceof Error?i.message:"Failed to open calendar")}finally{u=!1,d()}return}if(e==="close-cal-modal"){z=!1,d();return}if(e==="open-create-cal-modal"){$t=!0,z=!1,rt=null,A(),d();return}if(e==="close-create-cal-modal"){$t=!1,A(),d();return}if(e==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!O.find(i=>i.id===n&&i.canShare))return;rt=n,z=!1,A(),d();return}if(e==="cancel-delete-cal"){rt=null,d();return}if(e==="confirm-delete-cal"){const n=Number(t.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;u=!0,A(),d();try{if(await L.deleteCalendar(n),D===n&&(D=null),rt=null,z=!1,yt=[],Wt=[],await mt(),D===null){const i=Ne();i&&(D=i.id,await pt())}g("success","Calendar deleted")}catch(i){g("error",i instanceof Error?i.message:"Delete failed")}finally{u=!1,d()}return}if(e==="month-today"){const n=new Date;Nt={y:n.getFullYear(),m:n.getMonth()},Ht=null,u=!0,d();try{await pt()}finally{u=!1,d()}return}if(e==="month-prev"||e==="month-next"){const n=e==="month-prev"?-1:1,s=new Date(Nt.y,Nt.m+n,1);Nt={y:s.getFullYear(),m:s.getMonth()},Ht=null,u=!0,d();try{await pt()}finally{u=!1,d()}return}if(e==="open-event"){a.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;u=!0,A(),d();try{const i=await L.getEvent(n,s);y={...i.event,repeat:i.event.repeat??re()},ht=!1,wt=!0,C=null,z=!1,rt=null}catch(i){g("error",i instanceof Error?i.message:"Failed to open event")}finally{u=!1,d()}return}if(e==="open-event-day"){a.stopPropagation();const n=t.dataset.day??"";Ht=Ht===n?null:n,d();return}if(e==="new-event-day"){const n=a.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(D===null){g("error","Select a calendar first"),d();return}const i=O.find(p=>p.id===D);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){g("error","This calendar is read-only"),d();return}ht=!0,y=Qe(s,D),wt=!0,C=null,z=!1,rt=null,A(),d();return}if(e==="close-event-modal"){wt=!1,y=null,ht=!1,C=null,A(),d();return}if(e==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&y&&Qt(s),(C==null?void 0:C.field)===n)C=null;else{const i=t.dataset.dtDateOnly==="1",p=t.dataset.dtClear!=="0",h=t.dataset.dtName||n;let v=he(n);!v&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(v=Gt().start);const M=zt(v||J(new Date)),[x,k]=M.date.split("-").map(Number);C={field:n,viewY:x,viewM:(k||1)-1,dateOnly:i,allowClear:p,name:h}}d();return}if(e==="dt-month-prev"||e==="dt-month-next"){if(!C)return;const n=e==="dt-month-prev"?-1:1,s=new Date(C.viewY,C.viewM+n,1);C={...C,viewY:s.getFullYear(),viewM:s.getMonth()},d();return}if(e==="dt-pick-day"){if(!C)return;const n=C.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&Qt(i);const p=C.dateOnly;if(p)ft(n,s),C=null;else{const h=he(n),v=zt(h||Gt(s).start).hm;ft(n,`${s}T${v}`),C={...C,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&y&&!p&&y.end){const h=new Date(String(y.start)),v=new Date(String(y.end));!Number.isNaN(h.getTime())&&!Number.isNaN(v.getTime())&&v<=h&&ft("end",xt(new Date(h.getTime()+3600*1e3)))}d();return}if(e==="dt-pick-time"){if(!C||C.dateOnly)return;const n=C.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&Qt(i);const p=he(n)||Gt().start,v=`${zt(p).date}T${s}`;if(ft(n,v),n==="start"&&y){y={...y,allDay:!1};const M=y.end?zt(String(y.end)):null,x=new Date(v);(!M||new Date(`${M.date}T${M.hm}`)<=x)&&ft("end",xt(new Date(x.getTime()+3600*1e3)))}C=null,d();return}if(e==="dt-today"){if(!C)return;const n=C.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&Qt(s);const i=J(new Date);if(C.dateOnly)ft(n,i);else{const p=Gt(i);n==="start"?(ft("start",p.start),y&&!y.end&&ft("end",p.end)):n==="end"?ft("end",p.end):ft(n,p.start)}C=null,d();return}if(e==="dt-clear"){if(!C||!C.allowClear)return;const n=C.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&Qt(s),ft(n,null),C=null,d();return}if(e==="event-allday-toggle"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),p=String(i.get("start")??y.start??""),h=String(i.get("end")??y.end??"")||null;let v=p,M=h;if(s){const x=Be(p,h);v=x.start,M=x.end}else{const x=p.slice(0,10),k=(h||p).slice(0,10),I=fe(x,k);v=I.start,M=I.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:s,start:v,end:M,repeat:Zt(i)}}else y={...y,allDay:s};C=null,d();return}if(e==="event-repeat-freq"||e==="event-repeat-end"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),p=Zt(s);y={...y,summary:String(s.get("summary")??y.summary),description:String(s.get("description")??y.description),location:String(s.get("location")??y.location),instanceId:Number(s.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(s.get("start")??y.start??""),end:String(s.get("end")??y.end??"")||null,repeat:p,hasRrule:!!String(s.get("repeatFreq")??"").trim()},p.freq&&p.endMode==="until"&&(C==null?void 0:C.field)==="end"&&(C=null),d();return}if(e==="delete-event"){if(!y||!y.canWrite||ht||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,s=y.uri;u=!0,A(),d();try{await L.deleteEvent(n,s),wt=!1,y=null,await pt(),g("success","Event deleted")}catch(i){g("error",i instanceof Error?i.message:"Delete failed")}finally{u=!1,d()}return}if(e==="info"){const n=t.dataset.info??"";Ta(n);return}if(e==="info-close"){Fe();return}if(e==="flash-close"){A(),d();return}if(e==="tab"){const n=t.dataset.tab;if(n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"){E=n,n!=="calendars"&&(z=!1,rt=null),n!=="contacts"&&(dt=null),A(),u=!0,d();try{n==="contacts"&&T!==null?await Ot(T):n==="calendars"?await pt():n==="tasks"?await _t():n==="notes"&&await Xt()}catch(s){g("error",s instanceof Error?s.message:"Failed to load")}finally{u=!1,d()}}return}if(e==="sort-task"||e==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(e==="sort-task"){Tt===n?Dt=Dt==="asc"?"desc":"asc":(Tt=n,Dt=n==="due"||n==="summary"?"asc":"desc"),u=!0,d();try{await _t()}catch(s){g("error",s instanceof Error?s.message:"Sort failed")}finally{u=!1,d()}}else{Bt===n?Rt=Rt==="asc"?"desc":"asc":(Bt=n,Rt="asc"),u=!0,d();try{await Xt()}catch(s){g("error",s instanceof Error?s.message:"Sort failed")}finally{u=!1,d()}}return}if(e==="select-task"){if(a.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=at.find(p=>p.instanceId===n&&p.uri===s)??null;B=!1,st=W(n,s),q=i?{...i}:null,A(),d();return}if(e==="task-check"){a.preventDefault(),a.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=W(n,s),p=at.find(h=>W(h.instanceId,h.uri)===i);if(!p||!p.canWrite||p.readOnly)return;G.includes(i)?G=G.filter(h=>h!==i):G=[...G,i],d();return}if(e==="task-select-all"){a.preventDefault();const n=at.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>G.includes(W(i.instanceId,i.uri)))?G=[]:G=n.map(i=>W(i.instanceId,i.uri)),d();return}if(e==="bulk-task-clear"){G=[],d();return}if(e==="bulk-task-status"||e==="bulk-task-due"||e==="bulk-task-clear-due"||e==="bulk-task-percent"||e==="bulk-task-delete"){ua(e);return}if(e==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=Jt.find(p=>p.instanceId===n&&p.uri===s)??null;Z=!1,vt=W(n,s),V=i?{...i}:null,A(),d();return}if(e==="new-task"){B=!0,st=null,q={uri:"",instanceId:((o=Ft[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),d();return}if(e==="new-subtask"){if(!q||B||!q.uid||!q.canWrite)return;const n=q;B=!0,st=null,q={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),d();return}if(e==="new-note"){Z=!0,vt=null,V={uri:"",instanceId:((m=Mt[0])==null?void 0:m.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},A(),d();return}if(e==="cancel-task"){B=!1,q=null,st=null,d();return}if(e==="cancel-note"){Z=!1,V=null,vt=null,d();return}if(e==="delete-task"){if(!q||B||!confirm("Delete this task? CalDAV clients will sync the removal."))return;u=!0,A(),d();try{await L.deleteTask(q.instanceId,q.uri),st=null,q=null,await _t(),g("success","Task deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{u=!1,d()}return}if(e==="delete-note"){if(!V||Z||!confirm("Delete this note? CalDAV clients will sync the removal."))return;u=!0,A(),d();try{await L.deleteNote(V.instanceId,V.uri),vt=null,V=null,await Xt(),g("success","Note deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{u=!1,d()}return}if(e==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;T=n,ot=!1,Et=null,j=null,w=null,Y=!1,Q=!1,qt="",kt=[],et=null,it=null,ut=!1,A(),u=!0,d();try{await Ot(n)}catch(s){g("error",s instanceof Error?s.message:"Failed to load contacts")}finally{u=!1,d()}return}if(e==="edit-ab"){a.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!nt.find(p=>p.id===n))return;const i=T!==n;T=n,ot=!0,Q=!1,Et=null,A(),i&&(j=null,w=null,Y=!1,qt="",kt=[],et=null,it=null,ut=!1),u=!0,d();try{i&&await Ot(n)}catch(p){g("error",p instanceof Error?p.message:"Failed to open address book")}finally{u=!1,d()}return}if(e==="close-ab-modal"){ot=!1,d();return}if(e==="select-contact"){const n=t.dataset.uri??"";if(!n)return;A();try{await Ze(n)}catch(s){g("error",s instanceof Error?s.message:"Failed to load contact")}d();return}if(e==="new-contact"){if(T===null)return;ta(),A(),d();return}if(e==="cancel-contact"||e==="close-contact-modal"){Y=!1,Q=!1,w=null,j=null,et=null,it=null,ut=!1,C=null,A(),d();return}if(e==="add-email"||e==="add-phone"||e==="add-custom"){if(!w)return;oe(),Array.isArray(w.emails)||(w.emails=[""]),Array.isArray(w.phones)||(w.phones=[{type:"cell",value:""}]),Array.isArray(w.custom)||(w.custom=[]),e==="add-email"?w.emails.length<10&&w.emails.push(""):e==="add-phone"?w.phones.length<10&&w.phones.push({type:"other",value:""}):w.custom.length<30&&w.custom.push({label:"",value:""}),d();return}if(e==="remove-email"){if(!w)return;oe();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(w.emails)?w.emails:[""];w.emails=s.filter((i,p)=>p!==n),w.emails.length===0&&(w.emails=[""]),d();return}if(e==="remove-phone"){if(!w)return;oe();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(w.phones)?w.phones:[{type:"cell",value:""}];w.phones=s.filter((i,p)=>p!==n),w.phones.length===0&&(w.phones=[{type:"cell",value:""}]),d();return}if(e==="remove-custom"){if(!w)return;oe();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;w.custom=(Array.isArray(w.custom)?w.custom:[]).filter((s,i)=>i!==n),d();return}if(e==="remove-photo"){et=null,it=null,ut=!0,w&&(w.hasPhoto=!1),d();return}if(e==="delete-contact"){if(T===null||!j||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;u=!0,A(),Q=!0,d();try{await L.deleteContact(T,j),j=null,w=null,Y=!1,Q=!1,C=null,et=null,await mt(),g("success","Contact deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{u=!1,d()}return}if(e==="delete-ab"){a.stopPropagation();const n=Number(t.dataset.id??T);if(!Number.isFinite(n)||!nt.find(i=>i.id===n))return;dt=n,ot=!1,Q=!1,A(),d();return}if(e==="cancel-delete-ab"){dt=null,d();return}if(e==="confirm-delete-ab"){const n=Number(t.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=nt.find(h=>h.id===n);if(!i)return;const p=(i.cardCount??0)>0;u=!0,A(),d();try{await L.deleteAddressBook(n,p),T===n&&(T=null,kt=[],w=null,j=null,Y=!1),dt=null,ot=!1,Q=!1,await mt(),T===null&&nt.length>0&&(T=nt[0].id,await Ot(T)),g("success","Address book deleted")}catch(h){g("error",h instanceof Error?h.message:"Delete failed")}finally{u=!1,d()}return}if(e==="export-ab"){if(T===null)return;ot=!0,u=!0,A(),d();try{const{blob:n,filename:s}=await L.exportAddressBook(T),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{u=!1,d()}return}if(e==="export-contact"){if(T===null||!j||Y)return;Q=!0,u=!0,A(),d();try{const{blob:n,filename:s}=await L.exportContact(T,j),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{u=!1,d()}return}if(e==="revoke"){const n=t.dataset.href??"";if(!n||D===null||!confirm("Revoke access for this user?"))return;z=!0,u=!0,A(),d();try{await L.revoke(D,n),await Kt(D),g("success","Share revoked")}catch(s){g("error",s instanceof Error?s.message:"Revoke failed")}finally{u=!1,d()}return}if(e==="export-cal"){if(D===null)return;z=!0,u=!0,A(),d();try{const{blob:n,filename:s}=await L.exportCalendar(D),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{u=!1,d()}}}function ka(){const a=r.querySelector('input[data-action="import-cal"]');a&&a.addEventListener("change",()=>{xa(a)});const t=r.querySelector('input[data-action="import-ab"]');t&&t.addEventListener("change",()=>{Sa(t)})}async function Sa(a){var e;if(T===null)return;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){ot=!0,u=!0,A(),Et=null,d();try{const l=await t.text(),o=await L.importAddressBook(T,l),m=ue(o);Et={ok:!0,message:m},await mt(),await Ot(T),g("success",`Import finished for “${t.name}”: ${m}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";Et={ok:!1,message:o},g("error",o)}finally{u=!1,d()}}}function oe(){if(!w)return;const a=r.querySelector('[data-form="contact"]');if(!a)return;const t=new FormData(a);w.firstname=String(t.get("firstname")??""),w.lastname=String(t.get("lastname")??""),w.fullname=String(t.get("fullname")??""),w.org=String(t.get("org")??""),w.title=String(t.get("title")??""),w.url=String(t.get("url")??""),w.note=String(t.get("note")??"");const e=String(t.get("birthday")??"").trim();w.birthday=e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null,w.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const l=[];let o=0;for(;t.has(`email_${o}`);)l.push(String(t.get(`email_${o}`)??"")),o++;l.length&&(w.emails=l);const m=[];for(o=0;t.has(`phone_value_${o}`);)m.push({type:String(t.get(`phone_type_${o}`)??"other"),value:String(t.get(`phone_value_${o}`)??"")}),o++;m.length&&(w.phones=m);const n=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);)n.push({label:String(t.get(`custom_label_${o}`)??""),value:String(t.get(`custom_value_${o}`)??"")}),o++;w.custom=n}function Da(a){const t=new FormData(a),e=[];let l=0;for(;t.has(`email_${l}`);){const s=String(t.get(`email_${l}`)??"").trim();s&&e.push(s),l++}const o=[];for(l=0;t.has(`phone_value_${l}`);){const s=String(t.get(`phone_value_${l}`)??"").trim();s&&o.push({type:String(t.get(`phone_type_${l}`)??"other"),value:s}),l++}const m=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);){const s=String(t.get(`custom_label_${l}`)??"").trim(),i=String(t.get(`custom_value_${l}`)??"").trim();(s||i)&&m.push({label:s,value:i}),l++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:e,phones:o,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:m};return ut?n.removePhoto=!0:it&&(n.photoBase64=it),n}async function Ca(a){if(T===null)return;const t=Da(a);u=!0,A(),Q=!0,d();try{if(Y){const e=await L.createContact(T,t);Y=!1,j=e.contact.uri,w=null,Q=!1,et=null,it=null,ut=!1,C=null,g("success","Contact created")}else j&&(j=(await L.updateContact(T,j,t)).contact.uri,w=null,Q=!1,et=null,it=null,ut=!1,C=null,g("success","Contact saved"));try{await mt()}catch(e){if(console.error(e),T!==null)try{await Ot(T)}catch{}}}catch(e){g("error",e instanceof Error?e.message:"Save failed")}finally{u=!1,d()}}async function Na(a){const t=new FormData(a),e=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();if(e){u=!0,A(),d();try{const o=await L.createAddressBook({displayname:e,description:l});T=o.addressbook.id,j=null,w=null,Y=!1,qt="",await mt(),g("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){g("error",o instanceof Error?o.message:"Create failed")}finally{u=!1,d()}}}async function Ea(a){if(T===null)return;const t=new FormData(a),e=String(t.get("displayname")??"").trim(),l=String(t.get("description")??"").trim();ot=!0,u=!0,A(),d();try{await L.updateAddressBook(T,{displayname:e,description:l}),await mt(),g("success","Address book updated")}catch(o){g("error",o instanceof Error?o.message:"Update failed")}finally{u=!1,d()}}function Ta(a){const t=qa[a];if(!t)return;const e=r.querySelector("#info-modal"),l=r.querySelector("#info-modal-title"),o=r.querySelector("#info-modal-body");if(!e||!l||!o)return;l.textContent=t.title,o.innerHTML=t.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),e.hidden=!1,document.body.classList.add("info-modal-open");const m=e.querySelector(".info-modal-close");m==null||m.focus()}function Fe(){const a=r.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function xa(a){var e;if(D===null)return;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){z=!0,u=!0,A(),gt=null,d();try{const l=await t.text(),o=await L.importCalendar(D,l),m=ue(o);gt={ok:!0,message:m},await pt(),g("success",`Import finished for “${t.name}”: ${m}.`)}catch(l){const o=l instanceof Error?l.message:"Import failed";gt={ok:!1,message:o},g("error",o)}finally{u=!1,d()}}}Ue()}const Re=document.getElementById("app");if(!Re)throw new Error("#app missing");Ma(Re);
