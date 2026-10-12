// Pure validation shared by the UI and automated checks. No dependencies.
(function(root){
  const confirmation = {
    yes: 'Σας ευχαριστούμε! Ανυπομονούμε να γιορτάσουμε μαζί σας!',
    no: 'Σας ευχαριστούμε που μας ενημερώσατε! Θα μας λείψετε!'
  };
  function validate(name,attendance,count){
    const guestName=String(name||'').trim();
    if(guestName.length<2||guestName.length>120) return {error:'Συμπληρώστε το όνομά σας (2–120 χαρακτήρες).',field:'guest-name'};
    if(!['yes','no'].includes(attendance)) return {error:'Επιλέξτε ΝΑΙ ή ΟΧΙ.',field:'attendance'};
    if(attendance==='yes'&&!/^[1-5]$/.test(String(count))) return {error:'Επιλέξτε από 1 έως 5 άτομα.',field:'guest-count'};
    return {guestName,attending:attendance==='yes',guestCount:attendance==='yes'?Number(count):0};
  }
  root.RSVPCore={validate,confirmation};
})(typeof window!=='undefined'?window:globalThis);
