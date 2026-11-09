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
  // Try audible viewport playback; browser policy may require a muted fallback.
  const coupleVideo = $('couple-video');
  const videoError = $('video-error');
  const videoHelp = $('video-help');
  if (coupleVideo) {
    let inView = false;
    let playAttempt = 0;
    coupleVideo.muted = false;
    coupleVideo.volume = 1;
    const mutedHint = 'Το βίντεο παίζει χωρίς ήχο λόγω ρύθμισης του browser. Ανοίξτε τον ήχο από το εικονίδιο ηχείου στα χειριστήρια του βίντεο.';
    const manualHint = 'Πατήστε αναπαραγωγή στα χειριστήρια του βίντεο.';
    const pauseVideo = () => { playAttempt++; coupleVideo.pause(); };
    const autoplayWhenVisible = async () => {
      if (!inView || document.hidden || motion.matches || coupleVideo.ended) return;
      const attempt = ++playAttempt;
      try {
        await coupleVideo.play();
        if (attempt === playAttempt && videoHelp) videoHelp.textContent = coupleVideo.muted ? mutedHint : 'Μπορείτε να ρυθμίσετε την ένταση από τα χειριστήρια του βίντεο.';
      } catch {
        if (attempt !== playAttempt || !inView || document.hidden) return;
        if (!coupleVideo.muted) {
          coupleVideo.muted = true;
          try {
            await coupleVideo.play();
            if (attempt === playAttempt && videoHelp) videoHelp.textContent = mutedHint;
            return;
          } catch { /* Keep native controls for browsers that block all autoplay. */ }
        }
        if (attempt === playAttempt && videoHelp) videoHelp.textContent = manualHint;
      }
    };
    // The passport tap is an existing gesture. It can help, but does not guarantee
    // permission for delayed audible playback on Safari or restrictive browsers.
    $('passport').addEventListener('click', () => {
      coupleVideo.muted = false;
      coupleVideo.volume = 1;
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const entry = entries[0];
        const visible = entry.isIntersecting && entry.intersectionRatio >= (inView ? 0.15 : 0.35);
        if (visible === inView) return;
        inView = visible;
        if (inView) autoplayWhenVisible(); else pauseVideo();
      }, { threshold: [0, 0.15, 0.35, 0.5, 0.75, 1] });
      observer.observe(coupleVideo);
    } else if (videoHelp) videoHelp.textContent = manualHint;
    coupleVideo.addEventListener('volumechange', () => {
      if (videoHelp && !coupleVideo.paused) videoHelp.textContent = coupleVideo.muted ? mutedHint : 'Μπορείτε να ρυθμίσετε την ένταση από τα χειριστήρια του βίντεο.';
    });
    const showVideoError = () => { if (videoError) videoError.hidden = false; };
    coupleVideo.addEventListener('error', showVideoError);
    const source = coupleVideo.querySelector('source');
    if (source) source.addEventListener('error', showVideoError);
    coupleVideo.addEventListener('loadeddata', () => { if (videoError) videoError.hidden = true; });
    $('back-cover').addEventListener('click', () => { inView = false; pauseVideo(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseVideo(); else autoplayWhenVisible();
    });
    if (motion.matches && videoHelp) videoHelp.textContent = manualHint;
    motion.addEventListener?.('change', () => {
      if (motion.matches) { pauseVideo(); if (videoHelp) videoHelp.textContent = manualHint; }
      else autoplayWhenVisible();
    });
  }
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
