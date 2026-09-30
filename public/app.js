const statusEl=document.querySelector('#status');
const video=document.querySelector('#avatar');
const wrap=document.querySelector('.teacher');
const caption=document.querySelector('#caption');
const topic=document.querySelector('#topic');
const q=document.querySelector('#q');
let room=null;

async function start(){
  try{
    statusEl.textContent='AUTHENTICATING';

    const configRes=await fetch('/api/config');
    const c=await configRes.json();

    if(!c.ready){
      statusEl.textContent='SETUP REQUIRED';
      caption.textContent='Server configuration is incomplete.';
      return;
    }

    const tokenRes=await fetch('/api/token',{method:'POST'});
    if(!tokenRes.ok) throw new Error('Token request failed');

    const t=await tokenRes.json();

    room=new LivekitClient.Room({
      adaptiveStream:true,
      dynacast:true
    });

    room.on(LivekitClient.RoomEvent.TrackSubscribed,(track)=>{
      if(track.kind===LivekitClient.Track.Kind.Video){
        video.srcObject=new MediaStream([track.mediaStreamTrack]);
        wrap.classList.add('connected');
      }
      if(track.kind===LivekitClient.Track.Kind.Audio){
        const audio=document.querySelector('#remoteAudio');
        audio.srcObject=new MediaStream([track.mediaStreamTrack]);
        audio.autoplay=true;
        audio.playsInline=true;
        audio.muted=false;
        audio.play().catch(console.error);
      }
    });

    room.on(LivekitClient.RoomEvent.ParticipantConnected,()=>{
      statusEl.textContent='AURA LIVE';
      caption.textContent='Your teacher is ready. Ask anything.';
    });

    await room.connect(t.serverUrl,t.token);

    statusEl.textContent='AURA LIVE';
    caption.textContent='Your teacher is ready. Ask anything.';
    document.querySelector('#start').textContent='Class active';

  }catch(err){
    console.error(err);
    statusEl.textContent='CONNECTION ERROR';
    caption.textContent='AURA could not connect. Please try again.';
  }
}

function ask(){
  const text=q.value.trim();
  if(!text)return;

  caption.textContent='You: '+text;
  topic.textContent='THINKING';
  q.value='';

  if(room){
    room.localParticipant.sendText(text,{topic:'lk.chat'});
  }
}

document.querySelector('#start').onclick=start;
document.querySelector('#send').onclick=ask;

q.addEventListener('keydown',(e)=>{
  if(e.key==='Enter')ask();
});

document.querySelector('#mic').onclick=async()=>{
  if(!room)return;
  await room.localParticipant.setMicrophoneEnabled(true);
  caption.textContent='Listening…';
};
