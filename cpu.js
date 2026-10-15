// "CPU と対戦" mode switch shared by the versus games. Off by default, so 2-player play is unchanged.
// When on, the CPU drives player 2 and player 1 may use either key set.
'use strict';
const CpuMode=(()=>{
  const st={on:false,level:1};
  const LV=['よわい','ふつう','つよい'];
  let key='',onChange=()=>{};
  const CSS=`
body.cpu .ctrl.p2,body.cpu .keys .p2{opacity:.45}
body.cpu .tc-zone.p1,body.cpu .pcol{display:none}
.cpurow .seg button{min-width:7cqw}
`;
  function save(){try{localStorage.setItem(key,JSON.stringify(st))}catch(e){}}
  function apply(){
    document.body.classList.toggle('cpu',st.on);
    document.querySelectorAll('[data-pname="1"]').forEach(el=>el.textContent=st.on?'CPU（'+LV[st.level]+'）':el.dataset.orig);
    document.querySelectorAll('[data-pname="0"]').forEach(el=>el.textContent=st.on?'YOU':el.dataset.orig);
    document.querySelectorAll('.cpulv').forEach(el=>el.hidden=!st.on);
    document.querySelectorAll('.cpurow .seg').forEach(seg=>seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===(seg.dataset.k==='on'?+st.on:st.level)))));
  }
  // game: storage key; before: element the switch row is inserted in front of; cb(st) after every change.
  function mount(game,before,cb){
    key='cpu-'+game;onChange=cb||onChange;
    try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s){st.on=!!s.on;st.level=Math.max(0,Math.min(2,s.level|0))}}catch(e){}
    const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
    document.querySelectorAll('[data-pname]').forEach(el=>el.dataset.orig=el.textContent);
    const row=document.createElement('div');row.className='row cpurow';
    row.innerHTML='<span>あいて</span><div class="seg" data-k="on"><button data-v="0">2人で対戦</button><button data-v="1">CPUと対戦</button></div>'+
      '<span class="cpulv">強さ</span><div class="seg cpulv" data-k="level"><button data-v="0">よわい</button><button data-v="1">ふつう</button><button data-v="2">つよい</button></div>';
    before.parentNode.insertBefore(row,before);
    row.querySelectorAll('.seg').forEach(seg=>seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      if(seg.dataset.k==='on')st.on=b.dataset.v==='1';else st.level=+b.dataset.v;
      save();apply();onChange(st);b.blur();
    }));
    apply();onChange(st);
  }
  const name=p=>st.on?(p?'CPU':'YOU'):'PLAYER '+(p+1);
  const short=p=>st.on?(p?'CPU':'あなた'):'P'+(p+1);
  const winText=w=>st.on?(w?'CPU WIN…':'YOU WIN!'):`PLAYER ${w+1} WIN!`;
  // difficulty pick: lv(easy, normal, hard)
  const lv=(...v)=>v[st.level];
  return{get on(){return st.on},get level(){return st.level},mount,name,short,winText,lv,LV};
})();
