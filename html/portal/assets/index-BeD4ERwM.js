var Qa=Object.defineProperty;var Za=(r,d,D)=>d in r?Qa(r,d,{enumerable:!0,configurable:!0,writable:!0,value:D}):r[d]=D;var Zt=(r,d,D)=>Za(r,typeof d!="symbol"?d+"":d,D);(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const T of document.querySelectorAll('link[rel="modulepreload"]'))C(T);new MutationObserver(T=>{for(const U of T)if(U.type==="childList")for(const F of U.addedNodes)F.tagName==="LINK"&&F.rel==="modulepreload"&&C(F)}).observe(document,{childList:!0,subtree:!0});function D(T){const U={};return T.integrity&&(U.integrity=T.integrity),T.referrerPolicy&&(U.referrerPolicy=T.referrerPolicy),T.crossOrigin==="use-credentials"?U.credentials="include":T.crossOrigin==="anonymous"?U.credentials="omit":U.credentials="same-origin",U}function C(T){if(T.ep)return;T.ep=!0;const U=D(T);fetch(T.href,U)}})();const ea={off:0,error:1,warn:2,info:3,debug:4};let dt="off";const St="[baikal-portal]";function en(r){const d=(r||"off").toLowerCase().trim();return d==="error"||d==="warn"||d==="info"||d==="debug"||d==="off"?d:"off"}function tn(r){return dt=en(r),dt!=="off"&&console.info(St,`log level = ${dt}`),dt}function aa(r){return ea[dt]>=ea[r]}function wt(r,d,D,C){if(!aa(r))return;const T=[St,D];C!==void 0&&T.push(C),console[d](...T)}function an(r,d){aa("info")&&(d&&Object.keys(d).length>0?console.info(St,`event:${r}`,d):console.info(St,`event:${r}`))}const B={error(r,d){wt("error","error",r,d)},warn(r,d){wt("warn","warn",r,d)},info(r,d){wt("info","info",r,d)},debug(r,d){wt("debug","debug",r,d)},event:an};class be extends Error{constructor(D,C){super(D);Zt(this,"status");this.status=C}}let ut="";function Lt(r){ut=r&&typeof r=="string"?r:""}async function j(r,d={}){const D=new Headers(d.headers);d.body&&!D.has("Content-Type")&&D.set("Content-Type","application/json");const C=(d.method||"GET").toUpperCase();C!=="GET"&&C!=="HEAD"&&C!=="OPTIONS"&&ut&&D.set("X-CSRF-Token",ut);const T=typeof performance<"u"?performance.now():Date.now();B.debug(`api → ${C} ${r}`);const U=await fetch(`/api${r}`,{...d,headers:D,credentials:"same-origin"});let F=null;const k=await U.text();if(k)try{F=JSON.parse(k)}catch{F={error:k}}const se=Math.round((typeof performance<"u"?performance.now():Date.now())-T);if(!U.ok){let W=`Request failed (${U.status})`;throw F&&typeof F=="object"&&F!==null&&"error"in F&&typeof F.error=="string"?W=F.error:(U.status===500||U.status===504)&&(W="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),U.status>=500?B.error(`api ← ${C} ${r} ${U.status} (${se}ms)`,W):U.status!==401?B.warn(`api ← ${C} ${r} ${U.status} (${se}ms)`,W):B.debug(`api ← ${C} ${r} 401 (${se}ms)`),new be(W,U.status)}return B.info(`api ← ${C} ${r} ${U.status} (${se}ms)`),F}function ve(r){return encodeURIComponent(r)}async function ta(r,d,D,C){const T=new Headers({"Content-Type":D,Accept:"application/x-ndjson, application/json;q=0.9"});ut&&T.set("X-CSRF-Token",ut);const U=typeof performance<"u"?performance.now():Date.now();B.debug(`api → POST ${r} (stream, ${D}, ${d.length} bytes)`);let F;try{F=await fetch(`/api${r}`,{method:"POST",headers:T,credentials:"same-origin",body:d})}catch(Y){const _=Y instanceof Error?Y.message:"Network error";throw B.error(`api ← POST ${r} network fail`,_),new be(`Import request failed to start (${_}). Check connectivity and container logs.`,0)}const k=(F.headers.get("Content-Type")||"").toLowerCase(),se=k.includes("ndjson")||k.includes("x-ndjson");if(!F.ok&&!se){let Y=`Request failed (${F.status})`;try{const _=await F.json();_.error&&(Y=_.error)}catch{}throw(F.status===504||F.status===502)&&(Y="Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes."),B.warn(`api ← POST ${r} ${F.status}`,Y),new be(Y,F.status)}if(!se&&F.ok){try{const Y=await F.json();if(Y&&typeof Y.error=="string")throw new be(Y.error,F.status||500);if(Y&&typeof Y.imported=="number"&&typeof Y.updated=="number")return B.info(`api ← POST ${r} json done`),Y}catch(Y){if(Y instanceof be)throw Y}throw new be("Unexpected import response from server",500)}if(!F.body)throw new be("Import stream unavailable",500);const W=F.body.getReader(),ie=new TextDecoder;let ae="";const K={final:null,error:null,sawProgress:!1},$e=Y=>{let _;try{_=JSON.parse(Y)}catch{B.debug("import stream non-JSON line",Y.slice(0,80));return}if(_.type==="progress"){K.sawProgress=!0;const b=Number(_.total)||0,ce=Number(_.current)||0,E=typeof _.percent=="number"?_.percent:b>0?Math.round(100*ce/b):0;C==null||C({percent:E,current:ce,total:b,imported:Number(_.imported)||0,updated:Number(_.updated)||0,skipped:Number(_.skipped)||0})}else _.type==="done"&&_.result?K.final=_.result:_.type==="error"&&(K.error={message:_.error||"Import failed",status:_.status||500})};for(;;){const{done:Y,value:_}=await W.read();if(Y)break;ae+=ie.decode(_,{stream:!0});const b=ae.split(`
`);ae=b.pop()??"";for(const ce of b){const E=ce.trim();E&&$e(E)}}ae.trim()&&$e(ae.trim());const Ee=Math.round((typeof performance<"u"?performance.now():Date.now())-U);if(K.error)throw B.warn(`api ← POST ${r} stream error (${Ee}ms)`,K.error.message),new be(K.error.message,K.error.status);if(!K.final)throw B.error(`api ← POST ${r} stream incomplete (${Ee}ms)`,{sawProgress:K.sawProgress}),new be(K.sawProgress?"Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app.":"Import failed to start on the server. Check container logs and that you are on the latest image.",500);return B.info(`api ← POST ${r} stream done (${Ee}ms)`),K.final}const q={ui:()=>j("/ui"),me:async()=>{var d;const r=await j("/me");return Lt(r.csrfToken||((d=r.user)==null?void 0:d.csrfToken)),r},login:async(r,d)=>{var C;const D=await j("/login",{method:"POST",body:JSON.stringify({username:r,password:d})});return Lt((C=D.user)==null?void 0:C.csrfToken),D},logout:async()=>{try{return await j("/logout",{method:"POST"})}finally{Lt("")}},calendars:()=>j("/calendars"),createCalendar:r=>j("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>j("/holidays/countries"),updateCalendar:(r,d)=>j(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(d)}),deleteCalendar:r=>j(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,d,D)=>{const C=new URLSearchParams({from:d,to:D}).toString();return j(`/calendars/${r}/events?${C}`)},getEvent:(r,d)=>j(`/calendars/${r}/events/${ve(d)}`),createEvent:(r,d)=>j(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(d)}),updateEvent:(r,d,D)=>j(`/calendars/${r}/events/${ve(d)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteEvent:(r,d)=>j(`/calendars/${r}/events/${ve(d)}`,{method:"DELETE"}),exportCalendar:async r=>{const d=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!d.ok){let F=`Export failed (${d.status})`;try{const k=await d.json();k.error&&(F=k.error)}catch{}throw new be(F,d.status)}const D=d.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(D),T=(C==null?void 0:C[1])||`calendar-${r}.ics`;return{blob:await d.blob(),filename:T}},importCalendar:(r,d,D)=>ta(`/calendars/${r}/import`,d,"text/calendar; charset=utf-8",D),directory:()=>j("/directory"),shares:r=>j(`/calendars/${r}/shares`),share:(r,d,D)=>j(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:d,access:D})}),revoke:(r,d)=>j(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:d})}),addressbooks:()=>j("/addressbooks"),createAddressBook:r=>j("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,d)=>j(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(d)}),deleteAddressBook:(r,d=!1)=>j(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:d})}),exportAddressBook:async r=>{const d=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!d.ok){let F=`Export failed (${d.status})`;try{const k=await d.json();k.error&&(F=k.error)}catch{}throw new be(F,d.status)}const D=d.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(D),T=(C==null?void 0:C[1])||`contacts-${r}.vcf`;return{blob:await d.blob(),filename:T}},importAddressBook:(r,d,D)=>ta(`/addressbooks/${r}/import`,d,"text/vcard; charset=utf-8",D),contacts:(r,d="")=>{const D=d.trim()?`?q=${encodeURIComponent(d.trim())}`:"";return j(`/addressbooks/${r}/contacts${D}`)},getContact:(r,d)=>j(`/addressbooks/${r}/contacts/${ve(d)}`),createContact:(r,d)=>j(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(d)}),updateContact:(r,d,D)=>j(`/addressbooks/${r}/contacts/${ve(d)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteContact:(r,d)=>j(`/addressbooks/${r}/contacts/${ve(d)}`,{method:"DELETE"}),exportContact:async(r,d)=>{const D=await fetch(`/api/addressbooks/${r}/contacts/${ve(d)}/export`,{credentials:"same-origin"});if(!D.ok){let k=`Export failed (${D.status})`;try{const se=await D.json();se.error&&(k=se.error)}catch{}throw new be(k,D.status)}const C=D.headers.get("Content-Disposition")||"",T=/filename="([^"]+)"/i.exec(C),U=(T==null?void 0:T[1])||"contact.vcf";return{blob:await D.blob(),filename:U}},contactPhotoUrl:(r,d)=>`/api/addressbooks/${r}/contacts/${ve(d)}/photo`,tasks:(r={})=>{const d=new URLSearchParams;r.q&&d.set("q",r.q),r.sort&&d.set("sort",r.sort),r.order&&d.set("order",r.order);const D=d.toString()?`?${d}`:"";return j(`/tasks${D}`)},createTask:r=>j("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,d,D)=>j(`/tasks/${r}/${ve(d)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteTask:(r,d)=>j(`/tasks/${r}/${ve(d)}`,{method:"DELETE"}),bulkTasks:r=>j("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const d=new URLSearchParams;r.q&&d.set("q",r.q),r.sort&&d.set("sort",r.sort),r.order&&d.set("order",r.order);const D=d.toString()?`?${d}`:"";return j(`/notes${D}`)},createNote:r=>j("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,d,D)=>j(`/notes/${r}/${ve(d)}`,{method:"PATCH",body:JSON.stringify(D)}),deleteNote:(r,d)=>j(`/notes/${r}/${ve(d)}`,{method:"DELETE"})},nn="0.11.1-fork.4",sn="https://github.com/offsyanka99/Baikal/tree/master/docs";function c(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function qt(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(r)}</span>`}function kt(r){const d=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&d.push(`${r.skipped} skipped`),d.join(", ")}const rn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. Select one to view events in the month grid.","Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing)."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]}};function Ce(r,d,D="h2"){const C=D;return`<div class="section-title-row">
    <${C}>${c(r)}</${C}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(d)}"
      aria-label="About ${c(r)}" title="About ${c(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function on(){return`
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
    </div>`}function ln(r){let d=null,D=null,C="calendars",T=[],U=[],F=[],k=null,se=[],W=!1,ie=!1,ae=null,K=null,$e={y:new Date().getFullYear(),m:new Date().getMonth()},Ee=[],Y=!1,_=!1,b=null,ce=!1,E=null,mt="",Ze=null,de=[],I=null,Ie=[],Be="",G=null,S=null,Z=!1,oe=!1,he=!1,ue=null,ye=null,we=!1,p=!1,ke=null,qe=null,M=null,pt=null,Mt=!1,ze={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Oe=null;function Dt(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();ze={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},tn(ze.logLevel)}let me=[],et=[],_e=[],Ve=[],ft="",bt="",Me="due",Ae="asc",Ke="dtstart",He="desc",pe=null,Ne=null,P=null,z=null,J=!1,le=!1,re=[];function v(e,t){D={type:e,message:t}}function O(){D=null}async function sa(){B.event("bootstrap.start");try{const e=await q.ui();Dt(e.ui)}catch(e){B.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await q.me();d=e.user,Dt(e.ui),B.event("bootstrap.session",{username:(d==null?void 0:d.username)??null}),await ge()}catch(e){e instanceof be&&e.status===401?(d=null,B.event("bootstrap.anonymous")):(B.error("bootstrap failed",e instanceof Error?e.message:e),v("error",e instanceof Error?e.message:"Failed to load"))}m()}async function ge(){B.debug("loadHome");const[e,t,a]=await Promise.all([q.calendars(),q.directory().catch(()=>({users:[]})),q.addressbooks()]);if(T=e.calendars,U=t.users,de=a.addressbooks,B.event("loadHome",{calendars:T.length,addressBooks:de.length,directory:U.length}),F.length===0)try{F=(await q.holidayCountries()).countries}catch{F=[]}if(k!==null&&!T.some(o=>o.id===k)&&(k=null,se=[],W=!1,ae=null),k===null){const o=Ft();o&&(k=o.id)}k!==null&&W?await tt(k):k!==null&&(se=[]),C==="calendars"&&await Se(),I!==null&&!de.some(o=>o.id===I)&&(I=null,Ie=[],G=null,S=null,Z=!1),K!==null&&!de.some(o=>o.id===K)&&(K=null),I===null&&de.length>0&&(I=de[0].id),I!==null&&C==="contacts"&&await Pe(I)}async function tt(e){se=(await q.shares(e)).shares}function Ft(){const e=T.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const o=a.uri.toLowerCase(),l=a.displayname.toLowerCase();return o==="default"||l==="default"||l==="default calendar"};return e.find(t)??e[0]??null}function ee(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${o}`}function ra(e,t){const a=new Date(e,t,1),o=new Date(e,t+1,0);return{from:ee(a),to:ee(o)}}function Ct(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,o,l]=e.split("-").map(Number);return new Date(a,o-1,l)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,o,l]=e.slice(0,10).split("-").map(Number);return new Date(a,(o||1)-1,l||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function oa(e){const t=Ct(e.start);if(!e.end)return[ee(t)];let a=Ct(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const s=new Date(e.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ee(t)];const o=[],l=new Date(t.getFullYear(),t.getMonth(),t.getDate()),u=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;l<=u&&n++<370;)o.push(ee(l)),l.setDate(l.getDate()+1);return o.length?o:[ee(t)]}function Et(e,t){const a=e.slice(0,10),o=(t||a).slice(0,10);if(a===o){const A=nt(a);return{start:A.start,end:A.end}}const[l,u,n]=a.split("-").map(Number),[s,i,f]=o.split("-").map(Number),h=Fe(new Date(l,u-1,n,9,0,0,0)),g=Fe(new Date(s,i-1,f,17,0,0,0));return{start:h,end:g}}function la(e,t){const a=We(e);let o=t?We(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=new Date(t);if(!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getTime()>new Date(e).getTime()){const u=Ct(t);u.setDate(u.getDate()-1),o=ee(u)}}return{start:a,end:o}}async function Se(){if(k===null){Ee=[];return}const{from:e,to:t}=ra($e.y,$e.m);Y=!0,B.debug("loadMonthEvents",{selectedId:k,from:e,to:t});try{Ee=(await q.calendarEvents(k,e,t)).events,B.event("monthEvents.loaded",{calendarId:k,count:Ee.length,from:e,to:t})}catch(a){Ee=[],B.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Y=!1}}function ia(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function ca(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Nt())} ${t}`}function da(){const e=k!==null?T.find(y=>y.id===k):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",o=$e.y,l=$e.m,u=new Date(o,l,1),n=Tt(),s=(u.getDay()-n+7)%7,i=new Date(o,l+1,0).getDate(),f=new Date(o,l,0).getDate(),g=ee(new Date),A=Pt(),x=new Map;for(const y of Ee)for(const R of oa(y)){const N=x.get(R)??[];N.push(y),x.set(R,N)}const w=[],L=Math.ceil((s+i)/7)*7;for(let y=0;y<L;y++){let R,N=!0,V;y<s?(R=f-s+y+1,N=!1,V=new Date(o,l-1,R)):y>=s+i?(R=y-(s+i)+1,N=!1,V=new Date(o,l+1,R)):(R=y-s+1,V=new Date(o,l,R));const H=ee(V),Q=H===g,fe=N?x.get(H)??[]:[],lt=Ze===H?50:3,Qe=fe.slice(0,lt),gt=fe.length-Qe.length,Le=Qe.map(it=>{const At=k??0,$t=ca(it);return`<button type="button" class="month-event${it.allDay?"":" is-timed"}" title="${c($t)}" style="--ev-color:${c(a)}"
            data-action="open-event" data-instance="${At}" data-uri="${c(it.uri)}" ${p?"disabled":""}>${c($t)}</button>`}).join(""),It=gt>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(H)}" title="Show all events this day" ${p?"disabled":""}>+${gt} more</button>`:"",Ot=!N&&(R===1||y===s+i)?V.toLocaleString(void 0,{month:"short",day:"numeric"}):String(R),vt=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));w.push(`<div class="month-cell${N?"":" is-outside"}${Q?" is-today":""}${vt?" is-clickable":""}"${vt?` data-action="new-event-day" data-day="${c(H)}" role="button" tabindex="0" title="Add event on ${c(H)}"`:""}>
        <div class="month-daynum${Q?" is-today-num":""}">${c(Ot)}</div>
        <div class="month-events">${Le}${It}</div>
      </div>`)}const ne=e?Y?'<p class="muted small month-empty-hint">Loading events…</p>':"":T.length===0?'<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>':'<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${p?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${p?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${p?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(ia(o,l))}</h2>
        <span class="month-cal-name muted small" title="${c(t)}">
          <span class="cal-swatch" style="background:${c(a)};margin-top:0"></span>
          ${c(t)}
        </span>
      </div>
      ${ne}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${A.map(y=>`<div class="month-dow">${c(y)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${w.join("")}
        </div>
      </div>
    </section>`}function We(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ee(t)}function ua(){if(ze.timeFormat==="24h")return!1;if(ze.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Nt(){return ua()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Tt(){var a;if(ze.weekStart==="monday")return 1;if(ze.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const o of e)try{const l=new Intl.Locale(o),u=typeof l.getWeekInfo=="function"?l.getWeekInfo():l.weekInfo,n=u==null?void 0:u.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Pt(){const e=Tt(),t=new Date(2024,0,7+e),a=[];for(let o=0;o<7;o++){const l=new Date(t);l.setDate(t.getDate()+o),a.push(l.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Rt(e,t=15){const a=t*60*1e3,o=e.getTime();return o%a===0?new Date(o):new Date(Math.ceil(o/a)*a)}function Fe(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ma(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=e.slice(0,10),[l,u,n]=o.split("-").map(Number);return new Date(l,u-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Nt()})}function at(e){if(!e){const a=Rt(new Date);return{date:ee(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ee(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function nt(e){const t=new Date,a=ee(t);if(e&&e!==a){const[u,n,s]=e.split("-").map(Number),i=new Date(u,n-1,s,9,0,0,0),f=new Date(u,n-1,s,10,0,0,0);return{start:Fe(i),end:Fe(f)}}const o=Rt(t,15),l=new Date(o.getTime()+3600*1e3);return{start:Fe(o),end:Fe(l)}}function pa(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Ye(e){const{field:t,name:a,label:o,value:l,dateOnly:u=!1,required:n,disabled:s,allowClear:i=!0}=e,f=(E==null?void 0:E.field)===t,h=ma(l,u);return`<div class="dt-field${f?" is-open":""}" data-dt-id="${c(t)}">
      <span class="dt-field-label">${c(o)}</span>
      <input type="hidden" name="${c(a)}" value="${c(l)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(t)}"
        data-dt-name="${c(a)}" data-dt-date-only="${u?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${f}">
        <span class="dt-trigger-text">${c(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${f&&!s?fa(t,l,u,i):""}
    </div>`}function xt(e){var t;return e==="start"?String((b==null?void 0:b.start)||""):e==="end"?String((b==null?void 0:b.end)||""):e==="until"?((t=b==null?void 0:b.repeat)==null?void 0:t.until)||We(b==null?void 0:b.start)||ee(new Date):e==="due"?Ge(P==null?void 0:P.due):e==="dtstart"?Ge(z==null?void 0:z.dtstart):e==="bulk-due"?mt:e==="birthday"?String((S==null?void 0:S.birthday)||""):""}function De(e,t){if(e==="start"&&b){b={...b,start:t||""};return}if(e==="end"&&b){b={...b,end:t};return}if(e==="until"&&b){b={...b,repeat:{...b.repeat??ht(),until:t,endMode:"until"}};return}if(e==="due"&&P){if(t===null||t==="")P={...P,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))P={...P,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));P={...P,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&z){if(t===null||t==="")z={...z,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))z={...z,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));z={...z,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&S){S={...S,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(mt=t||"")}function fa(e,t,a,o){const l=at(t),u=(E==null?void 0:E.viewY)??Number(l.date.slice(0,4)),n=(E==null?void 0:E.viewM)??Number(l.date.slice(5,7))-1,s=Tt(),i=Pt(),h=(new Date(u,n,1).getDay()-s+7)%7,g=new Date(u,n+1,0).getDate(),A=new Date(u,n,0).getDate(),x=l.date,w=l.hm,L=new Date(u,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),ne=[],y=Math.ceil((h+g)/7)*7;for(let N=0;N<y;N++){let V,H,Q=!1;N<h?(V=A-h+N+1,H=new Date(u,n-1,V),Q=!0):N>=h+g?(V=N-(h+g)+1,H=new Date(u,n+1,V),Q=!0):(V=N-h+1,H=new Date(u,n,V));const fe=ee(H),lt=fe===x,Qe=fe===ee(new Date);ne.push(`<button type="button" class="dt-day${Q?" is-outside":""}${lt?" is-selected":""}${Qe?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${c(fe)}">${V}</button>`)}const R=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${pa().map(N=>{const V=(()=>{const[H,Q]=N.split(":").map(Number);return new Date(2e3,0,1,H,Q).toLocaleTimeString(void 0,Nt())})();return`<button type="button" class="dt-time${N===w?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${N}" role="option" aria-selected="${N===w}">${c(V)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(L)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(N=>`<span class="dt-dow">${c(N)}</span>`).join("")}</div>
          <div class="dt-days">${ne.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(e)}" ${o?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${R}
      </div>
    </div>`}function ba(){r.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const o=t.getBoundingClientRect(),l=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const u=a.offsetWidth||320,n=a.offsetHeight||300;let s=o.bottom+6;s+n>window.innerHeight-l&&(s=Math.max(l,o.top-n-6));let i=o.left;i+u>window.innerWidth-l&&(i=Math.max(l,window.innerWidth-u-l)),i<l&&(i=l),a.style.top=`${Math.round(s)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function ht(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function ha(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function ya(){if(!_||!b)return"";const e=b,t=e.repeat??ht(),a=(t.freq||"").toUpperCase(),o=T.filter(x=>x.canShare||x.access==="readwrite"),l=T.filter(x=>x.id===e.instanceId?!0:x.readOnly?!1:x.canShare||x.access==="readwrite").map(x=>`<option value="${x.id}" ${x.id===e.instanceId?"selected":""}>${c(x.displayname)}</option>`).join(""),u=e.readOnly||!e.canWrite;let n,s;if(e.allDay)n=We(e.start),s=We(e.end);else{const x=e.start||"",w=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(x)){const L=Et(x,w||null);n=L.start,s=L.end||""}else n=Ge(e.start),s=Ge(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],f=new Set((t.byDay||[]).map(x=>x.toUpperCase())),h=ha(t),g=!!a&&h==="until",A=t.until||(h==="until"?We(e.start)||ee(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${ce?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Ue()}
          ${!ce&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${u?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${u||o.length===0?"disabled":""}>
                ${l||`<option value="${e.instanceId}">${c(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(e.summary)}" ${u?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(e.location)}" ${u?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${u?"readonly":""}>${c(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${u?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${Ye({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:u,allowClear:!1})}
              ${Ye({field:"end",name:"end",label:"End",value:s,dateOnly:e.allDay,disabled:u||g,allowClear:!g})}
            </div>
            <fieldset class="event-repeat" ${u?"disabled":""}>
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(t.interval||1))}" ${a?"":"disabled"} />
                </label>
              </div>
              ${a==="WEEKLY"?`<div class="event-byday" role="group" aria-label="Days of week">
                      ${i.map(x=>`<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${x.code}" ${f.has(x.code)?"checked":""} />
                              ${x.label}
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
                      ${h==="until"?Ye({field:"until",name:"repeatUntil",label:"Until",value:A,dateOnly:!0,disabled:u,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${u?"":`<button type="submit" class="btn btn-primary" ${p?"disabled":""}>${ce?"Create event":"Save event"}</button>
                     ${ce?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${p?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function ga(e,t){const a=T.find(o=>o.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:ht(),readOnly:!1,canWrite:!0}}async function Pe(e){Ie=(await q.contacts(e,Be)).contacts,G!==null&&!Ie.some(a=>a.uri===G)&&(G=null,Z||(S=null,ue=null,ye=null,we=!1))}async function Je(){const e=await q.tasks({q:ft,sort:Me,order:Ae});me=e.tasks,_e=e.calendars;const t=new Set(me.map(a=>X(a.instanceId,a.uri)));re=re.filter(a=>t.has(a)),pe!==null&&!me.some(a=>`${a.instanceId}|${a.uri}`===pe)&&(pe=null,J||(P=null))}async function st(){const e=await q.notes({q:bt,sort:Ke,order:He});et=e.notes,Ve=e.calendars,Ne!==null&&!et.some(t=>`${t.instanceId}|${t.uri}`===Ne)&&(Ne=null,le||(z=null))}function X(e,t){return`${e}|${t}`}function Ut(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Ge(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Re(e,t,a,o,l,u=""){const n=a===t,s=n?o==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${u?" "+u:""}`}" data-action="sort-${l}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(e)}${s}</th>`}async function va(e){if(I===null)return;const t=await q.getContact(I,e);G=e,Z=!1;const a=t.contact;S={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??jt(),birthday:a.birthday??null},ue=a.photoDataUri??(a.hasPhoto&&I!==null?`${q.contactPhotoUrl(I,e)}?t=${Date.now()}`:null),ye=null,we=!1,oe=!0}function $a(){Z=!0,G=null,oe=!0,S={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},ue=null,ye=null,we=!1}function jt(){return{street:"",city:"",region:"",postal:"",country:""}}function wa(e){return new Promise((t,a)=>{const o=new FileReader;o.onload=()=>{const l=String(o.result??""),u=l.indexOf(",");t(u>=0?l.slice(u+1):l)},o.onerror=()=>a(new Error("Failed to read photo file")),o.readAsDataURL(e)})}function Bt(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,o=d?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            <span class="muted">${c(d.displayname||d.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,u=!(W||ie||ae!==null||K!==null||_||oe||he)?Ue():"",n=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${c(nn)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(sn)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${o}
      <main class="container">
        ${u}
        ${e}
      </main>
      ${n}
      ${on()}
      ${ka()}`}function Ue(){return D?`<div class="flash flash-${c(D.type)}" role="status">
      <span class="flash-text">${c(D.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function _t(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Xe(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),o=t%60;return a>0?`${a}m ${o}s`:`${o}s`}function Te(){pt!==null&&(clearInterval(pt),pt=null)}function Vt(){Te(),pt=setInterval(()=>{if(!M||M.phase==="done"||M.phase==="error"){Te();return}M={...M,elapsedSec:Math.floor((Date.now()-M.startedAt)/1e3)},M.phase==="processing"&&Yt(M)},1e3)}function je(e,t={}){M&&(M={...M,phase:e,elapsedSec:Math.floor((Date.now()-M.startedAt)/1e3),...t},m())}function Ht(){Te(),M=null,m()}function Wt(e){!M||M.phase==="done"||M.phase==="error"||(M={...M,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-M.startedAt)/1e3)},Yt(M))}function Yt(e){const t=r.querySelector("[data-import-status-line]"),a=r.querySelector(".import-progress-bar"),o=r.querySelector(".import-progress-track"),l=r.querySelector("[data-import-counts]"),u=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${u} (${e.processPercent??0}%) · ${Xe(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${Xe(e.elapsedSec)}`;else return;t&&(t.textContent=n),l&&(l.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),o&&e.processPercent!==null&&(o.setAttribute("aria-valuenow",String(e.processPercent)),o.removeAttribute("aria-valuetext"))}function ka(){if(!M)return"";const e=M,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",o=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",l=(()=>{const s=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],f={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return s.map((h,g)=>{let A="pending";return e.phase==="done"||g<f?A="done":g===f&&(A=(e.phase==="error","active")),`<li class="import-step import-step-${A}"><span class="import-step-icon" aria-hidden="true">${A==="done"?"✓":A==="active"?"●":"○"}</span> ${c(h.label)}</li>`}).join("")})();let u="";if(t){let s=null;e.phase==="reading"&&e.readPercent!==null?s=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(s=Math.min(100,Math.max(0,e.processPercent)));const i=s===null?"import-progress-bar is-indeterminate":"import-progress-bar",f=s!==null?` style="width:${s}%"`:"",h=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${h} (${e.processPercent??0}%) · ${Xe(e.elapsedSec)}`:g=`Importing on server… ${Xe(e.elapsedSec)}`;const A=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';u=`
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${c(a)}</strong> from
          <span class="mono">${c(e.fileName)}</span>
          ${e.fileSizeLabel?` <span class="muted">(${c(e.fileSizeLabel)})</span>`:""}
        </p>
        <ul class="import-steps">${l}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${s!==null?`aria-valuenow="${s}"`:'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${i}"${f}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${c(g)}</p>
        ${A}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?u=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${c(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · Took ${c(Xe(e.elapsedSec))}
        </p>`:u=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${c(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · After ${c(Xe(e.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;const n=t?'<p class="muted small" style="margin:0">Please wait…</p>':'<button type="button" class="btn btn-primary" data-action="close-import-progress">Close</button>';return`
      <div class="cal-modal import-progress-modal" role="dialog" aria-modal="true"
        aria-labelledby="import-progress-title" data-import-progress>
        <div class="cal-modal-backdrop"${t?"":' data-action="close-import-progress"'}></div>
        <div class="cal-modal-card cal-modal-card-sm import-progress-card">
          <header class="cal-modal-header">
            <h3 id="import-progress-title">${c(o)}</h3>
            ${t?"":'<button type="button" class="info-modal-close" data-action="close-import-progress" aria-label="Close">×</button>'}
          </header>
          <div class="cal-modal-body">${u}</div>
          <footer class="cal-modal-footer">${n}</footer>
        </div>
      </div>`}function Jt(e,t){return new Promise((a,o)=>{const l=new FileReader;l.onprogress=u=>{u.lengthComputable&&u.total>0?t(Math.min(100,Math.round(u.loaded/u.total*100))):t(null)},l.onload=()=>a(String(l.result??"")),l.onerror=()=>o(l.error??new Error("Failed to read file")),l.readAsText(e)})}function zt(){r.innerHTML=Bt(`<div class="auth-wrap">
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
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,{auth:!0})}function Sa(){if(!d){zt();return}const e=T.filter($=>$.canShare),t=T.filter($=>!$.canShare),a=T.find($=>$.id===k)??null,o=e.map($=>{const te=$.id===k?" is-selected":"",xe=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',ct=qt($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${te}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${xe}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${ct}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${p?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${p?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),l=t.map($=>{const te=$.id===k?" is-selected":"",xe=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',ct=$.access==="readwrite"?"Shared with you · full access — select to view and edit events":"Shared with you · read-only — select to view events";return`<div class="cal-row${te}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0" title="${c(ct)}">
          ${xe}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${qt($.access)}</span>
            <span class="muted small">${$.access==="readwrite"?"Shared · full access":"Shared · read-only"}</span>
          </span>
        </div>`}).join(""),u=U.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=se.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':se.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${qt($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${p?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),f=W&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Ue()}
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
                      <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(a.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${Ce(`Share “${a.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${U.length===0?"disabled":""}>
                        <option value="">${U.length?"Select user…":"No other users"}</option>
                        ${u}
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
                      <button type="submit" class="btn btn-primary" ${p||U.length===0?"disabled":""}>Share</button>
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
                  ${Ce("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${p?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${p||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${p||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                  ${ke?`<div class="flash flash-${ke.ok?"success":"error"} import-result" role="status">
                          <strong>Import result:</strong> ${c(ke.message)}
                        </div>`:""}
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",h=ae!==null?T.find($=>$.id===ae&&$.canShare)??null:null,g=h?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Ue()}
              <p>You are about to permanently delete <strong>${c(h.displayname)}</strong>
                <span class="muted small mono">(${c(h.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-cal-confirm" data-action="toggle-delete-confirm" />
                I understand and want to permanently delete this calendar
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-cal" ${p?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-cal" data-id="${h.id}" disabled id="delete-cal-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",A=ie?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Ue()}
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
                    ${F.map($=>`<option value="${c($.code)}">${c($.name)} (${c($.code)})</option>`).join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Create calendar</button>
                  <label class="btn btn-ghost file-btn" ${p?"aria-disabled=true":""} title="Create a calendar and import a .ics file">
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${p?"disabled":""} hidden />
                  </label>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${p?"disabled":""}>Cancel</button>
                </div>
                <p class="muted small" style="margin:0.5rem 0 0">
                  <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
                </p>
              </form>
            </div>
          </div>
        </div>`:"",x=`
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${Ce("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${o||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${Ce("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${l}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${p?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${da()}
      </div>
      ${A}
      ${f}
      ${g}
      ${ya()}`,w=de.map($=>`<div class="cal-row${$.id===I?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="muted small">${$.cardCount} contact${$.cardCount===1?"":"s"}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${$.id}" ${p?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${$.id}" ${p?"disabled":""}>Delete</button>
          </span>
        </div>`).join(""),L=de.find($=>$.id===I)??null,ne=Ie.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${Be?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Ie.map($=>{const te=!Z&&$.uri===G?" is-selected":"",xe=c(($.displayname||"?").slice(0,1).toUpperCase()),ct=$.hasPhoto&&I!==null?`<img class="contact-avatar" src="${c(q.contactPhotoUrl(I,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${xe}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${xe}</span>`;return`<tr class="contact-table-row${te}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${ct}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),y=S,R=Array.isArray(y==null?void 0:y.emails)&&y.emails.length>0?y.emails:[""],N=Array.isArray(y==null?void 0:y.phones)&&y.phones.length>0?y.phones:[{type:"cell",value:""}],V=(y==null?void 0:y.address)??jt(),H=R.map(($,te)=>`<div class="multi-row" data-multi="email" data-idx="${te}">
          <input type="email" name="email_${te}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${te}" ${R.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),Q=N.map(($,te)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${te}">
          <select name="phone_type_${te}" aria-label="Phone type">
            ${["cell","work","home","other"].map(xe=>`<option value="${xe}" ${(($==null?void 0:$.type)??"other")===xe?"selected":""}>${xe}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${te}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${te}" ${N.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),fe=Array.isArray(y==null?void 0:y.custom)?y.custom:[],lt=fe.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':fe.map(($,te)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${te}">
                <input type="text" name="custom_label_${te}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${te}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${te}" title="Remove">×</button>
              </div>`).join(""),Qe=oe&&y&&L?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${Z?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Ue()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${ue?`<img src="${c(ue)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((y.fullname||y.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${p?"aria-disabled=true":""}>
                        ${ue?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${p?"disabled":""} hidden />
                      </label>
                      ${ue||y.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${p?"disabled":""}>Remove photo</button>`:""}
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${c(y.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${c(y.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${c(y.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${c(y.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${c(y.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${H}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${R.length>=10?"disabled":""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${Q}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${N.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${c(V.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${c(V.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${c(V.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${c(V.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${c(V.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${c(y.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${Ye({field:"birthday",name:"birthday",label:"Birthday",value:y.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${lt}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${fe.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(y.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${p?"disabled":""}>${Z?"Create contact":"Save contact"}</button>
                    ${!Z&&y.uri?`<button type="button" class="btn" data-action="export-contact" ${p?"disabled":""}>Export .vcf</button>`:""}
                    ${Z?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${p?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${p?"disabled":""}>Cancel</button>
                    ${!Z&&y.uri?`<span class="muted small mono">${c(y.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",gt=he&&L?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Ue()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${c(L.uri)} · ${L.cardCount} contact${L.cardCount===1?"":"s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${c(L.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${c(L.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(L.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${Ce("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${p?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${p?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${p?"disabled":""} hidden />
                      </label>
                    </div>
                    ${qe?`<div class="flash flash-${qe.ok?"success":"error"} import-result" role="status">
                            <strong>Import:</strong> ${c(qe.message)}
                          </div>`:""}
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Le=K!==null?de.find($=>$.id===K)??null:null,It=Le?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Ue()}
              <p>You are about to permanently delete <strong>${c(Le.displayname)}</strong>
                <span class="muted small mono">(${c(Le.uri)})</span>.</p>
              <p class="muted small">${(Le.cardCount??0)>0?`All ${Le.cardCount} contact${Le.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${p?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Le.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",Ot=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${Ce("Address books","address-books")}
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
                <button type="submit" class="btn btn-primary" ${p?"disabled":""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${L?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${Ce("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(Be)}" aria-label="Search contacts" ${p?"disabled":""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${p?"disabled":""}>Add contact</button>
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
                        ${ne}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${It}
      ${gt}
      ${Qe}`,vt=C==="calendars"?"my-calendars":C==="contacts"?"my-contacts":C==="tasks"?"tasks":"notes",it=Na(),At=Ta(),$t=C==="calendars"?x:C==="contacts"?Ot:C==="tasks"?it:At;r.innerHTML=Bt(`
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
            data-info="${vt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${$t}
    `),document.body.classList.toggle("cal-modal-open",W||ie||ae!==null||K!==null||_||oe||he||M!==null),document.body.classList.toggle("layout-contacts",C==="contacts"),document.body.classList.toggle("layout-calendars",C==="calendars"),document.body.classList.toggle("layout-tasks",C==="tasks"||C==="notes")}function Da(e){const t=new Map;for(const f of e)f.uid&&t.set(f.uid,f);const a=new Map(e.map((f,h)=>[X(f.instanceId,f.uri),h])),o=new Map,l=[];for(const f of e){const h=f.parentUid;if(h&&t.has(h)&&h!==f.uid){const g=o.get(h)??[];g.push(f),o.set(h,g)}else l.push(f)}const u=(f,h)=>(a.get(X(f.instanceId,f.uri))??0)-(a.get(X(h.instanceId,h.uri))??0);l.sort(u);for(const[,f]of o)f.sort(u);const n=[],s=new Set,i=(f,h)=>{const g=f.uid||X(f.instanceId,f.uri);if(!s.has(g)){s.add(g),n.push({task:f,depth:Math.min(h,8)});for(const A of o.get(f.uid)??[])i(A,h+1);s.delete(g)}};for(const f of l)i(f,0);for(const f of e)n.some(h=>h.task===f)||n.push({task:f,depth:0});return n}function Ca(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const o of me)o.parentUid&&t.has(o.parentUid)&&o.uid&&!t.has(o.uid)&&(t.add(o.uid),a=!0)}return t}function Ea(e,t){const a=e.instanceId,o=t||!e.uid?new Set:Ca(e.uid),l=me.filter(s=>s.uid&&s.instanceId===a&&!o.has(s.uid)&&s.uid!==e.uid),u=e.parentUid||"",n=['<option value="">None (top-level)</option>',...l.map(s=>`<option value="${c(s.uid)}" ${s.uid===u?"selected":""}>${c(s.summary||s.uid)}</option>`)];if(u&&!l.some(s=>s.uid===u)){const s=me.find(i=>i.uid===u);n.push(`<option value="${c(u)}" selected>${c((s==null?void 0:s.summary)||u)} (current)</option>`)}return n.join("")}function Kt(){const e=new Set(re);return me.filter(t=>e.has(X(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function Na(){const e=w=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[w]||w,t=Da(me),a=me.filter(w=>w.canWrite&&!w.readOnly).map(w=>X(w.instanceId,w.uri)),o=a.length>0&&a.every(w=>re.includes(w)),l=re.length>0,n=Kt().length,s=me.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${ft?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:w,depth:L})=>{const ne=X(w.instanceId,w.uri),y=!J&&ne===pe?" is-selected":"",R=re.includes(ne),N=w.status==="COMPLETED"?"badge-ok":w.status==="CANCELLED"?"":"badge-admin",V=L>0?` style="--task-depth:${L}"`:"",H=L>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",Q=w.canWrite&&!w.readOnly;return`<tr class="contact-table-row task-row${L>0?" is-subtask":""}${y}${R?" is-checked":""}" data-action="select-task" data-instance="${w.instanceId}" data-uri="${c(w.uri)}" tabindex="0" role="button"${V}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${w.instanceId}" data-uri="${c(w.uri)}"
                    ${R?"checked":""} ${Q?"":"disabled"} aria-label="Select ${c(w.summary||w.uri)}" ${p?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${H}<span class="contact-name-primary">${c(w.summary||w.uri)}</span></span>
                  ${w.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${N}">${c(e(w.status))}</span></td>
                <td class="col-task-due muted small">${c(Ut(w.due))}</td>
                <td class="col-task-cal muted small">${c(w.calendarName)}</td>
                <td class="col-task-pct muted small">${w.percent?c(String(w.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,f=(w,L)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${w}"
        title="${c(L)}" aria-label="${c(L)}" ${p||n===0?"disabled":""}>${i}</button>`,h=l?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${re.length!==n?`<span class="muted small bulk-bar-count-extra">(${re.length-n} read-only skipped)</span>`:""}
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${p||n===0?"disabled":""}>
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
                ${Ye({field:"bulk-due",name:"bulkDue",label:"Due",value:mt,dateOnly:!1,disabled:p||n===0,allowClear:!0})}
                ${f("bulk-task-due","Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${p||n===0?"disabled":""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${p||n===0?"disabled":""} />
                </label>
                ${f("bulk-task-percent","Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${p||n===0?"disabled":""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${p?"disabled":""}>Clear selection</button>
            </div>
          </div>`:"",g=P,A=_e.map(w=>`<option value="${w.id}" ${g&&g.instanceId===w.id?"selected":""}>${c(w.displayname)}</option>`).join(""),x=g?`<div class="card">
            ${Ce(J?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${J?`<label>Calendar
                      <select name="instanceId" required ${_e.length===0?"disabled":""}>
                        <option value="">${_e.length?"Select calendar…":"No writable calendars"}</option>
                        ${A}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(g.summary)}" ${g.readOnly&&!J?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!J?"readonly":""}>${c(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!J?"disabled":""}>
                  ${Ea(g,J)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!J?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(w=>`<option value="${w}" ${g.status===w?"selected":""}>${c(e(w))}</option>`).join("")}
                  </select>
                </label>
                ${Ye({field:"due",name:"due",label:"Due",value:Ge(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!J),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${c(String(g.priority||0))}" ${g.readOnly&&!J?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${c(String(g.percent||0))}" ${g.readOnly&&!J?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${J||g.canWrite?`<button type="submit" class="btn btn-primary" ${p?"disabled":""}>${J?"Create task":"Save task"}</button>`:""}
                ${!J&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${p?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${p?"disabled":""}>Delete</button>`:J?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Ce("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(ft)}" aria-label="Search tasks" ${p?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${p||_e.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${_e.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${o?"checked":""} ${a.length===0||p?"disabled":""} />
                </th>
                ${Re("Title","summary",Me,Ae,"task","col-task-title")}
                ${Re("Status","status",Me,Ae,"task","col-task-status")}
                ${Re("Due","due",Me,Ae,"task","col-task-due")}
                ${Re("Calendar","calendar",Me,Ae,"task","col-task-cal")}
                ${Re("%","percent",Me,Ae,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${x}
      </section>
    </div>`}function Ta(){const e=et.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${bt?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:et.map(l=>{const u=X(l.instanceId,l.uri),n=!le&&u===Ne?" is-selected":"",s=(l.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${l.instanceId}" data-uri="${c(l.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(l.summary||l.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${c(s)}${l.description.length>80?"…":""}</span>`:""}
                  ${l.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(Ut(l.dtstart))}</td>
                <td class="col-note-cal muted small">${c(l.calendarName)}</td>
              </tr>`}).join(""),t=z,a=Ve.map(l=>`<option value="${l.id}" ${t&&t.instanceId===l.id?"selected":""}>${c(l.displayname)}</option>`).join(""),o=t?`<div class="card">
            ${Ce(le?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${le?`<label>Calendar
                      <select name="instanceId" required ${Ve.length===0?"disabled":""}>
                        <option value="">${Ve.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${t.readOnly&&!le?"readonly":""} />
              </label>
              ${Ye({field:"dtstart",name:"dtstart",label:"Date",value:Ge(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!le),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!le?"readonly":""}>${c(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${le||t.canWrite?`<button type="submit" class="btn btn-primary" ${p?"disabled":""}>${le?"Create note":"Save note"}</button>`:""}
                ${!le&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${p?"disabled":""}>Delete</button>`:le?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Ce("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(bt)}" aria-label="Search notes" ${p?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${p||Ve.length===0?"disabled":""}>Add note</button>
        </div>
        ${Ve.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Re("Title","summary",Ke,He,"note","col-note-title")}
                ${Re("Date","dtstart",Ke,He,"note","col-note-date")}
                ${Re("Calendar","calendar",Ke,He,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${o}
      </section>
    </div>`}function xa(){const e=r.querySelector(".contacts-table-wrap"),t=r.querySelector(".contacts-ab-list"),a=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function Ia(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=r.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=r.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=r.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function m(){const e=xa();d?Sa():zt(),Oa(),Ia(e),requestAnimationFrame(()=>{var t;ba(),(t=r.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Gt(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let o=a.value.trim();o&&!o.startsWith("#")&&(o=`#${o}`),/^#[0-9A-Fa-f]{6}/.test(o)&&(t.value=o.slice(0,7),a.value=o.toUpperCase())}))}function Oa(){r.querySelectorAll("[data-action]").forEach(y=>{y.addEventListener("click",R=>{const N=R.target.closest("[data-action]");((N==null?void 0:N.dataset.action)==="info"||(N==null?void 0:N.dataset.action)==="info-close")&&(R.preventDefault(),R.stopPropagation()),_a(R)})}),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(y=>{y.addEventListener("keydown",R=>{(R.key==="Enter"||R.key===" ")&&(R.preventDefault(),y.click())})});const e=r.querySelector("#delete-cal-confirm"),t=r.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||p)});const a=r.querySelector("#delete-ab-confirm"),o=r.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{o&&(o.disabled=!a.checked||p)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(y=>{y.addEventListener("error",()=>{const R=y.dataset.avatarFallback||"?",N=document.createElement("span");N.className="contact-avatar contact-avatar-fallback",N.setAttribute("aria-hidden","true"),N.textContent=R,y.replaceWith(N)})}),Mt||(document.addEventListener("keydown",y=>{if(y.key==="Escape"){if(M&&(M.phase==="done"||M.phase==="error")){Ht();return}M||Xt()}}),Mt=!0);const l=r.querySelector('[data-form="login"]');l==null||l.addEventListener("submit",y=>{y.preventDefault(),Pa(l)});const u=r.querySelector('[data-form="share"]');u==null||u.addEventListener("submit",y=>{y.preventDefault(),Ra(u)});const n=r.querySelector('[data-form="edit-cal"]');n&&(Gt(n),n.addEventListener("submit",y=>{y.preventDefault(),ja(n)}));const s=r.querySelector('[data-form="edit-event"]');s==null||s.addEventListener("submit",y=>{y.preventDefault(),Ua(s)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(y=>{y.addEventListener("change",()=>{if(!b)return;const R=r.querySelector('[data-form="edit-event"]');if(!R)return;const N=new FormData(R),V=R.querySelector('input[name="allDay"]'),H=ot(N);H.endMode==="until"&&!H.until&&(H.until=We(String(N.get("start")??b.start??""))||ee(new Date)),b={...b,summary:String(N.get("summary")??b.summary),description:String(N.get("description")??b.description),location:String(N.get("location")??b.location),instanceId:Number(N.get("instanceId"))||b.instanceId,allDay:(V==null?void 0:V.checked)??b.allDay,start:String(N.get("start")??b.start??""),end:String(N.get("end")??b.end??"")||null,repeat:H,hasRrule:!!String(N.get("repeatFreq")??"").trim()},H.freq&&H.endMode==="until"&&(E==null?void 0:E.field)==="end"&&(E=null),m(),H.endMode==="until"&&requestAnimationFrame(()=>{var fe;const Q=r.querySelector('input[name="repeatUntil"]');Q==null||Q.focus();try{(fe=Q==null?void 0:Q.showPicker)==null||fe.call(Q)}catch{}})})});const i=r.querySelector('[data-form="create-cal"]');i&&(Gt(i),i.addEventListener("submit",y=>{y.preventDefault(),Ba(i)}));const f=r.querySelector('[data-form="create-ab"]');f==null||f.addEventListener("submit",y=>{y.preventDefault(),Ja(f)});const h=r.querySelector('[data-form="edit-ab"]');h==null||h.addEventListener("submit",y=>{y.preventDefault(),za(h)});const g=r.querySelector('[data-form="contact"]');g==null||g.addEventListener("submit",y=>{y.preventDefault(),Ya(g)});const A=r.querySelector('[data-form="task"]');if(A==null||A.addEventListener("submit",y=>{y.preventDefault(),La(A)}),A){const y=A.querySelector('select[name="instanceId"]');y==null||y.addEventListener("change",()=>{if(!J||!P)return;const R=Number(y.value);if(!Number.isFinite(R)||R<=0)return;const N=new FormData(A),V=String(N.get("due")??"").trim();P={...P,instanceId:R,parentUid:P.parentUid&&me.some(H=>H.uid===P.parentUid&&H.instanceId===R)?P.parentUid:null,summary:String(N.get("summary")??""),description:String(N.get("description")??""),status:String(N.get("status")??"NEEDS-ACTION"),due:V?new Date(V).toISOString():null,priority:Number(N.get("priority")??0),percent:Number(N.get("percent")??0)},m()})}const x=r.querySelector('[data-form="note"]');x==null||x.addEventListener("submit",y=>{y.preventDefault(),qa(x)});const w=r.querySelector('input[data-action="contact-search"]');w==null||w.addEventListener("input",()=>{Oe&&clearTimeout(Oe),Oe=setTimeout(()=>{Be=w.value,I!==null&&(async()=>{try{await Pe(I),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)});const L=r.querySelector('input[data-action="task-search"]');L==null||L.addEventListener("input",()=>{Oe&&clearTimeout(Oe),Oe=setTimeout(()=>{ft=L.value,(async()=>{try{await Je(),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)});const ne=r.querySelector('input[data-action="note-search"]');ne==null||ne.addEventListener("input",()=>{Oe&&clearTimeout(Oe),Oe=setTimeout(()=>{bt=ne.value,(async()=>{try{await st(),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)}),Va(),Fa(),Ma()}async function Aa(e){var l,u;const t=Kt();if(t.length===0){v("error","No writable tasks selected"),m();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;p=!0,O(),m();try{const n=await q.bulkTasks({op:"delete",items:a});re=[],pe&&t.some(s=>X(s.instanceId,s.uri)===pe)&&(pe=null,P=null,J=!1),await Je(),n.failed>0?v("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk delete failed")}finally{p=!1,m()}return}let o={};if(e==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((l=n==null?void 0:n.value)==null?void 0:l.trim())??"";if(!s){v("error","Choose a status to apply"),m();return}o={status:s}}else if(e==="bulk-task-due"){const n=mt.trim();if(!n){v("error","Choose a due date to apply"),m();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){v("error","Invalid due date"),m();return}o={due:s.toISOString()}}else if(e==="bulk-task-clear-due")o={due:null};else if(e==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((u=n==null?void 0:n.value)==null?void 0:u.trim())??"";if(s===""){v("error","Enter a percent complete (0–100)"),m();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){v("error","Percent must be between 0 and 100"),m();return}o={percent:Math.round(i)}}p=!0,O(),m();try{const n=await q.bulkTasks({op:"update",items:a,fields:o});if(await Je(),P&&!J){const i=X(P.instanceId,P.uri),f=me.find(h=>X(h.instanceId,h.uri)===i);f&&(P={...f})}const s=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?v("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk update failed")}finally{p=!1,m()}}async function La(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("status")??"NEEDS-ACTION"),u=String(t.get("due")??"").trim(),n=u?new Date(u).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),f=String(t.get("parentUid")??"").trim(),h=f===""?null:f;p=!0,O(),m();try{if(J){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const A=await q.createTask({instanceId:g,summary:a,description:o,status:l,due:n,priority:s,percent:i,parentUid:h});J=!1,pe=X(A.task.instanceId,A.task.uri),P=A.task,v("success",h?"Subtask created":"Task created")}else if(P){const g=await q.updateTask(P.instanceId,P.uri,{summary:a,description:o,status:l,due:n,priority:s,percent:i,parentUid:h});P=g.task,pe=X(g.task.instanceId,g.task.uri),v("success","Task saved")}await Je()}catch(g){v("error",g instanceof Error?g.message:"Save failed")}finally{p=!1,m()}}async function qa(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("dtstart")??"").trim(),u=l?new Date(l).toISOString():null;p=!0,O(),m();try{if(le){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await q.createNote({instanceId:n,summary:a,description:o,dtstart:u});le=!1,Ne=X(s.note.instanceId,s.note.uri),z=s.note,v("success","Note created")}else if(z){const n=await q.updateNote(z.instanceId,z.uri,{summary:a,description:o,dtstart:u});z=n.note,Ne=X(n.note.instanceId,n.note.uri),v("success","Note saved")}await st()}catch(n){v("error",n instanceof Error?n.message:"Save failed")}finally{p=!1,m()}}function Ma(){const e=r.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){v("error","Photo is too large (max ~2 MB)"),m();return}try{const o=await wa(t);ye=o,ue=`data:${t.type||"image/jpeg"};base64,${o}`,we=!1,m()}catch(o){v("error",o instanceof Error?o.message:"Failed to read photo"),m()}}})()})}function Fa(){const e=r.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),o=e.querySelector('input[name="displayname"]'),l=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const u=()=>{const n=t.checked;a.hidden=!n,o&&(o.required=!n,n&&!o.value.trim()?o.placeholder="Auto: Holidays (XX)":n||(o.placeholder="Work")),n&&l&&(l.checked=!0)};t.addEventListener("change",u),u()}async function Pa(e){const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("password")??"");p=!0,O(),m(),B.event("login.attempt",{username:a});try{const l=await q.login(a,o);d=l.user,Dt(l.ui),B.event("login.ok",{username:(d==null?void 0:d.username)??a}),await ge(),v("success","Signed in")}catch(l){B.warn("login.failed",l instanceof Error?l.message:l),v("error",l instanceof Error?l.message:"Login failed")}finally{p=!1,m()}}async function Ra(e){if(k===null)return;const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("access")??"read");W=!0,p=!0,O(),m();try{await q.share(k,a,o),await tt(k),v("success",`Shared with ${a}`)}catch(l){v("error",l instanceof Error?l.message:"Share failed")}finally{p=!1,m()}}function rt(e){if(!b)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');b={...b,summary:String(t.get("summary")??b.summary),description:String(t.get("description")??b.description),location:String(t.get("location")??b.location),instanceId:Number(t.get("instanceId"))||b.instanceId,allDay:(a==null?void 0:a.checked)??b.allDay,start:String(t.get("start")??b.start??""),end:String(t.get("end")??b.end??"")||null,repeat:ot(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function ot(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),o=String(e.get("repeatEndMode")??"never"),l=o==="until"||o==="count"?o:"never";let u=null,n=null;if(l==="until"){const i=String(e.get("repeatUntil")??"").trim();u=i?i.slice(0,10):null}else if(l==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:u,count:n,byDay:s,endMode:l}}async function Ua(e){if(!b||!b.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("location")??"").trim(),u=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||b.instanceId,f=ot(t);if(!a){v("error","Title is required"),m();return}if(!n){v("error","Start is required"),m();return}let h,g;if(u)h=n.slice(0,10),g=s?s.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const L=Et(n,s||null);h=new Date(L.start).toISOString(),g=L.end?new Date(L.end).toISOString():null}else h=new Date(n).toISOString(),g=s?new Date(s).toISOString():null;const A=b.instanceId,x=b.uri,w=ce;p=!0,O(),_=!0,m(),B.event(w?"event.create":"event.update",{instanceId:i,uri:w?null:x,allDay:u,summary:a});try{const L={summary:a,description:o,location:l,allDay:u,start:h,end:g,instanceId:i,repeat:f},ne=w?await q.createEvent(i,L):await q.updateEvent(A,x,L);(k===null||ne.event.instanceId!==k)&&(k=ne.event.instanceId),await Se(),_=!1,b=null,ce=!1,E=null,B.event(w?"event.created":"event.saved",{uri:ne.event.uri,instanceId:ne.event.instanceId}),v("success",w?"Event created":"Event saved")}catch(L){B.warn("event.save failed",L instanceof Error?L.message:L),v("error",L instanceof Error?L.message:"Save failed")}finally{p=!1,m()}}async function ja(e){if(k===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim();p=!0,O(),m();try{const u=await q.updateCalendar(k,{displayname:a,description:o,color:l});W=!0,await ge(),k=u.calendar.id,await tt(k),await Se(),v("success","Calendar updated")}catch(u){v("error",u instanceof Error?u.message:"Update failed")}finally{p=!1,m()}}async function Ba(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim(),u=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if(ie=!0,u&&!n){v("error","Select a country for the holidays calendar"),m();return}if(!u&&!a){v("error","Display name is required"),m();return}p=!0,O(),ke=null,m();try{const i=await q.createCalendar({displayname:a,description:o,color:l,holidays:u,holidayCountry:u?n:void 0,readOnly:s});k=i.calendar.id,ie=!1,await ge();let f=`Created “${i.calendar.displayname}”`;const h=i.holidayImport??i.calendar.holidayImport;h&&(f+=`. Holidays imported: ${kt(h)}.`,ke={ok:!0,message:kt(h)}),s&&(f+=" Calendar is read-only."),v("success",f)}catch(i){ie=!0,v("error",i instanceof Error?i.message:"Create failed")}finally{p=!1,m()}}async function _a(e){var o,l,u;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&B.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){M&&(M.phase==="done"||M.phase==="error")&&Ht();return}if(a==="logout"){p=!0,B.event("logout");try{await q.logout()}catch{}d=null,Te(),M=null,T=[],se=[],k=null,de=[],I=null,Ie=[],G=null,S=null,Z=!1,oe=!1,he=!1,ie=!1,O(),p=!1,m();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;k=n,ke=null,p=!0,O(),m();try{await Se()}catch(s){v("error",s instanceof Error?s.message:"Failed to load calendar")}finally{p=!1,m()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;k=n,W=!0,ae=null,ke=null,p=!0,O(),m();try{await tt(n),await Se()}catch(i){v("error",i instanceof Error?i.message:"Failed to open calendar")}finally{p=!1,m()}return}if(a==="close-cal-modal"){W=!1,m();return}if(a==="open-create-cal-modal"){ie=!0,W=!1,ae=null,O(),m();return}if(a==="close-create-cal-modal"){ie=!1,O(),m();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!T.find(i=>i.id===n&&i.canShare))return;ae=n,W=!1,O(),m();return}if(a==="cancel-delete-cal"){ae=null,m();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;p=!0,O(),m();try{if(await q.deleteCalendar(n),k===n&&(k=null),ae=null,W=!1,se=[],Ee=[],await ge(),k===null){const i=Ft();i&&(k=i.id,await Se())}v("success","Calendar deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{p=!1,m()}return}if(a==="month-today"){const n=new Date;$e={y:n.getFullYear(),m:n.getMonth()},Ze=null,p=!0,m();try{await Se()}finally{p=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,s=new Date($e.y,$e.m+n,1);$e={y:s.getFullYear(),m:s.getMonth()},Ze=null,p=!0,m();try{await Se()}finally{p=!1,m()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;p=!0,O(),m();try{const i=await q.getEvent(n,s);b={...i.event,repeat:i.event.repeat??ht()},ce=!1,_=!0,E=null,W=!1,ae=null}catch(i){v("error",i instanceof Error?i.message:"Failed to open event")}finally{p=!1,m()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";Ze=Ze===n?null:n,m();return}if(a==="new-event-day"){const n=e.target;if((o=n==null?void 0:n.closest)!=null&&o.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(k===null){v("error","Select a calendar first"),m();return}const i=T.find(f=>f.id===k);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){v("error","This calendar is read-only"),m();return}ce=!0,b=ga(s,k),_=!0,E=null,W=!1,ae=null,O(),m();return}if(a==="close-event-modal"){_=!1,b=null,ce=!1,E=null,O(),m();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&b&&rt(s),(E==null?void 0:E.field)===n)E=null;else{const i=t.dataset.dtDateOnly==="1",f=t.dataset.dtClear!=="0",h=t.dataset.dtName||n;let g=xt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=nt().start);const A=at(g||ee(new Date)),[x,w]=A.date.split("-").map(Number);E={field:n,viewY:x,viewM:(w||1)-1,dateOnly:i,allowClear:f,name:h}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!E)return;const n=a==="dt-month-prev"?-1:1,s=new Date(E.viewY,E.viewM+n,1);E={...E,viewY:s.getFullYear(),viewM:s.getMonth()},m();return}if(a==="dt-pick-day"){if(!E)return;const n=E.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&b&&rt(i);const f=E.dateOnly;if(f)De(n,s),E=null;else{const h=xt(n),g=at(h||nt(s).start).hm;De(n,`${s}T${g}`),E={...E,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&b&&!f&&b.end){const h=new Date(String(b.start)),g=new Date(String(b.end));!Number.isNaN(h.getTime())&&!Number.isNaN(g.getTime())&&g<=h&&De("end",Fe(new Date(h.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!E||E.dateOnly)return;const n=E.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&b&&rt(i);const f=xt(n)||nt().start,g=`${at(f).date}T${s}`;if(De(n,g),n==="start"&&b){b={...b,allDay:!1};const A=b.end?at(String(b.end)):null,x=new Date(g);(!A||new Date(`${A.date}T${A.hm}`)<=x)&&De("end",Fe(new Date(x.getTime()+3600*1e3)))}E=null,m();return}if(a==="dt-today"){if(!E)return;const n=E.field,s=r.querySelector('[data-form="edit-event"]');s&&b&&rt(s);const i=ee(new Date);if(E.dateOnly)De(n,i);else{const f=nt(i);n==="start"?(De("start",f.start),b&&!b.end&&De("end",f.end)):n==="end"?De("end",f.end):De(n,f.start)}E=null,m();return}if(a==="dt-clear"){if(!E||!E.allowClear)return;const n=E.field,s=r.querySelector('[data-form="edit-event"]');s&&b&&rt(s),De(n,null),E=null,m();return}if(a==="event-allday-toggle"){if(!b)return;const n=r.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),f=String(i.get("start")??b.start??""),h=String(i.get("end")??b.end??"")||null;let g=f,A=h;if(s){const x=la(f,h);g=x.start,A=x.end}else{const x=f.slice(0,10),w=(h||f).slice(0,10),L=Et(x,w);g=L.start,A=L.end}b={...b,summary:String(i.get("summary")??b.summary),description:String(i.get("description")??b.description),location:String(i.get("location")??b.location),instanceId:Number(i.get("instanceId"))||b.instanceId,allDay:s,start:g,end:A,repeat:ot(i)}}else b={...b,allDay:s};E=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!b)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),f=ot(s);b={...b,summary:String(s.get("summary")??b.summary),description:String(s.get("description")??b.description),location:String(s.get("location")??b.location),instanceId:Number(s.get("instanceId"))||b.instanceId,allDay:(i==null?void 0:i.checked)??b.allDay,start:String(s.get("start")??b.start??""),end:String(s.get("end")??b.end??"")||null,repeat:f,hasRrule:!!String(s.get("repeatFreq")??"").trim()},f.freq&&f.endMode==="until"&&(E==null?void 0:E.field)==="end"&&(E=null),m();return}if(a==="delete-event"){if(!b||!b.canWrite||ce||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=b.instanceId,s=b.uri;p=!0,O(),m();try{await q.deleteEvent(n,s),_=!1,b=null,await Se(),v("success","Event deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{p=!1,m()}return}if(a==="info"){const n=t.dataset.info??"";Ka(n);return}if(a==="info-close"){Xt();return}if(a==="flash-close"){O(),m();return}if(a==="tab"){const n=t.dataset.tab;if(n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"){C=n,B.event("tab",{tab:n}),n!=="calendars"&&(W=!1,ae=null),n!=="contacts"&&(K=null),O(),p=!0,m();try{n==="contacts"&&I!==null?await Pe(I):n==="calendars"?await Se():n==="tasks"?await Je():n==="notes"&&await st()}catch(s){B.warn("tab load failed",s instanceof Error?s.message:s),v("error",s instanceof Error?s.message:"Failed to load")}finally{p=!1,m()}}return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){Me===n?Ae=Ae==="asc"?"desc":"asc":(Me=n,Ae=n==="due"||n==="summary"?"asc":"desc"),p=!0,m();try{await Je()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{p=!1,m()}}else{Ke===n?He=He==="asc"?"desc":"asc":(Ke=n,He="asc"),p=!0,m();try{await st()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{p=!1,m()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=me.find(f=>f.instanceId===n&&f.uri===s)??null;J=!1,pe=X(n,s),P=i?{...i}:null,O(),m();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=X(n,s),f=me.find(h=>X(h.instanceId,h.uri)===i);if(!f||!f.canWrite||f.readOnly)return;re.includes(i)?re=re.filter(h=>h!==i):re=[...re,i],m();return}if(a==="task-select-all"){e.preventDefault();const n=me.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>re.includes(X(i.instanceId,i.uri)))?re=[]:re=n.map(i=>X(i.instanceId,i.uri)),m();return}if(a==="bulk-task-clear"){re=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Aa(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=et.find(f=>f.instanceId===n&&f.uri===s)??null;le=!1,Ne=X(n,s),z=i?{...i}:null,O(),m();return}if(a==="new-task"){J=!0,pe=null,P={uri:"",instanceId:((l=_e[0])==null?void 0:l.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},O(),m();return}if(a==="new-subtask"){if(!P||J||!P.uid||!P.canWrite)return;const n=P;J=!0,pe=null,P={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},O(),m();return}if(a==="new-note"){le=!0,Ne=null,z={uri:"",instanceId:((u=Ve[0])==null?void 0:u.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},O(),m();return}if(a==="cancel-task"){J=!1,P=null,pe=null,m();return}if(a==="cancel-note"){le=!1,z=null,Ne=null,m();return}if(a==="delete-task"){if(!P||J||!confirm("Delete this task? CalDAV clients will sync the removal."))return;p=!0,O(),m();try{await q.deleteTask(P.instanceId,P.uri),pe=null,P=null,await Je(),v("success","Task deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{p=!1,m()}return}if(a==="delete-note"){if(!z||le||!confirm("Delete this note? CalDAV clients will sync the removal."))return;p=!0,O(),m();try{await q.deleteNote(z.instanceId,z.uri),Ne=null,z=null,await st(),v("success","Note deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{p=!1,m()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;I=n,he=!1,qe=null,G=null,S=null,Z=!1,oe=!1,Be="",Ie=[],ue=null,ye=null,we=!1,O(),p=!0,m();try{await Pe(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contacts")}finally{p=!1,m()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!de.find(f=>f.id===n))return;const i=I!==n;I=n,he=!0,oe=!1,qe=null,O(),i&&(G=null,S=null,Z=!1,Be="",Ie=[],ue=null,ye=null,we=!1),p=!0,m();try{i&&await Pe(n)}catch(f){v("error",f instanceof Error?f.message:"Failed to open address book")}finally{p=!1,m()}return}if(a==="close-ab-modal"){he=!1,m();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;O();try{await va(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(I===null)return;$a(),O(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){Z=!1,oe=!1,S=null,G=null,ue=null,ye=null,we=!1,E=null,O(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!S)return;yt(),Array.isArray(S.emails)||(S.emails=[""]),Array.isArray(S.phones)||(S.phones=[{type:"cell",value:""}]),Array.isArray(S.custom)||(S.custom=[]),a==="add-email"?S.emails.length<10&&S.emails.push(""):a==="add-phone"?S.phones.length<10&&S.phones.push({type:"other",value:""}):S.custom.length<30&&S.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!S)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(S.emails)?S.emails:[""];S.emails=s.filter((i,f)=>f!==n),S.emails.length===0&&(S.emails=[""]),m();return}if(a==="remove-phone"){if(!S)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(S.phones)?S.phones:[{type:"cell",value:""}];S.phones=s.filter((i,f)=>f!==n),S.phones.length===0&&(S.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!S)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;S.custom=(Array.isArray(S.custom)?S.custom:[]).filter((s,i)=>i!==n),m();return}if(a==="remove-photo"){ue=null,ye=null,we=!0,S&&(S.hasPhoto=!1),m();return}if(a==="delete-contact"){if(I===null||!G||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;p=!0,O(),oe=!0,m();try{await q.deleteContact(I,G),G=null,S=null,Z=!1,oe=!1,E=null,ue=null,await ge(),v("success","Contact deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{p=!1,m()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??I);if(!Number.isFinite(n)||!de.find(i=>i.id===n))return;K=n,he=!1,oe=!1,O(),m();return}if(a==="cancel-delete-ab"){K=null,m();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=de.find(h=>h.id===n);if(!i)return;const f=(i.cardCount??0)>0;p=!0,O(),m();try{await q.deleteAddressBook(n,f),I===n&&(I=null,Ie=[],S=null,G=null,Z=!1),K=null,he=!1,oe=!1,await ge(),I===null&&de.length>0&&(I=de[0].id,await Pe(I)),v("success","Address book deleted")}catch(h){v("error",h instanceof Error?h.message:"Delete failed")}finally{p=!1,m()}return}if(a==="export-ab"){if(I===null)return;he=!0,p=!0,O(),m();try{const{blob:n,filename:s}=await q.exportAddressBook(I),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{p=!1,m()}return}if(a==="export-contact"){if(I===null||!G||Z)return;oe=!0,p=!0,O(),m();try{const{blob:n,filename:s}=await q.exportContact(I,G),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{p=!1,m()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||k===null||!confirm("Revoke access for this user?"))return;W=!0,p=!0,O(),m();try{await q.revoke(k,n),await tt(k),v("success","Share revoked")}catch(s){v("error",s instanceof Error?s.message:"Revoke failed")}finally{p=!1,m()}return}if(a==="export-cal"){if(k===null)return;W=!0,p=!0,O(),m();try{const{blob:n,filename:s}=await q.exportCalendar(k),i=URL.createObjectURL(n),f=document.createElement("a");f.href=i,f.download=s,f.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{p=!1,m()}}}function Va(){const e=r.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Ga(e)});const t=r.querySelector('input[data-action="import-create-cal"]');t&&t.addEventListener("change",()=>{Xa(t)});const a=r.querySelector('input[data-action="import-ab"]');a&&a.addEventListener("change",()=>{Ha(a)})}async function Ha(e){var o;if(I===null)return;const t=(o=e.files)==null?void 0:o[0];if(e.value="",!t)return;const a=I;he=!0,p=!0,O(),qe=null,Te(),M={kind:"contacts",fileName:t.name,fileSizeLabel:_t(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Vt(),m();try{const l=await Jt(t,s=>{if(!M||M.phase!=="reading")return;M={...M,readPercent:s};const i=r.querySelector(".import-progress-bar"),f=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),f&&s!==null&&(f.textContent=`Reading file… ${s}%`)});je("uploading",{readPercent:100}),je("processing",{processPercent:0}),B.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const u=await q.importAddressBook(a,l,s=>{Wt(s)}),n=kt(u);qe={ok:!0,message:n},await ge(),I===a&&await Pe(a),Te(),je("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),v("success",`Import finished for “${t.name}”: ${n}.`)}catch(l){const u=l instanceof Error?l.message:"Import failed";qe={ok:!1,message:u},Te(),je("error",{ok:!1,resultMessage:u}),v("error",u)}finally{p=!1,m()}}function yt(){if(!S)return;const e=r.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);S.firstname=String(t.get("firstname")??""),S.lastname=String(t.get("lastname")??""),S.fullname=String(t.get("fullname")??""),S.org=String(t.get("org")??""),S.title=String(t.get("title")??""),S.url=String(t.get("url")??""),S.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();S.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,S.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const o=[];let l=0;for(;t.has(`email_${l}`);)o.push(String(t.get(`email_${l}`)??"")),l++;o.length&&(S.emails=o);const u=[];for(l=0;t.has(`phone_value_${l}`);)u.push({type:String(t.get(`phone_type_${l}`)??"other"),value:String(t.get(`phone_value_${l}`)??"")}),l++;u.length&&(S.phones=u);const n=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);)n.push({label:String(t.get(`custom_label_${l}`)??""),value:String(t.get(`custom_value_${l}`)??"")}),l++;S.custom=n}function Wa(e){const t=new FormData(e),a=[];let o=0;for(;t.has(`email_${o}`);){const s=String(t.get(`email_${o}`)??"").trim();s&&a.push(s),o++}const l=[];for(o=0;t.has(`phone_value_${o}`);){const s=String(t.get(`phone_value_${o}`)??"").trim();s&&l.push({type:String(t.get(`phone_type_${o}`)??"other"),value:s}),o++}const u=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);){const s=String(t.get(`custom_label_${o}`)??"").trim(),i=String(t.get(`custom_value_${o}`)??"").trim();(s||i)&&u.push({label:s,value:i}),o++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:l,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:u};return we?n.removePhoto=!0:ye&&(n.photoBase64=ye),n}async function Ya(e){if(I===null)return;const t=Wa(e);p=!0,O(),oe=!0,m();try{if(Z){const a=await q.createContact(I,t);Z=!1,G=a.contact.uri,S=null,oe=!1,ue=null,ye=null,we=!1,E=null,v("success","Contact created")}else G&&(G=(await q.updateContact(I,G,t)).contact.uri,S=null,oe=!1,ue=null,ye=null,we=!1,E=null,v("success","Contact saved"));try{await ge()}catch(a){if(console.error(a),I!==null)try{await Pe(I)}catch{}}}catch(a){v("error",a instanceof Error?a.message:"Save failed")}finally{p=!1,m()}}async function Ja(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();if(a){p=!0,O(),m();try{const l=await q.createAddressBook({displayname:a,description:o});I=l.addressbook.id,G=null,S=null,Z=!1,Be="",await ge(),v("success",`Address book “${l.addressbook.displayname}” created`)}catch(l){v("error",l instanceof Error?l.message:"Create failed")}finally{p=!1,m()}}}async function za(e){if(I===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();he=!0,p=!0,O(),m();try{await q.updateAddressBook(I,{displayname:a,description:o}),await ge(),v("success","Address book updated")}catch(l){v("error",l instanceof Error?l.message:"Update failed")}finally{p=!1,m()}}function Ka(e){const t=rn[e];if(!t)return;const a=r.querySelector("#info-modal"),o=r.querySelector("#info-modal-title"),l=r.querySelector("#info-modal-body");if(!a||!o||!l)return;o.textContent=t.title,l.innerHTML=t.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const u=a.querySelector(".info-modal-close");u==null||u.focus()}function Xt(){const e=r.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ga(e){var a;if(k===null)return;const t=(a=e.files)==null?void 0:a[0];e.value="",t&&(W=!0,await Qt(k,t,{keepEditModalOpen:!0}))}async function Xa(e){var f;const t=(f=e.files)==null?void 0:f[0];if(e.value="",!t)return;const a=r.querySelector('[data-form="create-cal"]'),o=a?new FormData(a):new FormData,l=o.get("holidays")==="on",u=o.get("readOnly")==="on";if(l){v("error","Turn off “Holidays calendar” to import a .ics file into a new calendar."),ie=!0,m();return}if(u){v("error","Turn off “Read-only” before importing — import cannot write to a read-only calendar."),ie=!0,m();return}let n=String(o.get("displayname")??"").trim();n||(n=t.name.replace(/\.ics$/i,"").trim()||"Imported calendar");const s=String(o.get("description")??""),i=String(o.get("color")??"").trim();p=!0,O(),ke=null,ie=!0,m();try{const h=await q.createCalendar({displayname:n,description:s,color:i,readOnly:!1});k=h.calendar.id,ie=!1,await ge(),v("success",`Created “${h.calendar.displayname}” — importing…`),await Qt(h.calendar.id,t,{keepEditModalOpen:!1,successPrefix:`Calendar “${h.calendar.displayname}” created. `})}catch(h){const g=h instanceof Error?h.message:"Create or import failed";ie=!0,v("error",g),p=!1,m()}}async function Qt(e,t,a={}){p=!0,O(),ke=null,Te(),M={kind:"calendar",fileName:t.name,fileSizeLabel:_t(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Vt(),m();try{const o=await Jt(t,n=>{if(!M||M.phase!=="reading")return;M={...M,readPercent:n};const s=r.querySelector(".import-progress-bar"),i=r.querySelector("[data-import-status-line]");s&&n!==null&&(s.classList.remove("is-indeterminate"),s.style.width=`${n}%`),i&&n!==null&&(i.textContent=`Reading file… ${n}%`)});je("uploading",{readPercent:100}),je("processing",{processPercent:0}),B.event("import.calendar.start",{file:t.name,bytes:t.size,calId:e});const l=await q.importCalendar(e,o,n=>{Wt(n)}),u=kt(l);ke={ok:!0,message:u},k===e&&await Se(),Te(),je("done",{ok:!0,resultMessage:`${u} (from “${t.name}”)`}),v("success",`${a.successPrefix||""}Import finished for “${t.name}”: ${u}.`)}catch(o){const l=o instanceof Error?o.message:"Import failed";ke={ok:!1,message:l},Te(),je("error",{ok:!1,resultMessage:l}),v("error",l)}finally{a.keepEditModalOpen&&(W=!0),p=!1,m()}}sa()}const na=document.getElementById("app");if(!na)throw new Error("#app missing");ln(na);
