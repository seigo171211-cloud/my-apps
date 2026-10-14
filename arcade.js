// Shared keyboard / sound / overlay helpers for the 2-player games.
// P1 = WASD + F/Space/左Shift, P2 = arrows + Enter / ( / ) / テンキー0 / 右Shift.
'use strict';
const Arcade=(()=>{
  const KEYS=[
    {up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],act:['KeyF','Space','ShiftLeft']},
    {up:['ArrowUp'],down:['ArrowDown'],left:['ArrowLeft'],right:['ArrowRight'],act:['Enter','NumpadEnter','Slash','Numpad0','ShiftRight','Period']}
  ];
  const ALL=new Set(KEYS.flatMap(k=>Object.values(k).flat()));
  const held=new Set();
  const h={press(){},release(){},pause(){},key(){},blur(){}};
  const isHeld=(p,a)=>KEYS[p][a].some(c=>held.has(c));
  const axis=p=>({x:(isHeld(p,'right')?1:0)-(isHeld(p,'left')?1:0),y:(isHeld(p,'down')?1:0)-(isHeld(p,'up')?1:0)});
  function who(code){for(let p=0;p<2;p++)for(const a in KEYS[p])if(KEYS[p][a].includes(code))return[p,a];return null}
  addEventListener('keydown',e=>{
    if(e.target&&e.target.closest&&e.target.closest('input,textarea'))return;
    if(ALL.has(e.code)||e.code==='Escape')e.preventDefault();
    held.add(e.code);
    if(e.repeat)return;
    unlock();
    if(e.code==='Escape'||e.code==='KeyP'){h.pause();return}
    if(e.code==='KeyM'){toggleMute();return}
    const w=who(e.code);
    if(w)h.press(w[0],w[1]);else h.key(e.code);
  });
  addEventListener('keyup',e=>{held.delete(e.code);const w=who(e.code);if(w)h.release(w[0],w[1])});
  addEventListener('blur',()=>{held.clear();h.blur()});

  // ---- sound (tiny synth, no assets) ----
  let AC=null,muted=false;
  try{muted=localStorage.getItem('arcade-muted')==='1'}catch(e){}
  function unlock(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
  function tone(f,d=.1,type='square',v=.12,slide=1,delay=0){
    if(muted||!AC)return;
    const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);
    if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);
    o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.03);
  }
  function noise(d=.4,v=.3,freq=1200,delay=0){
    if(muted||!AC)return;
    const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
    s.buffer=b;f.type='lowpass';f.frequency.value=freq;g.gain.value=v;
    s.connect(f).connect(g).connect(AC.destination);s.start(AC.currentTime+delay);
  }
  const fanfare=()=>[523,659,784,1046].forEach((f,i)=>tone(f,.22,'square',.1,1,i*.13));
  const jingle=()=>{tone(523,.12,'square',.1);tone(659,.12,'square',.1,1,.12);tone(784,.25,'square',.1,1,.24)};
  function toggleMute(){muted=!muted;try{localStorage.setItem('arcade-muted',muted?'1':'0')}catch(e){}paintMute()}
  function paintMute(){const b=document.getElementById('muteBtn');if(b)b.textContent=muted?'🔇 音 OFF (M)':'🔊 音 ON (M)'}

  // ---- overlays ----
  const $=id=>document.getElementById(id);
  const show=id=>{$(id).hidden=false},hide=id=>{$(id).hidden=true};

  // Both players press their action key to start. ids: element ids per player (may be missing).
  function readyCheck(ids,onAll){
    const r=[false,false];
    const label=p=>typeof TouchPad!=='undefined'&&TouchPad.isTouch?'ボタンを押して準備OK':(p?'Enter':'F')+' を押して準備OK';
    function paint(){ids.forEach((id,p)=>{const el=$(id);if(!el)return;el.classList.toggle('on',r[p]);el.textContent=r[p]?'準備OK ✓':label(p)})}
    paint();
    return{
      press(p){if(r[p])return;r[p]=true;tone(p?660:520,.08,'square',.1);paint();if(r[0]&&r[1])setTimeout(()=>{if(r[0]&&r[1]){r[0]=r[1]=false;paint();onAll()}},260)},
      reset(){r[0]=r[1]=false;paint()},
    };
  }

  // On-screen controls (touch devices only; see touch.js). Virtual presses go through the same handlers as keys.
  function vDown(p,a){const c=KEYS[p][a][0];if(held.has(c))return;held.add(c);unlock();h.press(p,a)}
  function vUp(p,a){const c=KEYS[p][a][0];if(!held.has(c))return;held.delete(c);h.release(p,a)}
  function touch(controls,extra){return !!(typeof TouchPad!=='undefined'&&TouchPad.init(Object.assign({controls,down:vDown,up:vUp,pause:()=>h.pause(),unlock},extra||{})))}

  function loop(step){let last=performance.now();function f(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt,now);requestAnimationFrame(f)}requestAnimationFrame(f)}

  addEventListener('DOMContentLoaded',()=>{paintMute();const b=$('muteBtn');if(b)b.onclick=()=>{unlock();toggleMute();b.blur()}});
  return{KEYS,held,isHeld,axis,touch,on:o=>Object.assign(h,o),tone,noise,fanfare,jingle,unlock,show,hide,$,readyCheck,loop,get muted(){return muted}};
})();
