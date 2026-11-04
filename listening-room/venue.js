const chosenHall=new URLSearchParams(location.search).get('hall')==='vineyard'?'vineyard':'chamber';
document.body.classList.toggle('vineyard',chosenHall==='vineyard');
document.querySelectorAll('.halllink').forEach(a=>{if(a.search.includes(chosenHall))a.setAttribute('aria-current','page');});
const venueScript=document.createElement('script');venueScript.src=(chosenHall==='vineyard'?'orchestra.js':'space.js')+'?v=20261104-2';venueScript.onload=()=>window.setupRituals?.();document.body.append(venueScript);
