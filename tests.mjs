import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const core=fs.readFileSync(new URL('./rsvp-core.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
function harness(configured=false,fetchImpl=async()=>({ok:true,json:async()=> 'saved'}),reduced=false){
  const ids=['passport','intro','invitation','details','back-cover','couple-photo','storage-note','rsvp-panel','rsvp-toggle','guest-name','count-field','guest-count','form-error','confirmation','confirmation-title','confirmation-detail','reset-demo','rsvp-form','submit-button'];
  const elements={};
  function el(){return {events:{},attrs:{},hidden:false,disabled:false,value:'',textContent:'',src:'',classList:{add(){},remove(){}},addEventListener(t,fn){this.events[t]=fn;},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},focus(){this.focused=true;}};}
  ids.forEach(id=>elements[id]=el());elements.invitation.hidden=true;elements['rsvp-toggle'].attrs['aria-expanded']='false';
  const yes=el(),no=el();yes.value='yes';no.value='no';let attendance=null;
  const skip=el(),link=el(),timers=[],store=new Map(),requests=[];
  const context={console,URL,AbortController,crypto:{randomUUID:()=> '8b70d6c2-9980-4000-9000-2336989c3230'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},matchMedia:()=>({matches:reduced}),setTimeout:(fn,time)=>{timers.push({fn,time});return timers.length;},clearTimeout(){},fetch:async(...args)=>{requests.push(args);return fetchImpl(...args);},document:{getElementById:id=>elements[id],querySelectorAll:()=>[yes,no],querySelector:s=>s==='.skip-link'?skip:s==='a[href="#rsvp"]'?link:s.includes(':checked')?(attendance==='yes'?yes:attendance==='no'?no:null):yes}};
  context.window=context;context.scrollTo=()=>{};context.WEDDING_CONFIG={couplePhoto:'./assets/couple-photo.jpg',supabaseUrl:configured?'https://test.supabase.co':'',supabasePublishableKey:configured?'sb_publishable_test':''};
  vm.createContext(context);vm.runInContext(core,context);vm.runInContext(app,context);
  return {context,elements,requests,timers,choose(value){attendance=value;(value==='yes'?yes:no).events.change();},submit(){return elements['rsvp-form'].events.submit({preventDefault(){}});}};
}
const demo=harness();const validate=demo.context.RSVPCore.validate;
for(const n of [1,2,3,4,5])check(validate('Δημήτρης','yes',n).guestCount===n,'Valid count');
for(const n of ['',0,6,1.5,'2abc'])check(!!validate('Ζωή','yes',n).error,'Invalid count rejected');
check(validate('Ζωή','no',5).guestCount===0,'Negative answer has no guests');
check(!!validate('','yes',1).error,'Name required');check(!!validate('Ζωή',undefined,1).error,'Attendance required');
demo.elements.passport.events.click();check(demo.elements.passport.disabled,'Opening prevents repeat click');demo.timers.find(x=>x.time===1750).fn();check(demo.elements.intro.hidden&&!demo.elements.invitation.hidden,'Passport reveals invitation');check(demo.elements.details.focused,'Reveal moves keyboard focus');demo.elements['back-cover'].events.click();check(!demo.elements.intro.hidden&&demo.elements.invitation.hidden,'Return to cover');
demo.choose('yes');check(!demo.elements['count-field'].hidden&&demo.elements['guest-count'].required,'YES reveals required count');demo.elements['guest-count'].value='3';demo.choose('no');check(demo.elements['count-field'].hidden&&demo.elements['guest-count'].disabled&&demo.elements['guest-count'].value==='','NO hides and clears count');
demo.elements['guest-name'].value='Ζωή';await demo.submit();check(demo.requests.length===0,'Demo does not send request');check(demo.elements['confirmation-detail'].textContent.includes('ΔΕΝ αποθηκεύτηκε'),'Demo honest about storage');check(demo.elements['confirmation-title'].textContent===demo.context.RSVPCore.confirmation.no,'Negative message');
demo.elements['reset-demo'].events.click();check(!demo.elements['rsvp-form'].hidden,'Demo can reset');demo.choose('yes');await demo.submit();check(demo.elements['form-error'].textContent.includes('1 έως 5'),'Missing affirmative count blocks submission');
const live=harness(true);live.elements['guest-name'].value='Δημήτρης';live.choose('yes');live.elements['guest-count'].value='2';await live.submit();check(live.requests.length===1,'Configured request sent');const sent=JSON.parse(live.requests[0][1].body);check(sent.p_guest_count===2&&sent.p_attending,'Correct payload');check(live.elements['confirmation-detail'].textContent.includes('αποθηκεύτηκε'),'Success only after API acknowledgment');await live.submit();check(live.requests.length===1,'Duplicate submission blocked');
const fail=harness(true,async()=>{throw Error('Offline');});fail.elements['guest-name'].value='Ζωή';fail.choose('no');await fail.submit();check(!fail.elements['rsvp-form'].hidden&&!fail.elements['submit-button'].disabled,'Network error preserves editable form');check(fail.elements['form-error'].textContent.includes('Δεν μπορέσαμε'),'Failure feedback in Greek');await fail.submit();check(JSON.parse(fail.requests[0][1].body).p_id===JSON.parse(fail.requests[1][1].body).p_id,'Retries reuse idempotency ID');
const reduced=harness(false,undefined,true);reduced.elements.passport.events.click();check(reduced.timers.some(x=>x.time===0),'Reduced motion instant reveal');
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const map=html.match(/id="location-link" href="([^"]+)/)[1].replaceAll('&amp;','&');const url=new URL(map);check(url.searchParams.get('query').includes('9WJM+WM'),'Maps preserves literal plus code');check(url.hostname==='www.google.com'&&url.searchParams.get('api')==='1','Real Maps URL');
for(const asset of [...html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map(m=>m[1]))check(fs.existsSync(new URL('./'+asset,import.meta.url)),'Relative asset exists: '+asset);
const css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');check(css.includes('@media(max-width:600px)')&&css.includes('@media(max-width:360px)'),'Mobile breakpoints');check(css.includes('prefers-reduced-motion')&&css.includes('rotateY(-155deg)'),'3D and reduced motion styles');
console.log(`${checks} checks passed. DOM-event simulation, validation, assets, and responsive CSS checks. No real browser or live Supabase used.`);
