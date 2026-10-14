// On-screen controls for phones/tablets. Does nothing on devices with a mouse/keyboard,
// so the PC version of every game behaves exactly as before.
// Layout: phone held in landscape, P1 uses the left half, P2 the right half.
'use strict';
// Canvas roundRect is missing on iOS 15 and older; fill it in (browsers that have it are untouched).
if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r=0){
    let [a,b,c,d]=Array.isArray(r)?(r.length===1?[r[0],r[0],r[0],r[0]]:r.length===2?[r[0],r[1],r[0],r[1]]:r.length===3?[r[0],r[1],r[2],r[1]]:r):[r,r,r,r];
    const m=Math.min(Math.abs(w),Math.abs(h))/2;[a,b,c,d]=[a,b,c,d].map(v=>Math.min(+v||0,m));
    this.moveTo(x+a,y);this.lineTo(x+w-b,y);this.arcTo(x+w,y,x+w,y+b,b);this.lineTo(x+w,y+h-c);this.arcTo(x+w,y+h,x+w-c,y+h,c);
    this.lineTo(x+d,y+h);this.arcTo(x,y+h,x,y+h-d,d);this.lineTo(x,y+a);this.arcTo(x,y,x+a,y,a);this.closePath();return this;
  };
}
const TouchPad=(()=>{
  // iPadOS Safari reports itself as a Mac, and with a keyboard/trackpad attached it matches (hover:hover),
  // so also treat a multi-touch "Macintosh" as touch. Real Macs report maxTouchPoints 0.
  const isTouch=matchMedia('(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&/Macintosh/.test(navigator.userAgent));
  const stick=[{x:0,y:0,on:false},{x:0,y:0,on:false}];
  const CSS=`
body.touch{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
body.touch header.bar{display:none}
body.touch .wrap{padding:0}
body.touch .frame{width:min(100vw,calc(100dvh * 16 / 9));border-radius:0;box-shadow:none}
body.touch .touchnote{display:block}
.tc-zone{position:absolute;bottom:0;width:50%;height:100%;pointer-events:none;z-index:20}
.tc-zone.p0{left:0}.tc-zone.p1{right:0}
.tc-pad{position:absolute;bottom:3cqw;width:max(17cqw,108px);aspect-ratio:1;border-radius:50%;pointer-events:auto;touch-action:none;
  background:radial-gradient(circle,rgba(255,255,255,.10) 0 30%,rgba(255,255,255,.05) 31% 100%);border:2px solid color-mix(in srgb,var(--pc) 55%,transparent)}
.tc-pad,.tc-btn{opacity:.5;transition:opacity .15s}.tc-pad.on,.tc-btn.on{opacity:1}
.p0 .tc-pad{left:3cqw}.p1 .tc-pad{right:3cqw}
.tc-pad i{position:absolute;width:30%;height:30%;display:grid;place-items:center;color:#fff;opacity:.55;font-style:normal;font-size:max(2.2cqw,13px)}
.tc-pad i.on{opacity:1;color:var(--pc);text-shadow:0 0 8px var(--pc)}
.tc-pad .u{left:35%;top:4%}.tc-pad .d{left:35%;bottom:4%}.tc-pad .l{left:4%;top:35%}.tc-pad .r{right:4%;top:35%}
.tc-knob{position:absolute;left:50%;top:50%;width:38%;height:38%;margin:-19% 0 0 -19%;border-radius:50%;background:color-mix(in srgb,var(--pc) 70%,#fff 10%);opacity:.75;box-shadow:0 0 14px var(--pc)}
.tc-btn{position:absolute;bottom:5cqw;width:max(9.5cqw,60px);aspect-ratio:1;border-radius:50%;pointer-events:auto;touch-action:none;display:grid;place-items:center;text-align:center;
  font:800 max(1.5cqw,11px)/1.2 "M PLUS Rounded 1c",sans-serif;color:#fff;background:color-mix(in srgb,var(--pc) 30%,transparent);border:2px solid color-mix(in srgb,var(--pc) 75%,transparent)}
.tc-btn.on{background:var(--pc);color:#111}
.p0 .tc-btn.act{left:calc(3cqw + max(17cqw,108px) + 2cqw)}.p1 .tc-btn.act{right:calc(3cqw + max(17cqw,108px) + 2cqw)}
.p0 .tc-btn.k-left{left:3cqw}.p0 .tc-btn.k-right{left:calc(4cqw + max(9.5cqw,60px))}
.p1 .tc-btn.k-right{right:3cqw}.p1 .tc-btn.k-left{right:calc(4cqw + max(9.5cqw,60px))}
.p0 .tc-btn.k-up{left:calc(7cqw + 2 * max(9.5cqw,60px))}.p1 .tc-btn.k-up{right:calc(7cqw + 2 * max(9.5cqw,60px))}
.p0 .tc-btn.k-down{left:calc(7cqw + 2 * max(9.5cqw,60px));bottom:calc(7cqw + max(9.5cqw,60px));width:max(7cqw,46px)}
.p1 .tc-btn.k-down{right:calc(7cqw + 2 * max(9.5cqw,60px));bottom:calc(7cqw + max(9.5cqw,60px));width:max(7cqw,46px)}
.tc-pause{position:absolute;top:7cqw;right:1.2cqw;opacity:.7;z-index:21;width:max(4cqw,34px);aspect-ratio:1;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:#fff;font:800 13px sans-serif;pointer-events:auto}
.tc-home{display:inline-block;color:#fff;font-size:max(1.4cqw,12px);border:1px solid rgba(255,255,255,.35);padding:.6cqw 1.6cqw;border-radius:999px;text-decoration:none}
.tc-rotate{display:none;position:fixed;inset:0;z-index:50;background:#0b0b12;color:#fff;place-items:center;text-align:center;font:800 18px/1.7 "M PLUS Rounded 1c",sans-serif;padding:24px}
.tc-rotate svg{width:64px;height:64px;stroke:#fff;fill:none;stroke-width:2;margin-bottom:12px}
@media (orientation:portrait){body.touch .tc-rotate{display:grid}}
`;
  // 4-way pad (or 8-way analog stick when kind==='stick'); slides between directions under one finger.
  function pad(zone,p,kind,o){
    const el=document.createElement('div');el.className='tc-pad';
    const marks={up:'▲',down:'▼',left:'◀',right:'▶'},cls={up:'u',down:'d',left:'l',right:'r'},I={};
    for(const a in marks){const i=document.createElement('i');i.className=cls[a];i.textContent=marks[a];el.appendChild(i);I[a]=i}
    let knob=null;if(kind==='stick'){knob=document.createElement('div');knob.className='tc-knob';el.appendChild(knob)}
    let id=null;const cur=new Set();
    function set(next){
      for(const a of cur)if(!next.has(a)){cur.delete(a);I[a].classList.remove('on');o.up(p,a)}
      for(const a of next)if(!cur.has(a)){cur.add(a);I[a].classList.add('on');o.down(p,a)}
    }
    function move(e){
      const r=el.getBoundingClientRect(),R=r.width/2;
      let x=(e.clientX-r.left-R)/R,y=(e.clientY-r.top-R)/R;const m=Math.hypot(x,y);
      if(m>1){x/=m;y/=m}
      const next=new Set();
      if(kind==='stick'){
        stick[p].x=m<.18?0:x;stick[p].y=m<.18?0:y;stick[p].on=true;
        if(knob)knob.style.transform=`translate(${x*R*.62}px,${y*R*.62}px)`;
        if(m>=.3){if(x>.38)next.add('right');if(x<-.38)next.add('left');if(y>.38)next.add('down');if(y<-.38)next.add('up')}
      }else if(m>=.22){
        if(Math.abs(x)>Math.abs(y))next.add(x>0?'right':'left');else next.add(y>0?'down':'up');
      }
      set(next);
    }
    function end(e){if(e.pointerId!==id)return;id=null;el.classList.remove('on');set(new Set());stick[p].x=stick[p].y=0;stick[p].on=false;if(knob)knob.style.transform=''}
    el.addEventListener('pointerdown',e=>{e.preventDefault();if(id!==null)return;id=e.pointerId;el.classList.add('on');o.unlock&&o.unlock();move(e)});
    addEventListener('pointermove',e=>{if(e.pointerId===id)move(e)});
    addEventListener('pointerup',end);addEventListener('pointercancel',end);
    zone.appendChild(el);
  }
  function btn(zone,p,a,label,cls,o){
    const b=document.createElement('div');b.className='tc-btn '+cls;b.textContent=label;let id=null;
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(id!==null)return;id=e.pointerId;b.classList.add('on');o.unlock&&o.unlock();o.down(p,a)});
    const end=e=>{if(e.pointerId!==id)return;id=null;b.classList.remove('on');o.up(p,a)};
    addEventListener('pointerup',end);addEventListener('pointercancel',end);
    zone.appendChild(b);
  }
  // Stop double-tap / pinch zoom (iOS ignores user-scalable=no alone), and undo it if it happens anyway:
  // with touch-action:none on the page the user could not pinch back out.
  function noZoom(){
    const VP='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    const vp=document.querySelector('meta[name="viewport"]');if(vp)vp.content=VP;
    document.documentElement.style.touchAction='none';
    for(const t of['gesturestart','gesturechange','gestureend'])document.addEventListener(t,e=>e.preventDefault(),{passive:false});
    let last=0;
    document.addEventListener('touchend',e=>{const n=e.timeStamp;if(n-last<350)e.preventDefault();last=n},{passive:false});
    document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
    const vv=window.visualViewport;
    if(vv&&vp){const fix=()=>{if(vv.scale>1.01){vp.content=VP+', minimum-scale=1';setTimeout(()=>{vp.content=VP;scrollTo(0,0)},60)}};vv.addEventListener('resize',fix);fix()}
  }
  // o: {frame, controls:[spec,spec], down(p,a), up(p,a), pause(), unlock()}
  // spec: {pad:'dpad'|'stick'|'lr'|null, act:'label'|null}
  function init(o){
    if(!isTouch)return false;
    document.body.classList.add('touch');
    const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
    const frame=o.frame||document.querySelector('.frame');
    o.controls.forEach((s,p)=>{
      if(!s)return;
      const z=document.createElement('div');z.className='tc-zone p'+p;z.style.setProperty('--pc',`var(--p${p+1})`);
      if(s.pad==='lr'){btn(z,p,'left','◀','k-left',o);btn(z,p,'right','▶','k-right',o);btn(z,p,'up','ジャンプ','k-up',o);btn(z,p,'down','▼','k-down',o)}
      else if(s.pad)pad(z,p,s.pad,o);
      if(s.act)btn(z,p,'act',s.act,'act',o);
      frame.appendChild(z);
    });
    const pb=document.createElement('button');pb.className='tc-pause';pb.textContent='II';pb.setAttribute('aria-label','一時停止');
    pb.addEventListener('click',()=>o.pause());frame.appendChild(pb);
    const row=document.querySelector('#ovPause .row');
    if(row){const a=document.createElement('a');a.className='tc-home';a.href='/';a.textContent='アプリ一覧へ';row.parentNode.appendChild(a)}
    const rot=document.createElement('div');rot.className='tc-rotate';
    rot.innerHTML='<div><svg viewBox="0 0 64 64"><rect x="20" y="8" width="24" height="44" rx="4"/><path d="M50 40a18 18 0 0 1-18 18M28 54l4 4-4 4"/></svg><br>スマホを横向きにして遊んでね</div>';
    document.body.appendChild(rot);
    document.querySelectorAll('.touchnote').forEach(n=>n.textContent=o.note||'スマホは横向きにして、画面のボタンで遊べます');
    addEventListener('contextmenu',e=>e.preventDefault());
    noZoom();
    return true;
  }
  return{isTouch,init,stick};
})();
