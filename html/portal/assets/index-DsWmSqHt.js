var Ja=Object.defineProperty;var za=(r,u,E)=>u in r?Ja(r,u,{enumerable:!0,configurable:!0,writable:!0,value:E}):r[u]=E;var Gt=(r,u,E)=>za(r,typeof u!="symbol"?u+"":u,E);(function(){const u=document.createElement("link").relList;if(u&&u.supports&&u.supports("modulepreload"))return;for(const A of document.querySelectorAll('link[rel="modulepreload"]'))C(A);new MutationObserver(A=>{for(const R of A)if(R.type==="childList")for(const H of R.addedNodes)H.tagName==="LINK"&&H.rel==="modulepreload"&&C(H)}).observe(document,{childList:!0,subtree:!0});function E(A){const R={};return A.integrity&&(R.integrity=A.integrity),A.referrerPolicy&&(R.referrerPolicy=A.referrerPolicy),A.crossOrigin==="use-credentials"?R.credentials="include":A.crossOrigin==="anonymous"?R.credentials="omit":R.credentials="same-origin",R}function C(A){if(A.ep)return;A.ep=!0;const R=E(A);fetch(A.href,R)}})();const Xt={off:0,error:1,warn:2,info:3,debug:4};let lt="off";const $t="[baikal-portal]";function Ka(r){const u=(r||"off").toLowerCase().trim();return u==="error"||u==="warn"||u==="info"||u==="debug"||u==="off"?u:"off"}function Ga(r){return lt=Ka(r),lt!=="off"&&console.info($t,`log level = ${lt}`),lt}function Qt(r){return Xt[lt]>=Xt[r]}function gt(r,u,E,C){if(!Qt(r))return;const A=[$t,E];C!==void 0&&A.push(C),console[u](...A)}function Xa(r,u){Qt("info")&&(u&&Object.keys(u).length>0?console.info($t,`event:${r}`,u):console.info($t,`event:${r}`))}const j={error(r,u){gt("error","error",r,u)},warn(r,u){gt("warn","warn",r,u)},info(r,u){gt("info","info",r,u)},debug(r,u){gt("debug","debug",r,u)},event:Xa};class ot extends Error{constructor(E,C){super(E);Gt(this,"status");this.status=C}}let Ft="";function At(r){Ft=r&&typeof r=="string"?r:""}async function P(r,u={}){const E=new Headers(u.headers);u.body&&!E.has("Content-Type")&&E.set("Content-Type","application/json");const C=(u.method||"GET").toUpperCase();C!=="GET"&&C!=="HEAD"&&C!=="OPTIONS"&&Ft&&E.set("X-CSRF-Token",Ft);const A=typeof performance<"u"?performance.now():Date.now();j.debug(`api → ${C} ${r}`);const R=await fetch(`/api${r}`,{...u,headers:E,credentials:"same-origin"});let H=null;const S=await R.text();if(S)try{H=JSON.parse(S)}catch{H={error:S}}const ne=Math.round((typeof performance<"u"?performance.now():Date.now())-A);if(!R.ok){let W=`Request failed (${R.status})`;throw H&&typeof H=="object"&&H!==null&&"error"in H&&typeof H.error=="string"?W=H.error:(R.status===500||R.status===504)&&(W="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),R.status>=500?j.error(`api ← ${C} ${r} ${R.status} (${ne}ms)`,W):R.status!==401?j.warn(`api ← ${C} ${r} ${R.status} (${ne}ms)`,W):j.debug(`api ← ${C} ${r} 401 (${ne}ms)`),new ot(W,R.status)}return j.info(`api ← ${C} ${r} ${R.status} (${ne}ms)`),H}function me(r){return encodeURIComponent(r)}const F={ui:()=>P("/ui"),me:async()=>{var u;const r=await P("/me");return At(r.csrfToken||((u=r.user)==null?void 0:u.csrfToken)),r},login:async(r,u)=>{var C;const E=await P("/login",{method:"POST",body:JSON.stringify({username:r,password:u})});return At((C=E.user)==null?void 0:C.csrfToken),E},logout:async()=>{try{return await P("/logout",{method:"POST"})}finally{At("")}},calendars:()=>P("/calendars"),createCalendar:r=>P("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>P("/holidays/countries"),updateCalendar:(r,u)=>P(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(u)}),deleteCalendar:r=>P(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,u,E)=>{const C=new URLSearchParams({from:u,to:E}).toString();return P(`/calendars/${r}/events?${C}`)},getEvent:(r,u)=>P(`/calendars/${r}/events/${me(u)}`),createEvent:(r,u)=>P(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(u)}),updateEvent:(r,u,E)=>P(`/calendars/${r}/events/${me(u)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteEvent:(r,u)=>P(`/calendars/${r}/events/${me(u)}`,{method:"DELETE"}),exportCalendar:async r=>{const u=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!u.ok){let H=`Export failed (${u.status})`;try{const S=await u.json();S.error&&(H=S.error)}catch{}throw new ot(H,u.status)}const E=u.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(E),A=(C==null?void 0:C[1])||`calendar-${r}.ics`;return{blob:await u.blob(),filename:A}},importCalendar:(r,u)=>P(`/calendars/${r}/import`,{method:"POST",body:JSON.stringify({ics:u})}),directory:()=>P("/directory"),shares:r=>P(`/calendars/${r}/shares`),share:(r,u,E)=>P(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:u,access:E})}),revoke:(r,u)=>P(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:u})}),addressbooks:()=>P("/addressbooks"),createAddressBook:r=>P("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,u)=>P(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(u)}),deleteAddressBook:(r,u=!1)=>P(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:u})}),exportAddressBook:async r=>{const u=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!u.ok){let H=`Export failed (${u.status})`;try{const S=await u.json();S.error&&(H=S.error)}catch{}throw new ot(H,u.status)}const E=u.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(E),A=(C==null?void 0:C[1])||`contacts-${r}.vcf`;return{blob:await u.blob(),filename:A}},importAddressBook:(r,u)=>P(`/addressbooks/${r}/import`,{method:"POST",body:JSON.stringify({vcf:u})}),contacts:(r,u="")=>{const E=u.trim()?`?q=${encodeURIComponent(u.trim())}`:"";return P(`/addressbooks/${r}/contacts${E}`)},getContact:(r,u)=>P(`/addressbooks/${r}/contacts/${me(u)}`),createContact:(r,u)=>P(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(u)}),updateContact:(r,u,E)=>P(`/addressbooks/${r}/contacts/${me(u)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteContact:(r,u)=>P(`/addressbooks/${r}/contacts/${me(u)}`,{method:"DELETE"}),exportContact:async(r,u)=>{const E=await fetch(`/api/addressbooks/${r}/contacts/${me(u)}/export`,{credentials:"same-origin"});if(!E.ok){let S=`Export failed (${E.status})`;try{const ne=await E.json();ne.error&&(S=ne.error)}catch{}throw new ot(S,E.status)}const C=E.headers.get("Content-Disposition")||"",A=/filename="([^"]+)"/i.exec(C),R=(A==null?void 0:A[1])||"contact.vcf";return{blob:await E.blob(),filename:R}},contactPhotoUrl:(r,u)=>`/api/addressbooks/${r}/contacts/${me(u)}/photo`,tasks:(r={})=>{const u=new URLSearchParams;r.q&&u.set("q",r.q),r.sort&&u.set("sort",r.sort),r.order&&u.set("order",r.order);const E=u.toString()?`?${u}`:"";return P(`/tasks${E}`)},createTask:r=>P("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,u,E)=>P(`/tasks/${r}/${me(u)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteTask:(r,u)=>P(`/tasks/${r}/${me(u)}`,{method:"DELETE"}),bulkTasks:r=>P("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const u=new URLSearchParams;r.q&&u.set("q",r.q),r.sort&&u.set("sort",r.sort),r.order&&u.set("order",r.order);const E=u.toString()?`?${u}`:"";return P(`/notes${E}`)},createNote:r=>P("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,u,E)=>P(`/notes/${r}/${me(u)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteNote:(r,u)=>P(`/notes/${r}/${me(u)}`,{method:"DELETE"})},Qa="0.11.1-fork.4",Za="https://github.com/offsyanka99/Baikal/tree/master/docs";function c(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Lt(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(r)}</span>`}function vt(r){const u=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&u.push(`${r.skipped} skipped`),u.join(", ")}const en={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]}};function ge(r,u,E="h2"){const C=E;return`<div class="section-title-row">
    <${C}>${c(r)}</${C}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(u)}"
      aria-label="About ${c(r)}" title="About ${c(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function tn(){return`
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
    </div>`}function an(r){let u=null,E=null,C="calendars",A=[],R=[],H=[],S=null,ne=[],W=!1,Se=!1,ce=null,pe=null,xe={y:new Date().getFullYear(),m:new Date().getMonth()},We=[],wt=!1,De=!1,y=null,ve=!1,N=null,it="",Ge=null,se=[],x=null,Ce=[],Re="",J=null,k=null,G=!1,te=!1,de=!1,re=null,ue=null,fe=!1,f=!1,$e=null,Ie=null,U=null,ct=null,qt=!1,Ye={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Ee=null;function kt(t){if(!t)return;const e=(t.timeFormat||"auto").toLowerCase(),a=(t.weekStart||"auto").toLowerCase();Ye={timeFormat:e==="12h"||e==="24h"?e:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:t.logLevel||"off"},Ga(Ye.logLevel)}let le=[],Xe=[],Ue=[],Be=[],dt="",ut="",Oe="due",Ne="asc",Je="dtstart",_e="desc",oe=null,we=null,q=null,Y=null,V=!1,ae=!1,Z=[];function v(t,e){E={type:t,message:e}}function I(){E=null}async function ea(){j.event("bootstrap.start");try{const t=await F.ui();kt(t.ui)}catch(t){j.debug("bootstrap: /api/ui failed",t instanceof Error?t.message:t)}try{const t=await F.me();u=t.user,kt(t.ui),j.event("bootstrap.session",{username:(u==null?void 0:u.username)??null}),await be()}catch(t){t instanceof ot&&t.status===401?(u=null,j.event("bootstrap.anonymous")):(j.error("bootstrap failed",t instanceof Error?t.message:t),v("error",t instanceof Error?t.message:"Failed to load"))}m()}async function be(){j.debug("loadHome");const[t,e,a]=await Promise.all([F.calendars(),F.directory().catch(()=>({users:[]})),F.addressbooks()]);if(A=t.calendars,R=e.users,se=a.addressbooks,j.event("loadHome",{calendars:A.length,addressBooks:se.length,directory:R.length}),H.length===0)try{H=(await F.holidayCountries()).countries}catch{H=[]}if(S!==null&&!A.some(l=>l.id===S)&&(S=null,ne=[],W=!1,ce=null),S===null){const l=Mt();l&&(S=l.id)}S!==null&&W?await Qe(S):S!==null&&(ne=[]),C==="calendars"&&await ye(),x!==null&&!se.some(l=>l.id===x)&&(x=null,Ce=[],J=null,k=null,G=!1),pe!==null&&!se.some(l=>l.id===pe)&&(pe=null),x===null&&se.length>0&&(x=se[0].id),x!==null&&C==="contacts"&&await Le(x)}async function Qe(t){ne=(await F.shares(t)).shares}function Mt(){const t=A.filter(a=>a.canShare);if(t.length===0)return null;const e=a=>{const l=a.uri.toLowerCase(),o=a.displayname.toLowerCase();return l==="default"||o==="default"||o==="default calendar"};return t.find(e)??t[0]??null}function X(t){const e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),l=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${l}`}function ta(t,e){const a=new Date(t,e,1),l=new Date(t,e+1,0);return{from:X(a),to:X(l)}}function St(t){if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[a,l,o]=t.split("-").map(Number);return new Date(a,l-1,o)}const e=new Date(t);if(Number.isNaN(e.getTime())){const[a,l,o]=t.slice(0,10).split("-").map(Number);return new Date(a,(l||1)-1,o||1)}return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function aa(t){const e=St(t.start);if(!t.end)return[X(e)];let a=St(t.end);if(!t.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(t.end)){const s=new Date(t.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(t.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<e)return[X(e)];const l=[],o=new Date(e.getFullYear(),e.getMonth(),e.getDate()),d=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;o<=d&&n++<370;)l.push(X(o)),o.setDate(o.getDate()+1);return l.length?l:[X(e)]}function Dt(t,e){const a=t.slice(0,10),l=(e||a).slice(0,10);if(a===l){const L=et(a);return{start:L.start,end:L.end}}const[o,d,n]=a.split("-").map(Number),[s,i,p]=l.split("-").map(Number),h=Ae(new Date(o,d-1,n,9,0,0,0)),g=Ae(new Date(s,i-1,p,17,0,0,0));return{start:h,end:g}}function na(t,e){const a=Ve(t);let l=e?Ve(e):a;if(e&&!/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=new Date(e);if(!Number.isNaN(o.getTime())&&o.getHours()===0&&o.getMinutes()===0&&o.getTime()>new Date(t).getTime()){const d=St(e);d.setDate(d.getDate()-1),l=X(d)}}return{start:a,end:l}}async function ye(){if(S===null){We=[];return}const{from:t,to:e}=ta(xe.y,xe.m);wt=!0,j.debug("loadMonthEvents",{selectedId:S,from:t,to:e});try{We=(await F.calendarEvents(S,t,e)).events,j.event("monthEvents.loaded",{calendarId:S,count:We.length,from:t,to:e})}catch(a){We=[],j.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{wt=!1}}function sa(t,e){return new Date(t,e,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function ra(t){const e=t.summary||"(No title)";if(t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(t.start))return e;const a=new Date(t.start);return Number.isNaN(a.getTime())?e:`${a.toLocaleTimeString(void 0,Ct())} ${e}`}function la(){const t=S!==null?A.find(b=>b.id===S):null,e=(t==null?void 0:t.displayname)??"Calendar",a=t!=null&&t.color?t.color.length>=7?t.color.slice(0,7):t.color:"#3B82F6",l=xe.y,o=xe.m,d=new Date(l,o,1),n=Et(),s=(d.getDay()-n+7)%7,i=new Date(l,o+1,0).getDate(),p=new Date(l,o,0).getDate(),g=X(new Date),L=Pt(),T=new Map;for(const b of We)for(const M of aa(b)){const D=T.get(M)??[];D.push(b),T.set(M,D)}const w=[],O=Math.ceil((s+i)/7)*7;for(let b=0;b<O;b++){let M,D=!0,B;b<s?(M=p-s+b+1,D=!1,B=new Date(l,o-1,M)):b>=s+i?(M=b-(s+i)+1,D=!1,B=new Date(l,o+1,M)):(M=b-s+1,B=new Date(l,o,M));const _=X(B),K=_===g,ie=D?T.get(_)??[]:[],st=Ge===_?50:3,Ke=ie.slice(0,st),bt=ie.length-Ke.length,Te=Ke.map(rt=>{const It=S??0,ht=ra(rt);return`<button type="button" class="month-event${rt.allDay?"":" is-timed"}" title="${c(ht)}" style="--ev-color:${c(a)}"
            data-action="open-event" data-instance="${It}" data-uri="${c(rt.uri)}" ${f?"disabled":""}>${c(ht)}</button>`}).join(""),Tt=bt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(_)}" title="Show all events this day" ${f?"disabled":""}>+${bt} more</button>`:"",xt=!D&&(M===1||b===s+i)?B.toLocaleString(void 0,{month:"short",day:"numeric"}):String(M),yt=!!(t&&!t.readOnly&&(t.canShare||t.access==="readwrite"));w.push(`<div class="month-cell${D?"":" is-outside"}${K?" is-today":""}${yt?" is-clickable":""}"${yt?` data-action="new-event-day" data-day="${c(_)}" role="button" tabindex="0" title="Add event on ${c(_)}"`:""}>
        <div class="month-daynum${K?" is-today-num":""}">${c(xt)}</div>
        <div class="month-events">${Te}${Tt}</div>
      </div>`)}const Q=t?wt?'<p class="muted small month-empty-hint">Loading events…</p>':"":'<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${f?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${f?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${f?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(sa(l,o))}</h2>
        <span class="month-cal-name muted small" title="${c(e)}">
          <span class="cal-swatch" style="background:${c(a)};margin-top:0"></span>
          ${c(e)}
        </span>
      </div>
      ${Q}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${L.map(b=>`<div class="month-dow">${c(b)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${w.join("")}
        </div>
      </div>
    </section>`}function Ve(t){if(!t)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const e=new Date(t);return Number.isNaN(e.getTime())?t.slice(0,10):X(e)}function oa(){if(Ye.timeFormat==="24h")return!1;if(Ye.timeFormat==="12h")return!0;try{const e=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(e.hourCycle==="h23"||e.hourCycle==="h24")return!1;if(e.hourCycle==="h11"||e.hourCycle==="h12")return!0;if(typeof e.hour12=="boolean")return e.hour12}catch{}const t=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(t)}function Ct(){return oa()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Et(){var a;if(Ye.weekStart==="monday")return 1;if(Ye.weekStart==="sunday")return 0;const t=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const l of t)try{const o=new Intl.Locale(l),d=typeof o.getWeekInfo=="function"?o.getWeekInfo():o.weekInfo,n=d==null?void 0:d.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const e=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(e)?0:1}function Pt(){const t=Et(),e=new Date(2024,0,7+t),a=[];for(let l=0;l<7;l++){const o=new Date(e);o.setDate(e.getDate()+l),a.push(o.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Rt(t,e=15){const a=e*60*1e3,l=t.getTime();return l%a===0?new Date(l):new Date(Math.ceil(l/a)*a)}function Ae(t){const e=a=>String(a).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}function ia(t,e){if(!t)return"Select…";if(e||/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=t.slice(0,10),[o,d,n]=l.split("-").map(Number);return new Date(o,d-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((t.includes("T")&&t.length===16,t));return Number.isNaN(a.getTime())?t:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Ct()})}function Ze(t){if(!t){const a=Rt(new Date);return{date:X(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(t))return{date:t,hm:"09:00"};const e=new Date((t.length===16,t));return Number.isNaN(e.getTime())?{date:t.slice(0,10),hm:"09:00"}:{date:X(e),hm:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}function et(t){const e=new Date,a=X(e);if(t&&t!==a){const[d,n,s]=t.split("-").map(Number),i=new Date(d,n-1,s,9,0,0,0),p=new Date(d,n-1,s,10,0,0,0);return{start:Ae(i),end:Ae(p)}}const l=Rt(e,15),o=new Date(l.getTime()+3600*1e3);return{start:Ae(l),end:Ae(o)}}function ca(){const t=[];for(let e=0;e<24;e++)for(let a=0;a<60;a+=15)t.push(`${String(e).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return t}function je(t){const{field:e,name:a,label:l,value:o,dateOnly:d=!1,required:n,disabled:s,allowClear:i=!0}=t,p=(N==null?void 0:N.field)===e,h=ia(o,d);return`<div class="dt-field${p?" is-open":""}" data-dt-id="${c(e)}">
      <span class="dt-field-label">${c(l)}</span>
      <input type="hidden" name="${c(a)}" value="${c(o)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(e)}"
        data-dt-name="${c(a)}" data-dt-date-only="${d?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${p}">
        <span class="dt-trigger-text">${c(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${p&&!s?da(e,o,d,i):""}
    </div>`}function Nt(t){var e;return t==="start"?String((y==null?void 0:y.start)||""):t==="end"?String((y==null?void 0:y.end)||""):t==="until"?((e=y==null?void 0:y.repeat)==null?void 0:e.until)||Ve(y==null?void 0:y.start)||X(new Date):t==="due"?ze(q==null?void 0:q.due):t==="dtstart"?ze(Y==null?void 0:Y.dtstart):t==="bulk-due"?it:t==="birthday"?String((k==null?void 0:k.birthday)||""):""}function he(t,e){if(t==="start"&&y){y={...y,start:e||""};return}if(t==="end"&&y){y={...y,end:e};return}if(t==="until"&&y){y={...y,repeat:{...y.repeat??mt(),until:e,endMode:"until"}};return}if(t==="due"&&q){if(e===null||e==="")q={...q,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))q={...q,due:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));q={...q,due:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="dtstart"&&Y){if(e===null||e==="")Y={...Y,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(e))Y={...Y,dtstart:new Date(e+"T00:00:00").toISOString()};else{const a=new Date((e.length===16,e));Y={...Y,dtstart:Number.isNaN(a.getTime())?e:a.toISOString()}}return}if(t==="birthday"&&k){k={...k,birthday:e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null};return}t==="bulk-due"&&(it=e||"")}function da(t,e,a,l){const o=Ze(e),d=(N==null?void 0:N.viewY)??Number(o.date.slice(0,4)),n=(N==null?void 0:N.viewM)??Number(o.date.slice(5,7))-1,s=Et(),i=Pt(),h=(new Date(d,n,1).getDay()-s+7)%7,g=new Date(d,n+1,0).getDate(),L=new Date(d,n,0).getDate(),T=o.date,w=o.hm,O=new Date(d,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),Q=[],b=Math.ceil((h+g)/7)*7;for(let D=0;D<b;D++){let B,_,K=!1;D<h?(B=L-h+D+1,_=new Date(d,n-1,B),K=!0):D>=h+g?(B=D-(h+g)+1,_=new Date(d,n+1,B),K=!0):(B=D-h+1,_=new Date(d,n,B));const ie=X(_),st=ie===T,Ke=ie===X(new Date);Q.push(`<button type="button" class="dt-day${K?" is-outside":""}${st?" is-selected":""}${Ke?" is-today":""}" data-action="dt-pick-day" data-dt-field="${t}" data-day="${c(ie)}">${B}</button>`)}const M=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${ca().map(D=>{const B=(()=>{const[_,K]=D.split(":").map(Number);return new Date(2e3,0,1,_,K).toLocaleTimeString(void 0,Ct())})();return`<button type="button" class="dt-time${D===w?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${t}" data-hm="${D}" role="option" aria-selected="${D===w}">${c(B)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${t}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${t}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(O)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${t}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(D=>`<span class="dt-dow">${c(D)}</span>`).join("")}</div>
          <div class="dt-days">${Q.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(t)}" ${l?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${t}">Today</button>
          </div>
        </div>
        ${M}
      </div>
    </div>`}function ua(){r.querySelectorAll(".dt-field.is-open").forEach(t=>{const e=t.querySelector(".dt-trigger"),a=t.querySelector(".dt-popover");if(!e||!a)return;const l=e.getBoundingClientRect(),o=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const d=a.offsetWidth||320,n=a.offsetHeight||300;let s=l.bottom+6;s+n>window.innerHeight-o&&(s=Math.max(o,l.top-n-6));let i=l.left;i+d>window.innerWidth-o&&(i=Math.max(o,window.innerWidth-d-o)),i<o&&(i=o),a.style.top=`${Math.round(s)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function mt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function ma(t){return t.endMode==="until"||t.endMode==="count"||t.endMode==="never"?t.endMode:t.until?"until":t.count?"count":"never"}function pa(){if(!De||!y)return"";const t=y,e=t.repeat??mt(),a=(e.freq||"").toUpperCase(),l=A.filter(T=>T.canShare||T.access==="readwrite"),o=A.filter(T=>T.id===t.instanceId?!0:T.readOnly?!1:T.canShare||T.access==="readwrite").map(T=>`<option value="${T.id}" ${T.id===t.instanceId?"selected":""}>${c(T.displayname)}</option>`).join(""),d=t.readOnly||!t.canWrite;let n,s;if(t.allDay)n=Ve(t.start),s=Ve(t.end);else{const T=t.start||"",w=t.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(T)){const O=Dt(T,w||null);n=O.start,s=O.end||""}else n=ze(t.start),s=ze(t.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],p=new Set((e.byDay||[]).map(T=>T.toUpperCase())),h=ma(e),g=!!a&&h==="until",L=e.until||(h==="until"?Ve(t.start)||X(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${ve?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${qe()}
          ${!ve&&(t.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${d?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${d||l.length===0?"disabled":""}>
                ${o||`<option value="${t.instanceId}">${c(t.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${d?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(t.location)}" ${d?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${d?"readonly":""}>${c(t.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${t.allDay?"checked":""} ${d?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${je({field:"start",name:"start",label:"Start",value:n,dateOnly:t.allDay,required:!0,disabled:d,allowClear:!1})}
              ${je({field:"end",name:"end",label:"End",value:s,dateOnly:t.allDay,disabled:d||g,allowClear:!g})}
            </div>
            <fieldset class="event-repeat" ${d?"disabled":""}>
              <legend class="event-repeat-legend">Repeat</legend>
              <div class="form-grid form-grid-2">
                <label>Frequency
                  <select name="repeatFreq" data-action="event-repeat-freq">
                    <option value="" ${a?"":"selected"}>Does not repeat</option>
                    <option value="DAILY" ${a==="DAILY"?"selected":""}>Daily</option>
                    <option value="WEEKLY" ${a==="WEEKLY"?"selected":""}>Weekly</option>
                    <option value="MONTHLY" ${a==="MONTHLY"?"selected":""}>Monthly</option>
                    <option value="YEARLY" ${a==="YEARLY"?"selected":""}>Yearly</option>
                  </select>
                </label>
                <label>Every
                  <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(e.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${i.map(T=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${T.code}" ${p.has(T.code)?"checked":""} />
                              ${T.label}
                            </label>`).join("")}
                    </div>`:""}
              ${a?`<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${h==="never"?"selected":""}>Never</option>
                          <option value="until" ${h==="until"?"selected":""}>On date</option>
                          <option value="count" ${h==="count"?"selected":""}>After count</option>
                        </select>
                      </label>
                      ${h==="until"?je({field:"until",name:"repeatUntil",label:"Until",value:L,dateOnly:!0,disabled:d,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(e.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${d?"":`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${ve?"Create event":"Save event"}</button>
                     ${ve?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${f?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function fa(t,e){const a=A.find(l=>l.id===e);return{uri:"",instanceId:e,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:t,end:t,allDay:!0,hasRrule:!1,repeat:mt(),readOnly:!1,canWrite:!0}}async function Le(t){Ce=(await F.contacts(t,Re)).contacts,J!==null&&!Ce.some(a=>a.uri===J)&&(J=null,G||(k=null,re=null,ue=null,fe=!1))}async function He(){const t=await F.tasks({q:dt,sort:Oe,order:Ne});le=t.tasks,Ue=t.calendars;const e=new Set(le.map(a=>z(a.instanceId,a.uri)));Z=Z.filter(a=>e.has(a)),oe!==null&&!le.some(a=>`${a.instanceId}|${a.uri}`===oe)&&(oe=null,V||(q=null))}async function tt(){const t=await F.notes({q:ut,sort:Je,order:_e});Xe=t.notes,Be=t.calendars,we!==null&&!Xe.some(e=>`${e.instanceId}|${e.uri}`===we)&&(we=null,ae||(Y=null))}function z(t,e){return`${t}|${e}`}function Ut(t){if(!t)return"—";try{const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}function ze(t){if(!t)return"";try{const e=new Date(t);if(Number.isNaN(e.getTime()))return"";const a=l=>String(l).padStart(2,"0");return`${e.getFullYear()}-${a(e.getMonth()+1)}-${a(e.getDate())}T${a(e.getHours())}:${a(e.getMinutes())}`}catch{return""}}function Fe(t,e,a,l,o,d=""){const n=a===e,s=n?l==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${d?" "+d:""}`}" data-action="sort-${o}" data-sort="${c(e)}" role="columnheader" tabindex="0">${c(t)}${s}</th>`}async function ba(t){if(x===null)return;const e=await F.getContact(x,t);J=t,G=!1;const a=e.contact;k={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??Bt(),birthday:a.birthday??null},re=a.photoDataUri??(a.hasPhoto&&x!==null?`${F.contactPhotoUrl(x,t)}?t=${Date.now()}`:null),ue=null,fe=!1,te=!0}function ya(){G=!0,J=null,te=!0,k={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},re=null,ue=null,fe=!1}function Bt(){return{street:"",city:"",region:"",postal:"",country:""}}function ha(t){return new Promise((e,a)=>{const l=new FileReader;l.onload=()=>{const o=String(l.result??""),d=o.indexOf(",");e(d>=0?o.slice(d+1):o)},l.onerror=()=>a(new Error("Failed to read photo file")),l.readAsDataURL(t)})}function _t(t,e={}){const a=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,l=u?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            <span class="muted">${c(u.displayname||u.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,d=!(W||Se||ce!==null||pe!==null||De||te||de)?qe():"",n=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${c(Qa)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(Za)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return e.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${l}
      <main class="container">
        ${d}
        ${t}
      </main>
      ${n}
      ${tn()}
      ${ga()}`}function qe(){return E?`<div class="flash flash-${c(E.type)}" role="status">
      <span class="flash-text">${c(E.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function Vt(t){return!Number.isFinite(t)||t<0?"":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:`${(t/(1024*1024)).toFixed(1)} MB`}function pt(t){const e=Math.max(0,Math.floor(t)),a=Math.floor(e/60),l=e%60;return a>0?`${a}m ${l}s`:`${l}s`}function ke(){ct!==null&&(clearInterval(ct),ct=null)}function jt(){ke(),ct=setInterval(()=>{if(!U||U.phase==="done"||U.phase==="error"){ke();return}U={...U,elapsedSec:Math.floor((Date.now()-U.startedAt)/1e3)};const t=r.querySelector("[data-import-status-line]");t&&U.phase==="processing"&&(t.textContent=`Still working… ${pt(U.elapsedSec)} (large files can take several minutes)`)},1e3)}function Me(t,e={}){U&&(U={...U,phase:t,elapsedSec:Math.floor((Date.now()-U.startedAt)/1e3),...e},m())}function Ht(){ke(),U=null,m()}function ga(){if(!U)return"";const t=U,e=t.phase!=="done"&&t.phase!=="error",a=t.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",l=t.phase==="done"?"Import finished":t.phase==="error"?"Import failed":"Importing…",o=(()=>{const s=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],p={reading:0,uploading:1,processing:2,done:3,error:2}[t.phase]??0;return s.map((h,g)=>{let L="pending";return t.phase==="done"||g<p?L="done":g===p&&(L=(t.phase==="error","active")),`<li class="import-step import-step-${L}"><span class="import-step-icon" aria-hidden="true">${L==="done"?"✓":L==="active"?"●":"○"}</span> ${c(h.label)}</li>`}).join("")})();let d="";if(e){const s=t.phase==="reading"&&t.readPercent!==null?Math.min(100,Math.max(0,t.readPercent)):null,i=s===null?"import-progress-bar is-indeterminate":"import-progress-bar",p=s!==null?` style="width:${s}%"`:"",h=t.phase==="reading"?t.readPercent!==null?`Reading file… ${t.readPercent}%`:"Reading file…":t.phase==="uploading"?"Uploading to server…":`Still working… ${pt(t.elapsedSec)} (large files can take several minutes)`;d=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${c(a)}</strong> from
          <span class="mono">${c(t.fileName)}</span>
          ${t.fileSizeLabel?` <span class="muted">(${c(t.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${o}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${s!==null?`aria-valuenow="${s}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${i}"${p}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${c(h)}</p>
        <p class="muted small">Keep this tab open until the import finishes.</p>`}else t.phase==="done"?d=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${c(t.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(t.fileName)}</span>
          · Took ${c(pt(t.elapsedSec))}
        </p>`:d=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${c(t.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(t.fileName)}</span>
          · After ${c(pt(t.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=e?'<p class="muted small" style="margin:0">Please wait…</p>':'<button type="button" class="btn btn-primary" data-action="close-import-progress">Close</button>';return`
      <div class="cal-modal import-progress-modal" role="dialog" aria-modal="true"
        aria-labelledby="import-progress-title" data-import-progress>
        <div class="cal-modal-backdrop"${e?"":' data-action="close-import-progress"'}></div>
        <div class="cal-modal-card cal-modal-card-sm import-progress-card">
          <header class="cal-modal-header">
            <h3 id="import-progress-title">${c(l)}</h3>
            ${e?"":'<button type="button" class="info-modal-close" data-action="close-import-progress" aria-label="Close">×</button>'}
          </header>
          <div class="cal-modal-body">${d}</div>
          <footer class="cal-modal-footer">${n}</footer>
        </div>
      </div>`}function Wt(t,e){return new Promise((a,l)=>{const o=new FileReader;o.onprogress=d=>{d.lengthComputable&&d.total>0?e(Math.min(100,Math.round(d.loaded/d.total*100))):e(null)},o.onload=()=>a(String(o.result??"")),o.onerror=()=>l(o.error??new Error("Failed to read file")),o.readAsText(t)})}function Yt(){r.innerHTML=_t(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function va(){if(!u){Yt();return}const t=A.filter($=>$.canShare),e=A.filter($=>!$.canShare),a=A.find($=>$.id===S)??null,l=t.map($=>{const ee=$.id===S?" is-selected":"",Pe=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ot=Lt($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${ee}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${Pe}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${Ot}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${f?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${f?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),o=e.map($=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${Lt($.access)}</span>
            <span class="muted small">Shared with you · ${c($.access)}</span>
          </span>
        </div>`).join(""),d=R.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=ne.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':ne.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${Lt($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${f?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),p=W&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${qe()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(a.uri)}
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
                        value="${c(a.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${c(s)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${c(a.color||s)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${c(a.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${ge(`Share “${a.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${R.length===0?"disabled":""}>
                        <option value="">${R.length?"Select user…":"No other users"}</option>
                        ${d}
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
                      <button type="submit" class="btn btn-primary" ${f||R.length===0?"disabled":""}>Share</button>
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
                  ${ge("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${f?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${f||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${f||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                  ${$e?`<div class="flash flash-${$e.ok?"success":"error"} import-result" role="status">
                          <strong>Import result:</strong> ${c($e.message)}
                        </div>`:""}
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",h=ce!==null?A.find($=>$.id===ce&&$.canShare)??null:null,g=h?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${qe()}
              <p>You are about to permanently delete <strong>${c(h.displayname)}</strong>
                <span class="muted small mono">(${c(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${f?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${h.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",L=Se?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${qe()}
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
                    ${H.map($=>`<option value="${c($.code)}">${c($.name)} (${c($.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Create calendar</button>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${f?"disabled":""}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>`:"",T=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ge("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${l||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${e.length?`<div class="calendars-shared-block">
                       ${ge("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${o}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${f?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${la()}
      </div>
      ${L}
      ${p}
      ${g}
      ${pa()}`,w=se.map($=>`<div class="cal-row${$.id===x?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${f?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${f?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),O=se.find($=>$.id===x)??null,Q=Ce.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Re?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Ce.map($=>{const ee=!G&&$.uri===J?" is-selected":"",Pe=c(($.displayname||"?").slice(0,1).toUpperCase()),Ot=$.hasPhoto&&x!==null?`<img class="contact-avatar" src="${c(F.contactPhotoUrl(x,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${Pe}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Pe}</span>`;return`<tr class="contact-table-row${ee}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ot}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),b=k,M=Array.isArray(b==null?void 0:b.emails)&&b.emails.length>0?b.emails:[""],D=Array.isArray(b==null?void 0:b.phones)&&b.phones.length>0?b.phones:[{type:"cell",value:""}],B=(b==null?void 0:b.address)??Bt(),_=M.map(($,ee)=>`<div class="multi-row" data-multi="email" data-idx="${ee}">
          <input type="email" name="email_${ee}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${ee}" ${M.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),K=D.map(($,ee)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${ee}">
          <select name="phone_type_${ee}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Pe=>`<option value="${Pe}" ${(($==null?void 0:$.type)??"other")===Pe?"selected":""}>${Pe}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${ee}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${ee}" ${D.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),ie=Array.isArray(b==null?void 0:b.custom)?b.custom:[],st=ie.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':ie.map(($,ee)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${ee}">
                <input type="text" name="custom_label_${ee}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${ee}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${ee}" title="Remove">×</button>
              </div>`).join(""),Ke=te&&b&&O?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${G?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${qe()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${re?`<img src="${c(re)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((b.fullname||b.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${f?"aria-disabled=true":""}>
                        ${re?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${f?"disabled":""} hidden />
                      </label>
                      ${re||b.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${f?"disabled":""}>Remove photo</button>`:""}
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
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${M.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${K}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${D.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${c(B.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${c(B.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${c(B.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${c(B.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${c(B.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${c(b.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${je({field:"birthday",name:"birthday",label:"Birthday",value:b.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${st}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${ie.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(b.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${f?"disabled":""}>${G?"Create contact":"Save contact"}</button>
                    ${!G&&b.uri?`<button type="button" class="btn" data-action="export-contact" ${f?"disabled":""}>Export .vcf</button>`:""}
                    ${G?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${f?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${f?"disabled":""}>Cancel</button>
                    ${!G&&b.uri?`<span class="muted small mono">${c(b.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",bt=de&&O?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${qe()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(O.uri)} · ${O.cardCount} contact${O.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${c(O.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(O.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(O.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ge("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${f?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${f?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${f?"disabled":""} hidden />
                      </label>
                    </div>
                    ${Ie?`<div class="flash flash-${Ie.ok?"success":"error"} import-result" role="status">
                            <strong>Import:</strong> ${c(Ie.message)}
                          </div>`:""}
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Te=pe!==null?se.find($=>$.id===pe)??null:null,Tt=Te?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${qe()}
              <p>You are about to permanently delete <strong>${c(Te.displayname)}</strong>
                <span class="muted small mono">(${c(Te.uri)})</span>.</p>
              <p class="muted small">${(Te.cardCount??0)>0?`All ${Te.cardCount} contact${Te.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${f?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Te.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",xt=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ge("Address books","address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${w||'<p class="muted">No address books yet. Create one below.</p>'}
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
                <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${O?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${ge("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(Re)}" aria-label="Search contacts" ${f?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${f?"disabled":""}>Add contact</button>
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
                        ${Q}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Tt}
      ${bt}
      ${Ke}`,yt=C==="calendars"?"my-calendars":C==="contacts"?"my-contacts":C==="tasks"?"tasks":"notes",rt=Sa(),It=Da(),ht=C==="calendars"?T:C==="contacts"?xt:C==="tasks"?rt:It;r.innerHTML=_t(`
      <header class="page-header">
        <div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${C==="calendars"?" is-active":""}"
            data-action="tab" data-tab="calendars" aria-selected="${C==="calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${C==="contacts"?" is-active":""}"
            data-action="tab" data-tab="contacts" aria-selected="${C==="contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${C==="tasks"?" is-active":""}"
            data-action="tab" data-tab="tasks" aria-selected="${C==="tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${C==="notes"?" is-active":""}"
            data-action="tab" data-tab="notes" aria-selected="${C==="notes"}">
            Notes
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${yt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${ht}
    `),document.body.classList.toggle("cal-modal-open",W||Se||ce!==null||pe!==null||De||te||de||U!==null),document.body.classList.toggle("layout-contacts",C==="contacts"),document.body.classList.toggle("layout-calendars",C==="calendars"),document.body.classList.toggle("layout-tasks",C==="tasks"||C==="notes")}function $a(t){const e=new Map;for(const p of t)p.uid&&e.set(p.uid,p);const a=new Map(t.map((p,h)=>[z(p.instanceId,p.uri),h])),l=new Map,o=[];for(const p of t){const h=p.parentUid;if(h&&e.has(h)&&h!==p.uid){const g=l.get(h)??[];g.push(p),l.set(h,g)}else o.push(p)}const d=(p,h)=>(a.get(z(p.instanceId,p.uri))??0)-(a.get(z(h.instanceId,h.uri))??0);o.sort(d);for(const[,p]of l)p.sort(d);const n=[],s=new Set,i=(p,h)=>{const g=p.uid||z(p.instanceId,p.uri);if(!s.has(g)){s.add(g),n.push({task:p,depth:Math.min(h,8)});for(const L of l.get(p.uid)??[])i(L,h+1);s.delete(g)}};for(const p of o)i(p,0);for(const p of t)n.some(h=>h.task===p)||n.push({task:p,depth:0});return n}function wa(t){const e=new Set([t]);if(!t)return e;let a=!0;for(;a;){a=!1;for(const l of le)l.parentUid&&e.has(l.parentUid)&&l.uid&&!e.has(l.uid)&&(e.add(l.uid),a=!0)}return e}function ka(t,e){const a=t.instanceId,l=e||!t.uid?new Set:wa(t.uid),o=le.filter(s=>s.uid&&s.instanceId===a&&!l.has(s.uid)&&s.uid!==t.uid),d=t.parentUid||"",n=['<option value="">None (top-level)</option>',...o.map(s=>`<option value="${c(s.uid)}" ${s.uid===d?"selected":""}>${c(s.summary||s.uid)}</option>`)];if(d&&!o.some(s=>s.uid===d)){const s=le.find(i=>i.uid===d);n.push(`<option value="${c(d)}" selected>${c((s==null?void 0:s.summary)||d)} (current)</option>`)}return n.join("")}function Jt(){const t=new Set(Z);return le.filter(e=>t.has(z(e.instanceId,e.uri))&&e.canWrite&&!e.readOnly)}function Sa(){const t=w=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[w]||w,e=$a(le),a=le.filter(w=>w.canWrite&&!w.readOnly).map(w=>z(w.instanceId,w.uri)),l=a.length>0&&a.every(w=>Z.includes(w)),o=Z.length>0,n=Jt().length,s=le.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${dt?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:e.map(({task:w,depth:O})=>{const Q=z(w.instanceId,w.uri),b=!V&&Q===oe?" is-selected":"",M=Z.includes(Q),D=w.status==="COMPLETED"?"badge-ok":w.status==="CANCELLED"?"":"badge-admin",B=O>0?` style="--task-depth:${O}"`:"",_=O>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",K=w.canWrite&&!w.readOnly;return`<tr class="contact-table-row task-row${O>0?" is-subtask":""}${b}${M?" is-checked":""}" data-action="select-task" data-instance="${w.instanceId}" data-uri="${c(w.uri)}" tabindex="0" role="button"${B}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${w.instanceId}" data-uri="${c(w.uri)}"
                    ${M?"checked":""} ${K?"":"disabled"} aria-label="Select ${c(w.summary||w.uri)}" ${f?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${_}<span class="contact-name-primary">${c(w.summary||w.uri)}</span></span>
                  ${w.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${D}">${c(t(w.status))}</span></td>
                <td class="col-task-due muted small">${c(Ut(w.due))}</td>
                <td class="col-task-cal muted small">${c(w.calendarName)}</td>
                <td class="col-task-pct muted small">${w.percent?c(String(w.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,p=(w,O)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${w}"
        title="${c(O)}" aria-label="${c(O)}" ${f||n===0?"disabled":""}>${i}</button>`,h=o?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${Z.length!==n?`<span class="muted small bulk-bar-count-extra">(${Z.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${f||n===0?"disabled":""}>
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
                ${je({field:"bulk-due",name:"bulkDue",label:"Due",value:it,dateOnly:!1,disabled:f||n===0,allowClear:!0})}
                ${p("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${f||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${f||n===0?"disabled":""} />
                </label>
                ${p("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${f||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${f?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",g=q,L=Ue.map(w=>`<option value="${w.id}" ${g&&g.instanceId===w.id?"selected":""}>${c(w.displayname)}</option>`).join(""),T=g?`<div class="card">
            ${ge(V?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${V?`<label>Calendar
                      <select name="instanceId" required ${Ue.length===0?"disabled":""}>
                        <option value="">${Ue.length?"Select calendar…":"No writable calendars"}</option>
                        ${L}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(g.summary)}" ${g.readOnly&&!V?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!V?"readonly":""}>${c(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!V?"disabled":""}>
                  ${ka(g,V)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!V?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(w=>`<option value="${w}" ${g.status===w?"selected":""}>${c(t(w))}</option>`).join("")}
                  </select>
                </label>
                ${je({field:"due",name:"due",label:"Due",value:ze(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!V),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${c(String(g.priority||0))}" ${g.readOnly&&!V?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${c(String(g.percent||0))}" ${g.readOnly&&!V?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${V||g.canWrite?`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${V?"Create task":"Save task"}</button>`:""}
                ${!V&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${f?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${f?"disabled":""}>Delete</button>`:V?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ge("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(dt)}" aria-label="Search tasks" ${f?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${f||Ue.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Ue.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${l?"checked":""} ${a.length===0||f?"disabled":""} />
                </th>
                ${Fe("Title","summary",Oe,Ne,"task","col-task-title")}
                ${Fe("Status","status",Oe,Ne,"task","col-task-status")}
                ${Fe("Due","due",Oe,Ne,"task","col-task-due")}
                ${Fe("Calendar","calendar",Oe,Ne,"task","col-task-cal")}
                ${Fe("%","percent",Oe,Ne,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function Da(){const t=Xe.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${ut?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Xe.map(o=>{const d=z(o.instanceId,o.uri),n=!ae&&d===we?" is-selected":"",s=(o.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${o.instanceId}" data-uri="${c(o.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(o.summary||o.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${c(s)}${o.description.length>80?"…":""}</span>`:""}
                  ${o.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(Ut(o.dtstart))}</td>
                <td class="col-note-cal muted small">${c(o.calendarName)}</td>
              </tr>`}).join(""),e=Y,a=Be.map(o=>`<option value="${o.id}" ${e&&e.instanceId===o.id?"selected":""}>${c(o.displayname)}</option>`).join(""),l=e?`<div class="card">
            ${ge(ae?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${ae?`<label>Calendar
                      <select name="instanceId" required ${Be.length===0?"disabled":""}>
                        <option value="">${Be.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(e.calendarName)}</strong>${e.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(e.summary)}" ${e.readOnly&&!ae?"readonly":""} />
              </label>
              ${je({field:"dtstart",name:"dtstart",label:"Date",value:ze(e.dtstart),dateOnly:!1,disabled:!!(e.readOnly&&!ae),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${e.readOnly&&!ae?"readonly":""}>${c(e.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${ae||e.canWrite?`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${ae?"Create note":"Save note"}</button>`:""}
                ${!ae&&e.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${f?"disabled":""}>Delete</button>`:ae?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ge("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(ut)}" aria-label="Search notes" ${f?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${f||Be.length===0?"disabled":""}>Add note</button>
        </div>
        ${Be.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Fe("Title","summary",Je,_e,"note","col-note-title")}
                ${Fe("Date","dtstart",Je,_e,"note","col-note-date")}
                ${Fe("Calendar","calendar",Je,_e,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${t}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${l}
      </section>
    </div>`}function Ca(){const t=r.querySelector(".contacts-table-wrap"),e=r.querySelector(".contacts-ab-list"),a=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(t==null?void 0:t.scrollTop)??null,abListTop:(e==null?void 0:e.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function Ea(t){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(t.windowX,t.windowY),t.tableTop!==null){const e=r.querySelector(".contacts-table-wrap");e&&(e.scrollTop=t.tableTop)}if(t.abListTop!==null){const e=r.querySelector(".contacts-ab-list");e&&(e.scrollTop=t.abListTop)}if(t.calListTop!==null){const e=r.querySelector(".calendars-owned-list");e&&(e.scrollTop=t.calListTop)}})})}function m(){const t=Ca();u?va():Yt(),Na(),Ea(t),requestAnimationFrame(()=>{var e;ua(),(e=r.querySelector(".dt-time.is-selected"))==null||e.scrollIntoView({block:"center"})})}function zt(t){const e=t.querySelector('input[name="color_picker"]'),a=t.querySelector('input[name="color"]');!e||!a||(e.addEventListener("input",()=>{a.value=e.value.toUpperCase()}),a.addEventListener("change",()=>{let l=a.value.trim();l&&!l.startsWith("#")&&(l=`#${l}`),/^#[0-9A-Fa-f]{6}/.test(l)&&(e.value=l.slice(0,7),a.value=l.toUpperCase())}))}function Na(){r.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",M=>{const D=M.target.closest("[data-action]");((D==null?void 0:D.dataset.action)==="info"||(D==null?void 0:D.dataset.action)==="info-close")&&(M.preventDefault(),M.stopPropagation()),Ra(M)})}),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(b=>{b.addEventListener("keydown",M=>{(M.key==="Enter"||M.key===" ")&&(M.preventDefault(),b.click())})});const t=r.querySelector("#delete-cal-confirm"),e=r.querySelector("#delete-cal-submit");t==null||t.addEventListener("change",()=>{e&&(e.disabled=!t.checked||f)});const a=r.querySelector("#delete-ab-confirm"),l=r.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{l&&(l.disabled=!a.checked||f)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(b=>{b.addEventListener("error",()=>{const M=b.dataset.avatarFallback||"?",D=document.createElement("span");D.className="contact-avatar contact-avatar-fallback",D.setAttribute("aria-hidden","true"),D.textContent=M,b.replaceWith(D)})}),qt||(document.addEventListener("keydown",b=>{if(b.key==="Escape"){if(U&&(U.phase==="done"||U.phase==="error")){Ht();return}U||Kt()}}),qt=!0);const o=r.querySelector('[data-form="login"]');o==null||o.addEventListener("submit",b=>{b.preventDefault(),La(o)});const d=r.querySelector('[data-form="share"]');d==null||d.addEventListener("submit",b=>{b.preventDefault(),Fa(d)});const n=r.querySelector('[data-form="edit-cal"]');n&&(zt(n),n.addEventListener("submit",b=>{b.preventDefault(),Ma(n)}));const s=r.querySelector('[data-form="edit-event"]');s==null||s.addEventListener("submit",b=>{b.preventDefault(),qa(s)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(b=>{b.addEventListener("change",()=>{if(!y)return;const M=r.querySelector('[data-form="edit-event"]');if(!M)return;const D=new FormData(M),B=M.querySelector('input[name="allDay"]'),_=nt(D);_.endMode==="until"&&!_.until&&(_.until=Ve(String(D.get("start")??y.start??""))||X(new Date)),y={...y,summary:String(D.get("summary")??y.summary),description:String(D.get("description")??y.description),location:String(D.get("location")??y.location),instanceId:Number(D.get("instanceId"))||y.instanceId,allDay:(B==null?void 0:B.checked)??y.allDay,start:String(D.get("start")??y.start??""),end:String(D.get("end")??y.end??"")||null,repeat:_,hasRrule:!!String(D.get("repeatFreq")??"").trim()},_.freq&&_.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),m(),_.endMode==="until"&&requestAnimationFrame(()=>{var ie;const K=r.querySelector('input[name="repeatUntil"]');K==null||K.focus();try{(ie=K==null?void 0:K.showPicker)==null||ie.call(K)}catch{}})})});const i=r.querySelector('[data-form="create-cal"]');i&&(zt(i),i.addEventListener("submit",b=>{b.preventDefault(),Pa(i)}));const p=r.querySelector('[data-form="create-ab"]');p==null||p.addEventListener("submit",b=>{b.preventDefault(),ja(p)});const h=r.querySelector('[data-form="edit-ab"]');h==null||h.addEventListener("submit",b=>{b.preventDefault(),Ha(h)});const g=r.querySelector('[data-form="contact"]');g==null||g.addEventListener("submit",b=>{b.preventDefault(),Va(g)});const L=r.querySelector('[data-form="task"]');if(L==null||L.addEventListener("submit",b=>{b.preventDefault(),xa(L)}),L){const b=L.querySelector('select[name="instanceId"]');b==null||b.addEventListener("change",()=>{if(!V||!q)return;const M=Number(b.value);if(!Number.isFinite(M)||M<=0)return;const D=new FormData(L),B=String(D.get("due")??"").trim();q={...q,instanceId:M,parentUid:q.parentUid&&le.some(_=>_.uid===q.parentUid&&_.instanceId===M)?q.parentUid:null,summary:String(D.get("summary")??""),description:String(D.get("description")??""),status:String(D.get("status")??"NEEDS-ACTION"),due:B?new Date(B).toISOString():null,priority:Number(D.get("priority")??0),percent:Number(D.get("percent")??0)},m()})}const T=r.querySelector('[data-form="note"]');T==null||T.addEventListener("submit",b=>{b.preventDefault(),Ia(T)});const w=r.querySelector('input[data-action="contact-search"]');w==null||w.addEventListener("input",()=>{Ee&&clearTimeout(Ee),Ee=setTimeout(()=>{Re=w.value,x!==null&&(async()=>{try{await Le(x),m()}catch(b){v("error",b instanceof Error?b.message:"Search failed"),m()}})()},250)});const O=r.querySelector('input[data-action="task-search"]');O==null||O.addEventListener("input",()=>{Ee&&clearTimeout(Ee),Ee=setTimeout(()=>{dt=O.value,(async()=>{try{await He(),m()}catch(b){v("error",b instanceof Error?b.message:"Search failed"),m()}})()},250)});const Q=r.querySelector('input[data-action="note-search"]');Q==null||Q.addEventListener("input",()=>{Ee&&clearTimeout(Ee),Ee=setTimeout(()=>{ut=Q.value,(async()=>{try{await tt(),m()}catch(b){v("error",b instanceof Error?b.message:"Search failed"),m()}})()},250)}),Ua(),Aa(),Oa()}async function Ta(t){var o,d;const e=Jt();if(e.length===0){v("error","No writable tasks selected"),m();return}const a=e.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(t==="bulk-task-delete"){if(!confirm(`Delete ${e.length} task${e.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;f=!0,I(),m();try{const n=await F.bulkTasks({op:"delete",items:a});Z=[],oe&&e.some(s=>z(s.instanceId,s.uri)===oe)&&(oe=null,q=null,V=!1),await He(),n.failed>0?v("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk delete failed")}finally{f=!1,m()}return}let l={};if(t==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((o=n==null?void 0:n.value)==null?void 0:o.trim())??"";if(!s){v("error","Choose a status to apply"),m();return}l={status:s}}else if(t==="bulk-task-due"){const n=it.trim();if(!n){v("error","Choose a due date to apply"),m();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){v("error","Invalid due date"),m();return}l={due:s.toISOString()}}else if(t==="bulk-task-clear-due")l={due:null};else if(t==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((d=n==null?void 0:n.value)==null?void 0:d.trim())??"";if(s===""){v("error","Enter a percent complete (0–100)"),m();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){v("error","Percent must be between 0 and 100"),m();return}l={percent:Math.round(i)}}f=!0,I(),m();try{const n=await F.bulkTasks({op:"update",items:a,fields:l});if(await He(),q&&!V){const i=z(q.instanceId,q.uri),p=le.find(h=>z(h.instanceId,h.uri)===i);p&&(q={...p})}const s=t==="bulk-task-status"?"status":t==="bulk-task-due"||t==="bulk-task-clear-due"?"due date":"percent";n.failed>0?v("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk update failed")}finally{f=!1,m()}}async function xa(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("status")??"NEEDS-ACTION"),d=String(e.get("due")??"").trim(),n=d?new Date(d).toISOString():null,s=Number(e.get("priority")??0),i=Number(e.get("percent")??0),p=String(e.get("parentUid")??"").trim(),h=p===""?null:p;f=!0,I(),m();try{if(V){const g=Number(e.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const L=await F.createTask({instanceId:g,summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:h});V=!1,oe=z(L.task.instanceId,L.task.uri),q=L.task,v("success",h?"Subtask created":"Task created")}else if(q){const g=await F.updateTask(q.instanceId,q.uri,{summary:a,description:l,status:o,due:n,priority:s,percent:i,parentUid:h});q=g.task,oe=z(g.task.instanceId,g.task.uri),v("success","Task saved")}await He()}catch(g){v("error",g instanceof Error?g.message:"Save failed")}finally{f=!1,m()}}async function Ia(t){const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("dtstart")??"").trim(),d=o?new Date(o).toISOString():null;f=!0,I(),m();try{if(ae){const n=Number(e.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await F.createNote({instanceId:n,summary:a,description:l,dtstart:d});ae=!1,we=z(s.note.instanceId,s.note.uri),Y=s.note,v("success","Note created")}else if(Y){const n=await F.updateNote(Y.instanceId,Y.uri,{summary:a,description:l,dtstart:d});Y=n.note,we=z(n.note.instanceId,n.note.uri),v("success","Note saved")}await tt()}catch(n){v("error",n instanceof Error?n.message:"Save failed")}finally{f=!1,m()}}function Oa(){const t=r.querySelector('input[data-action="contact-photo"]');t&&t.addEventListener("change",()=>{(async()=>{var a;const e=(a=t.files)==null?void 0:a[0];if(t.value="",!!e){if(e.size>2.5*1024*1024){v("error","Photo is too large (max ~2 MB)"),m();return}try{const l=await ha(e);ue=l,re=`data:${e.type||"image/jpeg"};base64,${l}`,fe=!1,m()}catch(l){v("error",l instanceof Error?l.message:"Failed to read photo"),m()}}})()})}function Aa(){const t=r.querySelector('[data-form="create-cal"]');if(!t)return;const e=t.querySelector('input[name="holidays"]'),a=t.querySelector("#holidays-country-wrap"),l=t.querySelector('input[name="displayname"]'),o=t.querySelector('input[name="readOnly"]');if(!e||!a)return;const d=()=>{const n=e.checked;a.hidden=!n,l&&(l.required=!n,n&&!l.value.trim()?l.placeholder="Auto: Holidays (XX)":n||(l.placeholder="Work")),n&&o&&(o.checked=!0)};e.addEventListener("change",d),d()}async function La(t){const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("password")??"");f=!0,I(),m(),j.event("login.attempt",{username:a});try{const o=await F.login(a,l);u=o.user,kt(o.ui),j.event("login.ok",{username:(u==null?void 0:u.username)??a}),await be(),v("success","Signed in")}catch(o){j.warn("login.failed",o instanceof Error?o.message:o),v("error",o instanceof Error?o.message:"Login failed")}finally{f=!1,m()}}async function Fa(t){if(S===null)return;const e=new FormData(t),a=String(e.get("username")??""),l=String(e.get("access")??"read");W=!0,f=!0,I(),m();try{await F.share(S,a,l),await Qe(S),v("success",`Shared with ${a}`)}catch(o){v("error",o instanceof Error?o.message:"Share failed")}finally{f=!1,m()}}function at(t){if(!y)return;const e=new FormData(t),a=t.querySelector('input[name="allDay"]');y={...y,summary:String(e.get("summary")??y.summary),description:String(e.get("description")??y.description),location:String(e.get("location")??y.location),instanceId:Number(e.get("instanceId"))||y.instanceId,allDay:(a==null?void 0:a.checked)??y.allDay,start:String(e.get("start")??y.start??""),end:String(e.get("end")??y.end??"")||null,repeat:nt(e),hasRrule:!!String(e.get("repeatFreq")??"").trim()}}function nt(t){const e=String(t.get("repeatFreq")??"").trim().toUpperCase();if(!e)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(t.get("repeatInterval")??1)||1)),l=String(t.get("repeatEndMode")??"never"),o=l==="until"||l==="count"?l:"never";let d=null,n=null;if(o==="until"){const i=String(t.get("repeatUntil")??"").trim();d=i?i.slice(0,10):null}else if(o==="count"){const i=Number(t.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=t.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:e,interval:a,until:d,count:n,byDay:s,endMode:o}}async function qa(t){if(!y||!y.canWrite)return;const e=new FormData(t),a=String(e.get("summary")??"").trim(),l=String(e.get("description")??"").trim(),o=String(e.get("location")??"").trim(),d=e.get("allDay")==="on",n=String(e.get("start")??"").trim(),s=String(e.get("end")??"").trim(),i=Number(e.get("instanceId"))||y.instanceId,p=nt(e);if(!a){v("error","Title is required"),m();return}if(!n){v("error","Start is required"),m();return}let h,g;if(d)h=n.slice(0,10),g=s?s.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const O=Dt(n,s||null);h=new Date(O.start).toISOString(),g=O.end?new Date(O.end).toISOString():null}else h=new Date(n).toISOString(),g=s?new Date(s).toISOString():null;const L=y.instanceId,T=y.uri,w=ve;f=!0,I(),De=!0,m(),j.event(w?"event.create":"event.update",{instanceId:i,uri:w?null:T,allDay:d,summary:a});try{const O={summary:a,description:l,location:o,allDay:d,start:h,end:g,instanceId:i,repeat:p},Q=w?await F.createEvent(i,O):await F.updateEvent(L,T,O);(S===null||Q.event.instanceId!==S)&&(S=Q.event.instanceId),await ye(),De=!1,y=null,ve=!1,N=null,j.event(w?"event.created":"event.saved",{uri:Q.event.uri,instanceId:Q.event.instanceId}),v("success",w?"Event created":"Event saved")}catch(O){j.warn("event.save failed",O instanceof Error?O.message:O),v("error",O instanceof Error?O.message:"Save failed")}finally{f=!1,m()}}async function Ma(t){if(S===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim();f=!0,I(),m();try{const d=await F.updateCalendar(S,{displayname:a,description:l,color:o});W=!0,await be(),S=d.calendar.id,await Qe(S),await ye(),v("success","Calendar updated")}catch(d){v("error",d instanceof Error?d.message:"Update failed")}finally{f=!1,m()}}async function Pa(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??""),o=String(e.get("color")??"").trim(),d=e.get("holidays")==="on",n=String(e.get("holidayCountry")??"").trim(),s=e.get("readOnly")==="on";if(Se=!0,d&&!n){v("error","Select a country for the holidays calendar"),m();return}if(!d&&!a){v("error","Display name is required"),m();return}f=!0,I(),$e=null,m();try{const i=await F.createCalendar({displayname:a,description:l,color:o,holidays:d,holidayCountry:d?n:void 0,readOnly:s});S=i.calendar.id,Se=!1,await be();let p=`Created “${i.calendar.displayname}”`;const h=i.holidayImport??i.calendar.holidayImport;h&&(p+=`. Holidays imported: ${vt(h)}.`,$e={ok:!0,message:vt(h)}),s&&(p+=" Calendar is read-only."),v("success",p)}catch(i){Se=!0,v("error",i instanceof Error?i.message:"Create failed")}finally{f=!1,m()}}async function Ra(t){var l,o,d;const e=t.target.closest("[data-action]");if(!e)return;const a=e.dataset.action;if(a&&j.debug(`action:${a}`,{id:e.dataset.id,tab:e.dataset.tab,uri:e.dataset.uri}),a==="close-import-progress"){U&&(U.phase==="done"||U.phase==="error")&&Ht();return}if(a==="logout"){f=!0,j.event("logout");try{await F.logout()}catch{}u=null,ke(),U=null,A=[],ne=[],S=null,se=[],x=null,Ce=[],J=null,k=null,G=!1,te=!1,de=!1,Se=!1,I(),f=!1,m();return}if(a==="select-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;S=n,$e=null,f=!0,I(),m();try{await ye()}catch(s){v("error",s instanceof Error?s.message:"Failed to load calendar")}finally{f=!1,m()}return}if(a==="edit-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;S=n,W=!0,ce=null,$e=null,f=!0,I(),m();try{await Qe(n),await ye()}catch(i){v("error",i instanceof Error?i.message:"Failed to open calendar")}finally{f=!1,m()}return}if(a==="close-cal-modal"){W=!1,m();return}if(a==="open-create-cal-modal"){Se=!0,W=!1,ce=null,I(),m();return}if(a==="close-create-cal-modal"){Se=!1,I(),m();return}if(a==="delete-cal"){const n=Number(e.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;ce=n,W=!1,I(),m();return}if(a==="cancel-delete-cal"){ce=null,m();return}if(a==="confirm-delete-cal"){const n=Number(e.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;f=!0,I(),m();try{if(await F.deleteCalendar(n),S===n&&(S=null),ce=null,W=!1,ne=[],We=[],await be(),S===null){const i=Mt();i&&(S=i.id,await ye())}v("success","Calendar deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{f=!1,m()}return}if(a==="month-today"){const n=new Date;xe={y:n.getFullYear(),m:n.getMonth()},Ge=null,f=!0,m();try{await ye()}finally{f=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,s=new Date(xe.y,xe.m+n,1);xe={y:s.getFullYear(),m:s.getMonth()},Ge=null,f=!0,m();try{await ye()}finally{f=!1,m()}return}if(a==="open-event"){t.stopPropagation();const n=Number(e.dataset.instance),s=e.dataset.uri??"";if(!Number.isFinite(n)||!s)return;f=!0,I(),m();try{const i=await F.getEvent(n,s);y={...i.event,repeat:i.event.repeat??mt()},ve=!1,De=!0,N=null,W=!1,ce=null}catch(i){v("error",i instanceof Error?i.message:"Failed to open event")}finally{f=!1,m()}return}if(a==="open-event-day"){t.stopPropagation();const n=e.dataset.day??"";Ge=Ge===n?null:n,m();return}if(a==="new-event-day"){const n=t.target;if((l=n==null?void 0:n.closest)!=null&&l.call(n,".month-event, .month-event-more"))return;const s=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(S===null){v("error","Select a calendar first"),m();return}const i=A.find(p=>p.id===S);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){v("error","This calendar is read-only"),m();return}ve=!0,y=fa(s,S),De=!0,N=null,W=!1,ce=null,I(),m();return}if(a==="close-event-modal"){De=!1,y=null,ve=!1,N=null,I(),m();return}if(a==="dt-open"){const n=e.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&y&&at(s),(N==null?void 0:N.field)===n)N=null;else{const i=e.dataset.dtDateOnly==="1",p=e.dataset.dtClear!=="0",h=e.dataset.dtName||n;let g=Nt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=et().start);const L=Ze(g||X(new Date)),[T,w]=L.date.split("-").map(Number);N={field:n,viewY:T,viewM:(w||1)-1,dateOnly:i,allowClear:p,name:h}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!N)return;const n=a==="dt-month-prev"?-1:1,s=new Date(N.viewY,N.viewM+n,1);N={...N,viewY:s.getFullYear(),viewM:s.getMonth()},m();return}if(a==="dt-pick-day"){if(!N)return;const n=N.field,s=e.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&at(i);const p=N.dateOnly;if(p)he(n,s),N=null;else{const h=Nt(n),g=Ze(h||et(s).start).hm;he(n,`${s}T${g}`),N={...N,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&y&&!p&&y.end){const h=new Date(String(y.start)),g=new Date(String(y.end));!Number.isNaN(h.getTime())&&!Number.isNaN(g.getTime())&&g<=h&&he("end",Ae(new Date(h.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!N||N.dateOnly)return;const n=N.field,s=e.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&y&&at(i);const p=Nt(n)||et().start,g=`${Ze(p).date}T${s}`;if(he(n,g),n==="start"&&y){y={...y,allDay:!1};const L=y.end?Ze(String(y.end)):null,T=new Date(g);(!L||new Date(`${L.date}T${L.hm}`)<=T)&&he("end",Ae(new Date(T.getTime()+3600*1e3)))}N=null,m();return}if(a==="dt-today"){if(!N)return;const n=N.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&at(s);const i=X(new Date);if(N.dateOnly)he(n,i);else{const p=et(i);n==="start"?(he("start",p.start),y&&!y.end&&he("end",p.end)):n==="end"?he("end",p.end):he(n,p.start)}N=null,m();return}if(a==="dt-clear"){if(!N||!N.allowClear)return;const n=N.field,s=r.querySelector('[data-form="edit-event"]');s&&y&&at(s),he(n,null),N=null,m();return}if(a==="event-allday-toggle"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]'),s=e.checked;if(n){const i=new FormData(n),p=String(i.get("start")??y.start??""),h=String(i.get("end")??y.end??"")||null;let g=p,L=h;if(s){const T=na(p,h);g=T.start,L=T.end}else{const T=p.slice(0,10),w=(h||p).slice(0,10),O=Dt(T,w);g=O.start,L=O.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:s,start:g,end:L,repeat:nt(i)}}else y={...y,allDay:s};N=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!y)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),p=nt(s);y={...y,summary:String(s.get("summary")??y.summary),description:String(s.get("description")??y.description),location:String(s.get("location")??y.location),instanceId:Number(s.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(s.get("start")??y.start??""),end:String(s.get("end")??y.end??"")||null,repeat:p,hasRrule:!!String(s.get("repeatFreq")??"").trim()},p.freq&&p.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),m();return}if(a==="delete-event"){if(!y||!y.canWrite||ve||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,s=y.uri;f=!0,I(),m();try{await F.deleteEvent(n,s),De=!1,y=null,await ye(),v("success","Event deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{f=!1,m()}return}if(a==="info"){const n=e.dataset.info??"";Wa(n);return}if(a==="info-close"){Kt();return}if(a==="flash-close"){I(),m();return}if(a==="tab"){const n=e.dataset.tab;if(n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"){C=n,j.event("tab",{tab:n}),n!=="calendars"&&(W=!1,ce=null),n!=="contacts"&&(pe=null),I(),f=!0,m();try{n==="contacts"&&x!==null?await Le(x):n==="calendars"?await ye():n==="tasks"?await He():n==="notes"&&await tt()}catch(s){j.warn("tab load failed",s instanceof Error?s.message:s),v("error",s instanceof Error?s.message:"Failed to load")}finally{f=!1,m()}}return}if(a==="sort-task"||a==="sort-note"){const n=e.dataset.sort||"";if(!n)return;if(a==="sort-task"){Oe===n?Ne=Ne==="asc"?"desc":"asc":(Oe=n,Ne=n==="due"||n==="summary"?"asc":"desc"),f=!0,m();try{await He()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{f=!1,m()}}else{Je===n?_e=_e==="asc"?"desc":"asc":(Je=n,_e="asc"),f=!0,m();try{await tt()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{f=!1,m()}}return}if(a==="select-task"){if(t.target.closest("[data-stop-row], .task-check"))return;const n=Number(e.dataset.instance),s=e.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=le.find(p=>p.instanceId===n&&p.uri===s)??null;V=!1,oe=z(n,s),q=i?{...i}:null,I(),m();return}if(a==="task-check"){t.preventDefault(),t.stopPropagation();const n=Number(e.dataset.instance),s=e.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=z(n,s),p=le.find(h=>z(h.instanceId,h.uri)===i);if(!p||!p.canWrite||p.readOnly)return;Z.includes(i)?Z=Z.filter(h=>h!==i):Z=[...Z,i],m();return}if(a==="task-select-all"){t.preventDefault();const n=le.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>Z.includes(z(i.instanceId,i.uri)))?Z=[]:Z=n.map(i=>z(i.instanceId,i.uri)),m();return}if(a==="bulk-task-clear"){Z=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Ta(a);return}if(a==="select-note"){const n=Number(e.dataset.instance),s=e.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=Xe.find(p=>p.instanceId===n&&p.uri===s)??null;ae=!1,we=z(n,s),Y=i?{...i}:null,I(),m();return}if(a==="new-task"){V=!0,oe=null,q={uri:"",instanceId:((o=Ue[0])==null?void 0:o.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},I(),m();return}if(a==="new-subtask"){if(!q||V||!q.uid||!q.canWrite)return;const n=q;V=!0,oe=null,q={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},I(),m();return}if(a==="new-note"){ae=!0,we=null,Y={uri:"",instanceId:((d=Be[0])==null?void 0:d.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},I(),m();return}if(a==="cancel-task"){V=!1,q=null,oe=null,m();return}if(a==="cancel-note"){ae=!1,Y=null,we=null,m();return}if(a==="delete-task"){if(!q||V||!confirm("Delete this task? CalDAV clients will sync the removal."))return;f=!0,I(),m();try{await F.deleteTask(q.instanceId,q.uri),oe=null,q=null,await He(),v("success","Task deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="delete-note"){if(!Y||ae||!confirm("Delete this note? CalDAV clients will sync the removal."))return;f=!0,I(),m();try{await F.deleteNote(Y.instanceId,Y.uri),we=null,Y=null,await tt(),v("success","Note deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="select-ab"){const n=Number(e.dataset.id);if(!Number.isFinite(n))return;x=n,de=!1,Ie=null,J=null,k=null,G=!1,te=!1,Re="",Ce=[],re=null,ue=null,fe=!1,I(),f=!0,m();try{await Le(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contacts")}finally{f=!1,m()}return}if(a==="edit-ab"){t.stopPropagation();const n=Number(e.dataset.id);if(!Number.isFinite(n)||!se.find(p=>p.id===n))return;const i=x!==n;x=n,de=!0,te=!1,Ie=null,I(),i&&(J=null,k=null,G=!1,Re="",Ce=[],re=null,ue=null,fe=!1),f=!0,m();try{i&&await Le(n)}catch(p){v("error",p instanceof Error?p.message:"Failed to open address book")}finally{f=!1,m()}return}if(a==="close-ab-modal"){de=!1,m();return}if(a==="select-contact"){const n=e.dataset.uri??"";if(!n)return;I();try{await ba(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(x===null)return;ya(),I(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){G=!1,te=!1,k=null,J=null,re=null,ue=null,fe=!1,N=null,I(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!k)return;ft(),Array.isArray(k.emails)||(k.emails=[""]),Array.isArray(k.phones)||(k.phones=[{type:"cell",value:""}]),Array.isArray(k.custom)||(k.custom=[]),a==="add-email"?k.emails.length<10&&k.emails.push(""):a==="add-phone"?k.phones.length<10&&k.phones.push({type:"other",value:""}):k.custom.length<30&&k.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!k)return;ft();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.emails)?k.emails:[""];k.emails=s.filter((i,p)=>p!==n),k.emails.length===0&&(k.emails=[""]),m();return}if(a==="remove-phone"){if(!k)return;ft();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.phones)?k.phones:[{type:"cell",value:""}];k.phones=s.filter((i,p)=>p!==n),k.phones.length===0&&(k.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!k)return;ft();const n=Number(e.dataset.idx);if(!Number.isFinite(n))return;k.custom=(Array.isArray(k.custom)?k.custom:[]).filter((s,i)=>i!==n),m();return}if(a==="remove-photo"){re=null,ue=null,fe=!0,k&&(k.hasPhoto=!1),m();return}if(a==="delete-contact"){if(x===null||!J||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;f=!0,I(),te=!0,m();try{await F.deleteContact(x,J),J=null,k=null,G=!1,te=!1,N=null,re=null,await be(),v("success","Contact deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="delete-ab"){t.stopPropagation();const n=Number(e.dataset.id??x);if(!Number.isFinite(n)||!se.find(i=>i.id===n))return;pe=n,de=!1,te=!1,I(),m();return}if(a==="cancel-delete-ab"){pe=null,m();return}if(a==="confirm-delete-ab"){const n=Number(e.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=se.find(h=>h.id===n);if(!i)return;const p=(i.cardCount??0)>0;f=!0,I(),m();try{await F.deleteAddressBook(n,p),x===n&&(x=null,Ce=[],k=null,J=null,G=!1),pe=null,de=!1,te=!1,await be(),x===null&&se.length>0&&(x=se[0].id,await Le(x)),v("success","Address book deleted")}catch(h){v("error",h instanceof Error?h.message:"Delete failed")}finally{f=!1,m()}return}if(a==="export-ab"){if(x===null)return;de=!0,f=!0,I(),m();try{const{blob:n,filename:s}=await F.exportAddressBook(x),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}return}if(a==="export-contact"){if(x===null||!J||G)return;te=!0,f=!0,I(),m();try{const{blob:n,filename:s}=await F.exportContact(x,J),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}return}if(a==="revoke"){const n=e.dataset.href??"";if(!n||S===null||!confirm("Revoke access for this user?"))return;W=!0,f=!0,I(),m();try{await F.revoke(S,n),await Qe(S),v("success","Share revoked")}catch(s){v("error",s instanceof Error?s.message:"Revoke failed")}finally{f=!1,m()}return}if(a==="export-cal"){if(S===null)return;W=!0,f=!0,I(),m();try{const{blob:n,filename:s}=await F.exportCalendar(S),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}}}function Ua(){const t=r.querySelector('input[data-action="import-cal"]');t&&t.addEventListener("change",()=>{Ya(t)});const e=r.querySelector('input[data-action="import-ab"]');e&&e.addEventListener("change",()=>{Ba(e)})}async function Ba(t){var l;if(x===null)return;const e=(l=t.files)==null?void 0:l[0];if(t.value="",!e)return;const a=x;de=!0,f=!0,I(),Ie=null,ke(),U={kind:"contacts",fileName:e.name,fileSizeLabel:Vt(e.size),phase:"reading",readPercent:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},jt(),m();try{const o=await Wt(e,s=>{if(!U||U.phase!=="reading")return;U={...U,readPercent:s};const i=r.querySelector(".import-progress-bar"),p=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),p&&s!==null&&(p.textContent=`Reading file… ${s}%`)});Me("uploading",{readPercent:100}),Me("processing"),j.event("import.contacts.start",{file:e.name,bytes:e.size,abId:a});const d=await F.importAddressBook(a,o),n=vt(d);Ie={ok:!0,message:n},await be(),x===a&&await Le(a),ke(),Me("done",{ok:!0,resultMessage:`${n} (from “${e.name}”)`}),v("success",`Import finished for “${e.name}”: ${n}.`)}catch(o){const d=o instanceof Error?o.message:"Import failed";Ie={ok:!1,message:d},ke(),Me("error",{ok:!1,resultMessage:d}),v("error",d)}finally{f=!1,m()}}function ft(){if(!k)return;const t=r.querySelector('[data-form="contact"]');if(!t)return;const e=new FormData(t);k.firstname=String(e.get("firstname")??""),k.lastname=String(e.get("lastname")??""),k.fullname=String(e.get("fullname")??""),k.org=String(e.get("org")??""),k.title=String(e.get("title")??""),k.url=String(e.get("url")??""),k.note=String(e.get("note")??"");const a=String(e.get("birthday")??"").trim();k.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,k.address={street:String(e.get("street")??""),city:String(e.get("city")??""),region:String(e.get("region")??""),postal:String(e.get("postal")??""),country:String(e.get("country")??"")};const l=[];let o=0;for(;e.has(`email_${o}`);)l.push(String(e.get(`email_${o}`)??"")),o++;l.length&&(k.emails=l);const d=[];for(o=0;e.has(`phone_value_${o}`);)d.push({type:String(e.get(`phone_type_${o}`)??"other"),value:String(e.get(`phone_value_${o}`)??"")}),o++;d.length&&(k.phones=d);const n=[];for(o=0;e.has(`custom_label_${o}`)||e.has(`custom_value_${o}`);)n.push({label:String(e.get(`custom_label_${o}`)??""),value:String(e.get(`custom_value_${o}`)??"")}),o++;k.custom=n}function _a(t){const e=new FormData(t),a=[];let l=0;for(;e.has(`email_${l}`);){const s=String(e.get(`email_${l}`)??"").trim();s&&a.push(s),l++}const o=[];for(l=0;e.has(`phone_value_${l}`);){const s=String(e.get(`phone_value_${l}`)??"").trim();s&&o.push({type:String(e.get(`phone_type_${l}`)??"other"),value:s}),l++}const d=[];for(l=0;e.has(`custom_label_${l}`)||e.has(`custom_value_${l}`);){const s=String(e.get(`custom_label_${l}`)??"").trim(),i=String(e.get(`custom_value_${l}`)??"").trim();(s||i)&&d.push({label:s,value:i}),l++}const n={firstname:String(e.get("firstname")??"").trim(),lastname:String(e.get("lastname")??"").trim(),fullname:String(e.get("fullname")??"").trim(),org:String(e.get("org")??"").trim(),title:String(e.get("title")??"").trim(),emails:a,phones:o,address:{street:String(e.get("street")??"").trim(),city:String(e.get("city")??"").trim(),region:String(e.get("region")??"").trim(),postal:String(e.get("postal")??"").trim(),country:String(e.get("country")??"").trim()},url:String(e.get("url")??"").trim(),note:String(e.get("note")??"").trim(),birthday:(()=>{const s=String(e.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:d};return fe?n.removePhoto=!0:ue&&(n.photoBase64=ue),n}async function Va(t){if(x===null)return;const e=_a(t);f=!0,I(),te=!0,m();try{if(G){const a=await F.createContact(x,e);G=!1,J=a.contact.uri,k=null,te=!1,re=null,ue=null,fe=!1,N=null,v("success","Contact created")}else J&&(J=(await F.updateContact(x,J,e)).contact.uri,k=null,te=!1,re=null,ue=null,fe=!1,N=null,v("success","Contact saved"));try{await be()}catch(a){if(console.error(a),x!==null)try{await Le(x)}catch{}}}catch(a){v("error",a instanceof Error?a.message:"Save failed")}finally{f=!1,m()}}async function ja(t){const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();if(a){f=!0,I(),m();try{const o=await F.createAddressBook({displayname:a,description:l});x=o.addressbook.id,J=null,k=null,G=!1,Re="",await be(),v("success",`Address book “${o.addressbook.displayname}” created`)}catch(o){v("error",o instanceof Error?o.message:"Create failed")}finally{f=!1,m()}}}async function Ha(t){if(x===null)return;const e=new FormData(t),a=String(e.get("displayname")??"").trim(),l=String(e.get("description")??"").trim();de=!0,f=!0,I(),m();try{await F.updateAddressBook(x,{displayname:a,description:l}),await be(),v("success","Address book updated")}catch(o){v("error",o instanceof Error?o.message:"Update failed")}finally{f=!1,m()}}function Wa(t){const e=en[t];if(!e)return;const a=r.querySelector("#info-modal"),l=r.querySelector("#info-modal-title"),o=r.querySelector("#info-modal-body");if(!a||!l||!o)return;l.textContent=e.title,o.innerHTML=e.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const d=a.querySelector(".info-modal-close");d==null||d.focus()}function Kt(){const t=r.querySelector("#info-modal");t&&(t.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ya(t){var l;if(S===null)return;const e=(l=t.files)==null?void 0:l[0];if(t.value="",!e)return;const a=S;W=!0,f=!0,I(),$e=null,ke(),U={kind:"calendar",fileName:e.name,fileSizeLabel:Vt(e.size),phase:"reading",readPercent:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},jt(),m();try{const o=await Wt(e,s=>{if(!U||U.phase!=="reading")return;U={...U,readPercent:s};const i=r.querySelector(".import-progress-bar"),p=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),p&&s!==null&&(p.textContent=`Reading file… ${s}%`)});Me("uploading",{readPercent:100}),Me("processing"),j.event("import.calendar.start",{file:e.name,bytes:e.size,calId:a});const d=await F.importCalendar(a,o),n=vt(d);$e={ok:!0,message:n},S===a&&await ye(),ke(),Me("done",{ok:!0,resultMessage:`${n} (from “${e.name}”)`}),v("success",`Import finished for “${e.name}”: ${n}.`)}catch(o){const d=o instanceof Error?o.message:"Import failed";$e={ok:!1,message:d},ke(),Me("error",{ok:!1,resultMessage:d}),v("error",d)}finally{f=!1,m()}}ea()}const Zt=document.getElementById("app");if(!Zt)throw new Error("#app missing");an(Zt);
