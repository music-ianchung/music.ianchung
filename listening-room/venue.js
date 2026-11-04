const requestedHall=new URLSearchParams(location.search).get('hall');
if(!['chamber','vineyard','greenhouse'].includes(requestedHall)){
 document.documentElement.classList.add('choosingHall');
 document.title='잠시, 음악 — 당신의 공간을 골라보세요';
 for(const el of document.body.children)if(el.tagName!=='SCRIPT')el.inert=true;
 const picker=document.createElement('main');picker.id='roomPicker';
 picker.innerHTML=`<div class="pickerTop"><a href="/" class="pickerBrand">잠시, 음악<small>THE LISTENING ROOM</small></a><a class="pickerHome" href="/">Ian Chung ↗</a></div><section class="pickerContent" aria-labelledby="pickerTitle"><div class="pickerIntro"><small>A LITTLE ROOM FOR YOU</small><h1 id="pickerTitle">오늘은, 어디에 머물까요.</h1><p>마음이 향하는 공간을 골라보세요.</p></div><nav class="roomChoices" aria-label="음악 공간 선택"><a class="roomChoice" href="?hall=chamber" aria-label="체임버홀 선택"><div class="roomImage"><img src="chamber-preview.webp?v=20261105-11" alt="높은 천장과 부드러운 빛 아래 작은 피아노 무대" width="720" height="480" fetchpriority="high"></div><div class="roomCaption"><span>01 / CHAMBER</span><span aria-hidden="true">↗</span></div><h2>체임버홀</h2><p>작은 피아노 곁에, 잠시.</p></a><a class="roomChoice" href="?hall=vineyard" aria-label="빈야드홀 선택"><div class="roomImage"><img src="vineyard-preview.webp" alt="촛불이 감싼 거대한 오케스트라 연주홀" width="720" height="480"></div><div class="roomCaption"><span>02 / VINEYARD</span><span aria-hidden="true">↗</span></div><h2>빈야드홀</h2><p>촛불 사이로 번지는, 깊은 울림.</p></a><a class="roomChoice" href="?hall=greenhouse" aria-label="별빛 청음실 선택"><div class="roomImage"><img src="starlight-preview.webp" alt="별과 오로라 아래 테이블과 무드등이 놓인 유리 공간" width="720" height="480"></div><div class="roomCaption"><span>03 / STARLIGHT</span><span aria-hidden="true">↗</span></div><h2>별빛 청음실</h2><p>별 아래, 나만의 고요.</p></a></nav></section><div class="pickerBottom">서두르지 않아도 괜찮아요.<span>YOU WERE NEVER LOST</span></div>`;
 document.body.append(picker);
}else{
 document.documentElement.classList.remove('choosingHall');
 const back=document.createElement('a');back.className='backToRooms';back.href=location.pathname;back.textContent='← 다른 공간 고르기';$('welcome').firstElementChild.prepend(back);
const chosenHall=['vineyard','greenhouse'].includes(requestedHall)?requestedHall:'chamber';
document.body.classList.toggle('vineyard',chosenHall==='vineyard');
document.body.classList.toggle('greenhouse',chosenHall==='greenhouse');
document.querySelectorAll('.halllink').forEach(a=>{if(a.search.includes(chosenHall))a.setAttribute('aria-current','page');});
const venueScript=document.createElement('script');venueScript.src=({chamber:'space.js',vineyard:'orchestra.js',greenhouse:'greenhouse.js'}[chosenHall])+'?v=20261105-11';venueScript.onload=()=>window.setupRituals?.();document.body.append(venueScript);

}
