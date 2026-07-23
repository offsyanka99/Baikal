var Ra=Object.defineProperty;var Ua=(l,d,E)=>d in l?Ra(l,d,{enumerable:!0,configurable:!0,writable:!0,value:E}):l[d]=E;var Be=(l,d,E)=>Ua(l,typeof d!="symbol"?d+"":d,E);(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const A of document.querySelectorAll('link[rel="modulepreload"]'))C(A);new MutationObserver(A=>{for(const U of A)if(U.type==="childList")for(const V of U.addedNodes)V.tagName==="LINK"&&V.rel==="modulepreload"&&C(V)}).observe(document,{childList:!0,subtree:!0});function E(A){const U={};return A.integrity&&(U.integrity=A.integrity),A.referrerPolicy&&(U.referrerPolicy=A.referrerPolicy),A.crossOrigin==="use-credentials"?U.credentials="include":A.crossOrigin==="anonymous"?U.credentials="omit":U.credentials="same-origin",U}function C(A){if(A.ep)return;A.ep=!0;const U=E(A);fetch(A.href,U)}})();const Ve={off:0,error:1,warn:2,info:3,debug:4};let ne="off";const be="[baikal-portal]";function Pa(l){const d=(l||"off").toLowerCase().trim();return d==="error"||d==="warn"||d==="info"||d==="debug"||d==="off"?d:"off"}function _a(l){return ne=Pa(l),ne!=="off"&&console.info(be,`log level = ${ne}`),ne}function je(l){return Ve[ne]>=Ve[l]}function pe(l,d,E,C){if(!je(l))return;const A=[be,E];C!==void 0&&A.push(C),console[d](...A)}function Ba(l,d){je("info")&&(d&&Object.keys(d).length>0?console.info(be,`event:${l}`,d):console.info(be,`event:${l}`))}const j={error(l,d){pe("error","error",l,d)},warn(l,d){pe("warn","warn",l,d)},info(l,d){pe("info","info",l,d)},debug(l,d){pe("debug","debug",l,d)},event:Ba};class se extends Error{constructor(E,C){super(E);Be(this,"status");this.status=C}}let xe="";function Ne(l){xe=l&&typeof l=="string"?l:""}async function R(l,d={}){const E=new Headers(d.headers);d.body&&!E.has("Content-Type")&&E.set("Content-Type","application/json");const C=(d.method||"GET").toUpperCase();C!=="GET"&&C!=="HEAD"&&C!=="OPTIONS"&&xe&&E.set("X-CSRF-Token",xe);const A=typeof performance<"u"?performance.now():Date.now();j.debug(`api → ${C} ${l}`);const U=await fetch(`/api${l}`,{...d,headers:E,credentials:"same-origin"});let V=null;const S=await U.text();if(S)try{V=JSON.parse(S)}catch{V={error:S}}const at=Math.round((typeof performance<"u"?performance.now():Date.now())-A);if(!U.ok){let H=`Request failed (${U.status})`;throw V&&typeof V=="object"&&V!==null&&"error"in V&&typeof V.error=="string"?H=V.error:(U.status===500||U.status===504)&&(H="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),U.status>=500?j.error(`api ← ${C} ${l} ${U.status} (${at}ms)`,H):U.status!==401?j.warn(`api ← ${C} ${l} ${U.status} (${at}ms)`,H):j.debug(`api ← ${C} ${l} 401 (${at}ms)`),new se(H,U.status)}return j.info(`api ← ${C} ${l} ${U.status} (${at}ms)`),V}function ut(l){return encodeURIComponent(l)}const L={ui:()=>R("/ui"),me:async()=>{var d;const l=await R("/me");return Ne(l.csrfToken||((d=l.user)==null?void 0:d.csrfToken)),l},login:async(l,d)=>{var C;const E=await R("/login",{method:"POST",body:JSON.stringify({username:l,password:d})});return Ne((C=E.user)==null?void 0:C.csrfToken),E},logout:async()=>{try{return await R("/logout",{method:"POST"})}finally{Ne("")}},calendars:()=>R("/calendars"),createCalendar:l=>R("/calendars",{method:"POST",body:JSON.stringify(l)}),holidayCountries:()=>R("/holidays/countries"),updateCalendar:(l,d)=>R(`/calendars/${l}`,{method:"PATCH",body:JSON.stringify(d)}),deleteCalendar:l=>R(`/calendars/${l}`,{method:"DELETE"}),calendarEvents:(l,d,E)=>{const C=new URLSearchParams({from:d,to:E}).toString();return R(`/calendars/${l}/events?${C}`)},getEvent:(l,d)=>R(`/calendars/${l}/events/${ut(d)}`),createEvent:(l,d)=>R(`/calendars/${l}/events`,{method:"POST",body:JSON.stringify(d)}),updateEvent:(l,d,E)=>R(`/calendars/${l}/events/${ut(d)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteEvent:(l,d)=>R(`/calendars/${l}/events/${ut(d)}`,{method:"DELETE"}),exportCalendar:async l=>{const d=await fetch(`/api/calendars/${l}/export`,{credentials:"same-origin"});if(!d.ok){let V=`Export failed (${d.status})`;try{const S=await d.json();S.error&&(V=S.error)}catch{}throw new se(V,d.status)}const E=d.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(E),A=(C==null?void 0:C[1])||`calendar-${l}.ics`;return{blob:await d.blob(),filename:A}},importCalendar:(l,d)=>R(`/calendars/${l}/import`,{method:"POST",body:JSON.stringify({ics:d})}),directory:()=>R("/directory"),shares:l=>R(`/calendars/${l}/shares`),share:(l,d,E)=>R(`/calendars/${l}/shares`,{method:"POST",body:JSON.stringify({username:d,access:E})}),revoke:(l,d)=>R(`/calendars/${l}/shares`,{method:"DELETE",body:JSON.stringify({href:d})}),addressbooks:()=>R("/addressbooks"),createAddressBook:l=>R("/addressbooks",{method:"POST",body:JSON.stringify(l)}),updateAddressBook:(l,d)=>R(`/addressbooks/${l}`,{method:"PATCH",body:JSON.stringify(d)}),deleteAddressBook:(l,d=!1)=>R(`/addressbooks/${l}`,{method:"DELETE",body:JSON.stringify({force:d})}),exportAddressBook:async l=>{const d=await fetch(`/api/addressbooks/${l}/export`,{credentials:"same-origin"});if(!d.ok){let V=`Export failed (${d.status})`;try{const S=await d.json();S.error&&(V=S.error)}catch{}throw new se(V,d.status)}const E=d.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(E),A=(C==null?void 0:C[1])||`contacts-${l}.vcf`;return{blob:await d.blob(),filename:A}},importAddressBook:(l,d)=>R(`/addressbooks/${l}/import`,{method:"POST",body:JSON.stringify({vcf:d})}),contacts:(l,d="")=>{const E=d.trim()?`?q=${encodeURIComponent(d.trim())}`:"";return R(`/addressbooks/${l}/contacts${E}`)},getContact:(l,d)=>R(`/addressbooks/${l}/contacts/${ut(d)}`),createContact:(l,d)=>R(`/addressbooks/${l}/contacts`,{method:"POST",body:JSON.stringify(d)}),updateContact:(l,d,E)=>R(`/addressbooks/${l}/contacts/${ut(d)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteContact:(l,d)=>R(`/addressbooks/${l}/contacts/${ut(d)}`,{method:"DELETE"}),exportContact:async(l,d)=>{const E=await fetch(`/api/addressbooks/${l}/contacts/${ut(d)}/export`,{credentials:"same-origin"});if(!E.ok){let S=`Export failed (${E.status})`;try{const at=await E.json();at.error&&(S=at.error)}catch{}throw new se(S,E.status)}const C=E.headers.get("Content-Disposition")||"",A=/filename="([^"]+)"/i.exec(C),U=(A==null?void 0:A[1])||"contact.vcf";return{blob:await E.blob(),filename:U}},contactPhotoUrl:(l,d)=>`/api/addressbooks/${l}/contacts/${ut(d)}/photo`,tasks:(l={})=>{const d=new URLSearchParams;l.q&&d.set("q",l.q),l.sort&&d.set("sort",l.sort),l.order&&d.set("order",l.order);const E=d.toString()?`?${d}`:"";return R(`/tasks${E}`)},createTask:l=>R("/tasks",{method:"POST",body:JSON.stringify(l)}),updateTask:(l,d,E)=>R(`/tasks/${l}/${ut(d)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteTask:(l,d)=>R(`/tasks/${l}/${ut(d)}`,{method:"DELETE"}),bulkTasks:l=>R("/tasks/bulk",{method:"POST",body:JSON.stringify(l)}),notes:(l={})=>{const d=new URLSearchParams;l.q&&d.set("q",l.q),l.sort&&d.set("sort",l.sort),l.order&&d.set("order",l.order);const E=d.toString()?`?${d}`:"";return R(`/notes${E}`)},createNote:l=>R("/notes",{method:"POST",body:JSON.stringify(l)}),updateNote:(l,d,E)=>R(`/notes/${l}/${ut(d)}`,{method:"PATCH",body:JSON.stringify(E)}),deleteNote:(l,d)=>R(`/notes/${l}/${ut(d)}`,{method:"DELETE"})},Va="0.11.1-fork.4",ja="https://github.com/offsyanka99/Baikal/tree/master/docs";function c(l){return l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Te(l){return l==="readwrite"?'<span class="badge badge-admin">full access</span>':l==="read"?'<span class="badge">read-only</span>':l==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(l)}</span>`}function fe(l){const d=[`${l.imported} new`,`${l.updated} updated`];return l.skipped>0&&d.push(`${l.skipped} skipped`),d.join(", ")}const Ha={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards."]}};function ht(l,d,E="h2"){const C=E;return`<div class="section-title-row">
    <${C}>${c(l)}</${C}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(d)}"
      aria-label="About ${c(l)}" title="About ${c(l)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function Wa(){return`
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
    </div>`}function Ya(l){let d=null,E=null,C="calendars",A=[],U=[],V=[],S=null,at=[],H=!1,wt=!1,it=null,mt=null,Nt={y:new Date().getFullYear(),m:new Date().getMonth()},Vt=[],ye=!1,kt=!1,y=null,gt=!1,N=null,le="",Jt=null,nt=[],x=null,St=[],Ft="",Y=null,k=null,z=!1,tt=!1,ct=!1,st=null,dt=null,pt=!1,m=!1,vt=null,Tt=null,Oe=!1,jt={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Dt=null;function he(a){if(!a)return;const t=(a.timeFormat||"auto").toLowerCase(),e=(a.weekStart||"auto").toLowerCase();jt={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:e==="monday"||e==="sunday"?e:"auto",logLevel:a.logLevel||"off"},_a(jt.logLevel)}let lt=[],Kt=[],Mt=[],Rt=[],oe="",re="",xt="due",Ct="asc",Ht="dtstart",Ut="desc",ot=null,$t=null,q=null,W=null,B=!1,et=!1,Q=[];function g(a,t){E={type:a,message:t}}function O(){E=null}async function We(){j.event("bootstrap.start");try{const a=await L.ui();he(a.ui)}catch(a){j.debug("bootstrap: /api/ui failed",a instanceof Error?a.message:a)}try{const a=await L.me();d=a.user,he(a.ui),j.event("bootstrap.session",{username:(d==null?void 0:d.username)??null}),await ft()}catch(a){a instanceof se&&a.status===401?(d=null,j.event("bootstrap.anonymous")):(j.error("bootstrap failed",a instanceof Error?a.message:a),g("error",a instanceof Error?a.message:"Failed to load"))}u()}async function ft(){j.debug("loadHome");const[a,t,e]=await Promise.all([L.calendars(),L.directory().catch(()=>({users:[]})),L.addressbooks()]);if(A=a.calendars,U=t.users,nt=e.addressbooks,j.event("loadHome",{calendars:A.length,addressBooks:nt.length,directory:U.length}),V.length===0)try{V=(await L.holidayCountries()).countries}catch{V=[]}if(S!==null&&!A.some(o=>o.id===S)&&(S=null,at=[],H=!1,it=null),S===null){const o=Ie();o&&(S=o.id)}S!==null&&H?await zt(S):S!==null&&(at=[]),C==="calendars"&&await bt(),x!==null&&!nt.some(o=>o.id===x)&&(x=null,St=[],Y=null,k=null,z=!1),mt!==null&&!nt.some(o=>o.id===mt)&&(mt=null),x===null&&nt.length>0&&(x=nt[0].id),x!==null&&C==="contacts"&&await It(x)}async function zt(a){at=(await L.shares(a)).shares}function Ie(){const a=A.filter(e=>e.canShare);if(a.length===0)return null;const t=e=>{const o=e.uri.toLowerCase(),r=e.displayname.toLowerCase();return o==="default"||r==="default"||r==="default calendar"};return a.find(t)??a[0]??null}function G(a){const t=a.getFullYear(),e=String(a.getMonth()+1).padStart(2,"0"),o=String(a.getDate()).padStart(2,"0");return`${t}-${e}-${o}`}function Ye(a,t){const e=new Date(a,t,1),o=new Date(a,t+1,0);return{from:G(e),to:G(o)}}function ge(a){if(/^\d{4}-\d{2}-\d{2}$/.test(a)){const[e,o,r]=a.split("-").map(Number);return new Date(e,o-1,r)}const t=new Date(a);if(Number.isNaN(t.getTime())){const[e,o,r]=a.slice(0,10).split("-").map(Number);return new Date(e,(o||1)-1,r||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Je(a){const t=ge(a.start);if(!a.end)return[G(t)];let e=ge(a.end);if(!a.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(a.end)){const s=new Date(a.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(a.start).getTime()&&(e=new Date(e.getFullYear(),e.getMonth(),e.getDate()-1))}if(e<t)return[G(t)];const o=[],r=new Date(t.getFullYear(),t.getMonth(),t.getDate()),p=new Date(e.getFullYear(),e.getMonth(),e.getDate());let n=0;for(;r<=p&&n++<370;)o.push(G(r)),r.setDate(r.getDate()+1);return o.length?o:[G(t)]}function ve(a,t){const e=a.slice(0,10),o=(t||e).slice(0,10);if(e===o){const M=Xt(e);return{start:M.start,end:M.end}}const[r,p,n]=e.split("-").map(Number),[s,i,f]=o.split("-").map(Number),h=Ot(new Date(r,p-1,n,9,0,0,0)),v=Ot(new Date(s,i-1,f,17,0,0,0));return{start:h,end:v}}function Ke(a,t){const e=Pt(a);let o=t?Pt(t):e;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const r=new Date(t);if(!Number.isNaN(r.getTime())&&r.getHours()===0&&r.getMinutes()===0&&r.getTime()>new Date(a).getTime()){const p=ge(t);p.setDate(p.getDate()-1),o=G(p)}}return{start:e,end:o}}async function bt(){if(S===null){Vt=[];return}const{from:a,to:t}=Ye(Nt.y,Nt.m);ye=!0,j.debug("loadMonthEvents",{selectedId:S,from:a,to:t});try{Vt=(await L.calendarEvents(S,a,t)).events,j.event("monthEvents.loaded",{calendarId:S,count:Vt.length,from:a,to:t})}catch(e){Vt=[],j.warn("loadMonthEvents failed",e instanceof Error?e.message:e)}finally{ye=!1}}function ze(a,t){return new Date(a,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function Ge(a){const t=a.summary||"(No title)";if(a.allDay||/^\d{4}-\d{2}-\d{2}$/.test(a.start))return t;const e=new Date(a.start);return Number.isNaN(e.getTime())?t:`${e.toLocaleTimeString(void 0,$e())} ${t}`}function Xe(){const a=S!==null?A.find(b=>b.id===S):null,t=(a==null?void 0:a.displayname)??"Calendar",e=a!=null&&a.color?a.color.length>=7?a.color.slice(0,7):a.color:"#3B82F6",o=Nt.y,r=Nt.m,p=new Date(o,r,1),n=we(),s=(p.getDay()-n+7)%7,i=new Date(o,r+1,0).getDate(),f=new Date(o,r,0).getDate(),v=G(new Date),M=Ae(),T=new Map;for(const b of Vt)for(const F of Je(b)){const D=T.get(F)??[];D.push(b),T.set(F,D)}const w=[],I=Math.ceil((s+i)/7)*7;for(let b=0;b<I;b++){let F,D=!0,P;b<s?(F=f-s+b+1,D=!1,P=new Date(o,r-1,F)):b>=s+i?(F=b-(s+i)+1,D=!1,P=new Date(o,r+1,F)):(F=b-s+1,P=new Date(o,r,F));const _=G(P),K=_===v,rt=D?T.get(_)??[]:[],ee=Jt===_?50:3,Yt=rt.slice(0,ee),de=rt.length-Yt.length,Et=Yt.map(ae=>{const Ce=S??0,me=Ge(ae);return`<button type="button" class="month-event${ae.allDay?"":" is-timed"}" title="${c(me)}" style="--ev-color:${c(e)}"
            data-action="open-event" data-instance="${Ce}" data-uri="${c(ae.uri)}" ${m?"disabled":""}>${c(me)}</button>`}).join(""),Se=de>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(_)}" title="Show all events this day" ${m?"disabled":""}>+${de} more</button>`:"",De=!D&&(F===1||b===s+i)?P.toLocaleString(void 0,{month:"short",day:"numeric"}):String(F),ue=!!(a&&!a.readOnly&&(a.canShare||a.access==="readwrite"));w.push(`<div class="month-cell${D?"":" is-outside"}${K?" is-today":""}${ue?" is-clickable":""}"${ue?` data-action="new-event-day" data-day="${c(_)}" role="button" tabindex="0" title="Add event on ${c(_)}"`:""}>
        <div class="month-daynum${K?" is-today-num":""}">${c(De)}</div>
        <div class="month-events">${Et}${Se}</div>
      </div>`)}const X=a?ye?'<p class="muted small month-empty-hint">Loading events…</p>':"":'<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${m?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${m?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${m?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(ze(o,r))}</h2>
        <span class="month-cal-name muted small" title="${c(t)}">
          <span class="cal-swatch" style="background:${c(e)};margin-top:0"></span>
          ${c(t)}
        </span>
      </div>
      ${X}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${M.map(b=>`<div class="month-dow">${c(b)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${w.join("")}
        </div>
      </div>
    </section>`}function Pt(a){if(!a)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;const t=new Date(a);return Number.isNaN(t.getTime())?a.slice(0,10):G(t)}function Qe(){if(jt.timeFormat==="24h")return!1;if(jt.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const a=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(a)}function $e(){return Qe()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function we(){var e;if(jt.weekStart==="monday")return 1;if(jt.weekStart==="sunday")return 0;const a=[...(e=navigator.languages)!=null&&e.length?navigator.languages:[],navigator.language].filter(Boolean);for(const o of a)try{const r=new Intl.Locale(o),p=typeof r.getWeekInfo=="function"?r.getWeekInfo():r.weekInfo,n=p==null?void 0:p.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Ae(){const a=we(),t=new Date(2024,0,7+a),e=[];for(let o=0;o<7;o++){const r=new Date(t);r.setDate(t.getDate()+o),e.push(r.toLocaleDateString(void 0,{weekday:"short"}))}return e}function Le(a,t=15){const e=t*60*1e3,o=a.getTime();return o%e===0?new Date(o):new Date(Math.ceil(o/e)*e)}function Ot(a){const t=e=>String(e).padStart(2,"0");return`${a.getFullYear()}-${t(a.getMonth()+1)}-${t(a.getDate())}T${t(a.getHours())}:${t(a.getMinutes())}`}function Ze(a,t){if(!a)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(a)){const o=a.slice(0,10),[r,p,n]=o.split("-").map(Number);return new Date(r,p-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const e=new Date((a.includes("T")&&a.length===16,a));return Number.isNaN(e.getTime())?a:e.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...$e()})}function Gt(a){if(!a){const e=Le(new Date);return{date:G(e),hm:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(a))return{date:a,hm:"09:00"};const t=new Date((a.length===16,a));return Number.isNaN(t.getTime())?{date:a.slice(0,10),hm:"09:00"}:{date:G(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function Xt(a){const t=new Date,e=G(t);if(a&&a!==e){const[p,n,s]=a.split("-").map(Number),i=new Date(p,n-1,s,9,0,0,0),f=new Date(p,n-1,s,10,0,0,0);return{start:Ot(i),end:Ot(f)}}const o=Le(t,15),r=new Date(o.getTime()+3600*1e3);return{start:Ot(o),end:Ot(r)}}function ta(){const a=[];for(let t=0;t<24;t++)for(let e=0;e<60;e+=15)a.push(`${String(t).padStart(2,"0")}:${String(e).padStart(2,"0")}`);return a}function _t(a){const{field:t,name:e,label:o,value:r,dateOnly:p=!1,required:n,disabled:s,allowClear:i=!0}=a,f=(N==null?void 0:N.field)===t,h=Ze(r,p);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${c(t)}">
      <span class="dt-field-label">${c(o)}</span>
      <input type="hidden" name="${c(e)}" value="${c(r)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(t)}"
        data-dt-name="${c(e)}" data-dt-date-only="${p?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${c(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!s?ea(t,r,p,i):""}
    </div>`}function ke(a){var t;return a==="start"?String((y==null?void 0:y.start)||""):a==="end"?String((y==null?void 0:y.end)||""):a==="until"?((t=y==null?void 0:y.repeat)==null?void 0:t.until)||Pt(y==null?void 0:y.start)||G(new Date):a==="due"?Wt(q==null?void 0:q.due):a==="dtstart"?Wt(W==null?void 0:W.dtstart):a==="bulk-due"?le:a==="birthday"?String((k==null?void 0:k.birthday)||""):""}function yt(a,t){if(a==="start"&&y){y={...y,start:t||""};return}if(a==="end"&&y){y={...y,end:t};return}if(a==="until"&&y){y={...y,repeat:{...y.repeat??ie(),until:t,endMode:"until"}};return}if(a==="due"&&q){if(t===null||t==="")q={...q,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))q={...q,due:new Date(t+"T00:00:00").toISOString()};else{const e=new Date((t.length===16,t));q={...q,due:Number.isNaN(e.getTime())?t:e.toISOString()}}return}if(a==="dtstart"&&W){if(t===null||t==="")W={...W,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))W={...W,dtstart:new Date(t+"T00:00:00").toISOString()};else{const e=new Date((t.length===16,t));W={...W,dtstart:Number.isNaN(e.getTime())?t:e.toISOString()}}return}if(a==="birthday"&&k){k={...k,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}a==="bulk-due"&&(le=t||"")}function ea(a,t,e,o){const r=Gt(t),p=(N==null?void 0:N.viewY)??Number(r.date.slice(0,4)),n=(N==null?void 0:N.viewM)??Number(r.date.slice(5,7))-1,s=we(),i=Ae(),h=(new Date(p,n,1).getDay()-s+7)%7,v=new Date(p,n+1,0).getDate(),M=new Date(p,n,0).getDate(),T=r.date,w=r.hm,I=new Date(p,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),X=[],b=Math.ceil((h+v)/7)*7;for(let D=0;D<b;D++){let P,_,K=!1;D<h?(P=M-h+D+1,_=new Date(p,n-1,P),K=!0):D>=h+v?(P=D-(h+v)+1,_=new Date(p,n+1,P),K=!0):(P=D-h+1,_=new Date(p,n,P));const rt=G(_),ee=rt===T,Yt=rt===G(new Date);X.push(`<button type="button" class="dt-day${K?" is-outside":""}${ee?" is-selected":""}${Yt?" is-today":""}" data-action="dt-pick-day" data-dt-field="${a}" data-day="${c(rt)}">${P}</button>`)}const F=e?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${ta().map(D=>{const P=(()=>{const[_,K]=D.split(":").map(Number);return new Date(2e3,0,1,_,K).toLocaleTimeString(void 0,$e())})();return`<button type="button" class="dt-time${D===w?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${a}" data-hm="${D}" role="option" aria-selected="${D===w}">${c(P)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${a}" role="dialog" aria-label="Choose date${e?"":" and time"}">
      <div class="dt-popover-inner${e?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${a}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(I)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${a}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(D=>`<span class="dt-dow">${c(D)}</span>`).join("")}</div>
          <div class="dt-days">${X.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(a)}" ${o?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${a}">Today</button>
          </div>
        </div>
        ${F}
      </div>
    </div>`}function aa(){l.querySelectorAll(".dt-field.is-open").forEach(a=>{const t=a.querySelector(".dt-trigger"),e=a.querySelector(".dt-popover");if(!t||!e)return;const o=t.getBoundingClientRect(),r=8;e.style.position="fixed",e.style.visibility="hidden",e.style.top="0",e.style.left="0";const p=e.offsetWidth||320,n=e.offsetHeight||300;let s=o.bottom+6;s+n>window.innerHeight-r&&(s=Math.max(r,o.top-n-6));let i=o.left;i+p>window.innerWidth-r&&(i=Math.max(r,window.innerWidth-p-r)),i<r&&(i=r),e.style.top=`${Math.round(s)}px`,e.style.left=`${Math.round(i)}px`,e.style.right="auto",e.style.visibility="visible",e.style.zIndex="200"})}function ie(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function na(a){return a.endMode==="until"||a.endMode==="count"||a.endMode==="never"?a.endMode:a.until?"until":a.count?"count":"never"}function sa(){if(!kt||!y)return"";const a=y,t=a.repeat??ie(),e=(t.freq||"").toUpperCase(),o=A.filter(T=>T.canShare||T.access==="readwrite"),r=A.filter(T=>T.id===a.instanceId?!0:T.readOnly?!1:T.canShare||T.access==="readwrite").map(T=>`<option value="${T.id}" ${T.id===a.instanceId?"selected":""}>${c(T.displayname)}</option>`).join(""),p=a.readOnly||!a.canWrite;let n,s;if(a.allDay)n=Pt(a.start),s=Pt(a.end);else{const T=a.start||"",w=a.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(T)){const I=ve(T,w||null);n=I.start,s=I.end||""}else n=Wt(a.start),s=Wt(a.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(T=>T.toUpperCase())),h=na(t),v=!!e&&h==="until",M=t.until||(h==="until"?Pt(a.start)||G(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${gt?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Lt()}
          ${!gt&&(a.hasRrule||e)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${p?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${p||o.length===0?"disabled":""}>
                ${r||`<option value="${a.instanceId}">${c(a.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(a.summary)}" ${p?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(a.location)}" ${p?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${p?"readonly":""}>${c(a.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${a.allDay?"checked":""} ${p?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${_t({field:"start",name:"start",label:"Start",value:n,dateOnly:a.allDay,required:!0,disabled:p,allowClear:!1})}
              ${_t({field:"end",name:"end",label:"End",value:s,dateOnly:a.allDay,disabled:p||v,allowClear:!v})}
            </div>
            <fieldset class="event-repeat" ${p?"disabled":""}>
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
                      ${i.map(T=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${T.code}" ${f.has(T.code)?"checked":""} />
                              ${T.label}
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
                      ${h==="until"?_t({field:"until",name:"repeatUntil",label:"Until",value:M,dateOnly:!0,disabled:p,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${p?"":`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${gt?"Create event":"Save event"}</button>
                     ${gt?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${m?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function la(a,t){const e=A.find(o=>o.id===t);return{uri:"",instanceId:t,calendarId:(e==null?void 0:e.calendarId)??0,calendarName:(e==null?void 0:e.displayname)??"Calendar",calendarUri:(e==null?void 0:e.uri)??"",uid:"",summary:"",description:"",location:"",start:a,end:a,allDay:!0,hasRrule:!1,repeat:ie(),readOnly:!1,canWrite:!0}}async function It(a){St=(await L.contacts(a,Ft)).contacts,Y!==null&&!St.some(e=>e.uri===Y)&&(Y=null,z||(k=null,st=null,dt=null,pt=!1))}async function Bt(){const a=await L.tasks({q:oe,sort:xt,order:Ct});lt=a.tasks,Mt=a.calendars;const t=new Set(lt.map(e=>J(e.instanceId,e.uri)));Q=Q.filter(e=>t.has(e)),ot!==null&&!lt.some(e=>`${e.instanceId}|${e.uri}`===ot)&&(ot=null,B||(q=null))}async function Qt(){const a=await L.notes({q:re,sort:Ht,order:Ut});Kt=a.notes,Rt=a.calendars,$t!==null&&!Kt.some(t=>`${t.instanceId}|${t.uri}`===$t)&&($t=null,et||(W=null))}function J(a,t){return`${a}|${t}`}function qe(a){if(!a)return"—";try{const t=new Date(a);return Number.isNaN(t.getTime())?a:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return a}}function Wt(a){if(!a)return"";try{const t=new Date(a);if(Number.isNaN(t.getTime()))return"";const e=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`}catch{return""}}function At(a,t,e,o,r,p=""){const n=e===t,s=n?o==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${p?" "+p:""}`}" data-action="sort-${r}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(a)}${s}</th>`}async function oa(a){if(x===null)return;const t=await L.getContact(x,a);Y=a,z=!1;const e=t.contact;k={...e,emails:Array.isArray(e.emails)?e.emails:[],phones:Array.isArray(e.phones)?e.phones:[],custom:Array.isArray(e.custom)?e.custom:[],address:e.address??Fe(),birthday:e.birthday??null},st=e.photoDataUri??(e.hasPhoto&&x!==null?`${L.contactPhotoUrl(x,a)}?t=${Date.now()}`:null),dt=null,pt=!1,tt=!0}function ra(){z=!0,Y=null,tt=!0,k={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},st=null,dt=null,pt=!1}function Fe(){return{street:"",city:"",region:"",postal:"",country:""}}function ia(a){return new Promise((t,e)=>{const o=new FileReader;o.onload=()=>{const r=String(o.result??""),p=r.indexOf(",");t(p>=0?r.slice(p+1):r)},o.onerror=()=>e(new Error("Failed to read photo file")),o.readAsDataURL(a)})}function Me(a,t={}){const e=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,o=d?`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
          <div class="topnav-right">
            <span class="muted">${c(d.displayname||d.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${e}</a>
        </nav>`,p=!(H||wt||it!==null||mt!==null||kt||tt||ct)?Lt():"",n=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${c(Va)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(ja)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${o}
      <main class="container">
        ${p}
        ${a}
      </main>
      ${n}
      ${Wa()}`}function Lt(){return E?`<div class="flash flash-${c(E.type)}" role="status">
      <span class="flash-text">${c(E.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function Re(){l.innerHTML=Me(`<div class="auth-wrap">
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
            <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function ca(){if(!d){Re();return}const a=A.filter($=>$.canShare),t=A.filter($=>!$.canShare),e=A.find($=>$.id===S)??null,o=a.map($=>{const Z=$.id===S?" is-selected":"",qt=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',Ee=Te($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${Z}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${qt}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${Ee}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),r=t.map($=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${Te($.access)}</span>
            <span class="muted small">Shared with you · ${c($.access)}</span>
          </span>
        </div>`).join(""),p=U.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=at.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':at.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${Te($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${m?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=e!=null&&e.color&&e.color.length>=7?e.color.slice(0,7):"#3B82F6",i=!!(e&&e.readOnly),f=H&&e&&e.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Lt()}
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
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(e.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${ht(`Share “${e.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${U.length===0?"disabled":""}>
                        <option value="">${U.length?"Select user…":"No other users"}</option>
                        ${p}
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
                      <button type="submit" class="btn btn-primary" ${m||U.length===0?"disabled":""}>Share</button>
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
                  ${ht("Import / export","import-export")}
                  ${e.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${m?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${m||e.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${m||e.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                  ${vt?`<div class="flash flash-${vt.ok?"success":"error"} import-result" role="status">
                          <strong>Import result:</strong> ${c(vt.message)}
                        </div>`:""}
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",h=it!==null?A.find($=>$.id===it&&$.canShare)??null:null,v=h?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Lt()}
              <p>You are about to permanently delete <strong>${c(h.displayname)}</strong>
                <span class="muted small mono">(${c(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${h.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",M=wt?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Lt()}
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
                    ${V.map($=>`<option value="${c($.code)}">${c($.name)} (${c($.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Create calendar</button>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${m?"disabled":""}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>`:"",T=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${ht("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${o||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${ht("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${r}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${m?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${Xe()}
      </div>
      ${M}
      ${f}
      ${v}
      ${sa()}`,w=nt.map($=>`<div class="cal-row${$.id===x?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${m?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${m?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),I=nt.find($=>$.id===x)??null,X=St.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Ft?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:St.map($=>{const Z=!z&&$.uri===Y?" is-selected":"",qt=c(($.displayname||"?").slice(0,1).toUpperCase()),Ee=$.hasPhoto&&x!==null?`<img class="contact-avatar" src="${c(L.contactPhotoUrl(x,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${qt}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${qt}</span>`;return`<tr class="contact-table-row${Z}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${Ee}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),b=k,F=Array.isArray(b==null?void 0:b.emails)&&b.emails.length>0?b.emails:[""],D=Array.isArray(b==null?void 0:b.phones)&&b.phones.length>0?b.phones:[{type:"cell",value:""}],P=(b==null?void 0:b.address)??Fe(),_=F.map(($,Z)=>`<div class="multi-row" data-multi="email" data-idx="${Z}">
          <input type="email" name="email_${Z}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${Z}" ${F.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),K=D.map(($,Z)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${Z}">
          <select name="phone_type_${Z}" aria-label="Phone type">
            ${["cell","work","home","other"].map(qt=>`<option value="${qt}" ${(($==null?void 0:$.type)??"other")===qt?"selected":""}>${qt}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${Z}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${Z}" ${D.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),rt=Array.isArray(b==null?void 0:b.custom)?b.custom:[],ee=rt.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':rt.map(($,Z)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${Z}">
                <input type="text" name="custom_label_${Z}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${Z}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${Z}" title="Remove">×</button>
              </div>`).join(""),Yt=tt&&b&&I?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${z?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Lt()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${st?`<img src="${c(st)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((b.fullname||b.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        ${st?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${m?"disabled":""} hidden />
                      </label>
                      ${st||b.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${m?"disabled":""}>Remove photo</button>`:""}
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
                      ${K}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${D.length>=10?"disabled":""}>+ Phone</button>
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
                  ${_t({field:"birthday",name:"birthday",label:"Birthday",value:b.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${ee}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${rt.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(b.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${m?"disabled":""}>${z?"Create contact":"Save contact"}</button>
                    ${!z&&b.uri?`<button type="button" class="btn" data-action="export-contact" ${m?"disabled":""}>Export .vcf</button>`:""}
                    ${z?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${m?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${m?"disabled":""}>Cancel</button>
                    ${!z&&b.uri?`<span class="muted small mono">${c(b.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",de=ct&&I?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Lt()}
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
                      <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(I.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${ht("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${m?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${m?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${m?"disabled":""} hidden />
                      </label>
                    </div>
                    ${Tt?`<div class="flash flash-${Tt.ok?"success":"error"} import-result" role="status">
                            <strong>Import:</strong> ${c(Tt.message)}
                          </div>`:""}
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Et=mt!==null?nt.find($=>$.id===mt)??null:null,Se=Et?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Lt()}
              <p>You are about to permanently delete <strong>${c(Et.displayname)}</strong>
                <span class="muted small mono">(${c(Et.uri)})</span>.</p>
              <p class="muted small">${(Et.cardCount??0)>0?`All ${Et.cardCount} contact${Et.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${m?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Et.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",De=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${ht("Address books","address-books")}
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
                <button type="submit" class="btn btn-primary" ${m?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${I?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${ht("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(Ft)}" aria-label="Search contacts" ${m?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${m?"disabled":""}>Add contact</button>
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
                        ${X}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${Se}
      ${de}
      ${Yt}`,ue=C==="calendars"?"my-calendars":C==="contacts"?"my-contacts":C==="tasks"?"tasks":"notes",ae=pa(),Ce=fa(),me=C==="calendars"?T:C==="contacts"?De:C==="tasks"?ae:Ce;l.innerHTML=Me(`
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
            data-info="${ue}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${me}
    `),document.body.classList.toggle("cal-modal-open",H||wt||it!==null||mt!==null||kt||tt||ct),document.body.classList.toggle("layout-contacts",C==="contacts"),document.body.classList.toggle("layout-calendars",C==="calendars"),document.body.classList.toggle("layout-tasks",C==="tasks"||C==="notes")}function da(a){const t=new Map;for(const f of a)f.uid&&t.set(f.uid,f);const e=new Map(a.map((f,h)=>[J(f.instanceId,f.uri),h])),o=new Map,r=[];for(const f of a){const h=f.parentUid;if(h&&t.has(h)&&h!==f.uid){const v=o.get(h)??[];v.push(f),o.set(h,v)}else r.push(f)}const p=(f,h)=>(e.get(J(f.instanceId,f.uri))??0)-(e.get(J(h.instanceId,h.uri))??0);r.sort(p);for(const[,f]of o)f.sort(p);const n=[],s=new Set,i=(f,h)=>{const v=f.uid||J(f.instanceId,f.uri);if(!s.has(v)){s.add(v),n.push({task:f,depth:Math.min(h,8)});for(const M of o.get(f.uid)??[])i(M,h+1);s.delete(v)}};for(const f of r)i(f,0);for(const f of a)n.some(h=>h.task===f)||n.push({task:f,depth:0});return n}function ua(a){const t=new Set([a]);if(!a)return t;let e=!0;for(;e;){e=!1;for(const o of lt)o.parentUid&&t.has(o.parentUid)&&o.uid&&!t.has(o.uid)&&(t.add(o.uid),e=!0)}return t}function ma(a,t){const e=a.instanceId,o=t||!a.uid?new Set:ua(a.uid),r=lt.filter(s=>s.uid&&s.instanceId===e&&!o.has(s.uid)&&s.uid!==a.uid),p=a.parentUid||"",n=['<option value="">None (top-level)</option>',...r.map(s=>`<option value="${c(s.uid)}" ${s.uid===p?"selected":""}>${c(s.summary||s.uid)}</option>`)];if(p&&!r.some(s=>s.uid===p)){const s=lt.find(i=>i.uid===p);n.push(`<option value="${c(p)}" selected>${c((s==null?void 0:s.summary)||p)} (current)</option>`)}return n.join("")}function Ue(){const a=new Set(Q);return lt.filter(t=>a.has(J(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function pa(){const a=w=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[w]||w,t=da(lt),e=lt.filter(w=>w.canWrite&&!w.readOnly).map(w=>J(w.instanceId,w.uri)),o=e.length>0&&e.every(w=>Q.includes(w)),r=Q.length>0,n=Ue().length,s=lt.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${oe?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:w,depth:I})=>{const X=J(w.instanceId,w.uri),b=!B&&X===ot?" is-selected":"",F=Q.includes(X),D=w.status==="COMPLETED"?"badge-ok":w.status==="CANCELLED"?"":"badge-admin",P=I>0?` style="--task-depth:${I}"`:"",_=I>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",K=w.canWrite&&!w.readOnly;return`<tr class="contact-table-row task-row${I>0?" is-subtask":""}${b}${F?" is-checked":""}" data-action="select-task" data-instance="${w.instanceId}" data-uri="${c(w.uri)}" tabindex="0" role="button"${P}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${w.instanceId}" data-uri="${c(w.uri)}"
                    ${F?"checked":""} ${K?"":"disabled"} aria-label="Select ${c(w.summary||w.uri)}" ${m?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${_}<span class="contact-name-primary">${c(w.summary||w.uri)}</span></span>
                  ${w.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${D}">${c(a(w.status))}</span></td>
                <td class="col-task-due muted small">${c(qe(w.due))}</td>
                <td class="col-task-cal muted small">${c(w.calendarName)}</td>
                <td class="col-task-pct muted small">${w.percent?c(String(w.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(w,I)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${w}"
        title="${c(I)}" aria-label="${c(I)}" ${m||n===0?"disabled":""}>${i}</button>`,h=r?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${Q.length!==n?`<span class="muted small bulk-bar-count-extra">(${Q.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${m||n===0?"disabled":""}>
                    <option value="">—</option>
                    <option value="NEEDS-ACTION">To do</option>
                    <option value="IN-PROCESS">In progress</option>
                    <option value="COMPLETED">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
                ${f("bulk-task-status","Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${_t({field:"bulk-due",name:"bulkDue",label:"Due",value:le,dateOnly:!1,disabled:m||n===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${m||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${m||n===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${m||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${m?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",v=q,M=Mt.map(w=>`<option value="${w.id}" ${v&&v.instanceId===w.id?"selected":""}>${c(w.displayname)}</option>`).join(""),T=v?`<div class="card">
            ${ht(B?v.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${B?`<label>Calendar
                      <select name="instanceId" required ${Mt.length===0?"disabled":""}>
                        <option value="">${Mt.length?"Select calendar…":"No writable calendars"}</option>
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
                  ${ma(v,B)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${v.readOnly&&!B?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(w=>`<option value="${w}" ${v.status===w?"selected":""}>${c(a(w))}</option>`).join("")}
                  </select>
                </label>
                ${_t({field:"due",name:"due",label:"Due",value:Wt(v.due),dateOnly:!1,disabled:!!(v.readOnly&&!B),allowClear:!0})}
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
                ${B||v.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${B?"Create task":"Save task"}</button>`:""}
                ${!B&&v.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${m?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${m?"disabled":""}>Delete</button>`:B?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ht("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(oe)}" aria-label="Search tasks" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${m||Mt.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Mt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${o?"checked":""} ${e.length===0||m?"disabled":""} />
                </th>
                ${At("Title","summary",xt,Ct,"task","col-task-title")}
                ${At("Status","status",xt,Ct,"task","col-task-status")}
                ${At("Due","due",xt,Ct,"task","col-task-due")}
                ${At("Calendar","calendar",xt,Ct,"task","col-task-cal")}
                ${At("%","percent",xt,Ct,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function fa(){const a=Kt.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${re?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:Kt.map(r=>{const p=J(r.instanceId,r.uri),n=!et&&p===$t?" is-selected":"",s=(r.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${r.instanceId}" data-uri="${c(r.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(r.summary||r.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${c(s)}${r.description.length>80?"…":""}</span>`:""}
                  ${r.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(qe(r.dtstart))}</td>
                <td class="col-note-cal muted small">${c(r.calendarName)}</td>
              </tr>`}).join(""),t=W,e=Rt.map(r=>`<option value="${r.id}" ${t&&t.instanceId===r.id?"selected":""}>${c(r.displayname)}</option>`).join(""),o=t?`<div class="card">
            ${ht(et?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${et?`<label>Calendar
                      <select name="instanceId" required ${Rt.length===0?"disabled":""}>
                        <option value="">${Rt.length?"Select calendar…":"No writable calendars"}</option>
                        ${e}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${t.readOnly&&!et?"readonly":""} />
              </label>
              ${_t({field:"dtstart",name:"dtstart",label:"Date",value:Wt(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!et),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!et?"readonly":""}>${c(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${et||t.canWrite?`<button type="submit" class="btn btn-primary" ${m?"disabled":""}>${et?"Create note":"Save note"}</button>`:""}
                ${!et&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${m?"disabled":""}>Delete</button>`:et?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${ht("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(re)}" aria-label="Search notes" ${m?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${m||Rt.length===0?"disabled":""}>Add note</button>
        </div>
        ${Rt.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${At("Title","summary",Ht,Ut,"note","col-note-title")}
                ${At("Date","dtstart",Ht,Ut,"note","col-note-date")}
                ${At("Calendar","calendar",Ht,Ut,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${a}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${o}
      </section>
    </div>`}function ba(){const a=l.querySelector(".contacts-table-wrap"),t=l.querySelector(".contacts-ab-list"),e=l.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(a==null?void 0:a.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(e==null?void 0:e.scrollTop)??null}}function ya(a){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(a.windowX,a.windowY),a.tableTop!==null){const t=l.querySelector(".contacts-table-wrap");t&&(t.scrollTop=a.tableTop)}if(a.abListTop!==null){const t=l.querySelector(".contacts-ab-list");t&&(t.scrollTop=a.abListTop)}if(a.calListTop!==null){const t=l.querySelector(".calendars-owned-list");t&&(t.scrollTop=a.calListTop)}})})}function u(){const a=ba();d?ca():Re(),ha(),ya(a),requestAnimationFrame(()=>{var t;aa(),(t=l.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Pe(a){const t=a.querySelector('input[name="color_picker"]'),e=a.querySelector('input[name="color"]');!t||!e||(t.addEventListener("input",()=>{e.value=t.value.toUpperCase()}),e.addEventListener("change",()=>{let o=e.value.trim();o&&!o.startsWith("#")&&(o=`#${o}`),/^#[0-9A-Fa-f]{6}/.test(o)&&(t.value=o.slice(0,7),e.value=o.toUpperCase())}))}function ha(){l.querySelectorAll("[data-action]").forEach(b=>{b.addEventListener("click",F=>{const D=F.target.closest("[data-action]");((D==null?void 0:D.dataset.action)==="info"||(D==null?void 0:D.dataset.action)==="info-close")&&(F.preventDefault(),F.stopPropagation()),Ta(F)})}),l.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(b=>{b.addEventListener("keydown",F=>{(F.key==="Enter"||F.key===" ")&&(F.preventDefault(),b.click())})});const a=l.querySelector("#delete-cal-confirm"),t=l.querySelector("#delete-cal-submit");a==null||a.addEventListener("change",()=>{t&&(t.disabled=!a.checked||m)});const e=l.querySelector("#delete-ab-confirm"),o=l.querySelector("#delete-ab-submit");e==null||e.addEventListener("change",()=>{o&&(o.disabled=!e.checked||m)}),l.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(b=>{b.addEventListener("error",()=>{const F=b.dataset.avatarFallback||"?",D=document.createElement("span");D.className="contact-avatar contact-avatar-fallback",D.setAttribute("aria-hidden","true"),D.textContent=F,b.replaceWith(D)})}),Oe||(document.addEventListener("keydown",b=>{b.key==="Escape"&&_e()}),Oe=!0);const r=l.querySelector('[data-form="login"]');r==null||r.addEventListener("submit",b=>{b.preventDefault(),Sa(r)});const p=l.querySelector('[data-form="share"]');p==null||p.addEventListener("submit",b=>{b.preventDefault(),Da(p)});const n=l.querySelector('[data-form="edit-cal"]');n&&(Pe(n),n.addEventListener("submit",b=>{b.preventDefault(),Ea(n)}));const s=l.querySelector('[data-form="edit-event"]');s==null||s.addEventListener("submit",b=>{b.preventDefault(),Ca(s)}),l.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(b=>{b.addEventListener("change",()=>{if(!y)return;const F=l.querySelector('[data-form="edit-event"]');if(!F)return;const D=new FormData(F),P=F.querySelector('input[name="allDay"]'),_=te(D);_.endMode==="until"&&!_.until&&(_.until=Pt(String(D.get("start")??y.start??""))||G(new Date)),y={...y,summary:String(D.get("summary")??y.summary),description:String(D.get("description")??y.description),location:String(D.get("location")??y.location),instanceId:Number(D.get("instanceId"))||y.instanceId,allDay:(P==null?void 0:P.checked)??y.allDay,start:String(D.get("start")??y.start??""),end:String(D.get("end")??y.end??"")||null,repeat:_,hasRrule:!!String(D.get("repeatFreq")??"").trim()},_.freq&&_.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),u(),_.endMode==="until"&&requestAnimationFrame(()=>{var rt;const K=l.querySelector('input[name="repeatUntil"]');K==null||K.focus();try{(rt=K==null?void 0:K.showPicker)==null||rt.call(K)}catch{}})})});const i=l.querySelector('[data-form="create-cal"]');i&&(Pe(i),i.addEventListener("submit",b=>{b.preventDefault(),Na(i)}));const f=l.querySelector('[data-form="create-ab"]');f==null||f.addEventListener("submit",b=>{b.preventDefault(),La(f)});const h=l.querySelector('[data-form="edit-ab"]');h==null||h.addEventListener("submit",b=>{b.preventDefault(),qa(h)});const v=l.querySelector('[data-form="contact"]');v==null||v.addEventListener("submit",b=>{b.preventDefault(),Aa(v)});const M=l.querySelector('[data-form="task"]');if(M==null||M.addEventListener("submit",b=>{b.preventDefault(),va(M)}),M){const b=M.querySelector('select[name="instanceId"]');b==null||b.addEventListener("change",()=>{if(!B||!q)return;const F=Number(b.value);if(!Number.isFinite(F)||F<=0)return;const D=new FormData(M),P=String(D.get("due")??"").trim();q={...q,instanceId:F,parentUid:q.parentUid&&lt.some(_=>_.uid===q.parentUid&&_.instanceId===F)?q.parentUid:null,summary:String(D.get("summary")??""),description:String(D.get("description")??""),status:String(D.get("status")??"NEEDS-ACTION"),due:P?new Date(P).toISOString():null,priority:Number(D.get("priority")??0),percent:Number(D.get("percent")??0)},u()})}const T=l.querySelector('[data-form="note"]');T==null||T.addEventListener("submit",b=>{b.preventDefault(),$a(T)});const w=l.querySelector('input[data-action="contact-search"]');w==null||w.addEventListener("input",()=>{Dt&&clearTimeout(Dt),Dt=setTimeout(()=>{Ft=w.value,x!==null&&(async()=>{try{await It(x),u()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),u()}})()},250)});const I=l.querySelector('input[data-action="task-search"]');I==null||I.addEventListener("input",()=>{Dt&&clearTimeout(Dt),Dt=setTimeout(()=>{oe=I.value,(async()=>{try{await Bt(),u()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),u()}})()},250)});const X=l.querySelector('input[data-action="note-search"]');X==null||X.addEventListener("input",()=>{Dt&&clearTimeout(Dt),Dt=setTimeout(()=>{re=X.value,(async()=>{try{await Qt(),u()}catch(b){g("error",b instanceof Error?b.message:"Search failed"),u()}})()},250)}),xa(),ka(),wa()}async function ga(a){var r,p;const t=Ue();if(t.length===0){g("error","No writable tasks selected"),u();return}const e=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(a==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;m=!0,O(),u();try{const n=await L.bulkTasks({op:"delete",items:e});Q=[],ot&&t.some(s=>J(s.instanceId,s.uri)===ot)&&(ot=null,q=null,B=!1),await Bt(),n.failed>0?g("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk delete failed")}finally{m=!1,u()}return}let o={};if(a==="bulk-task-status"){const n=l.querySelector("#bulk-task-status"),s=((r=n==null?void 0:n.value)==null?void 0:r.trim())??"";if(!s){g("error","Choose a status to apply"),u();return}o={status:s}}else if(a==="bulk-task-due"){const n=le.trim();if(!n){g("error","Choose a due date to apply"),u();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){g("error","Invalid due date"),u();return}o={due:s.toISOString()}}else if(a==="bulk-task-clear-due")o={due:null};else if(a==="bulk-task-percent"){const n=l.querySelector("#bulk-task-percent"),s=((p=n==null?void 0:n.value)==null?void 0:p.trim())??"";if(s===""){g("error","Enter a percent complete (0–100)"),u();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){g("error","Percent must be between 0 and 100"),u();return}o={percent:Math.round(i)}}m=!0,O(),u();try{const n=await L.bulkTasks({op:"update",items:e,fields:o});if(await Bt(),q&&!B){const i=J(q.instanceId,q.uri),f=lt.find(h=>J(h.instanceId,h.uri)===i);f&&(q={...f})}const s=a==="bulk-task-status"?"status":a==="bulk-task-due"||a==="bulk-task-clear-due"?"due date":"percent";n.failed>0?g("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):g("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){g("error",n instanceof Error?n.message:"Bulk update failed")}finally{m=!1,u()}}async function va(a){const t=new FormData(a),e=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),r=String(t.get("status")??"NEEDS-ACTION"),p=String(t.get("due")??"").trim(),n=p?new Date(p).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),h=f===""?null:f;m=!0,O(),u();try{if(B){const v=Number(t.get("instanceId"));if(!Number.isFinite(v)||v<=0)throw new Error("Select a calendar");const M=await L.createTask({instanceId:v,summary:e,description:o,status:r,due:n,priority:s,percent:i,parentUid:h});B=!1,ot=J(M.task.instanceId,M.task.uri),q=M.task,g("success",h?"Subtask created":"Task created")}else if(q){const v=await L.updateTask(q.instanceId,q.uri,{summary:e,description:o,status:r,due:n,priority:s,percent:i,parentUid:h});q=v.task,ot=J(v.task.instanceId,v.task.uri),g("success","Task saved")}await Bt()}catch(v){g("error",v instanceof Error?v.message:"Save failed")}finally{m=!1,u()}}async function $a(a){const t=new FormData(a),e=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),r=String(t.get("dtstart")??"").trim(),p=r?new Date(r).toISOString():null;m=!0,O(),u();try{if(et){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await L.createNote({instanceId:n,summary:e,description:o,dtstart:p});et=!1,$t=J(s.note.instanceId,s.note.uri),W=s.note,g("success","Note created")}else if(W){const n=await L.updateNote(W.instanceId,W.uri,{summary:e,description:o,dtstart:p});W=n.note,$t=J(n.note.instanceId,n.note.uri),g("success","Note saved")}await Qt()}catch(n){g("error",n instanceof Error?n.message:"Save failed")}finally{m=!1,u()}}function wa(){const a=l.querySelector('input[data-action="contact-photo"]');a&&a.addEventListener("change",()=>{(async()=>{var e;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){if(t.size>2.5*1024*1024){g("error","Photo is too large (max ~2 MB)"),u();return}try{const o=await ia(t);dt=o,st=`data:${t.type||"image/jpeg"};base64,${o}`,pt=!1,u()}catch(o){g("error",o instanceof Error?o.message:"Failed to read photo"),u()}}})()})}function ka(){const a=l.querySelector('[data-form="create-cal"]');if(!a)return;const t=a.querySelector('input[name="holidays"]'),e=a.querySelector("#holidays-country-wrap"),o=a.querySelector('input[name="displayname"]'),r=a.querySelector('input[name="readOnly"]');if(!t||!e)return;const p=()=>{const n=t.checked;e.hidden=!n,o&&(o.required=!n,n&&!o.value.trim()?o.placeholder="Auto: Holidays (XX)":n||(o.placeholder="Work")),n&&r&&(r.checked=!0)};t.addEventListener("change",p),p()}async function Sa(a){const t=new FormData(a),e=String(t.get("username")??""),o=String(t.get("password")??"");m=!0,O(),u(),j.event("login.attempt",{username:e});try{const r=await L.login(e,o);d=r.user,he(r.ui),j.event("login.ok",{username:(d==null?void 0:d.username)??e}),await ft(),g("success","Signed in")}catch(r){j.warn("login.failed",r instanceof Error?r.message:r),g("error",r instanceof Error?r.message:"Login failed")}finally{m=!1,u()}}async function Da(a){if(S===null)return;const t=new FormData(a),e=String(t.get("username")??""),o=String(t.get("access")??"read");H=!0,m=!0,O(),u();try{await L.share(S,e,o),await zt(S),g("success",`Shared with ${e}`)}catch(r){g("error",r instanceof Error?r.message:"Share failed")}finally{m=!1,u()}}function Zt(a){if(!y)return;const t=new FormData(a),e=a.querySelector('input[name="allDay"]');y={...y,summary:String(t.get("summary")??y.summary),description:String(t.get("description")??y.description),location:String(t.get("location")??y.location),instanceId:Number(t.get("instanceId"))||y.instanceId,allDay:(e==null?void 0:e.checked)??y.allDay,start:String(t.get("start")??y.start??""),end:String(t.get("end")??y.end??"")||null,repeat:te(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function te(a){const t=String(a.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const e=Math.max(1,Math.min(99,Number(a.get("repeatInterval")??1)||1)),o=String(a.get("repeatEndMode")??"never"),r=o==="until"||o==="count"?o:"never";let p=null,n=null;if(r==="until"){const i=String(a.get("repeatUntil")??"").trim();p=i?i.slice(0,10):null}else if(r==="count"){const i=Number(a.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=a.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:e,until:p,count:n,byDay:s,endMode:r}}async function Ca(a){if(!y||!y.canWrite)return;const t=new FormData(a),e=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),r=String(t.get("location")??"").trim(),p=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||y.instanceId,f=te(t);if(!e){g("error","Title is required"),u();return}if(!n){g("error","Start is required"),u();return}let h,v;if(p)h=n.slice(0,10),v=s?s.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const I=ve(n,s||null);h=new Date(I.start).toISOString(),v=I.end?new Date(I.end).toISOString():null}else h=new Date(n).toISOString(),v=s?new Date(s).toISOString():null;const M=y.instanceId,T=y.uri,w=gt;m=!0,O(),kt=!0,u(),j.event(w?"event.create":"event.update",{instanceId:i,uri:w?null:T,allDay:p,summary:e});try{const I={summary:e,description:o,location:r,allDay:p,start:h,end:v,instanceId:i,repeat:f},X=w?await L.createEvent(i,I):await L.updateEvent(M,T,I);(S===null||X.event.instanceId!==S)&&(S=X.event.instanceId),await bt(),kt=!1,y=null,gt=!1,N=null,j.event(w?"event.created":"event.saved",{uri:X.event.uri,instanceId:X.event.instanceId}),g("success",w?"Event created":"Event saved")}catch(I){j.warn("event.save failed",I instanceof Error?I.message:I),g("error",I instanceof Error?I.message:"Save failed")}finally{m=!1,u()}}async function Ea(a){if(S===null)return;const t=new FormData(a),e=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),r=String(t.get("color")??"").trim();m=!0,O(),u();try{const p=await L.updateCalendar(S,{displayname:e,description:o,color:r});H=!0,await ft(),S=p.calendar.id,await zt(S),await bt(),g("success","Calendar updated")}catch(p){g("error",p instanceof Error?p.message:"Update failed")}finally{m=!1,u()}}async function Na(a){const t=new FormData(a),e=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),r=String(t.get("color")??"").trim(),p=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if(wt=!0,p&&!n){g("error","Select a country for the holidays calendar"),u();return}if(!p&&!e){g("error","Display name is required"),u();return}m=!0,O(),vt=null,u();try{const i=await L.createCalendar({displayname:e,description:o,color:r,holidays:p,holidayCountry:p?n:void 0,readOnly:s});S=i.calendar.id,wt=!1,await ft();let f=`Created “${i.calendar.displayname}”`;const h=i.holidayImport??i.calendar.holidayImport;h&&(f+=`. Holidays imported: ${fe(h)}.`,vt={ok:!0,message:fe(h)}),s&&(f+=" Calendar is read-only."),g("success",f)}catch(i){wt=!0,g("error",i instanceof Error?i.message:"Create failed")}finally{m=!1,u()}}async function Ta(a){var o,r,p;const t=a.target.closest("[data-action]");if(!t)return;const e=t.dataset.action;if(e&&j.debug(`action:${e}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),e==="logout"){m=!0,j.event("logout");try{await L.logout()}catch{}d=null,A=[],at=[],S=null,nt=[],x=null,St=[],Y=null,k=null,z=!1,tt=!1,ct=!1,wt=!1,O(),m=!1,u();return}if(e==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;S=n,vt=null,m=!0,O(),u();try{await bt()}catch(s){g("error",s instanceof Error?s.message:"Failed to load calendar")}finally{m=!1,u()}return}if(e==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;S=n,H=!0,it=null,vt=null,m=!0,O(),u();try{await zt(n),await bt()}catch(i){g("error",i instanceof Error?i.message:"Failed to open calendar")}finally{m=!1,u()}return}if(e==="close-cal-modal"){H=!1,u();return}if(e==="open-create-cal-modal"){wt=!0,H=!1,it=null,O(),u();return}if(e==="close-create-cal-modal"){wt=!1,O(),u();return}if(e==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!A.find(i=>i.id===n&&i.canShare))return;it=n,H=!1,O(),u();return}if(e==="cancel-delete-cal"){it=null,u();return}if(e==="confirm-delete-cal"){const n=Number(t.dataset.id),s=l.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;m=!0,O(),u();try{if(await L.deleteCalendar(n),S===n&&(S=null),it=null,H=!1,at=[],Vt=[],await ft(),S===null){const i=Ie();i&&(S=i.id,await bt())}g("success","Calendar deleted")}catch(i){g("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(e==="month-today"){const n=new Date;Nt={y:n.getFullYear(),m:n.getMonth()},Jt=null,m=!0,u();try{await bt()}finally{m=!1,u()}return}if(e==="month-prev"||e==="month-next"){const n=e==="month-prev"?-1:1,s=new Date(Nt.y,Nt.m+n,1);Nt={y:s.getFullYear(),m:s.getMonth()},Jt=null,m=!0,u();try{await bt()}finally{m=!1,u()}return}if(e==="open-event"){a.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;m=!0,O(),u();try{const i=await L.getEvent(n,s);y={...i.event,repeat:i.event.repeat??ie()},gt=!1,kt=!0,N=null,H=!1,it=null}catch(i){g("error",i instanceof Error?i.message:"Failed to open event")}finally{m=!1,u()}return}if(e==="open-event-day"){a.stopPropagation();const n=t.dataset.day??"";Jt=Jt===n?null:n,u();return}if(e==="new-event-day"){const n=a.target;if((o=n==null?void 0:n.closest)!=null&&o.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(S===null){g("error","Select a calendar first"),u();return}const i=A.find(f=>f.id===S);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){g("error","This calendar is read-only"),u();return}gt=!0,y=la(s,S),kt=!0,N=null,H=!1,it=null,O(),u();return}if(e==="close-event-modal"){kt=!1,y=null,gt=!1,N=null,O(),u();return}if(e==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=l.querySelector('[data-form="edit-event"]');if(s&&y&&Zt(s),(N==null?void 0:N.field)===n)N=null;else{const i=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",h=t.dataset.dtName||n;let v=ke(n);!v&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(v=Xt().start);const M=Gt(v||G(new Date)),[T,w]=M.date.split("-").map(Number);N={field:n,viewY:T,viewM:(w||1)-1,dateOnly:i,allowClear:f,name:h}}u();return}if(e==="dt-month-prev"||e==="dt-month-next"){if(!N)return;const n=e==="dt-month-prev"?-1:1,s=new Date(N.viewY,N.viewM+n,1);N={...N,viewY:s.getFullYear(),viewM:s.getMonth()},u();return}if(e==="dt-pick-day"){if(!N)return;const n=N.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=l.querySelector('[data-form="edit-event"]');i&&y&&Zt(i);const f=N.dateOnly;if(f)yt(n,s),N=null;else{const h=ke(n),v=Gt(h||Xt(s).start).hm;yt(n,`${s}T${v}`),N={...N,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&y&&!f&&y.end){const h=new Date(String(y.start)),v=new Date(String(y.end));!Number.isNaN(h.getTime())&&!Number.isNaN(v.getTime())&&v<=h&&yt("end",Ot(new Date(h.getTime()+3600*1e3)))}u();return}if(e==="dt-pick-time"){if(!N||N.dateOnly)return;const n=N.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=l.querySelector('[data-form="edit-event"]');i&&y&&Zt(i);const f=ke(n)||Xt().start,v=`${Gt(f).date}T${s}`;if(yt(n,v),n==="start"&&y){y={...y,allDay:!1};const M=y.end?Gt(String(y.end)):null,T=new Date(v);(!M||new Date(`${M.date}T${M.hm}`)<=T)&&yt("end",Ot(new Date(T.getTime()+3600*1e3)))}N=null,u();return}if(e==="dt-today"){if(!N)return;const n=N.field,s=l.querySelector('[data-form="edit-event"]');s&&y&&Zt(s);const i=G(new Date);if(N.dateOnly)yt(n,i);else{const f=Xt(i);n==="start"?(yt("start",f.start),y&&!y.end&&yt("end",f.end)):n==="end"?yt("end",f.end):yt(n,f.start)}N=null,u();return}if(e==="dt-clear"){if(!N||!N.allowClear)return;const n=N.field,s=l.querySelector('[data-form="edit-event"]');s&&y&&Zt(s),yt(n,null),N=null,u();return}if(e==="event-allday-toggle"){if(!y)return;const n=l.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),f=String(i.get("start")??y.start??""),h=String(i.get("end")??y.end??"")||null;let v=f,M=h;if(s){const T=Ke(f,h);v=T.start,M=T.end}else{const T=f.slice(0,10),w=(h||f).slice(0,10),I=ve(T,w);v=I.start,M=I.end}y={...y,summary:String(i.get("summary")??y.summary),description:String(i.get("description")??y.description),location:String(i.get("location")??y.location),instanceId:Number(i.get("instanceId"))||y.instanceId,allDay:s,start:v,end:M,repeat:te(i)}}else y={...y,allDay:s};N=null,u();return}if(e==="event-repeat-freq"||e==="event-repeat-end"){if(!y)return;const n=l.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),f=te(s);y={...y,summary:String(s.get("summary")??y.summary),description:String(s.get("description")??y.description),location:String(s.get("location")??y.location),instanceId:Number(s.get("instanceId"))||y.instanceId,allDay:(i==null?void 0:i.checked)??y.allDay,start:String(s.get("start")??y.start??""),end:String(s.get("end")??y.end??"")||null,repeat:f,hasRrule:!!String(s.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(N==null?void 0:N.field)==="end"&&(N=null),u();return}if(e==="delete-event"){if(!y||!y.canWrite||gt||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=y.instanceId,s=y.uri;m=!0,O(),u();try{await L.deleteEvent(n,s),kt=!1,y=null,await bt(),g("success","Event deleted")}catch(i){g("error",i instanceof Error?i.message:"Delete failed")}finally{m=!1,u()}return}if(e==="info"){const n=t.dataset.info??"";Fa(n);return}if(e==="info-close"){_e();return}if(e==="flash-close"){O(),u();return}if(e==="tab"){const n=t.dataset.tab;if(n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"){C=n,j.event("tab",{tab:n}),n!=="calendars"&&(H=!1,it=null),n!=="contacts"&&(mt=null),O(),m=!0,u();try{n==="contacts"&&x!==null?await It(x):n==="calendars"?await bt():n==="tasks"?await Bt():n==="notes"&&await Qt()}catch(s){j.warn("tab load failed",s instanceof Error?s.message:s),g("error",s instanceof Error?s.message:"Failed to load")}finally{m=!1,u()}}return}if(e==="sort-task"||e==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(e==="sort-task"){xt===n?Ct=Ct==="asc"?"desc":"asc":(xt=n,Ct=n==="due"||n==="summary"?"asc":"desc"),m=!0,u();try{await Bt()}catch(s){g("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}else{Ht===n?Ut=Ut==="asc"?"desc":"asc":(Ht=n,Ut="asc"),m=!0,u();try{await Qt()}catch(s){g("error",s instanceof Error?s.message:"Sort failed")}finally{m=!1,u()}}return}if(e==="select-task"){if(a.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=lt.find(f=>f.instanceId===n&&f.uri===s)??null;B=!1,ot=J(n,s),q=i?{...i}:null,O(),u();return}if(e==="task-check"){a.preventDefault(),a.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=J(n,s),f=lt.find(h=>J(h.instanceId,h.uri)===i);if(!f||!f.canWrite||f.readOnly)return;Q.includes(i)?Q=Q.filter(h=>h!==i):Q=[...Q,i],u();return}if(e==="task-select-all"){a.preventDefault();const n=lt.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>Q.includes(J(i.instanceId,i.uri)))?Q=[]:Q=n.map(i=>J(i.instanceId,i.uri)),u();return}if(e==="bulk-task-clear"){Q=[],u();return}if(e==="bulk-task-status"||e==="bulk-task-due"||e==="bulk-task-clear-due"||e==="bulk-task-percent"||e==="bulk-task-delete"){ga(e);return}if(e==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=Kt.find(f=>f.instanceId===n&&f.uri===s)??null;et=!1,$t=J(n,s),W=i?{...i}:null,O(),u();return}if(e==="new-task"){B=!0,ot=null,q={uri:"",instanceId:((r=Mt[0])==null?void 0:r.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},O(),u();return}if(e==="new-subtask"){if(!q||B||!q.uid||!q.canWrite)return;const n=q;B=!0,ot=null,q={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},O(),u();return}if(e==="new-note"){et=!0,$t=null,W={uri:"",instanceId:((p=Rt[0])==null?void 0:p.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},O(),u();return}if(e==="cancel-task"){B=!1,q=null,ot=null,u();return}if(e==="cancel-note"){et=!1,W=null,$t=null,u();return}if(e==="delete-task"){if(!q||B||!confirm("Delete this task? CalDAV clients will sync the removal."))return;m=!0,O(),u();try{await L.deleteTask(q.instanceId,q.uri),ot=null,q=null,await Bt(),g("success","Task deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(e==="delete-note"){if(!W||et||!confirm("Delete this note? CalDAV clients will sync the removal."))return;m=!0,O(),u();try{await L.deleteNote(W.instanceId,W.uri),$t=null,W=null,await Qt(),g("success","Note deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(e==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;x=n,ct=!1,Tt=null,Y=null,k=null,z=!1,tt=!1,Ft="",St=[],st=null,dt=null,pt=!1,O(),m=!0,u();try{await It(n)}catch(s){g("error",s instanceof Error?s.message:"Failed to load contacts")}finally{m=!1,u()}return}if(e==="edit-ab"){a.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!nt.find(f=>f.id===n))return;const i=x!==n;x=n,ct=!0,tt=!1,Tt=null,O(),i&&(Y=null,k=null,z=!1,Ft="",St=[],st=null,dt=null,pt=!1),m=!0,u();try{i&&await It(n)}catch(f){g("error",f instanceof Error?f.message:"Failed to open address book")}finally{m=!1,u()}return}if(e==="close-ab-modal"){ct=!1,u();return}if(e==="select-contact"){const n=t.dataset.uri??"";if(!n)return;O();try{await oa(n)}catch(s){g("error",s instanceof Error?s.message:"Failed to load contact")}u();return}if(e==="new-contact"){if(x===null)return;ra(),O(),u();return}if(e==="cancel-contact"||e==="close-contact-modal"){z=!1,tt=!1,k=null,Y=null,st=null,dt=null,pt=!1,N=null,O(),u();return}if(e==="add-email"||e==="add-phone"||e==="add-custom"){if(!k)return;ce(),Array.isArray(k.emails)||(k.emails=[""]),Array.isArray(k.phones)||(k.phones=[{type:"cell",value:""}]),Array.isArray(k.custom)||(k.custom=[]),e==="add-email"?k.emails.length<10&&k.emails.push(""):e==="add-phone"?k.phones.length<10&&k.phones.push({type:"other",value:""}):k.custom.length<30&&k.custom.push({label:"",value:""}),u();return}if(e==="remove-email"){if(!k)return;ce();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.emails)?k.emails:[""];k.emails=s.filter((i,f)=>f!==n),k.emails.length===0&&(k.emails=[""]),u();return}if(e==="remove-phone"){if(!k)return;ce();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.phones)?k.phones:[{type:"cell",value:""}];k.phones=s.filter((i,f)=>f!==n),k.phones.length===0&&(k.phones=[{type:"cell",value:""}]),u();return}if(e==="remove-custom"){if(!k)return;ce();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;k.custom=(Array.isArray(k.custom)?k.custom:[]).filter((s,i)=>i!==n),u();return}if(e==="remove-photo"){st=null,dt=null,pt=!0,k&&(k.hasPhoto=!1),u();return}if(e==="delete-contact"){if(x===null||!Y||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;m=!0,O(),tt=!0,u();try{await L.deleteContact(x,Y),Y=null,k=null,z=!1,tt=!1,N=null,st=null,await ft(),g("success","Contact deleted")}catch(n){g("error",n instanceof Error?n.message:"Delete failed")}finally{m=!1,u()}return}if(e==="delete-ab"){a.stopPropagation();const n=Number(t.dataset.id??x);if(!Number.isFinite(n)||!nt.find(i=>i.id===n))return;mt=n,ct=!1,tt=!1,O(),u();return}if(e==="cancel-delete-ab"){mt=null,u();return}if(e==="confirm-delete-ab"){const n=Number(t.dataset.id),s=l.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=nt.find(h=>h.id===n);if(!i)return;const f=(i.cardCount??0)>0;m=!0,O(),u();try{await L.deleteAddressBook(n,f),x===n&&(x=null,St=[],k=null,Y=null,z=!1),mt=null,ct=!1,tt=!1,await ft(),x===null&&nt.length>0&&(x=nt[0].id,await It(x)),g("success","Address book deleted")}catch(h){g("error",h instanceof Error?h.message:"Delete failed")}finally{m=!1,u()}return}if(e==="export-ab"){if(x===null)return;ct=!0,m=!0,O(),u();try{const{blob:n,filename:s}=await L.exportAddressBook(x),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(e==="export-contact"){if(x===null||!Y||z)return;tt=!0,m=!0,O(),u();try{const{blob:n,filename:s}=await L.exportContact(x,Y),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}return}if(e==="revoke"){const n=t.dataset.href??"";if(!n||S===null||!confirm("Revoke access for this user?"))return;H=!0,m=!0,O(),u();try{await L.revoke(S,n),await zt(S),g("success","Share revoked")}catch(s){g("error",s instanceof Error?s.message:"Revoke failed")}finally{m=!1,u()}return}if(e==="export-cal"){if(S===null)return;H=!0,m=!0,O(),u();try{const{blob:n,filename:s}=await L.exportCalendar(S),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),g("success",`Exported ${s}`)}catch(n){g("error",n instanceof Error?n.message:"Export failed")}finally{m=!1,u()}}}function xa(){const a=l.querySelector('input[data-action="import-cal"]');a&&a.addEventListener("change",()=>{Ma(a)});const t=l.querySelector('input[data-action="import-ab"]');t&&t.addEventListener("change",()=>{Oa(t)})}async function Oa(a){var e;if(x===null)return;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){ct=!0,m=!0,O(),Tt=null,u();try{const o=await t.text(),r=await L.importAddressBook(x,o),p=fe(r);Tt={ok:!0,message:p},await ft(),await It(x),g("success",`Import finished for “${t.name}”: ${p}.`)}catch(o){const r=o instanceof Error?o.message:"Import failed";Tt={ok:!1,message:r},g("error",r)}finally{m=!1,u()}}}function ce(){if(!k)return;const a=l.querySelector('[data-form="contact"]');if(!a)return;const t=new FormData(a);k.firstname=String(t.get("firstname")??""),k.lastname=String(t.get("lastname")??""),k.fullname=String(t.get("fullname")??""),k.org=String(t.get("org")??""),k.title=String(t.get("title")??""),k.url=String(t.get("url")??""),k.note=String(t.get("note")??"");const e=String(t.get("birthday")??"").trim();k.birthday=e&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):null,k.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const o=[];let r=0;for(;t.has(`email_${r}`);)o.push(String(t.get(`email_${r}`)??"")),r++;o.length&&(k.emails=o);const p=[];for(r=0;t.has(`phone_value_${r}`);)p.push({type:String(t.get(`phone_type_${r}`)??"other"),value:String(t.get(`phone_value_${r}`)??"")}),r++;p.length&&(k.phones=p);const n=[];for(r=0;t.has(`custom_label_${r}`)||t.has(`custom_value_${r}`);)n.push({label:String(t.get(`custom_label_${r}`)??""),value:String(t.get(`custom_value_${r}`)??"")}),r++;k.custom=n}function Ia(a){const t=new FormData(a),e=[];let o=0;for(;t.has(`email_${o}`);){const s=String(t.get(`email_${o}`)??"").trim();s&&e.push(s),o++}const r=[];for(o=0;t.has(`phone_value_${o}`);){const s=String(t.get(`phone_value_${o}`)??"").trim();s&&r.push({type:String(t.get(`phone_type_${o}`)??"other"),value:s}),o++}const p=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);){const s=String(t.get(`custom_label_${o}`)??"").trim(),i=String(t.get(`custom_value_${o}`)??"").trim();(s||i)&&p.push({label:s,value:i}),o++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:e,phones:r,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:p};return pt?n.removePhoto=!0:dt&&(n.photoBase64=dt),n}async function Aa(a){if(x===null)return;const t=Ia(a);m=!0,O(),tt=!0,u();try{if(z){const e=await L.createContact(x,t);z=!1,Y=e.contact.uri,k=null,tt=!1,st=null,dt=null,pt=!1,N=null,g("success","Contact created")}else Y&&(Y=(await L.updateContact(x,Y,t)).contact.uri,k=null,tt=!1,st=null,dt=null,pt=!1,N=null,g("success","Contact saved"));try{await ft()}catch(e){if(console.error(e),x!==null)try{await It(x)}catch{}}}catch(e){g("error",e instanceof Error?e.message:"Save failed")}finally{m=!1,u()}}async function La(a){const t=new FormData(a),e=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();if(e){m=!0,O(),u();try{const r=await L.createAddressBook({displayname:e,description:o});x=r.addressbook.id,Y=null,k=null,z=!1,Ft="",await ft(),g("success",`Address book “${r.addressbook.displayname}” created`)}catch(r){g("error",r instanceof Error?r.message:"Create failed")}finally{m=!1,u()}}}async function qa(a){if(x===null)return;const t=new FormData(a),e=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();ct=!0,m=!0,O(),u();try{await L.updateAddressBook(x,{displayname:e,description:o}),await ft(),g("success","Address book updated")}catch(r){g("error",r instanceof Error?r.message:"Update failed")}finally{m=!1,u()}}function Fa(a){const t=Ha[a];if(!t)return;const e=l.querySelector("#info-modal"),o=l.querySelector("#info-modal-title"),r=l.querySelector("#info-modal-body");if(!e||!o||!r)return;o.textContent=t.title,r.innerHTML=t.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),e.hidden=!1,document.body.classList.add("info-modal-open");const p=e.querySelector(".info-modal-close");p==null||p.focus()}function _e(){const a=l.querySelector("#info-modal");a&&(a.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ma(a){var e;if(S===null)return;const t=(e=a.files)==null?void 0:e[0];if(a.value="",!!t){H=!0,m=!0,O(),vt=null,u();try{const o=await t.text(),r=await L.importCalendar(S,o),p=fe(r);vt={ok:!0,message:p},await bt(),g("success",`Import finished for “${t.name}”: ${p}.`)}catch(o){const r=o instanceof Error?o.message:"Import failed";vt={ok:!1,message:r},g("error",r)}finally{m=!1,u()}}}We()}const He=document.getElementById("app");if(!He)throw new Error("#app missing");Ya(He);
