var Xa=Object.defineProperty;var Ga=(r,u,S)=>u in r?Xa(r,u,{enumerable:!0,configurable:!0,writable:!0,value:S}):r[u]=S;var Qt=(r,u,S)=>Ga(r,typeof u!="symbol"?u+"":u,S);(function(){const u=document.createElement("link").relList;if(u&&u.supports&&u.supports("modulepreload"))return;for(const x of document.querySelectorAll('link[rel="modulepreload"]'))C(x);new MutationObserver(x=>{for(const M of x)if(M.type==="childList")for(const V of M.addedNodes)V.tagName==="LINK"&&V.rel==="modulepreload"&&C(V)}).observe(document,{childList:!0,subtree:!0});function S(x){const M={};return x.integrity&&(M.integrity=x.integrity),x.referrerPolicy&&(M.referrerPolicy=x.referrerPolicy),x.crossOrigin==="use-credentials"?M.credentials="include":x.crossOrigin==="anonymous"?M.credentials="omit":M.credentials="same-origin",M}function C(x){if(x.ep)return;x.ep=!0;const M=S(x);fetch(x.href,M)}})();const Zt={off:0,error:1,warn:2,info:3,debug:4};let dt="off";const kt="[baikal-portal]";function Qa(r){const u=(r||"off").toLowerCase().trim();return u==="error"||u==="warn"||u==="info"||u==="debug"||u==="off"?u:"off"}function Za(r){return dt=Qa(r),dt!=="off"&&console.info(kt,`log level = ${dt}`),dt}function ta(r){return Zt[dt]>=Zt[r]}function $t(r,u,S,C){if(!ta(r))return;const x=[kt,S];C!==void 0&&x.push(C),console[u](...x)}function en(r,u){ta("info")&&(u&&Object.keys(u).length>0?console.info(kt,`event:${r}`,u):console.info(kt,`event:${r}`))}const B={error(r,u){$t("error","error",r,u)},warn(r,u){$t("warn","warn",r,u)},info(r,u){$t("info","info",r,u)},debug(r,u){$t("debug","debug",r,u)},event:en};class Oe extends Error{constructor(S,C){super(S);Qt(this,"status");this.status=C}}let ut="";function Lt(r){ut=r&&typeof r=="string"?r:""}async function U(r,u={}){const S=new Headers(u.headers);u.body&&!S.has("Content-Type")&&S.set("Content-Type","application/json");const C=(u.method||"GET").toUpperCase();C!=="GET"&&C!=="HEAD"&&C!=="OPTIONS"&&ut&&S.set("X-CSRF-Token",ut);const x=typeof performance<"u"?performance.now():Date.now();B.debug(`api → ${C} ${r}`);const M=await fetch(`/api${r}`,{...u,headers:S,credentials:"same-origin"});let V=null;const D=await M.text();if(D)try{V=JSON.parse(D)}catch{V={error:D}}const se=Math.round((typeof performance<"u"?performance.now():Date.now())-x);if(!M.ok){let _=`Request failed (${M.status})`;throw V&&typeof V=="object"&&V!==null&&"error"in V&&typeof V.error=="string"?_=V.error:(M.status===500||M.status===504)&&(_="Server error during import (often a timeout on large calendars). Try again — already imported events update faster."),M.status>=500?B.error(`api ← ${C} ${r} ${M.status} (${se}ms)`,_):M.status!==401?B.warn(`api ← ${C} ${r} ${M.status} (${se}ms)`,_):B.debug(`api ← ${C} ${r} 401 (${se}ms)`),new Oe(_,M.status)}return B.info(`api ← ${C} ${r} ${M.status} (${se}ms)`),V}function ye(r){return encodeURIComponent(r)}async function ea(r,u,S){const C=new Headers({"Content-Type":"application/json",Accept:"application/x-ndjson"});ut&&C.set("X-CSRF-Token",ut);const x=typeof performance<"u"?performance.now():Date.now();B.debug(`api → POST ${r} (stream)`);const M=await fetch(`/api${r}`,{method:"POST",headers:C,credentials:"same-origin",body:JSON.stringify(u)}),V=(M.headers.get("Content-Type")||"").toLowerCase();if(!M.ok&&!V.includes("ndjson")&&!V.includes("x-ndjson")){let X=`Request failed (${M.status})`;try{const he=await M.json();he.error&&(X=he.error)}catch{}throw B.warn(`api ← POST ${r} ${M.status}`,X),new Oe(X,M.status)}if(!M.body)throw new Oe("Import stream unavailable",500);const D=M.body.getReader(),se=new TextDecoder;let _="",ue=null,Q=null;for(;;){const{done:X,value:he}=await D.read();if(X)break;_+=se.decode(he,{stream:!0});const Ke=_.split(`
`);_=Ke.pop()??"";for(const ge of Ke){const b=ge.trim();if(!b)continue;let Y;try{Y=JSON.parse(b)}catch{B.debug("import stream non-JSON line",b.slice(0,80));continue}if(Y.type==="progress"){const E=Number(Y.total)||0,Be=Number(Y.current)||0,_e=typeof Y.percent=="number"?Y.percent:E>0?Math.round(100*Be/E):0;S==null||S({percent:_e,current:Be,total:E,imported:Number(Y.imported)||0,updated:Number(Y.updated)||0,skipped:Number(Y.skipped)||0})}else Y.type==="done"&&Y.result?ue=Y.result:Y.type==="error"&&(Q={message:Y.error||"Import failed",status:Y.status||500})}}if(_.trim())try{const X=JSON.parse(_.trim());X.type==="done"&&X.result&&(ue=X.result),X.type==="error"&&(Q={message:X.error||"Import failed",status:X.status||500})}catch{}const le=Math.round((typeof performance<"u"?performance.now():Date.now())-x);if(Q)throw B.warn(`api ← POST ${r} stream error (${le}ms)`,Q.message),new Oe(Q.message,Q.status);if(!ue)throw B.error(`api ← POST ${r} stream incomplete (${le}ms)`),new Oe("Import ended without a result",500);return B.info(`api ← POST ${r} stream done (${le}ms)`),ue}const q={ui:()=>U("/ui"),me:async()=>{var u;const r=await U("/me");return Lt(r.csrfToken||((u=r.user)==null?void 0:u.csrfToken)),r},login:async(r,u)=>{var C;const S=await U("/login",{method:"POST",body:JSON.stringify({username:r,password:u})});return Lt((C=S.user)==null?void 0:C.csrfToken),S},logout:async()=>{try{return await U("/logout",{method:"POST"})}finally{Lt("")}},calendars:()=>U("/calendars"),createCalendar:r=>U("/calendars",{method:"POST",body:JSON.stringify(r)}),holidayCountries:()=>U("/holidays/countries"),updateCalendar:(r,u)=>U(`/calendars/${r}`,{method:"PATCH",body:JSON.stringify(u)}),deleteCalendar:r=>U(`/calendars/${r}`,{method:"DELETE"}),calendarEvents:(r,u,S)=>{const C=new URLSearchParams({from:u,to:S}).toString();return U(`/calendars/${r}/events?${C}`)},getEvent:(r,u)=>U(`/calendars/${r}/events/${ye(u)}`),createEvent:(r,u)=>U(`/calendars/${r}/events`,{method:"POST",body:JSON.stringify(u)}),updateEvent:(r,u,S)=>U(`/calendars/${r}/events/${ye(u)}`,{method:"PATCH",body:JSON.stringify(S)}),deleteEvent:(r,u)=>U(`/calendars/${r}/events/${ye(u)}`,{method:"DELETE"}),exportCalendar:async r=>{const u=await fetch(`/api/calendars/${r}/export`,{credentials:"same-origin"});if(!u.ok){let V=`Export failed (${u.status})`;try{const D=await u.json();D.error&&(V=D.error)}catch{}throw new Oe(V,u.status)}const S=u.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(S),x=(C==null?void 0:C[1])||`calendar-${r}.ics`;return{blob:await u.blob(),filename:x}},importCalendar:(r,u,S)=>ea(`/calendars/${r}/import`,{ics:u},S),directory:()=>U("/directory"),shares:r=>U(`/calendars/${r}/shares`),share:(r,u,S)=>U(`/calendars/${r}/shares`,{method:"POST",body:JSON.stringify({username:u,access:S})}),revoke:(r,u)=>U(`/calendars/${r}/shares`,{method:"DELETE",body:JSON.stringify({href:u})}),addressbooks:()=>U("/addressbooks"),createAddressBook:r=>U("/addressbooks",{method:"POST",body:JSON.stringify(r)}),updateAddressBook:(r,u)=>U(`/addressbooks/${r}`,{method:"PATCH",body:JSON.stringify(u)}),deleteAddressBook:(r,u=!1)=>U(`/addressbooks/${r}`,{method:"DELETE",body:JSON.stringify({force:u})}),exportAddressBook:async r=>{const u=await fetch(`/api/addressbooks/${r}/export`,{credentials:"same-origin"});if(!u.ok){let V=`Export failed (${u.status})`;try{const D=await u.json();D.error&&(V=D.error)}catch{}throw new Oe(V,u.status)}const S=u.headers.get("Content-Disposition")||"",C=/filename="([^"]+)"/i.exec(S),x=(C==null?void 0:C[1])||`contacts-${r}.vcf`;return{blob:await u.blob(),filename:x}},importAddressBook:(r,u,S)=>ea(`/addressbooks/${r}/import`,{vcf:u},S),contacts:(r,u="")=>{const S=u.trim()?`?q=${encodeURIComponent(u.trim())}`:"";return U(`/addressbooks/${r}/contacts${S}`)},getContact:(r,u)=>U(`/addressbooks/${r}/contacts/${ye(u)}`),createContact:(r,u)=>U(`/addressbooks/${r}/contacts`,{method:"POST",body:JSON.stringify(u)}),updateContact:(r,u,S)=>U(`/addressbooks/${r}/contacts/${ye(u)}`,{method:"PATCH",body:JSON.stringify(S)}),deleteContact:(r,u)=>U(`/addressbooks/${r}/contacts/${ye(u)}`,{method:"DELETE"}),exportContact:async(r,u)=>{const S=await fetch(`/api/addressbooks/${r}/contacts/${ye(u)}/export`,{credentials:"same-origin"});if(!S.ok){let D=`Export failed (${S.status})`;try{const se=await S.json();se.error&&(D=se.error)}catch{}throw new Oe(D,S.status)}const C=S.headers.get("Content-Disposition")||"",x=/filename="([^"]+)"/i.exec(C),M=(x==null?void 0:x[1])||"contact.vcf";return{blob:await S.blob(),filename:M}},contactPhotoUrl:(r,u)=>`/api/addressbooks/${r}/contacts/${ye(u)}/photo`,tasks:(r={})=>{const u=new URLSearchParams;r.q&&u.set("q",r.q),r.sort&&u.set("sort",r.sort),r.order&&u.set("order",r.order);const S=u.toString()?`?${u}`:"";return U(`/tasks${S}`)},createTask:r=>U("/tasks",{method:"POST",body:JSON.stringify(r)}),updateTask:(r,u,S)=>U(`/tasks/${r}/${ye(u)}`,{method:"PATCH",body:JSON.stringify(S)}),deleteTask:(r,u)=>U(`/tasks/${r}/${ye(u)}`,{method:"DELETE"}),bulkTasks:r=>U("/tasks/bulk",{method:"POST",body:JSON.stringify(r)}),notes:(r={})=>{const u=new URLSearchParams;r.q&&u.set("q",r.q),r.sort&&u.set("sort",r.sort),r.order&&u.set("order",r.order);const S=u.toString()?`?${u}`:"";return U(`/notes${S}`)},createNote:r=>U("/notes",{method:"POST",body:JSON.stringify(r)}),updateNote:(r,u,S)=>U(`/notes/${r}/${ye(u)}`,{method:"PATCH",body:JSON.stringify(S)}),deleteNote:(r,u)=>U(`/notes/${r}/${ye(u)}`,{method:"DELETE"})},tn="0.11.1-fork.4",an="https://github.com/offsyanka99/Baikal/tree/master/docs";function c(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function qt(r){return r==="readwrite"?'<span class="badge badge-admin">full access</span>':r==="read"?'<span class="badge">read-only</span>':r==="owner"?'<span class="badge badge-ok">owner</span>':`<span class="badge">${c(r)}</span>`}function wt(r){const u=[`${r.imported} new`,`${r.updated} updated`];return r.skipped>0&&u.push(`${r.skipped} skipped`),u.join(", ")}const nn={"my-calendars":{title:"Calendar",paragraphs:["Create and edit calendars, then share them with other Baïkal users.","CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only."]},owned:{title:"Owned",paragraphs:["Calendars you own appear here. Select one to edit details, import/export, or share.","Badges show ownership, read-only mode, and holiday calendars."]},"add-calendar":{title:"Add calendar",paragraphs:["Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).","Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant."]},"shared-with-me":{title:"Shared with me",paragraphs:["Calendars other users shared with you. You can export a copy; name, color, and sharing are managed by the owner."]},"calendar-details":{title:"Calendar details",paragraphs:["Display name, color, and description are stored on the calendar and are visible to CalDAV clients.","The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name."]},"import-export":{title:"Import / export",paragraphs:["Export downloads a standard .ics file of the whole calendar.","Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.","Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.","Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact."]},share:{title:"Share",paragraphs:["Share this calendar with another Baïkal user. Choose read-only or full access.","This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.","If the calendar is marked read-only, shares are always read-only for everyone."]},"my-contacts":{title:"Contacts",paragraphs:["Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.","Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files."]},tasks:{title:"Tasks",paragraphs:["Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.","Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.","Click a column header to sort. Create tasks on any writable calendar that allows VTODO components."]},notes:{title:"Notes",paragraphs:["Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.","Click a column header to sort. Pick a writable calendar when creating a note."]},"address-books":{title:"Address books",paragraphs:["Address books you own. Select one to manage its contacts.","You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation."]},contacts:{title:"Contacts",paragraphs:["Search filters by name, email, phone, org, notes, and custom fields.","Add or select a contact to edit fields. Multiple emails and phones are supported.","Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.","Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them."]},"contact-import-export":{title:"Import / export contacts",paragraphs:["Export downloads a multi-vCard .vcf file of every contact in the address book.","Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.","Large imports show a progress dialog with elapsed time — keep the tab open until the result appears."]}};function Se(r,u,S="h2"){const C=S;return`<div class="section-title-row">
    <${C}>${c(r)}</${C}>
    <button type="button" class="info-btn" data-action="info" data-info="${c(u)}"
      aria-label="About ${c(r)}" title="About ${c(r)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`}function sn(){return`
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
    </div>`}function rn(r){let u=null,S=null,C="calendars",x=[],M=[],V=[],D=null,se=[],_=!1,ue=!1,Q=null,le=null,X={y:new Date().getFullYear(),m:new Date().getMonth()},he=[],Ke=!1,ge=!1,b=null,Y=!1,E=null,Be="",_e=null,ie=[],I=null,Ne=[],je="",z=null,k=null,Z=!1,re=!1,fe=!1,ce=null,be=null,ve=!1,f=!1,De=null,Ae=null,F=null,mt=null,Mt=!1,Xe={timeFormat:"auto",weekStart:"auto",logLevel:"off"},Te=null;function St(e){if(!e)return;const t=(e.timeFormat||"auto").toLowerCase(),a=(e.weekStart||"auto").toLowerCase();Xe={timeFormat:t==="12h"||t==="24h"?t:"auto",weekStart:a==="monday"||a==="sunday"?a:"auto",logLevel:e.logLevel||"off"},Za(Xe.logLevel)}let de=[],tt=[],Ve=[],He=[],pt="",ft="",Le="due",xe="asc",Ge="dtstart",We="desc",me=null,Ce=null,P=null,J=null,W=!1,oe=!1,ae=[];function v(e,t){S={type:e,message:t}}function A(){S=null}async function na(){B.event("bootstrap.start");try{const e=await q.ui();St(e.ui)}catch(e){B.debug("bootstrap: /api/ui failed",e instanceof Error?e.message:e)}try{const e=await q.me();u=e.user,St(e.ui),B.event("bootstrap.session",{username:(u==null?void 0:u.username)??null}),await $e()}catch(e){e instanceof Oe&&e.status===401?(u=null,B.event("bootstrap.anonymous")):(B.error("bootstrap failed",e instanceof Error?e.message:e),v("error",e instanceof Error?e.message:"Failed to load"))}m()}async function $e(){B.debug("loadHome");const[e,t,a]=await Promise.all([q.calendars(),q.directory().catch(()=>({users:[]})),q.addressbooks()]);if(x=e.calendars,M=t.users,ie=a.addressbooks,B.event("loadHome",{calendars:x.length,addressBooks:ie.length,directory:M.length}),V.length===0)try{V=(await q.holidayCountries()).countries}catch{V=[]}if(D!==null&&!x.some(o=>o.id===D)&&(D=null,se=[],_=!1,Q=null),D===null){const o=Ft();o&&(D=o.id)}D!==null&&_?await at(D):D!==null&&(se=[]),C==="calendars"&&await we(),I!==null&&!ie.some(o=>o.id===I)&&(I=null,Ne=[],z=null,k=null,Z=!1),le!==null&&!ie.some(o=>o.id===le)&&(le=null),I===null&&ie.length>0&&(I=ie[0].id),I!==null&&C==="contacts"&&await Me(I)}async function at(e){se=(await q.shares(e)).shares}function Ft(){const e=x.filter(a=>a.canShare);if(e.length===0)return null;const t=a=>{const o=a.uri.toLowerCase(),l=a.displayname.toLowerCase();return o==="default"||l==="default"||l==="default calendar"};return e.find(t)??e[0]??null}function ee(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${o}`}function sa(e,t){const a=new Date(e,t,1),o=new Date(e,t+1,0);return{from:ee(a),to:ee(o)}}function Dt(e){if(/^\d{4}-\d{2}-\d{2}$/.test(e)){const[a,o,l]=e.split("-").map(Number);return new Date(a,o-1,l)}const t=new Date(e);if(Number.isNaN(t.getTime())){const[a,o,l]=e.slice(0,10).split("-").map(Number);return new Date(a,(o||1)-1,l||1)}return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function ra(e){const t=Dt(e.start);if(!e.end)return[ee(t)];let a=Dt(e.end);if(!e.allDay&&!/^\d{4}-\d{2}-\d{2}$/.test(e.end)){const s=new Date(e.end);!Number.isNaN(s.getTime())&&s.getHours()===0&&s.getMinutes()===0&&s.getSeconds()===0&&s.getTime()>new Date(e.start).getTime()&&(a=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1))}if(a<t)return[ee(t)];const o=[],l=new Date(t.getFullYear(),t.getMonth(),t.getDate()),d=new Date(a.getFullYear(),a.getMonth(),a.getDate());let n=0;for(;l<=d&&n++<370;)o.push(ee(l)),l.setDate(l.getDate()+1);return o.length?o:[ee(t)]}function Ct(e,t){const a=e.slice(0,10),o=(t||a).slice(0,10);if(a===o){const O=st(a);return{start:O.start,end:O.end}}const[l,d,n]=a.split("-").map(Number),[s,i,p]=o.split("-").map(Number),h=qe(new Date(l,d-1,n,9,0,0,0)),g=qe(new Date(s,i-1,p,17,0,0,0));return{start:h,end:g}}function oa(e,t){const a=Ye(e);let o=t?Ye(t):a;if(t&&!/^\d{4}-\d{2}-\d{2}$/.test(t)){const l=new Date(t);if(!Number.isNaN(l.getTime())&&l.getHours()===0&&l.getMinutes()===0&&l.getTime()>new Date(e).getTime()){const d=Dt(t);d.setDate(d.getDate()-1),o=ee(d)}}return{start:a,end:o}}async function we(){if(D===null){he=[];return}const{from:e,to:t}=sa(X.y,X.m);Ke=!0,B.debug("loadMonthEvents",{selectedId:D,from:e,to:t});try{he=(await q.calendarEvents(D,e,t)).events,B.event("monthEvents.loaded",{calendarId:D,count:he.length,from:e,to:t})}catch(a){he=[],B.warn("loadMonthEvents failed",a instanceof Error?a.message:a)}finally{Ke=!1}}function la(e,t){return new Date(e,t,1).toLocaleString(void 0,{month:"long",year:"numeric"})}function ia(e){const t=e.summary||"(No title)";if(e.allDay||/^\d{4}-\d{2}-\d{2}$/.test(e.start))return t;const a=new Date(e.start);return Number.isNaN(a.getTime())?t:`${a.toLocaleTimeString(void 0,Et())} ${t}`}function ca(){const e=D!==null?x.find(y=>y.id===D):null,t=(e==null?void 0:e.displayname)??"Calendar",a=e!=null&&e.color?e.color.length>=7?e.color.slice(0,7):e.color:"#3B82F6",o=X.y,l=X.m,d=new Date(o,l,1),n=Nt(),s=(d.getDay()-n+7)%7,i=new Date(o,l+1,0).getDate(),p=new Date(o,l,0).getDate(),g=ee(new Date),O=Pt(),T=new Map;for(const y of he)for(const R of ra(y)){const N=T.get(R)??[];N.push(y),T.set(R,N)}const w=[],L=Math.ceil((s+i)/7)*7;for(let y=0;y<L;y++){let R,N=!0,j;y<s?(R=p-s+y+1,N=!1,j=new Date(o,l-1,R)):y>=s+i?(R=y-(s+i)+1,N=!1,j=new Date(o,l+1,R)):(R=y-s+1,j=new Date(o,l,R));const H=ee(j),G=H===g,pe=N?T.get(H)??[]:[],it=_e===H?50:3,et=pe.slice(0,it),ht=pe.length-et.length,Ie=et.map(ct=>{const Ot=D??0,vt=ia(ct);return`<button type="button" class="month-event${ct.allDay?"":" is-timed"}" title="${c(vt)}" style="--ev-color:${c(a)}"
            data-action="open-event" data-instance="${Ot}" data-uri="${c(ct.uri)}" ${f?"disabled":""}>${c(vt)}</button>`}).join(""),xt=ht>0?`<button type="button" class="month-event-more" data-action="open-event-day" data-day="${c(H)}" title="Show all events this day" ${f?"disabled":""}>+${ht} more</button>`:"",It=!N&&(R===1||y===s+i)?j.toLocaleString(void 0,{month:"short",day:"numeric"}):String(R),gt=!!(e&&!e.readOnly&&(e.canShare||e.access==="readwrite"));w.push(`<div class="month-cell${N?"":" is-outside"}${G?" is-today":""}${gt?" is-clickable":""}"${gt?` data-action="new-event-day" data-day="${c(H)}" role="button" tabindex="0" title="Add event on ${c(H)}"`:""}>
        <div class="month-daynum${G?" is-today-num":""}">${c(It)}</div>
        <div class="month-events">${Ie}${xt}</div>
      </div>`)}const te=e?Ke?'<p class="muted small month-empty-hint">Loading events…</p>':"":'<p class="muted small month-empty-hint">No calendars yet — create one on the left. The grid stays empty until events exist.</p>';return`<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${f?"disabled":""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${f?"disabled":""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${f?"disabled":""}>›</button>
        </div>
        <h2 class="month-cal-title">${c(la(o,l))}</h2>
        <span class="month-cal-name muted small" title="${c(t)}">
          <span class="cal-swatch" style="background:${c(a)};margin-top:0"></span>
          ${c(t)}
        </span>
      </div>
      ${te}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${O.map(y=>`<div class="month-dow">${c(y)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${w.join("")}
        </div>
      </div>
    </section>`}function Ye(e){if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?e.slice(0,10):ee(t)}function da(){if(Xe.timeFormat==="24h")return!1;if(Xe.timeFormat==="12h")return!0;try{const t=new Intl.DateTimeFormat(void 0,{hour:"numeric"}).resolvedOptions();if(t.hourCycle==="h23"||t.hourCycle==="h24")return!1;if(t.hourCycle==="h11"||t.hourCycle==="h12")return!0;if(typeof t.hour12=="boolean")return t.hour12}catch{}const e=(navigator.language||"").toLowerCase();return/^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(e)}function Et(){return da()?{hour:"numeric",minute:"2-digit",hour12:!0}:{hour:"2-digit",minute:"2-digit",hour12:!1}}function Nt(){var a;if(Xe.weekStart==="monday")return 1;if(Xe.weekStart==="sunday")return 0;const e=[...(a=navigator.languages)!=null&&a.length?navigator.languages:[],navigator.language].filter(Boolean);for(const o of e)try{const l=new Intl.Locale(o),d=typeof l.getWeekInfo=="function"?l.getWeekInfo():l.weekInfo,n=d==null?void 0:d.firstDay;if(typeof n=="number")return n===7?0:n}catch{}const t=(navigator.language||"en").toLowerCase();return/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(t)?0:1}function Pt(){const e=Nt(),t=new Date(2024,0,7+e),a=[];for(let o=0;o<7;o++){const l=new Date(t);l.setDate(t.getDate()+o),a.push(l.toLocaleDateString(void 0,{weekday:"short"}))}return a}function Rt(e,t=15){const a=t*60*1e3,o=e.getTime();return o%a===0?new Date(o):new Date(Math.ceil(o/a)*a)}function qe(e){const t=a=>String(a).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ua(e,t){if(!e)return"Select…";if(t||/^\d{4}-\d{2}-\d{2}$/.test(e)){const o=e.slice(0,10),[l,d,n]=o.split("-").map(Number);return new Date(l,d-1,n).toLocaleDateString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric"})}const a=new Date((e.includes("T")&&e.length===16,e));return Number.isNaN(a.getTime())?e:a.toLocaleString(void 0,{weekday:"short",year:"numeric",month:"short",day:"numeric",...Et()})}function nt(e){if(!e){const a=Rt(new Date);return{date:ee(a),hm:`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}}if(/^\d{4}-\d{2}-\d{2}$/.test(e))return{date:e,hm:"09:00"};const t=new Date((e.length===16,e));return Number.isNaN(t.getTime())?{date:e.slice(0,10),hm:"09:00"}:{date:ee(t),hm:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}function st(e){const t=new Date,a=ee(t);if(e&&e!==a){const[d,n,s]=e.split("-").map(Number),i=new Date(d,n-1,s,9,0,0,0),p=new Date(d,n-1,s,10,0,0,0);return{start:qe(i),end:qe(p)}}const o=Rt(t,15),l=new Date(o.getTime()+3600*1e3);return{start:qe(o),end:qe(l)}}function ma(){const e=[];for(let t=0;t<24;t++)for(let a=0;a<60;a+=15)e.push(`${String(t).padStart(2,"0")}:${String(a).padStart(2,"0")}`);return e}function Je(e){const{field:t,name:a,label:o,value:l,dateOnly:d=!1,required:n,disabled:s,allowClear:i=!0}=e,p=(E==null?void 0:E.field)===t,h=ua(l,d);return`<div class="dt-field${p?" is-open":""}" data-dt-id="${c(t)}">
      <span class="dt-field-label">${c(o)}</span>
      <input type="hidden" name="${c(a)}" value="${c(l)}" ${n?"required":""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${c(t)}"
        data-dt-name="${c(a)}" data-dt-date-only="${d?"1":"0"}" data-dt-clear="${i?"1":"0"}"
        ${s?"disabled":""} aria-expanded="${p}">
        <span class="dt-trigger-text">${c(h)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${p&&!s?pa(t,l,d,i):""}
    </div>`}function Tt(e){var t;return e==="start"?String((b==null?void 0:b.start)||""):e==="end"?String((b==null?void 0:b.end)||""):e==="until"?((t=b==null?void 0:b.repeat)==null?void 0:t.until)||Ye(b==null?void 0:b.start)||ee(new Date):e==="due"?Qe(P==null?void 0:P.due):e==="dtstart"?Qe(J==null?void 0:J.dtstart):e==="bulk-due"?Be:e==="birthday"?String((k==null?void 0:k.birthday)||""):""}function ke(e,t){if(e==="start"&&b){b={...b,start:t||""};return}if(e==="end"&&b){b={...b,end:t};return}if(e==="until"&&b){b={...b,repeat:{...b.repeat??bt(),until:t,endMode:"until"}};return}if(e==="due"&&P){if(t===null||t==="")P={...P,due:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))P={...P,due:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));P={...P,due:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="dtstart"&&J){if(t===null||t==="")J={...J,dtstart:null};else if(/^\d{4}-\d{2}-\d{2}$/.test(t))J={...J,dtstart:new Date(t+"T00:00:00").toISOString()};else{const a=new Date((t.length===16,t));J={...J,dtstart:Number.isNaN(a.getTime())?t:a.toISOString()}}return}if(e==="birthday"&&k){k={...k,birthday:t&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):null};return}e==="bulk-due"&&(Be=t||"")}function pa(e,t,a,o){const l=nt(t),d=(E==null?void 0:E.viewY)??Number(l.date.slice(0,4)),n=(E==null?void 0:E.viewM)??Number(l.date.slice(5,7))-1,s=Nt(),i=Pt(),h=(new Date(d,n,1).getDay()-s+7)%7,g=new Date(d,n+1,0).getDate(),O=new Date(d,n,0).getDate(),T=l.date,w=l.hm,L=new Date(d,n,1).toLocaleString(void 0,{month:"long",year:"numeric"}),te=[],y=Math.ceil((h+g)/7)*7;for(let N=0;N<y;N++){let j,H,G=!1;N<h?(j=O-h+N+1,H=new Date(d,n-1,j),G=!0):N>=h+g?(j=N-(h+g)+1,H=new Date(d,n+1,j),G=!0):(j=N-h+1,H=new Date(d,n,j));const pe=ee(H),it=pe===T,et=pe===ee(new Date);te.push(`<button type="button" class="dt-day${G?" is-outside":""}${it?" is-selected":""}${et?" is-today":""}" data-action="dt-pick-day" data-dt-field="${e}" data-day="${c(pe)}">${j}</button>`)}const R=a?"":`<div class="dt-times" role="listbox" aria-label="Time">
          ${ma().map(N=>{const j=(()=>{const[H,G]=N.split(":").map(Number);return new Date(2e3,0,1,H,G).toLocaleTimeString(void 0,Et())})();return`<button type="button" class="dt-time${N===w?" is-selected":""}" data-action="dt-pick-time" data-dt-field="${e}" data-hm="${N}" role="option" aria-selected="${N===w}">${c(j)}</button>`}).join("")}
        </div>`;return`<div class="dt-popover" data-dt-popover="${e}" role="dialog" aria-label="Choose date${a?"":" and time"}">
      <div class="dt-popover-inner${a?" is-date-only":""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${e}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${c(L)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${e}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${i.map(N=>`<span class="dt-dow">${c(N)}</span>`).join("")}</div>
          <div class="dt-days">${te.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${c(e)}" ${o?"":"disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${e}">Today</button>
          </div>
        </div>
        ${R}
      </div>
    </div>`}function fa(){r.querySelectorAll(".dt-field.is-open").forEach(e=>{const t=e.querySelector(".dt-trigger"),a=e.querySelector(".dt-popover");if(!t||!a)return;const o=t.getBoundingClientRect(),l=8;a.style.position="fixed",a.style.visibility="hidden",a.style.top="0",a.style.left="0";const d=a.offsetWidth||320,n=a.offsetHeight||300;let s=o.bottom+6;s+n>window.innerHeight-l&&(s=Math.max(l,o.top-n-6));let i=o.left;i+d>window.innerWidth-l&&(i=Math.max(l,window.innerWidth-d-l)),i<l&&(i=l),a.style.top=`${Math.round(s)}px`,a.style.left=`${Math.round(i)}px`,a.style.right="auto",a.style.visibility="visible",a.style.zIndex="200"})}function bt(){return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"}}function ba(e){return e.endMode==="until"||e.endMode==="count"||e.endMode==="never"?e.endMode:e.until?"until":e.count?"count":"never"}function ya(){if(!ge||!b)return"";const e=b,t=e.repeat??bt(),a=(t.freq||"").toUpperCase(),o=x.filter(T=>T.canShare||T.access==="readwrite"),l=x.filter(T=>T.id===e.instanceId?!0:T.readOnly?!1:T.canShare||T.access==="readwrite").map(T=>`<option value="${T.id}" ${T.id===e.instanceId?"selected":""}>${c(T.displayname)}</option>`).join(""),d=e.readOnly||!e.canWrite;let n,s;if(e.allDay)n=Ye(e.start),s=Ye(e.end);else{const T=e.start||"",w=e.end||"";if(/^\d{4}-\d{2}-\d{2}$/.test(T)){const L=Ct(T,w||null);n=L.start,s=L.end||""}else n=Qe(e.start),s=Qe(e.end)}const i=[{code:"MO",label:"Mon"},{code:"TU",label:"Tue"},{code:"WE",label:"Wed"},{code:"TH",label:"Thu"},{code:"FR",label:"Fri"},{code:"SA",label:"Sat"},{code:"SU",label:"Sun"}],p=new Set((t.byDay||[]).map(T=>T.toUpperCase())),h=ba(t),g=!!a&&h==="until",O=t.until||(h==="until"?Ye(e.start)||ee(new Date):"");return`<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${Y?"New event":"Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${Pe()}
          ${!Y&&(e.hasRrule||a)?'<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>':""}
          ${d?'<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>':""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${d||o.length===0?"disabled":""}>
                ${l||`<option value="${e.instanceId}">${c(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${c(e.summary)}" ${d?"readonly":""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${c(e.location)}" ${d?"readonly":""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${d?"readonly":""}>${c(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay?"checked":""} ${d?"disabled":""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${Je({field:"start",name:"start",label:"Start",value:n,dateOnly:e.allDay,required:!0,disabled:d,allowClear:!1})}
              ${Je({field:"end",name:"end",label:"End",value:s,dateOnly:e.allDay,disabled:d||g,allowClear:!g})}
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
                  <input type="number" name="repeatInterval" min="1" max="99" value="${c(String(t.interval||1))}" ${a?"":"disabled"} />
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
                      ${h==="until"?Je({field:"until",name:"repeatUntil",label:"Until",value:O,dateOnly:!0,disabled:d,allowClear:!0}):h==="count"?`<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${c(String(t.count||10))}" />
                              </label>`:"<span></span>"}
                    </div>`:""}
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${d?"":`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${Y?"Create event":"Save event"}</button>
                     ${Y?"":`<button type="button" class="btn btn-danger" data-action="delete-event" ${f?"disabled":""}>Delete</button>`}`}
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`}function ha(e,t){const a=x.find(o=>o.id===t);return{uri:"",instanceId:t,calendarId:(a==null?void 0:a.calendarId)??0,calendarName:(a==null?void 0:a.displayname)??"Calendar",calendarUri:(a==null?void 0:a.uri)??"",uid:"",summary:"",description:"",location:"",start:e,end:e,allDay:!0,hasRrule:!1,repeat:bt(),readOnly:!1,canWrite:!0}}async function Me(e){Ne=(await q.contacts(e,je)).contacts,z!==null&&!Ne.some(a=>a.uri===z)&&(z=null,Z||(k=null,ce=null,be=null,ve=!1))}async function ze(){const e=await q.tasks({q:pt,sort:Le,order:xe});de=e.tasks,Ve=e.calendars;const t=new Set(de.map(a=>K(a.instanceId,a.uri)));ae=ae.filter(a=>t.has(a)),me!==null&&!de.some(a=>`${a.instanceId}|${a.uri}`===me)&&(me=null,W||(P=null))}async function rt(){const e=await q.notes({q:ft,sort:Ge,order:We});tt=e.notes,He=e.calendars,Ce!==null&&!tt.some(t=>`${t.instanceId}|${t.uri}`===Ce)&&(Ce=null,oe||(J=null))}function K(e,t){return`${e}|${t}`}function Ut(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Qe(e){if(!e)return"";try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${a(t.getMonth()+1)}-${a(t.getDate())}T${a(t.getHours())}:${a(t.getMinutes())}`}catch{return""}}function Fe(e,t,a,o,l,d=""){const n=a===t,s=n?o==="asc"?" ▲":" ▼":"";return`<th class="${`sortable-th${n?" is-sorted":""}${d?" "+d:""}`}" data-action="sort-${l}" data-sort="${c(t)}" role="columnheader" tabindex="0">${c(e)}${s}</th>`}async function ga(e){if(I===null)return;const t=await q.getContact(I,e);z=e,Z=!1;const a=t.contact;k={...a,emails:Array.isArray(a.emails)?a.emails:[],phones:Array.isArray(a.phones)?a.phones:[],custom:Array.isArray(a.custom)?a.custom:[],address:a.address??Bt(),birthday:a.birthday??null},ce=a.photoDataUri??(a.hasPhoto&&I!==null?`${q.contactPhotoUrl(I,e)}?t=${Date.now()}`:null),be=null,ve=!1,re=!0}function va(){Z=!0,z=null,re=!0,k={uri:"",displayname:"",firstname:"",lastname:"",fullname:"",org:"",title:"",emails:[""],phones:[{type:"cell",value:""}],address:{street:"",city:"",region:"",postal:"",country:""},birthday:null,url:"",note:"",custom:[],hasPhoto:!1,photoDataUri:null},ce=null,be=null,ve=!1}function Bt(){return{street:"",city:"",region:"",postal:"",country:""}}function $a(e){return new Promise((t,a)=>{const o=new FileReader;o.onload=()=>{const l=String(o.result??""),d=l.indexOf(",");t(d>=0?l.slice(d+1):l)},o.onerror=()=>a(new Error("Failed to read photo file")),o.readAsDataURL(e)})}function _t(e,t={}){const a=`
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>Baïkal User Portal</span>`,o=u?`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
          <div class="topnav-right">
            <span class="muted">${c(u.displayname||u.username)}</span>
            <button type="button" class="btn btn-ghost" data-action="logout">Log out</button>
          </div>
        </nav>`:`<nav class="topnav">
          <a class="brand" href="/portal/">${a}</a>
        </nav>`,d=!(_||ue||Q!==null||le!==null||ge||re||fe)?Pe():"",n=`
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>Baïkal portal <span class="mono">v${c(tn)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">Classic DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/admin/">Admin</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${c(an)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;return t.auth?document.body.className="layout-auth":document.body.classList.remove("layout-auth"),`${o}
      <main class="container">
        ${d}
        ${e}
      </main>
      ${n}
      ${sn()}
      ${wa()}`}function Pe(){return S?`<div class="flash flash-${c(S.type)}" role="status">
      <span class="flash-text">${c(S.message)}</span>
      <button type="button" class="flash-close" data-action="flash-close" aria-label="Dismiss message" title="Dismiss">×</button>
    </div>`:""}function jt(e){return!Number.isFinite(e)||e<0?"":e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Ze(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),o=t%60;return a>0?`${a}m ${o}s`:`${o}s`}function Ee(){mt!==null&&(clearInterval(mt),mt=null)}function Vt(){Ee(),mt=setInterval(()=>{if(!F||F.phase==="done"||F.phase==="error"){Ee();return}F={...F,elapsedSec:Math.floor((Date.now()-F.startedAt)/1e3)},F.phase==="processing"&&Yt(F)},1e3)}function Re(e,t={}){F&&(F={...F,phase:e,elapsedSec:Math.floor((Date.now()-F.startedAt)/1e3),...t},m())}function Ht(){Ee(),F=null,m()}function Wt(e){!F||F.phase==="done"||F.phase==="error"||(F={...F,phase:"processing",processPercent:e.percent,processCurrent:e.current,processTotal:e.total,processImported:e.imported,processUpdated:e.updated,processSkipped:e.skipped,elapsedSec:Math.floor((Date.now()-F.startedAt)/1e3)},Yt(F))}function Yt(e){const t=r.querySelector("[data-import-status-line]"),a=r.querySelector(".import-progress-bar"),o=r.querySelector(".import-progress-track"),l=r.querySelector("[data-import-counts]"),d=e.kind==="calendar"?"items":"contacts";let n;if(e.phase==="processing"&&e.processTotal>0)n=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${d} (${e.processPercent??0}%) · ${Ze(e.elapsedSec)}`;else if(e.phase==="processing")n=`Importing on server… ${Ze(e.elapsedSec)}`;else return;t&&(t.textContent=n),l&&(l.textContent=`${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}`),a&&e.processPercent!==null&&(a.classList.remove("is-indeterminate"),a.style.width=`${Math.min(100,Math.max(0,e.processPercent))}%`),o&&e.processPercent!==null&&(o.setAttribute("aria-valuenow",String(e.processPercent)),o.removeAttribute("aria-valuetext"))}function wa(){if(!F)return"";const e=F,t=e.phase!=="done"&&e.phase!=="error",a=e.kind==="calendar"?"calendar (.ics)":"contacts (.vcf)",o=e.phase==="done"?"Import finished":e.phase==="error"?"Import failed":"Importing…",l=(()=>{const s=[{id:"reading",label:"Reading file"},{id:"uploading",label:"Uploading to server"},{id:"processing",label:"Importing on server"}],p={reading:0,uploading:1,processing:2,done:3,error:2}[e.phase]??0;return s.map((h,g)=>{let O="pending";return e.phase==="done"||g<p?O="done":g===p&&(O=(e.phase==="error","active")),`<li class="import-step import-step-${O}"><span class="import-step-icon" aria-hidden="true">${O==="done"?"✓":O==="active"?"●":"○"}</span> ${c(h.label)}</li>`}).join("")})();let d="";if(t){let s=null;e.phase==="reading"&&e.readPercent!==null?s=Math.min(100,Math.max(0,e.readPercent)):e.phase==="processing"&&e.processPercent!==null&&(s=Math.min(100,Math.max(0,e.processPercent)));const i=s===null?"import-progress-bar is-indeterminate":"import-progress-bar",p=s!==null?` style="width:${s}%"`:"",h=e.kind==="calendar"?"items":"contacts";let g;e.phase==="reading"?g=e.readPercent!==null?`Reading file… ${e.readPercent}%`:"Reading file…":e.phase==="uploading"?g="Uploading to server…":e.processTotal>0?g=`Importing ${e.processCurrent.toLocaleString()} / ${e.processTotal.toLocaleString()} ${h} (${e.processPercent??0}%) · ${Ze(e.elapsedSec)}`:g=`Importing on server… ${Ze(e.elapsedSec)}`;const O=e.phase==="processing"&&e.processTotal>0?`<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${e.processImported} new · ${e.processUpdated} updated${e.processSkipped?` · ${e.processSkipped} skipped`:""}</p>`:'<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>';d=`
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
          <div class="${i}"${p}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${c(g)}</p>
        ${O}
        <p class="muted small">Keep this tab open until the import finishes.
          ${e.kind==="calendar"?"Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS.":""}
        </p>`}else e.phase==="done"?d=`
        <div class="flash flash-success import-result" role="status" style="margin:0 0 1rem">
          <strong>Success.</strong> ${c(e.resultMessage||"Import completed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · Took ${c(Ze(e.elapsedSec))}
        </p>`:d=`
        <div class="flash flash-error import-result" role="status" style="margin:0 0 1rem">
          <strong>Failed.</strong> ${c(e.resultMessage||"Import failed.")}
        </div>
        <p class="muted small" style="margin:0">
          File: <span class="mono">${c(e.fileName)}</span>
          · After ${c(Ze(e.elapsedSec))}
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
          <div class="cal-modal-body">${d}</div>
          <footer class="cal-modal-footer">${n}</footer>
        </div>
      </div>`}function Jt(e,t){return new Promise((a,o)=>{const l=new FileReader;l.onprogress=d=>{d.lengthComputable&&d.total>0?t(Math.min(100,Math.round(d.loaded/d.total*100))):t(null)},l.onload=()=>a(String(l.result??"")),l.onerror=()=>o(l.error??new Error("Failed to read file")),l.readAsText(e)})}function zt(){r.innerHTML=_t(`<div class="auth-wrap">
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
      </div>`,{auth:!0})}function ka(){if(!u){zt();return}const e=x.filter($=>$.canShare),t=x.filter($=>!$.canShare),a=x.find($=>$.id===D)??null,o=e.map($=>{const ne=$.id===D?" is-selected":"",Ue=$.color?`<span class="cal-swatch" style="background:${c($.color)}"></span>`:'<span class="cal-swatch cal-swatch-empty"></span>',At=qt($.access)+($.readOnly?'<span class="badge">read-only</span>':"")+($.holidaysCountry?`<span class="badge badge-admin">holidays ${c($.holidaysCountry)}</span>`:"");return`<div class="cal-row${ne}" data-action="select-cal" data-id="${$.id}" role="button" tabindex="0">
          ${Ue}
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${At}</span>
            <span class="muted small mono cal-row-uri">${c($.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${$.id}" ${f?"disabled":""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${$.id}" ${f?"disabled":""}>Delete</button>
          </span>
        </div>`}).join(""),l=t.map($=>`<div class="cal-row cal-row-static">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${c($.displayname)}</span>
            <span class="cal-row-badges">${qt($.access)}</span>
            <span class="muted small">Shared with you · ${c($.access)}</span>
          </span>
        </div>`).join(""),d=M.map($=>`<option value="${c($.username)}">${c($.displayname)} (${c($.username)})</option>`).join(""),n=se.length===0?'<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>':se.map($=>`<tr>
                <td>
                  <strong>${c($.displayname||$.username||$.href)}</strong>
                  <div class="muted small mono">${c($.username||$.href)}</div>
                </td>
                <td>${qt($.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${c($.href)}" ${f?"disabled":""}>Revoke</button>
                </td>
              </tr>`).join(""),s=a!=null&&a.color&&a.color.length>=7?a.color.slice(0,7):"#3B82F6",i=!!(a&&a.readOnly),p=_&&a&&a.canShare?`<div class="cal-modal" id="cal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
            <div class="cal-modal-backdrop" data-action="close-cal-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="cal-modal-title">Calendar details</h3>
                <button type="button" class="info-modal-close" data-action="close-cal-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Pe()}
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
                  ${Se(`Share “${a.displayname}”`,"share")}
                  ${i?'<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>':""}
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${M.length===0?"disabled":""}>
                        <option value="">${M.length?"Select user…":"No other users"}</option>
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
                      <button type="submit" class="btn btn-primary" ${f||M.length===0?"disabled":""}>Share</button>
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
                  ${Se("Import / export","import-export")}
                  ${a.readOnly?'<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>':""}
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${f?"disabled":""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${f||a.readOnly?"aria-disabled=true":""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${f||a.readOnly?"disabled":""} hidden />
                    </label>
                  </div>
                  ${De?`<div class="flash flash-${De.ok?"success":"error"} import-result" role="status">
                          <strong>Import result:</strong> ${c(De.message)}
                        </div>`:""}
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-cal-modal">Close</button>
              </footer>
            </div>
          </div>`:"",h=Q!==null?x.find($=>$.id===Q&&$.canShare)??null:null,g=h?`<div class="cal-modal" id="cal-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cal-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-cal"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="cal-delete-title">Delete calendar</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-cal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Pe()}
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
        </div>`:"",O=ue?`<div class="cal-modal" id="cal-create-modal" role="dialog" aria-modal="true" aria-labelledby="cal-create-title">
          <div class="cal-modal-backdrop" data-action="close-create-cal-modal"></div>
          <div class="cal-modal-card">
            <header class="cal-modal-header">
              <h3 id="cal-create-title">Add calendar</h3>
              <button type="button" class="info-modal-close" data-action="close-create-cal-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Pe()}
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
              ${Se("Owned","owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${o||'<p class="muted">No calendars yet. Create one below.</p>'}
              ${t.length?`<div class="calendars-shared-block">
                       ${Se("Shared with me","shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${l}</div>
                     </div>`:""}
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${f?"disabled":""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${ca()}
      </div>
      ${O}
      ${p}
      ${g}
      ${ya()}`,w=ie.map($=>`<div class="cal-row${$.id===I?" is-selected":""}" data-action="select-ab" data-id="${$.id}" role="button" tabindex="0">
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
        </div>`).join(""),L=ie.find($=>$.id===I)??null,te=Ne.length===0?`<tr class="contacts-empty-row"><td colspan="4" class="muted">${je?"No contacts match your search.":"No contacts yet. Add one or import a .vcf file."}</td></tr>`:Ne.map($=>{const ne=!Z&&$.uri===z?" is-selected":"",Ue=c(($.displayname||"?").slice(0,1).toUpperCase()),At=$.hasPhoto&&I!==null?`<img class="contact-avatar" src="${c(q.contactPhotoUrl(I,$.uri))}" alt="" loading="lazy" data-avatar-fallback="${Ue}" />`:`<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${Ue}</span>`;return`<tr class="contact-table-row${ne}" data-action="select-contact" data-uri="${c($.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${At}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${c($.displayname)}</span>
                      ${$.org?`<span class="muted small contact-name-secondary">${c($.org)}</span>`:""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${c($.email||"—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${c($.phone||"—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${c($.org||"—")}</span></td>
              </tr>`}).join(""),y=k,R=Array.isArray(y==null?void 0:y.emails)&&y.emails.length>0?y.emails:[""],N=Array.isArray(y==null?void 0:y.phones)&&y.phones.length>0?y.phones:[{type:"cell",value:""}],j=(y==null?void 0:y.address)??Bt(),H=R.map(($,ne)=>`<div class="multi-row" data-multi="email" data-idx="${ne}">
          <input type="email" name="email_${ne}" value="${c($??"")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${ne}" ${R.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),G=N.map(($,ne)=>`<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${ne}">
          <select name="phone_type_${ne}" aria-label="Phone type">
            ${["cell","work","home","other"].map(Ue=>`<option value="${Ue}" ${(($==null?void 0:$.type)??"other")===Ue?"selected":""}>${Ue}</option>`).join("")}
          </select>
          <input type="tel" name="phone_value_${ne}" value="${c(($==null?void 0:$.value)??"")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${ne}" ${N.length<=1?"disabled":""} title="Remove">×</button>
        </div>`).join(""),pe=Array.isArray(y==null?void 0:y.custom)?y.custom:[],it=pe.length===0?'<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>':pe.map(($,ne)=>`<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${ne}">
                <input type="text" name="custom_label_${ne}" value="${c($.label||"")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${ne}" value="${c($.value||"")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${ne}" title="Remove">×</button>
              </div>`).join(""),et=re&&y&&L?`<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${Z?"New contact":"Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Pe()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${ce?`<img src="${c(ce)}" alt="Contact photo" />`:`<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${c((y.fullname||y.firstname||"?").slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${f?"aria-disabled=true":""}>
                        ${ce?"Change photo":"Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${f?"disabled":""} hidden />
                      </label>
                      ${ce||y.hasPhoto?`<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${f?"disabled":""}>Remove photo</button>`:""}
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
                      ${G}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${N.length>=10?"disabled":""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${c(j.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${c(j.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${c(j.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${c(j.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${c(j.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${c(y.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${Je({field:"birthday",name:"birthday",label:"Birthday",value:y.birthday||"",dateOnly:!0,allowClear:!0})}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${it}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${pe.length>=30?"disabled":""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${c(y.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${f?"disabled":""}>${Z?"Create contact":"Save contact"}</button>
                    ${!Z&&y.uri?`<button type="button" class="btn" data-action="export-contact" ${f?"disabled":""}>Export .vcf</button>`:""}
                    ${Z?"":`<button type="button" class="btn btn-danger" data-action="delete-contact" ${f?"disabled":""}>Delete</button>`}
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${f?"disabled":""}>Cancel</button>
                    ${!Z&&y.uri?`<span class="muted small mono">${c(y.uri)}</span>`:""}
                  </div>
                </form>
              </div>
            </div>
          </div>`:"",ht=fe&&L?`<div class="cal-modal" id="ab-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ab-modal-title">
            <div class="cal-modal-backdrop" data-action="close-ab-modal"></div>
            <div class="cal-modal-card">
              <header class="cal-modal-header">
                <h3 id="ab-modal-title">Address book details</h3>
                <button type="button" class="info-modal-close" data-action="close-ab-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${Pe()}
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
                      <button type="submit" class="btn btn-primary" ${f?"disabled":""}>Save changes</button>
                      <span class="muted small mono">${c(L.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${Se("Import / export","contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${f?"disabled":""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${f?"aria-disabled=true":""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${f?"disabled":""} hidden />
                      </label>
                    </div>
                    ${Ae?`<div class="flash flash-${Ae.ok?"success":"error"} import-result" role="status">
                            <strong>Import:</strong> ${c(Ae.message)}
                          </div>`:""}
                  </div>
                </section>
              </div>
              <footer class="cal-modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close-ab-modal">Close</button>
              </footer>
            </div>
          </div>`:"",Ie=le!==null?ie.find($=>$.id===le)??null:null,xt=Ie?`<div class="cal-modal" id="ab-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title">
          <div class="cal-modal-backdrop" data-action="cancel-delete-ab"></div>
          <div class="cal-modal-card cal-modal-card-sm">
            <header class="cal-modal-header">
              <h3 id="ab-delete-title">Delete address book</h3>
              <button type="button" class="info-modal-close" data-action="cancel-delete-ab" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${Pe()}
              <p>You are about to permanently delete <strong>${c(Ie.displayname)}</strong>
                <span class="muted small mono">(${c(Ie.uri)})</span>.</p>
              <p class="muted small">${(Ie.cardCount??0)>0?`All ${Ie.cardCount} contact${Ie.cardCount===1?"":"s"} in this address book will be removed. This cannot be undone.`:"This address book is empty. This cannot be undone."}</p>
              <label class="checkbox" style="margin-top:1rem">
                <input type="checkbox" id="delete-ab-confirm" data-action="toggle-delete-ab-confirm" />
                I understand and want to permanently delete this address book
              </label>
            </div>
            <footer class="cal-modal-footer">
              <button type="button" class="btn btn-ghost" data-action="cancel-delete-ab" ${f?"disabled":""}>Cancel</button>
              <button type="button" class="btn btn-danger" data-action="confirm-delete-ab" data-id="${Ie.id}" disabled id="delete-ab-submit">Delete permanently</button>
            </footer>
          </div>
        </div>`:"",It=`
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${Se("Address books","address-books")}
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
          ${L?`<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${Se("Contacts","contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${c(je)}" aria-label="Search contacts" ${f?"disabled":""} />
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
                        ${te}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`:'<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>'}
        </section>
      </div>
      ${xt}
      ${ht}
      ${et}`,gt=C==="calendars"?"my-calendars":C==="contacts"?"my-contacts":C==="tasks"?"tasks":"notes",ct=Ea(),Ot=Na(),vt=C==="calendars"?T:C==="contacts"?It:C==="tasks"?ct:Ot;r.innerHTML=_t(`
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
            data-info="${gt}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>
      </header>

      ${vt}
    `),document.body.classList.toggle("cal-modal-open",_||ue||Q!==null||le!==null||ge||re||fe||F!==null),document.body.classList.toggle("layout-contacts",C==="contacts"),document.body.classList.toggle("layout-calendars",C==="calendars"),document.body.classList.toggle("layout-tasks",C==="tasks"||C==="notes")}function Sa(e){const t=new Map;for(const p of e)p.uid&&t.set(p.uid,p);const a=new Map(e.map((p,h)=>[K(p.instanceId,p.uri),h])),o=new Map,l=[];for(const p of e){const h=p.parentUid;if(h&&t.has(h)&&h!==p.uid){const g=o.get(h)??[];g.push(p),o.set(h,g)}else l.push(p)}const d=(p,h)=>(a.get(K(p.instanceId,p.uri))??0)-(a.get(K(h.instanceId,h.uri))??0);l.sort(d);for(const[,p]of o)p.sort(d);const n=[],s=new Set,i=(p,h)=>{const g=p.uid||K(p.instanceId,p.uri);if(!s.has(g)){s.add(g),n.push({task:p,depth:Math.min(h,8)});for(const O of o.get(p.uid)??[])i(O,h+1);s.delete(g)}};for(const p of l)i(p,0);for(const p of e)n.some(h=>h.task===p)||n.push({task:p,depth:0});return n}function Da(e){const t=new Set([e]);if(!e)return t;let a=!0;for(;a;){a=!1;for(const o of de)o.parentUid&&t.has(o.parentUid)&&o.uid&&!t.has(o.uid)&&(t.add(o.uid),a=!0)}return t}function Ca(e,t){const a=e.instanceId,o=t||!e.uid?new Set:Da(e.uid),l=de.filter(s=>s.uid&&s.instanceId===a&&!o.has(s.uid)&&s.uid!==e.uid),d=e.parentUid||"",n=['<option value="">None (top-level)</option>',...l.map(s=>`<option value="${c(s.uid)}" ${s.uid===d?"selected":""}>${c(s.summary||s.uid)}</option>`)];if(d&&!l.some(s=>s.uid===d)){const s=de.find(i=>i.uid===d);n.push(`<option value="${c(d)}" selected>${c((s==null?void 0:s.summary)||d)} (current)</option>`)}return n.join("")}function Kt(){const e=new Set(ae);return de.filter(t=>e.has(K(t.instanceId,t.uri))&&t.canWrite&&!t.readOnly)}function Ea(){const e=w=>({"NEEDS-ACTION":"To do","IN-PROCESS":"In progress",COMPLETED:"Done",CANCELLED:"Cancelled"})[w]||w,t=Sa(de),a=de.filter(w=>w.canWrite&&!w.readOnly).map(w=>K(w.instanceId,w.uri)),o=a.length>0&&a.every(w=>ae.includes(w)),l=ae.length>0,n=Kt().length,s=de.length===0?`<tr class="contacts-empty-row"><td colspan="6" class="muted">${pt?"No tasks match your search.":"No tasks yet. Add one below."}</td></tr>`:t.map(({task:w,depth:L})=>{const te=K(w.instanceId,w.uri),y=!W&&te===me?" is-selected":"",R=ae.includes(te),N=w.status==="COMPLETED"?"badge-ok":w.status==="CANCELLED"?"":"badge-admin",j=L>0?` style="--task-depth:${L}"`:"",H=L>0?'<span class="task-subtask-marker" aria-hidden="true">↳</span>':"",G=w.canWrite&&!w.readOnly;return`<tr class="contact-table-row task-row${L>0?" is-subtask":""}${y}${R?" is-checked":""}" data-action="select-task" data-instance="${w.instanceId}" data-uri="${c(w.uri)}" tabindex="0" role="button"${j}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${w.instanceId}" data-uri="${c(w.uri)}"
                    ${R?"checked":""} ${G?"":"disabled"} aria-label="Select ${c(w.summary||w.uri)}" ${f?"disabled":""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${H}<span class="contact-name-primary">${c(w.summary||w.uri)}</span></span>
                  ${w.readOnly?'<span class="badge">read-only</span>':""}</td>
                <td class="col-task-status"><span class="badge ${N}">${c(e(w.status))}</span></td>
                <td class="col-task-due muted small">${c(Ut(w.due))}</td>
                <td class="col-task-cal muted small">${c(w.calendarName)}</td>
                <td class="col-task-pct muted small">${w.percent?c(String(w.percent))+"%":"—"}</td>
              </tr>`}).join(""),i=`<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,p=(w,L)=>`<button type="button" class="btn btn-small bulk-apply-btn" data-action="${w}"
        title="${c(L)}" aria-label="${c(L)}" ${f||n===0?"disabled":""}>${i}</button>`,h=l?`<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${n}</strong><span class="bulk-bar-count-label">selected</span>${ae.length!==n?`<span class="muted small bulk-bar-count-extra">(${ae.length-n} read-only skipped)</span>`:""}
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
                ${Je({field:"bulk-due",name:"bulkDue",label:"Due",value:Be,dateOnly:!1,disabled:f||n===0,allowClear:!0})}
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
          </div>`:"",g=P,O=Ve.map(w=>`<option value="${w.id}" ${g&&g.instanceId===w.id?"selected":""}>${c(w.displayname)}</option>`).join(""),T=g?`<div class="card">
            ${Se(W?g.parentUid?"New subtask":"New task":"Edit task","tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${W?`<label>Calendar
                      <select name="instanceId" required ${Ve.length===0?"disabled":""}>
                        <option value="">${Ve.length?"Select calendar…":"No writable calendars"}</option>
                        ${O}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(g.calendarName)}</strong>${g.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(g.summary)}" ${g.readOnly&&!W?"readonly":""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${g.readOnly&&!W?"readonly":""}>${c(g.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${g.readOnly&&!W?"disabled":""}>
                  ${Ca(g,W)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${g.readOnly&&!W?"disabled":""}>
                    ${["NEEDS-ACTION","IN-PROCESS","COMPLETED","CANCELLED"].map(w=>`<option value="${w}" ${g.status===w?"selected":""}>${c(e(w))}</option>`).join("")}
                  </select>
                </label>
                ${Je({field:"due",name:"due",label:"Due",value:Qe(g.due),dateOnly:!1,disabled:!!(g.readOnly&&!W),allowClear:!0})}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${c(String(g.priority||0))}" ${g.readOnly&&!W?"readonly":""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${c(String(g.percent||0))}" ${g.readOnly&&!W?"readonly":""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${W||g.canWrite?`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${W?"Create task":"Save task"}</button>`:""}
                ${!W&&g.canWrite?`<button type="button" class="btn btn-ghost" data-action="new-subtask" ${f?"disabled":""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${f?"disabled":""}>Delete</button>`:W?'<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Se("Tasks","tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${c(pt)}" aria-label="Search tasks" ${f?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${f||Ve.length===0?"disabled":""}>Add task</button>
        </div>
        ${h}
        ${Ve.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${o?"checked":""} ${a.length===0||f?"disabled":""} />
                </th>
                ${Fe("Title","summary",Le,xe,"task","col-task-title")}
                ${Fe("Status","status",Le,xe,"task","col-task-status")}
                ${Fe("Due","due",Le,xe,"task","col-task-due")}
                ${Fe("Calendar","calendar",Le,xe,"task","col-task-cal")}
                ${Fe("%","percent",Le,xe,"task","col-task-pct")}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${T}
      </section>
    </div>`}function Na(){const e=tt.length===0?`<tr class="contacts-empty-row"><td colspan="3" class="muted">${ft?"No notes match your search.":"No notes yet. Add one below."}</td></tr>`:tt.map(l=>{const d=K(l.instanceId,l.uri),n=!oe&&d===Ce?" is-selected":"",s=(l.description||"").replace(/\s+/g," ").slice(0,80);return`<tr class="contact-table-row${n}" data-action="select-note" data-instance="${l.instanceId}" data-uri="${c(l.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${c(l.summary||l.uri)}</span>
                  ${s?`<span class="muted small contact-name-secondary">${c(s)}${l.description.length>80?"…":""}</span>`:""}
                  ${l.readOnly?'<span class="badge">read-only</span>':""}
                </td>
                <td class="col-note-date muted small">${c(Ut(l.dtstart))}</td>
                <td class="col-note-cal muted small">${c(l.calendarName)}</td>
              </tr>`}).join(""),t=J,a=He.map(l=>`<option value="${l.id}" ${t&&t.instanceId===l.id?"selected":""}>${c(l.displayname)}</option>`).join(""),o=t?`<div class="card">
            ${Se(oe?"New note":"Edit note","notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${oe?`<label>Calendar
                      <select name="instanceId" required ${He.length===0?"disabled":""}>
                        <option value="">${He.length?"Select calendar…":"No writable calendars"}</option>
                        ${a}
                      </select>
                    </label>`:`<p class="muted small">Calendar: <strong>${c(t.calendarName)}</strong>${t.readOnly?" · read-only":""}</p>`}
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${c(t.summary)}" ${t.readOnly&&!oe?"readonly":""} />
              </label>
              ${Je({field:"dtstart",name:"dtstart",label:"Date",value:Qe(t.dtstart),dateOnly:!1,disabled:!!(t.readOnly&&!oe),allowClear:!0})}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${t.readOnly&&!oe?"readonly":""}>${c(t.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${oe||t.canWrite?`<button type="submit" class="btn btn-primary" ${f?"disabled":""}>${oe?"Create note":"Save note"}</button>`:""}
                ${!oe&&t.canWrite?`<button type="button" class="btn btn-danger" data-action="delete-note" ${f?"disabled":""}>Delete</button>`:oe?'<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>':""}
              </div>
            </form>
          </div>`:'<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>';return`<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${Se("Notes","notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${c(ft)}" aria-label="Search notes" ${f?"disabled":""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${f||He.length===0?"disabled":""}>Add note</button>
        </div>
        ${He.length===0?'<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>':""}
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${Fe("Title","summary",Ge,We,"note","col-note-title")}
                ${Fe("Date","dtstart",Ge,We,"note","col-note-date")}
                ${Fe("Calendar","calendar",Ge,We,"note","col-note-cal")}
              </tr>
            </thead>
            <tbody>${e}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${o}
      </section>
    </div>`}function Ta(){const e=r.querySelector(".contacts-table-wrap"),t=r.querySelector(".contacts-ab-list"),a=r.querySelector(".calendars-owned-list");return{windowX:window.scrollX,windowY:window.scrollY,tableTop:(e==null?void 0:e.scrollTop)??null,abListTop:(t==null?void 0:t.scrollTop)??null,calListTop:(a==null?void 0:a.scrollTop)??null}}function xa(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(window.scrollTo(e.windowX,e.windowY),e.tableTop!==null){const t=r.querySelector(".contacts-table-wrap");t&&(t.scrollTop=e.tableTop)}if(e.abListTop!==null){const t=r.querySelector(".contacts-ab-list");t&&(t.scrollTop=e.abListTop)}if(e.calListTop!==null){const t=r.querySelector(".calendars-owned-list");t&&(t.scrollTop=e.calListTop)}})})}function m(){const e=Ta();u?ka():zt(),Ia(),xa(e),requestAnimationFrame(()=>{var t;fa(),(t=r.querySelector(".dt-time.is-selected"))==null||t.scrollIntoView({block:"center"})})}function Xt(e){const t=e.querySelector('input[name="color_picker"]'),a=e.querySelector('input[name="color"]');!t||!a||(t.addEventListener("input",()=>{a.value=t.value.toUpperCase()}),a.addEventListener("change",()=>{let o=a.value.trim();o&&!o.startsWith("#")&&(o=`#${o}`),/^#[0-9A-Fa-f]{6}/.test(o)&&(t.value=o.slice(0,7),a.value=o.toUpperCase())}))}function Ia(){r.querySelectorAll("[data-action]").forEach(y=>{y.addEventListener("click",R=>{const N=R.target.closest("[data-action]");((N==null?void 0:N.dataset.action)==="info"||(N==null?void 0:N.dataset.action)==="info-close")&&(R.preventDefault(),R.stopPropagation()),_a(R)})}),r.querySelectorAll("tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]").forEach(y=>{y.addEventListener("keydown",R=>{(R.key==="Enter"||R.key===" ")&&(R.preventDefault(),y.click())})});const e=r.querySelector("#delete-cal-confirm"),t=r.querySelector("#delete-cal-submit");e==null||e.addEventListener("change",()=>{t&&(t.disabled=!e.checked||f)});const a=r.querySelector("#delete-ab-confirm"),o=r.querySelector("#delete-ab-submit");a==null||a.addEventListener("change",()=>{o&&(o.disabled=!a.checked||f)}),r.querySelectorAll("img.contact-avatar[data-avatar-fallback]").forEach(y=>{y.addEventListener("error",()=>{const R=y.dataset.avatarFallback||"?",N=document.createElement("span");N.className="contact-avatar contact-avatar-fallback",N.setAttribute("aria-hidden","true"),N.textContent=R,y.replaceWith(N)})}),Mt||(document.addEventListener("keydown",y=>{if(y.key==="Escape"){if(F&&(F.phase==="done"||F.phase==="error")){Ht();return}F||Gt()}}),Mt=!0);const l=r.querySelector('[data-form="login"]');l==null||l.addEventListener("submit",y=>{y.preventDefault(),Fa(l)});const d=r.querySelector('[data-form="share"]');d==null||d.addEventListener("submit",y=>{y.preventDefault(),Pa(d)});const n=r.querySelector('[data-form="edit-cal"]');n&&(Xt(n),n.addEventListener("submit",y=>{y.preventDefault(),Ua(n)}));const s=r.querySelector('[data-form="edit-event"]');s==null||s.addEventListener("submit",y=>{y.preventDefault(),Ra(s)}),r.querySelectorAll('select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]').forEach(y=>{y.addEventListener("change",()=>{if(!b)return;const R=r.querySelector('[data-form="edit-event"]');if(!R)return;const N=new FormData(R),j=R.querySelector('input[name="allDay"]'),H=lt(N);H.endMode==="until"&&!H.until&&(H.until=Ye(String(N.get("start")??b.start??""))||ee(new Date)),b={...b,summary:String(N.get("summary")??b.summary),description:String(N.get("description")??b.description),location:String(N.get("location")??b.location),instanceId:Number(N.get("instanceId"))||b.instanceId,allDay:(j==null?void 0:j.checked)??b.allDay,start:String(N.get("start")??b.start??""),end:String(N.get("end")??b.end??"")||null,repeat:H,hasRrule:!!String(N.get("repeatFreq")??"").trim()},H.freq&&H.endMode==="until"&&(E==null?void 0:E.field)==="end"&&(E=null),m(),H.endMode==="until"&&requestAnimationFrame(()=>{var pe;const G=r.querySelector('input[name="repeatUntil"]');G==null||G.focus();try{(pe=G==null?void 0:G.showPicker)==null||pe.call(G)}catch{}})})});const i=r.querySelector('[data-form="create-cal"]');i&&(Xt(i),i.addEventListener("submit",y=>{y.preventDefault(),Ba(i)}));const p=r.querySelector('[data-form="create-ab"]');p==null||p.addEventListener("submit",y=>{y.preventDefault(),Ya(p)});const h=r.querySelector('[data-form="edit-ab"]');h==null||h.addEventListener("submit",y=>{y.preventDefault(),Ja(h)});const g=r.querySelector('[data-form="contact"]');g==null||g.addEventListener("submit",y=>{y.preventDefault(),Wa(g)});const O=r.querySelector('[data-form="task"]');if(O==null||O.addEventListener("submit",y=>{y.preventDefault(),Aa(O)}),O){const y=O.querySelector('select[name="instanceId"]');y==null||y.addEventListener("change",()=>{if(!W||!P)return;const R=Number(y.value);if(!Number.isFinite(R)||R<=0)return;const N=new FormData(O),j=String(N.get("due")??"").trim();P={...P,instanceId:R,parentUid:P.parentUid&&de.some(H=>H.uid===P.parentUid&&H.instanceId===R)?P.parentUid:null,summary:String(N.get("summary")??""),description:String(N.get("description")??""),status:String(N.get("status")??"NEEDS-ACTION"),due:j?new Date(j).toISOString():null,priority:Number(N.get("priority")??0),percent:Number(N.get("percent")??0)},m()})}const T=r.querySelector('[data-form="note"]');T==null||T.addEventListener("submit",y=>{y.preventDefault(),La(T)});const w=r.querySelector('input[data-action="contact-search"]');w==null||w.addEventListener("input",()=>{Te&&clearTimeout(Te),Te=setTimeout(()=>{je=w.value,I!==null&&(async()=>{try{await Me(I),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)});const L=r.querySelector('input[data-action="task-search"]');L==null||L.addEventListener("input",()=>{Te&&clearTimeout(Te),Te=setTimeout(()=>{pt=L.value,(async()=>{try{await ze(),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)});const te=r.querySelector('input[data-action="note-search"]');te==null||te.addEventListener("input",()=>{Te&&clearTimeout(Te),Te=setTimeout(()=>{ft=te.value,(async()=>{try{await rt(),m()}catch(y){v("error",y instanceof Error?y.message:"Search failed"),m()}})()},250)}),ja(),Ma(),qa()}async function Oa(e){var l,d;const t=Kt();if(t.length===0){v("error","No writable tasks selected"),m();return}const a=t.map(n=>({instanceId:n.instanceId,uri:n.uri}));if(e==="bulk-task-delete"){if(!confirm(`Delete ${t.length} task${t.length===1?"":"s"}? CalDAV clients will sync the removal.`))return;f=!0,A(),m();try{const n=await q.bulkTasks({op:"delete",items:a});ae=[],me&&t.some(s=>K(s.instanceId,s.uri)===me)&&(me=null,P=null,W=!1),await ze(),n.failed>0?v("error",`Deleted ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Deleted ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk delete failed")}finally{f=!1,m()}return}let o={};if(e==="bulk-task-status"){const n=r.querySelector("#bulk-task-status"),s=((l=n==null?void 0:n.value)==null?void 0:l.trim())??"";if(!s){v("error","Choose a status to apply"),m();return}o={status:s}}else if(e==="bulk-task-due"){const n=Be.trim();if(!n){v("error","Choose a due date to apply"),m();return}const s=/^\d{4}-\d{2}-\d{2}$/.test(n)?new Date(n+"T00:00:00"):new Date((n.length===16,n));if(Number.isNaN(s.getTime())){v("error","Invalid due date"),m();return}o={due:s.toISOString()}}else if(e==="bulk-task-clear-due")o={due:null};else if(e==="bulk-task-percent"){const n=r.querySelector("#bulk-task-percent"),s=((d=n==null?void 0:n.value)==null?void 0:d.trim())??"";if(s===""){v("error","Enter a percent complete (0–100)"),m();return}const i=Number(s);if(!Number.isFinite(i)||i<0||i>100){v("error","Percent must be between 0 and 100"),m();return}o={percent:Math.round(i)}}f=!0,A(),m();try{const n=await q.bulkTasks({op:"update",items:a,fields:o});if(await ze(),P&&!W){const i=K(P.instanceId,P.uri),p=de.find(h=>K(h.instanceId,h.uri)===i);p&&(P={...p})}const s=e==="bulk-task-status"?"status":e==="bulk-task-due"||e==="bulk-task-clear-due"?"due date":"percent";n.failed>0?v("error",`Updated ${s} on ${n.ok}, failed ${n.failed}${n.errors[0]?`: ${n.errors[0]}`:""}`):v("success",`Updated ${s} on ${n.ok} task${n.ok===1?"":"s"}`)}catch(n){v("error",n instanceof Error?n.message:"Bulk update failed")}finally{f=!1,m()}}async function Aa(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("status")??"NEEDS-ACTION"),d=String(t.get("due")??"").trim(),n=d?new Date(d).toISOString():null,s=Number(t.get("priority")??0),i=Number(t.get("percent")??0),p=String(t.get("parentUid")??"").trim(),h=p===""?null:p;f=!0,A(),m();try{if(W){const g=Number(t.get("instanceId"));if(!Number.isFinite(g)||g<=0)throw new Error("Select a calendar");const O=await q.createTask({instanceId:g,summary:a,description:o,status:l,due:n,priority:s,percent:i,parentUid:h});W=!1,me=K(O.task.instanceId,O.task.uri),P=O.task,v("success",h?"Subtask created":"Task created")}else if(P){const g=await q.updateTask(P.instanceId,P.uri,{summary:a,description:o,status:l,due:n,priority:s,percent:i,parentUid:h});P=g.task,me=K(g.task.instanceId,g.task.uri),v("success","Task saved")}await ze()}catch(g){v("error",g instanceof Error?g.message:"Save failed")}finally{f=!1,m()}}async function La(e){const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("dtstart")??"").trim(),d=l?new Date(l).toISOString():null;f=!0,A(),m();try{if(oe){const n=Number(t.get("instanceId"));if(!Number.isFinite(n)||n<=0)throw new Error("Select a calendar");const s=await q.createNote({instanceId:n,summary:a,description:o,dtstart:d});oe=!1,Ce=K(s.note.instanceId,s.note.uri),J=s.note,v("success","Note created")}else if(J){const n=await q.updateNote(J.instanceId,J.uri,{summary:a,description:o,dtstart:d});J=n.note,Ce=K(n.note.instanceId,n.note.uri),v("success","Note saved")}await rt()}catch(n){v("error",n instanceof Error?n.message:"Save failed")}finally{f=!1,m()}}function qa(){const e=r.querySelector('input[data-action="contact-photo"]');e&&e.addEventListener("change",()=>{(async()=>{var a;const t=(a=e.files)==null?void 0:a[0];if(e.value="",!!t){if(t.size>2.5*1024*1024){v("error","Photo is too large (max ~2 MB)"),m();return}try{const o=await $a(t);be=o,ce=`data:${t.type||"image/jpeg"};base64,${o}`,ve=!1,m()}catch(o){v("error",o instanceof Error?o.message:"Failed to read photo"),m()}}})()})}function Ma(){const e=r.querySelector('[data-form="create-cal"]');if(!e)return;const t=e.querySelector('input[name="holidays"]'),a=e.querySelector("#holidays-country-wrap"),o=e.querySelector('input[name="displayname"]'),l=e.querySelector('input[name="readOnly"]');if(!t||!a)return;const d=()=>{const n=t.checked;a.hidden=!n,o&&(o.required=!n,n&&!o.value.trim()?o.placeholder="Auto: Holidays (XX)":n||(o.placeholder="Work")),n&&l&&(l.checked=!0)};t.addEventListener("change",d),d()}async function Fa(e){const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("password")??"");f=!0,A(),m(),B.event("login.attempt",{username:a});try{const l=await q.login(a,o);u=l.user,St(l.ui),B.event("login.ok",{username:(u==null?void 0:u.username)??a}),await $e(),v("success","Signed in")}catch(l){B.warn("login.failed",l instanceof Error?l.message:l),v("error",l instanceof Error?l.message:"Login failed")}finally{f=!1,m()}}async function Pa(e){if(D===null)return;const t=new FormData(e),a=String(t.get("username")??""),o=String(t.get("access")??"read");_=!0,f=!0,A(),m();try{await q.share(D,a,o),await at(D),v("success",`Shared with ${a}`)}catch(l){v("error",l instanceof Error?l.message:"Share failed")}finally{f=!1,m()}}function ot(e){if(!b)return;const t=new FormData(e),a=e.querySelector('input[name="allDay"]');b={...b,summary:String(t.get("summary")??b.summary),description:String(t.get("description")??b.description),location:String(t.get("location")??b.location),instanceId:Number(t.get("instanceId"))||b.instanceId,allDay:(a==null?void 0:a.checked)??b.allDay,start:String(t.get("start")??b.start??""),end:String(t.get("end")??b.end??"")||null,repeat:lt(t),hasRrule:!!String(t.get("repeatFreq")??"").trim()}}function lt(e){const t=String(e.get("repeatFreq")??"").trim().toUpperCase();if(!t)return{freq:"",interval:1,until:null,count:null,byDay:[],endMode:"never"};const a=Math.max(1,Math.min(99,Number(e.get("repeatInterval")??1)||1)),o=String(e.get("repeatEndMode")??"never"),l=o==="until"||o==="count"?o:"never";let d=null,n=null;if(l==="until"){const i=String(e.get("repeatUntil")??"").trim();d=i?i.slice(0,10):null}else if(l==="count"){const i=Number(e.get("repeatCount")??0);n=Number.isFinite(i)&&i>0?Math.min(999,Math.round(i)):10}const s=e.getAll("repeatByDay").map(i=>String(i).toUpperCase()).filter(Boolean);return{freq:t,interval:a,until:d,count:n,byDay:s,endMode:l}}async function Ra(e){if(!b||!b.canWrite)return;const t=new FormData(e),a=String(t.get("summary")??"").trim(),o=String(t.get("description")??"").trim(),l=String(t.get("location")??"").trim(),d=t.get("allDay")==="on",n=String(t.get("start")??"").trim(),s=String(t.get("end")??"").trim(),i=Number(t.get("instanceId"))||b.instanceId,p=lt(t);if(!a){v("error","Title is required"),m();return}if(!n){v("error","Start is required"),m();return}let h,g;if(d)h=n.slice(0,10),g=s?s.slice(0,10):h;else if(/^\d{4}-\d{2}-\d{2}$/.test(n)){const L=Ct(n,s||null);h=new Date(L.start).toISOString(),g=L.end?new Date(L.end).toISOString():null}else h=new Date(n).toISOString(),g=s?new Date(s).toISOString():null;const O=b.instanceId,T=b.uri,w=Y;f=!0,A(),ge=!0,m(),B.event(w?"event.create":"event.update",{instanceId:i,uri:w?null:T,allDay:d,summary:a});try{const L={summary:a,description:o,location:l,allDay:d,start:h,end:g,instanceId:i,repeat:p},te=w?await q.createEvent(i,L):await q.updateEvent(O,T,L);(D===null||te.event.instanceId!==D)&&(D=te.event.instanceId),await we(),ge=!1,b=null,Y=!1,E=null,B.event(w?"event.created":"event.saved",{uri:te.event.uri,instanceId:te.event.instanceId}),v("success",w?"Event created":"Event saved")}catch(L){B.warn("event.save failed",L instanceof Error?L.message:L),v("error",L instanceof Error?L.message:"Save failed")}finally{f=!1,m()}}async function Ua(e){if(D===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim();f=!0,A(),m();try{const d=await q.updateCalendar(D,{displayname:a,description:o,color:l});_=!0,await $e(),D=d.calendar.id,await at(D),await we(),v("success","Calendar updated")}catch(d){v("error",d instanceof Error?d.message:"Update failed")}finally{f=!1,m()}}async function Ba(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??""),l=String(t.get("color")??"").trim(),d=t.get("holidays")==="on",n=String(t.get("holidayCountry")??"").trim(),s=t.get("readOnly")==="on";if(ue=!0,d&&!n){v("error","Select a country for the holidays calendar"),m();return}if(!d&&!a){v("error","Display name is required"),m();return}f=!0,A(),De=null,m();try{const i=await q.createCalendar({displayname:a,description:o,color:l,holidays:d,holidayCountry:d?n:void 0,readOnly:s});D=i.calendar.id,ue=!1,await $e();let p=`Created “${i.calendar.displayname}”`;const h=i.holidayImport??i.calendar.holidayImport;h&&(p+=`. Holidays imported: ${wt(h)}.`,De={ok:!0,message:wt(h)}),s&&(p+=" Calendar is read-only."),v("success",p)}catch(i){ue=!0,v("error",i instanceof Error?i.message:"Create failed")}finally{f=!1,m()}}async function _a(e){var o,l,d;const t=e.target.closest("[data-action]");if(!t)return;const a=t.dataset.action;if(a&&B.debug(`action:${a}`,{id:t.dataset.id,tab:t.dataset.tab,uri:t.dataset.uri}),a==="close-import-progress"){F&&(F.phase==="done"||F.phase==="error")&&Ht();return}if(a==="logout"){f=!0,B.event("logout");try{await q.logout()}catch{}u=null,Ee(),F=null,x=[],se=[],D=null,ie=[],I=null,Ne=[],z=null,k=null,Z=!1,re=!1,fe=!1,ue=!1,A(),f=!1,m();return}if(a==="select-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;D=n,De=null,f=!0,A(),m();try{await we()}catch(s){v("error",s instanceof Error?s.message:"Failed to load calendar")}finally{f=!1,m()}return}if(a==="edit-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!x.find(i=>i.id===n&&i.canShare))return;D=n,_=!0,Q=null,De=null,f=!0,A(),m();try{await at(n),await we()}catch(i){v("error",i instanceof Error?i.message:"Failed to open calendar")}finally{f=!1,m()}return}if(a==="close-cal-modal"){_=!1,m();return}if(a==="open-create-cal-modal"){ue=!0,_=!1,Q=null,A(),m();return}if(a==="close-create-cal-modal"){ue=!1,A(),m();return}if(a==="delete-cal"){const n=Number(t.dataset.id);if(!Number.isFinite(n)||!x.find(i=>i.id===n&&i.canShare))return;Q=n,_=!1,A(),m();return}if(a==="cancel-delete-cal"){Q=null,m();return}if(a==="confirm-delete-cal"){const n=Number(t.dataset.id),s=r.querySelector("#delete-cal-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;f=!0,A(),m();try{if(await q.deleteCalendar(n),D===n&&(D=null),Q=null,_=!1,se=[],he=[],await $e(),D===null){const i=Ft();i&&(D=i.id,await we())}v("success","Calendar deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{f=!1,m()}return}if(a==="month-today"){const n=new Date;X={y:n.getFullYear(),m:n.getMonth()},_e=null,f=!0,m();try{await we()}finally{f=!1,m()}return}if(a==="month-prev"||a==="month-next"){const n=a==="month-prev"?-1:1,s=new Date(X.y,X.m+n,1);X={y:s.getFullYear(),m:s.getMonth()},_e=null,f=!0,m();try{await we()}finally{f=!1,m()}return}if(a==="open-event"){e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;f=!0,A(),m();try{const i=await q.getEvent(n,s);b={...i.event,repeat:i.event.repeat??bt()},Y=!1,ge=!0,E=null,_=!1,Q=null}catch(i){v("error",i instanceof Error?i.message:"Failed to open event")}finally{f=!1,m()}return}if(a==="open-event-day"){e.stopPropagation();const n=t.dataset.day??"";_e=_e===n?null:n,m();return}if(a==="new-event-day"){const n=e.target;if((o=n==null?void 0:n.closest)!=null&&o.call(n,".month-event, .month-event-more"))return;const s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;if(D===null){v("error","Select a calendar first"),m();return}const i=x.find(p=>p.id===D);if(!i||i.readOnly||!(i.canShare||i.access==="readwrite")){v("error","This calendar is read-only"),m();return}Y=!0,b=ha(s,D),ge=!0,E=null,_=!1,Q=null,A(),m();return}if(a==="close-event-modal"){ge=!1,b=null,Y=!1,E=null,A(),m();return}if(a==="dt-open"){const n=t.dataset.dtField||"";if(!n)return;const s=r.querySelector('[data-form="edit-event"]');if(s&&b&&ot(s),(E==null?void 0:E.field)===n)E=null;else{const i=t.dataset.dtDateOnly==="1",p=t.dataset.dtClear!=="0",h=t.dataset.dtName||n;let g=Tt(n);!g&&(n==="due"||n==="dtstart"||n==="bulk-due")&&(g=st().start);const O=nt(g||ee(new Date)),[T,w]=O.date.split("-").map(Number);E={field:n,viewY:T,viewM:(w||1)-1,dateOnly:i,allowClear:p,name:h}}m();return}if(a==="dt-month-prev"||a==="dt-month-next"){if(!E)return;const n=a==="dt-month-prev"?-1:1,s=new Date(E.viewY,E.viewM+n,1);E={...E,viewY:s.getFullYear(),viewM:s.getMonth()},m();return}if(a==="dt-pick-day"){if(!E)return;const n=E.field,s=t.dataset.day??"";if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&b&&ot(i);const p=E.dateOnly;if(p)ke(n,s),E=null;else{const h=Tt(n),g=nt(h||st(s).start).hm;ke(n,`${s}T${g}`),E={...E,viewY:Number(s.slice(0,4)),viewM:Number(s.slice(5,7))-1}}if(n==="start"&&b&&!p&&b.end){const h=new Date(String(b.start)),g=new Date(String(b.end));!Number.isNaN(h.getTime())&&!Number.isNaN(g.getTime())&&g<=h&&ke("end",qe(new Date(h.getTime()+3600*1e3)))}m();return}if(a==="dt-pick-time"){if(!E||E.dateOnly)return;const n=E.field,s=t.dataset.hm??"";if(!/^\d{2}:\d{2}$/.test(s))return;const i=r.querySelector('[data-form="edit-event"]');i&&b&&ot(i);const p=Tt(n)||st().start,g=`${nt(p).date}T${s}`;if(ke(n,g),n==="start"&&b){b={...b,allDay:!1};const O=b.end?nt(String(b.end)):null,T=new Date(g);(!O||new Date(`${O.date}T${O.hm}`)<=T)&&ke("end",qe(new Date(T.getTime()+3600*1e3)))}E=null,m();return}if(a==="dt-today"){if(!E)return;const n=E.field,s=r.querySelector('[data-form="edit-event"]');s&&b&&ot(s);const i=ee(new Date);if(E.dateOnly)ke(n,i);else{const p=st(i);n==="start"?(ke("start",p.start),b&&!b.end&&ke("end",p.end)):n==="end"?ke("end",p.end):ke(n,p.start)}E=null,m();return}if(a==="dt-clear"){if(!E||!E.allowClear)return;const n=E.field,s=r.querySelector('[data-form="edit-event"]');s&&b&&ot(s),ke(n,null),E=null,m();return}if(a==="event-allday-toggle"){if(!b)return;const n=r.querySelector('[data-form="edit-event"]'),s=t.checked;if(n){const i=new FormData(n),p=String(i.get("start")??b.start??""),h=String(i.get("end")??b.end??"")||null;let g=p,O=h;if(s){const T=oa(p,h);g=T.start,O=T.end}else{const T=p.slice(0,10),w=(h||p).slice(0,10),L=Ct(T,w);g=L.start,O=L.end}b={...b,summary:String(i.get("summary")??b.summary),description:String(i.get("description")??b.description),location:String(i.get("location")??b.location),instanceId:Number(i.get("instanceId"))||b.instanceId,allDay:s,start:g,end:O,repeat:lt(i)}}else b={...b,allDay:s};E=null,m();return}if(a==="event-repeat-freq"||a==="event-repeat-end"){if(!b)return;const n=r.querySelector('[data-form="edit-event"]');if(!n)return;const s=new FormData(n),i=n.querySelector('input[name="allDay"]'),p=lt(s);b={...b,summary:String(s.get("summary")??b.summary),description:String(s.get("description")??b.description),location:String(s.get("location")??b.location),instanceId:Number(s.get("instanceId"))||b.instanceId,allDay:(i==null?void 0:i.checked)??b.allDay,start:String(s.get("start")??b.start??""),end:String(s.get("end")??b.end??"")||null,repeat:p,hasRrule:!!String(s.get("repeatFreq")??"").trim()},p.freq&&p.endMode==="until"&&(E==null?void 0:E.field)==="end"&&(E=null),m();return}if(a==="delete-event"){if(!b||!b.canWrite||Y||!confirm("Delete this event? CalDAV clients will sync the removal."))return;const n=b.instanceId,s=b.uri;f=!0,A(),m();try{await q.deleteEvent(n,s),ge=!1,b=null,await we(),v("success","Event deleted")}catch(i){v("error",i instanceof Error?i.message:"Delete failed")}finally{f=!1,m()}return}if(a==="info"){const n=t.dataset.info??"";za(n);return}if(a==="info-close"){Gt();return}if(a==="flash-close"){A(),m();return}if(a==="tab"){const n=t.dataset.tab;if(n==="calendars"||n==="contacts"||n==="tasks"||n==="notes"){C=n,B.event("tab",{tab:n}),n!=="calendars"&&(_=!1,Q=null),n!=="contacts"&&(le=null),A(),f=!0,m();try{n==="contacts"&&I!==null?await Me(I):n==="calendars"?await we():n==="tasks"?await ze():n==="notes"&&await rt()}catch(s){B.warn("tab load failed",s instanceof Error?s.message:s),v("error",s instanceof Error?s.message:"Failed to load")}finally{f=!1,m()}}return}if(a==="sort-task"||a==="sort-note"){const n=t.dataset.sort||"";if(!n)return;if(a==="sort-task"){Le===n?xe=xe==="asc"?"desc":"asc":(Le=n,xe=n==="due"||n==="summary"?"asc":"desc"),f=!0,m();try{await ze()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{f=!1,m()}}else{Ge===n?We=We==="asc"?"desc":"asc":(Ge=n,We="asc"),f=!0,m();try{await rt()}catch(s){v("error",s instanceof Error?s.message:"Sort failed")}finally{f=!1,m()}}return}if(a==="select-task"){if(e.target.closest("[data-stop-row], .task-check"))return;const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=de.find(p=>p.instanceId===n&&p.uri===s)??null;W=!1,me=K(n,s),P=i?{...i}:null,A(),m();return}if(a==="task-check"){e.preventDefault(),e.stopPropagation();const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=K(n,s),p=de.find(h=>K(h.instanceId,h.uri)===i);if(!p||!p.canWrite||p.readOnly)return;ae.includes(i)?ae=ae.filter(h=>h!==i):ae=[...ae,i],m();return}if(a==="task-select-all"){e.preventDefault();const n=de.filter(i=>i.canWrite&&!i.readOnly);n.length>0&&n.every(i=>ae.includes(K(i.instanceId,i.uri)))?ae=[]:ae=n.map(i=>K(i.instanceId,i.uri)),m();return}if(a==="bulk-task-clear"){ae=[],m();return}if(a==="bulk-task-status"||a==="bulk-task-due"||a==="bulk-task-clear-due"||a==="bulk-task-percent"||a==="bulk-task-delete"){Oa(a);return}if(a==="select-note"){const n=Number(t.dataset.instance),s=t.dataset.uri??"";if(!Number.isFinite(n)||!s)return;const i=tt.find(p=>p.instanceId===n&&p.uri===s)??null;oe=!1,Ce=K(n,s),J=i?{...i}:null,A(),m();return}if(a==="new-task"){W=!0,me=null,P={uri:"",instanceId:((l=Ve[0])==null?void 0:l.id)??0,calendarId:0,calendarName:"",calendarUri:"",uid:"",parentUid:null,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),m();return}if(a==="new-subtask"){if(!P||W||!P.uid||!P.canWrite)return;const n=P;W=!0,me=null,P={uri:"",instanceId:n.instanceId,calendarId:n.calendarId,calendarName:n.calendarName,calendarUri:n.calendarUri,uid:"",parentUid:n.uid,summary:"",description:"",status:"NEEDS-ACTION",due:null,priority:0,percent:0,completed:null,lastmodified:0,readOnly:!1,canWrite:!0},A(),m();return}if(a==="new-note"){oe=!0,Ce=null,J={uri:"",instanceId:((d=He[0])==null?void 0:d.id)??0,calendarId:0,calendarName:"",calendarUri:"",summary:"",description:"",dtstart:new Date().toISOString(),lastmodified:0,readOnly:!1,canWrite:!0},A(),m();return}if(a==="cancel-task"){W=!1,P=null,me=null,m();return}if(a==="cancel-note"){oe=!1,J=null,Ce=null,m();return}if(a==="delete-task"){if(!P||W||!confirm("Delete this task? CalDAV clients will sync the removal."))return;f=!0,A(),m();try{await q.deleteTask(P.instanceId,P.uri),me=null,P=null,await ze(),v("success","Task deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="delete-note"){if(!J||oe||!confirm("Delete this note? CalDAV clients will sync the removal."))return;f=!0,A(),m();try{await q.deleteNote(J.instanceId,J.uri),Ce=null,J=null,await rt(),v("success","Note deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="select-ab"){const n=Number(t.dataset.id);if(!Number.isFinite(n))return;I=n,fe=!1,Ae=null,z=null,k=null,Z=!1,re=!1,je="",Ne=[],ce=null,be=null,ve=!1,A(),f=!0,m();try{await Me(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contacts")}finally{f=!1,m()}return}if(a==="edit-ab"){e.stopPropagation();const n=Number(t.dataset.id);if(!Number.isFinite(n)||!ie.find(p=>p.id===n))return;const i=I!==n;I=n,fe=!0,re=!1,Ae=null,A(),i&&(z=null,k=null,Z=!1,je="",Ne=[],ce=null,be=null,ve=!1),f=!0,m();try{i&&await Me(n)}catch(p){v("error",p instanceof Error?p.message:"Failed to open address book")}finally{f=!1,m()}return}if(a==="close-ab-modal"){fe=!1,m();return}if(a==="select-contact"){const n=t.dataset.uri??"";if(!n)return;A();try{await ga(n)}catch(s){v("error",s instanceof Error?s.message:"Failed to load contact")}m();return}if(a==="new-contact"){if(I===null)return;va(),A(),m();return}if(a==="cancel-contact"||a==="close-contact-modal"){Z=!1,re=!1,k=null,z=null,ce=null,be=null,ve=!1,E=null,A(),m();return}if(a==="add-email"||a==="add-phone"||a==="add-custom"){if(!k)return;yt(),Array.isArray(k.emails)||(k.emails=[""]),Array.isArray(k.phones)||(k.phones=[{type:"cell",value:""}]),Array.isArray(k.custom)||(k.custom=[]),a==="add-email"?k.emails.length<10&&k.emails.push(""):a==="add-phone"?k.phones.length<10&&k.phones.push({type:"other",value:""}):k.custom.length<30&&k.custom.push({label:"",value:""}),m();return}if(a==="remove-email"){if(!k)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.emails)?k.emails:[""];k.emails=s.filter((i,p)=>p!==n),k.emails.length===0&&(k.emails=[""]),m();return}if(a==="remove-phone"){if(!k)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;const s=Array.isArray(k.phones)?k.phones:[{type:"cell",value:""}];k.phones=s.filter((i,p)=>p!==n),k.phones.length===0&&(k.phones=[{type:"cell",value:""}]),m();return}if(a==="remove-custom"){if(!k)return;yt();const n=Number(t.dataset.idx);if(!Number.isFinite(n))return;k.custom=(Array.isArray(k.custom)?k.custom:[]).filter((s,i)=>i!==n),m();return}if(a==="remove-photo"){ce=null,be=null,ve=!0,k&&(k.hasPhoto=!1),m();return}if(a==="delete-contact"){if(I===null||!z||!confirm("Delete this contact? CardDAV clients will sync the removal."))return;f=!0,A(),re=!0,m();try{await q.deleteContact(I,z),z=null,k=null,Z=!1,re=!1,E=null,ce=null,await $e(),v("success","Contact deleted")}catch(n){v("error",n instanceof Error?n.message:"Delete failed")}finally{f=!1,m()}return}if(a==="delete-ab"){e.stopPropagation();const n=Number(t.dataset.id??I);if(!Number.isFinite(n)||!ie.find(i=>i.id===n))return;le=n,fe=!1,re=!1,A(),m();return}if(a==="cancel-delete-ab"){le=null,m();return}if(a==="confirm-delete-ab"){const n=Number(t.dataset.id),s=r.querySelector("#delete-ab-confirm");if(!Number.isFinite(n)||!(s!=null&&s.checked))return;const i=ie.find(h=>h.id===n);if(!i)return;const p=(i.cardCount??0)>0;f=!0,A(),m();try{await q.deleteAddressBook(n,p),I===n&&(I=null,Ne=[],k=null,z=null,Z=!1),le=null,fe=!1,re=!1,await $e(),I===null&&ie.length>0&&(I=ie[0].id,await Me(I)),v("success","Address book deleted")}catch(h){v("error",h instanceof Error?h.message:"Delete failed")}finally{f=!1,m()}return}if(a==="export-ab"){if(I===null)return;fe=!0,f=!0,A(),m();try{const{blob:n,filename:s}=await q.exportAddressBook(I),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}return}if(a==="export-contact"){if(I===null||!z||Z)return;re=!0,f=!0,A(),m();try{const{blob:n,filename:s}=await q.exportContact(I,z),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}return}if(a==="revoke"){const n=t.dataset.href??"";if(!n||D===null||!confirm("Revoke access for this user?"))return;_=!0,f=!0,A(),m();try{await q.revoke(D,n),await at(D),v("success","Share revoked")}catch(s){v("error",s instanceof Error?s.message:"Revoke failed")}finally{f=!1,m()}return}if(a==="export-cal"){if(D===null)return;_=!0,f=!0,A(),m();try{const{blob:n,filename:s}=await q.exportCalendar(D),i=URL.createObjectURL(n),p=document.createElement("a");p.href=i,p.download=s,p.click(),URL.revokeObjectURL(i),v("success",`Exported ${s}`)}catch(n){v("error",n instanceof Error?n.message:"Export failed")}finally{f=!1,m()}}}function ja(){const e=r.querySelector('input[data-action="import-cal"]');e&&e.addEventListener("change",()=>{Ka(e)});const t=r.querySelector('input[data-action="import-ab"]');t&&t.addEventListener("change",()=>{Va(t)})}async function Va(e){var o;if(I===null)return;const t=(o=e.files)==null?void 0:o[0];if(e.value="",!t)return;const a=I;fe=!0,f=!0,A(),Ae=null,Ee(),F={kind:"contacts",fileName:t.name,fileSizeLabel:jt(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Vt(),m();try{const l=await Jt(t,s=>{if(!F||F.phase!=="reading")return;F={...F,readPercent:s};const i=r.querySelector(".import-progress-bar"),p=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),p&&s!==null&&(p.textContent=`Reading file… ${s}%`)});Re("uploading",{readPercent:100}),Re("processing",{processPercent:0}),B.event("import.contacts.start",{file:t.name,bytes:t.size,abId:a});const d=await q.importAddressBook(a,l,s=>{Wt(s)}),n=wt(d);Ae={ok:!0,message:n},await $e(),I===a&&await Me(a),Ee(),Re("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),v("success",`Import finished for “${t.name}”: ${n}.`)}catch(l){const d=l instanceof Error?l.message:"Import failed";Ae={ok:!1,message:d},Ee(),Re("error",{ok:!1,resultMessage:d}),v("error",d)}finally{f=!1,m()}}function yt(){if(!k)return;const e=r.querySelector('[data-form="contact"]');if(!e)return;const t=new FormData(e);k.firstname=String(t.get("firstname")??""),k.lastname=String(t.get("lastname")??""),k.fullname=String(t.get("fullname")??""),k.org=String(t.get("org")??""),k.title=String(t.get("title")??""),k.url=String(t.get("url")??""),k.note=String(t.get("note")??"");const a=String(t.get("birthday")??"").trim();k.birthday=a&&/^\d{4}-\d{2}-\d{2}/.test(a)?a.slice(0,10):null,k.address={street:String(t.get("street")??""),city:String(t.get("city")??""),region:String(t.get("region")??""),postal:String(t.get("postal")??""),country:String(t.get("country")??"")};const o=[];let l=0;for(;t.has(`email_${l}`);)o.push(String(t.get(`email_${l}`)??"")),l++;o.length&&(k.emails=o);const d=[];for(l=0;t.has(`phone_value_${l}`);)d.push({type:String(t.get(`phone_type_${l}`)??"other"),value:String(t.get(`phone_value_${l}`)??"")}),l++;d.length&&(k.phones=d);const n=[];for(l=0;t.has(`custom_label_${l}`)||t.has(`custom_value_${l}`);)n.push({label:String(t.get(`custom_label_${l}`)??""),value:String(t.get(`custom_value_${l}`)??"")}),l++;k.custom=n}function Ha(e){const t=new FormData(e),a=[];let o=0;for(;t.has(`email_${o}`);){const s=String(t.get(`email_${o}`)??"").trim();s&&a.push(s),o++}const l=[];for(o=0;t.has(`phone_value_${o}`);){const s=String(t.get(`phone_value_${o}`)??"").trim();s&&l.push({type:String(t.get(`phone_type_${o}`)??"other"),value:s}),o++}const d=[];for(o=0;t.has(`custom_label_${o}`)||t.has(`custom_value_${o}`);){const s=String(t.get(`custom_label_${o}`)??"").trim(),i=String(t.get(`custom_value_${o}`)??"").trim();(s||i)&&d.push({label:s,value:i}),o++}const n={firstname:String(t.get("firstname")??"").trim(),lastname:String(t.get("lastname")??"").trim(),fullname:String(t.get("fullname")??"").trim(),org:String(t.get("org")??"").trim(),title:String(t.get("title")??"").trim(),emails:a,phones:l,address:{street:String(t.get("street")??"").trim(),city:String(t.get("city")??"").trim(),region:String(t.get("region")??"").trim(),postal:String(t.get("postal")??"").trim(),country:String(t.get("country")??"").trim()},url:String(t.get("url")??"").trim(),note:String(t.get("note")??"").trim(),birthday:(()=>{const s=String(t.get("birthday")??"").trim();return s&&/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):null})(),custom:d};return ve?n.removePhoto=!0:be&&(n.photoBase64=be),n}async function Wa(e){if(I===null)return;const t=Ha(e);f=!0,A(),re=!0,m();try{if(Z){const a=await q.createContact(I,t);Z=!1,z=a.contact.uri,k=null,re=!1,ce=null,be=null,ve=!1,E=null,v("success","Contact created")}else z&&(z=(await q.updateContact(I,z,t)).contact.uri,k=null,re=!1,ce=null,be=null,ve=!1,E=null,v("success","Contact saved"));try{await $e()}catch(a){if(console.error(a),I!==null)try{await Me(I)}catch{}}}catch(a){v("error",a instanceof Error?a.message:"Save failed")}finally{f=!1,m()}}async function Ya(e){const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();if(a){f=!0,A(),m();try{const l=await q.createAddressBook({displayname:a,description:o});I=l.addressbook.id,z=null,k=null,Z=!1,je="",await $e(),v("success",`Address book “${l.addressbook.displayname}” created`)}catch(l){v("error",l instanceof Error?l.message:"Create failed")}finally{f=!1,m()}}}async function Ja(e){if(I===null)return;const t=new FormData(e),a=String(t.get("displayname")??"").trim(),o=String(t.get("description")??"").trim();fe=!0,f=!0,A(),m();try{await q.updateAddressBook(I,{displayname:a,description:o}),await $e(),v("success","Address book updated")}catch(l){v("error",l instanceof Error?l.message:"Update failed")}finally{f=!1,m()}}function za(e){const t=nn[e];if(!t)return;const a=r.querySelector("#info-modal"),o=r.querySelector("#info-modal-title"),l=r.querySelector("#info-modal-body");if(!a||!o||!l)return;o.textContent=t.title,l.innerHTML=t.paragraphs.map(n=>`<p>${c(n)}</p>`).join(""),a.hidden=!1,document.body.classList.add("info-modal-open");const d=a.querySelector(".info-modal-close");d==null||d.focus()}function Gt(){const e=r.querySelector("#info-modal");e&&(e.hidden=!0,document.body.classList.remove("info-modal-open"))}async function Ka(e){var o;if(D===null)return;const t=(o=e.files)==null?void 0:o[0];if(e.value="",!t)return;const a=D;_=!0,f=!0,A(),De=null,Ee(),F={kind:"calendar",fileName:t.name,fileSizeLabel:jt(t.size),phase:"reading",readPercent:0,processPercent:null,processCurrent:0,processTotal:0,processImported:0,processUpdated:0,processSkipped:0,startedAt:Date.now(),elapsedSec:0,resultMessage:null,ok:null},Vt(),m();try{const l=await Jt(t,s=>{if(!F||F.phase!=="reading")return;F={...F,readPercent:s};const i=r.querySelector(".import-progress-bar"),p=r.querySelector("[data-import-status-line]");i&&s!==null&&(i.classList.remove("is-indeterminate"),i.style.width=`${s}%`),p&&s!==null&&(p.textContent=`Reading file… ${s}%`)});Re("uploading",{readPercent:100}),Re("processing",{processPercent:0}),B.event("import.calendar.start",{file:t.name,bytes:t.size,calId:a});const d=await q.importCalendar(a,l,s=>{Wt(s)}),n=wt(d);De={ok:!0,message:n},D===a&&await we(),Ee(),Re("done",{ok:!0,resultMessage:`${n} (from “${t.name}”)`}),v("success",`Import finished for “${t.name}”: ${n}.`)}catch(l){const d=l instanceof Error?l.message:"Import failed";De={ok:!1,message:d},Ee(),Re("error",{ok:!1,resultMessage:d}),v("error",d)}finally{f=!1,m()}}na()}const aa=document.getElementById("app");if(!aa)throw new Error("#app missing");rn(aa);
