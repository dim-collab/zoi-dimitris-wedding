(() => {
  'use strict';
  const $=id=>document.getElementById(id), config=window.WEDDING_CONFIG;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let opening=false,submitting=false,submitted=false;
  const configured=!!(config.supabaseUrl&&config.supabasePublishableKey);
  const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{/* Session state still prevents repeat clicks. */}}};
  const storageKey='zoi-dimitris-rsvp-2027';
  let submissionId=storage.get(storageKey+'-id');
  const makeId=()=>crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
  if(!submissionId){submissionId=makeId();storage.set(storageKey+'-id',submissionId);}
  const endpointKey=storageKey+'-saved-'+config.supabaseUrl;
  const openInvitation=()=>{
    if(opening)return;opening=true;$('passport').setAttribute('aria-expanded','true');$('intro').classList.add('opening');$('passport').disabled=true;
    setTimeout(()=>{$('intro').hidden=true;$('invitation').hidden=false;window.scrollTo({top:0,behavior:'instant'});$('details').focus({preventScroll:true});},motion.matches?0:1750);
  };
  $('passport').addEventListener('click',openInvitation);
  document.querySelector('.skip-link').addEventListener('click',e=>{if($('invitation').hidden){e.preventDefault();openInvitation();}});
  $('back-cover').addEventListener('click',()=>{$('invitation').hidden=true;$('intro').hidden=false;$('intro').classList.remove('opening');$('passport').disabled=false;$('passport').setAttribute('aria-expanded','false');opening=false;window.scrollTo(0,0);$('passport').focus({preventScroll:true});});
  const photo=$('couple-photo');photo.addEventListener('error',()=>{if(!photo.src.endsWith('couple-placeholder.svg')){photo.src='./assets/couple-placeholder.svg';photo.alt='Προσωρινή θέση για τη φωτογραφία μας';}});photo.addEventListener('load',()=>{if(!photo.src.endsWith('couple-placeholder.svg'))photo.alt='Η Ζωή και ο Δημήτρης';});photo.src=config.couplePhoto;
  $('storage-note').textContent=configured?'Η απάντησή σας θα αποθηκευτεί και θα είναι ορατή μόνο στο ζευγάρι.':'Προεπισκόπηση φόρμας: η αποθήκευση δεν έχει ενεργοποιηθεί. Οι απαντήσεις δεν αποστέλλονται στο ζευγάρι.';
  const showPanel=()=>{$('rsvp-panel').hidden=false;$('rsvp-toggle').setAttribute('aria-expanded','true');};
  $('rsvp-toggle').addEventListener('click',()=>{const expanded=$('rsvp-toggle').getAttribute('aria-expanded')==='true';$('rsvp-panel').hidden=expanded;$('rsvp-toggle').setAttribute('aria-expanded',String(!expanded));if(!expanded&&!submitted)$('guest-name').focus({preventScroll:true});});
  document.querySelector('a[href="#rsvp"]').addEventListener('click',showPanel);
  document.querySelectorAll('input[name="attendance"]').forEach(r=>r.addEventListener('change',()=>{const yes=r.value==='yes';$('count-field').hidden=!yes;$('guest-count').disabled=!yes;$('guest-count').required=yes;if(!yes)$('guest-count').value='';$('form-error').textContent='';}));
  const confirm=(attendance,saved)=>{
    submitted=saved;$('rsvp-form').hidden=true;$('confirmation').hidden=false;
    $('confirmation-title').textContent=window.RSVPCore.confirmation[attendance];
    $('confirmation-detail').textContent=saved?'Η απάντησή σας αποθηκεύτηκε. Για αλλαγές, επικοινωνήστε με το ζευγάρι.':'Δοκιμαστική επιβεβαίωση. Η απάντησή σας ΔΕΝ αποθηκεύτηκε και ΔΕΝ αποστάλθηκε.';
    $('reset-demo').hidden=saved;$('confirmation').focus({preventScroll:true});
  };
  $('reset-demo').addEventListener('click',()=>{$('confirmation').hidden=true;$('rsvp-form').hidden=false;$('guest-name').focus({preventScroll:true});});
  const saved=storage.get(endpointKey);
  if(configured&&['yes','no'].includes(saved)){confirm(saved,true);}
  $('rsvp-form').addEventListener('submit',async e=>{
    e.preventDefault();if(submitting||submitted)return;
    const attendance=document.querySelector('input[name="attendance"]:checked')?.value;
    const payload=window.RSVPCore.validate($('guest-name').value,attendance,$('guest-count').value);
    if(payload.error){$('form-error').textContent=payload.error;const target=payload.field==='attendance'?document.querySelector('input[name="attendance"]'):$(payload.field);target.focus();return;}
    $('form-error').textContent='';
    if(!configured){confirm(attendance,false);return;}
    submitting=true;$('submit-button').disabled=true;$('submit-button').textContent='ΑΠΟΣΤΟΛΗ…';
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const url=new URL(config.supabaseUrl);
      if(url.protocol!=='https:')throw Error('Invalid endpoint');
      const response=await fetch(url.origin+'/rest/v1/rpc/submit_wedding_rsvp',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',apikey:config.supabasePublishableKey},body:JSON.stringify({p_id:submissionId,p_name:payload.guestName,p_attending:payload.attending,p_guest_count:payload.guestCount})});
      if(!response.ok)throw Error('Submission failed');
      const result=await response.json();if(!['saved','already_saved'].includes(result))throw Error('Unexpected response');
      storage.set(endpointKey,attendance);confirm(attendance,true);
    }catch{
      $('form-error').textContent='Δεν μπορέσαμε να επιβεβαιώσουμε την αποθήκευση. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά. Αν το πρόβλημα επιμένει, επικοινωνήστε με το ζευγάρι.';
    }finally{clearTimeout(timer);submitting=false;$('submit-button').disabled=false;$('submit-button').innerHTML='ΥΠΟΒΟΛΗ ΑΠΑΝΤΗΣΗΣ <span aria-hidden="true">↗</span>';}
  });
})();
