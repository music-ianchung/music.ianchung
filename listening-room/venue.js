const requestedHall=new URLSearchParams(location.search).get('hall');
const chosenHall=['vineyard','greenhouse'].includes(requestedHall)?requestedHall:'chamber';
document.body.classList.toggle('vineyard',chosenHall==='vineyard');
document.body.classList.toggle('greenhouse',chosenHall==='greenhouse');
document.querySelectorAll('.halllink').forEach(a=>{if(a.search.includes(chosenHall))a.setAttribute('aria-current','page');});
const venueScript=document.createElement('script');venueScript.src=({chamber:'space.js',vineyard:'orchestra.js',greenhouse:'greenhouse.js'}[chosenHall])+'?v=20261104-4';venueScript.onload=()=>window.setupRituals?.();document.body.append(venueScript);
