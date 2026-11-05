(()=>{
 if(new URLSearchParams(location.search).get('hall')!=='greenhouse')return;
 const previous=window.onGreenhouseDesk;let tree=false,source=null,gain=null;
 function stop(){if(source){source.stop();source.disconnect();source=null;}gain?.disconnect();gain=null;}
 function volume(){if(gain)gain.gain.setTargetAtTime((+$('volume').value/100)*.095*(window.hallRitual?.duck??1),audio.currentTime,.4);}
 function fire(){stop();initAudio();audio.resume().catch(()=>{});const seconds=12,b=audio.createBuffer(2,audio.sampleRate*seconds,audio.sampleRate);for(let c=0;c<2;c++){const data=b.getChannelData(c);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)*.997;data[i]=brown*.55;}for(let k=0;k<150;k++){const at=Math.floor(Math.random()*(data.length-audio.sampleRate*.1)),len=Math.floor(audio.sampleRate*(.008+Math.random()*.06)),power=.08+Math.random()*.28;for(let j=0;j<len;j++)data[at+j]+=(Math.random()*2-1)*Math.exp(-j/(len*.16))*power;}}source=audio.createBufferSource();source.buffer=b;source.loop=true;gain=audio.createGain();source.connect(gain);gain.connect(audio.destination);volume();source.start();}
 function ui(){for(const id of ['listeningDesk','play','programtoggle']){const el=$(id);if(el)el.hidden=tree;}if(tree){$('title').hidden=false;$('title').textContent='모닥불 곁에서';$('playstate').textContent='FIRELIGHT';}}
 window.onGreenhouseDesk=index=>{stop();const was=tree;tree=index>=36;previous(tree?-1:index);if(tree){window.dispatchEvent(new CustomEvent('nightSilence',{detail:true}));$('deskControls').hidden=true;fire();}else if(was)window.dispatchEvent(new CustomEvent('nightSilence',{detail:false}));ui();};
 const base=window.mediaVolume;window.mediaVolume=v=>{base?.(v);if(tree){volume();ui();}};
 $('volume').addEventListener('input',volume);addEventListener('pagehide',stop);$('leaveHall').addEventListener('click',stop);$('returnHall').addEventListener('click',()=>{if(tree)fire();});
})();
