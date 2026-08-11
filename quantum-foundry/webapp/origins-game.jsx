import { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* =========================================================
   OEQL: ORIGINS
   All target states computed by the actual Python simulator.
   All quantum simulation uses the verified JS engine.
   Terra Infinita: the final state. The horizon.
   ========================================================= */

// ── Level data (targets from core/statevector.py) ──────────────────────────
const K = 0.707107;
const LEVELS = [
  { id:"l1", title:"First Light",      n:1, par:1, sec:60,
    brief:"Transform |0⟩ into |1⟩.",
    hint:"Place X on q0.",
    target:[[0,0],[1,0]] },
  { id:"l2", title:"Superposition",    n:1, par:1, sec:60,
    brief:"Create (|0⟩+|1⟩)/√2 — equal probability, both at once.",
    hint:"Place H on q0.",
    target:[[K,0],[K,0]] },
  { id:"l3", title:"Phase Twist",      n:1, par:2, sec:60,
    brief:"Create (|0⟩+i|1⟩)/√2. Same odds as |+⟩ but rotated in phase.",
    hint:"H then S on q0.",
    target:[[K,0],[0,K]] },
  { id:"l4", title:"Entanglement",     n:2, par:2, sec:65,
    brief:"Bell state (|00⟩+|11⟩)/√2 — two qubits, one fate.",
    hint:"H on q0, then CX control=q0 target=q1.",
    target:[[K,0],[0,0],[0,0],[K,0]] },
  { id:"l5", title:"Anti-Correlation", n:2, par:3, sec:65,
    brief:"(|01⟩+|10⟩)/√2 — measuring one always reveals the opposite.",
    hint:"X on q1, H on q0, CX 0→1.",
    target:[[0,0],[K,0],[K,0],[0,0]] },
  { id:"l6", title:"Imaginary Bell",   n:2, par:3, sec:70,
    brief:"(|00⟩+i|11⟩)/√2 — entangled and phase-shifted.",
    hint:"H on q0, CX 0→1, S on q0.",
    target:[[K,0],[0,0],[0,0],[0,K]] },
  { id:"l7", title:"Three-Body",       n:3, par:3, sec:70,
    brief:"GHZ-3: (|000⟩+|111⟩)/√2 — three qubits, one shared fate.",
    hint:"H q0, CX 0→1, CX 0→2.",
    target:[[K,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[K,0]] },
  { id:"l8", title:"Dark Phase",       n:3, par:4, sec:75,
    brief:"(|000⟩−|111⟩)/√2 — GHZ with sign reversal. Invisible locally.",
    hint:"H q0, CX 0→1, CX 0→2, Z q0.",
    target:[[K,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[-K,0]] },
  { id:"l9", title:"Four-Body",        n:4, par:4, sec:80,
    brief:"GHZ-4: maximum entanglement across four qubits.",
    hint:"H q0, CX 0→1, CX 0→2, CX 0→3.",
    target:[[K,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[K,0]] },
  { id:"ti", title:"TERRA INFINITA",   n:4, par:7, sec:120,
    brief:"The horizon. H all qubits, entangle, phase-twist. The final state.",
    hint:"H q0-q3, CX 0→1, CX 2→3, S q0, S q2, CZ q1 q3.",
    target:[[.25,0],[0,.25],[.25,0],[0,.25],[0,.25],[-.25,0],[0,.25],[-.25,0],
            [.25,0],[0,.25],[-.25,0],[0,-.25],[0,.25],[-.25,0],[0,-.25],[.25,0]] },
];

// ── JS Quantum Engine (verified against Python statevector.py) ──────────────
class C {
  constructor(re=0,im=0){this.re=re;this.im=im;}
  static add(a,b){return new C(a.re+b.re,a.im+b.im);}
  static mul(a,b){return new C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);}
  static conj(a){return new C(a.re,-a.im);}
  abs2(){return this.re*this.re+this.im*this.im;}
}
function gm(g,t=0){
  const k=.707107,c=Math.cos(t/2),s=Math.sin(t/2);
  if(g==='H')return[[new C(k),new C(k)],[new C(k),new C(-k)]];
  if(g==='X')return[[new C(0),new C(1)],[new C(1),new C(0)]];
  if(g==='Y')return[[new C(0,0),new C(0,-1)],[new C(0,1),new C(0)]];
  if(g==='Z')return[[new C(1),new C(0)],[new C(0),new C(-1)]];
  if(g==='S')return[[new C(1),new C(0)],[new C(0),new C(0,1)]];
  if(g==='T')return[[new C(1),new C(0)],[new C(0),new C(Math.cos(Math.PI/4),Math.sin(Math.PI/4))]];
  if(g==='RZ')return[[new C(Math.cos(-t/2),Math.sin(-t/2)),new C(0)],[new C(0),new C(Math.cos(t/2),Math.sin(t/2))]];
  return[[new C(1),new C(0)],[new C(0),new C(1)]];
}
class Sim {
  constructor(n){this.n=n;this.dim=1<<n;this.s=Array.from({length:1<<n},()=>new C(0));this.s[0]=new C(1);}
  a1(g,q,t=0){const m=gm(g,t),b=1<<q,ns=this.s.slice();for(let i=0;i<this.dim;i++)if(!(i&b)){const j=i|b,a0=this.s[i],a1=this.s[j];ns[i]=C.add(C.mul(m[0][0],a0),C.mul(m[0][1],a1));ns[j]=C.add(C.mul(m[1][0],a0),C.mul(m[1][1],a1));}this.s=ns;}
  cx(c,t){const cb=1<<c,tb=1<<t,ns=this.s.slice();for(let i=0;i<this.dim;i++)if(i&cb)ns[i]=this.s[i^tb];this.s=ns;}
  cz(c,t){const cb=1<<c,tb=1<<t;for(let i=0;i<this.dim;i++)if((i&cb)&&(i&tb))this.s[i]=C.mul(this.s[i],new C(-1));}
  sw(a,b){const ab=1<<a,bb=1<<b,ns=this.s.slice();for(let i=0;i<this.dim;i++)if(((i&ab)!==0)!==((i&bb)!==0))ns[i]=this.s[i^ab^bb];this.s=ns;}
}
function runCircuit(ops,n){
  const sim=new Sim(n);
  const sorted=[...ops].sort((a,b)=>a.slot-b.slot);
  for(const op of sorted){
    try{
      if(['H','X','Y','Z','S','T'].includes(op.type))sim.a1(op.type,op.qubit);
      else if(op.type==='CX')sim.cx(op.control,op.target);
      else if(op.type==='CZ')sim.cz(op.control,op.target);
    }catch(e){}
  }
  return sim.s;
}
function fidelity(sv,tgt){
  let re=0,im=0;
  for(let i=0;i<sv.length;i++){
    const t=new C(tgt[i][0],tgt[i][1]);
    const p=C.mul(C.conj(t),sv[i]);
    re+=p.re;im+=p.im;
  }
  return re*re+im*im;
}

// ── Sound ───────────────────────────────────────────────────────────────────
function beep(freq=440,dur=0.06,vol=0.18,type='sine'){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur);
  }catch(e){}
}
function chord(freqs,dur=0.3){freqs.forEach((f,i)=>setTimeout(()=>beep(f,dur),i*80));}
function winChord(){chord([523,659,784,1047],0.35);}
function loseSound(){[440,370,300].forEach((f,i)=>setTimeout(()=>beep(f,0.15,'sawtooth'),i*100));}
function terraSound(){[261,329,392,523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,1.2,'sine',0.1),i*120));}

// ── Constants ───────────────────────────────────────────────────────────────
const GATES=['H','X','Z','S','CX','CZ'];
const GATE_DESC={H:'Superposition',X:'NOT/Flip',Z:'Phase flip',S:'¼ turn',CX:'Entangle (CNOT)',CZ:'Ctrl-Phase'};
const MAX_SLOTS=8;
const CELL=52;

// ── Styles ──────────────────────────────────────────────────────────────────
const P='#5ffbc0',A='#ffb454',BG='#060f0b',PAN='#0a1812',LINE='#12201a',INK='#cfe9dd',DIM='#6f9686';
const mono='"IBM Plex Mono","JetBrains Mono",ui-monospace,Menlo,monospace';
const base={fontFamily:mono,background:BG,color:INK,minHeight:'100vh',
  backgroundImage:'linear-gradient(rgba(95,251,192,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(95,251,192,.025) 1px,transparent 1px)',
  backgroundSize:'28px 28px'};

// ── Helper components ────────────────────────────────────────────────────────
const Btn=({onClick,children,style,disabled})=>(
  <button onClick={onClick} disabled={disabled} style={{
    background:'transparent',border:`1px solid ${P}`,color:P,fontFamily:mono,
    fontSize:12,letterSpacing:'.08em',textTransform:'uppercase',padding:'9px 20px',
    cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style
  }}>{children}</button>
);

// ── MENU ────────────────────────────────────────────────────────────────────
function Menu({onPlay,highScore}){
  return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,textAlign:'center'}}>
       <div style={{fontSize:11,letterSpacing:'.22em',textTransform:'uppercase',color:DIM,marginBottom:16}}>OEQL — ARCADE</div>
      <h1 style={{fontSize:'clamp(36px,7vw,72px)',fontWeight:700,color:P,margin:'0 0 8px',textShadow:`0 0 40px ${P}55`}}>ORIGINS</h1>
      <p style={{maxWidth:480,color:DIM,lineHeight:1.7,fontSize:14,marginBottom:40}}>
        Build quantum circuits to match target states. The physics is real — every target was computed
        by the project's own verified simulator. 10 levels. One horizon.
      </p>
      <Btn onClick={onPlay} style={{fontSize:16,padding:'14px 48px',letterSpacing:'.14em'}}>[ PLAY ]</Btn>
      {highScore>0&&<div style={{marginTop:24,fontSize:12,color:DIM}}>Best: {highScore} pts</div>}
      <div style={{marginTop:48,fontSize:11,color:LINE,lineHeight:1.8}}>
        {GATES.map(g=><span key={g} style={{marginRight:16}}><b style={{color:DIM}}>{g}</b> — {GATE_DESC[g]}</span>)}
      </div>
    </div>
  );
}

// ── LEVEL COMPLETE ───────────────────────────────────────────────────────────
function LevelComplete({level,pts,total,gateUsed,onNext}){
  useEffect(()=>{winChord();},[]);
  return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,textAlign:'center'}}>
      <div style={{fontSize:11,letterSpacing:'.22em',color:DIM,marginBottom:16}}>LEVEL COMPLETE</div>
      <h2 style={{fontSize:48,fontWeight:700,color:P,margin:'0 0 8px'}}>{level.title}</h2>
      <div style={{fontSize:28,color:A,marginBottom:32}}>+{pts} pts</div>
      <div style={{background:PAN,border:`1px solid ${LINE}`,padding:'20px 32px',marginBottom:32,fontSize:13,color:DIM,lineHeight:2}}>
        <div>Gates used: <b style={{color:INK}}>{gateUsed}</b> / par {level.par} {gateUsed<=level.par?'⚡ UNDER PAR':''}</div>
        <div>Total score: <b style={{color:P}}>{total}</b></div>
      </div>
      <Btn onClick={onNext}>Next Level →</Btn>
    </div>
  );
}

// ── GAME OVER ────────────────────────────────────────────────────────────────
function GameOver({score,onRestart}){
  useEffect(()=>{loseSound();},[]);
  return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,textAlign:'center'}}>
      <div style={{fontSize:11,letterSpacing:'.22em',color:'#ff6a6a',marginBottom:16}}>DECOHERENCE</div>
      <h2 style={{fontSize:48,fontWeight:700,color:'#ff6a6a',margin:'0 0 8px'}}>SYSTEM COLLAPSE</h2>
      <div style={{fontSize:20,color:DIM,marginBottom:32}}>Final score: <b style={{color:INK}}>{score}</b></div>
      <Btn onClick={onRestart} style={{borderColor:'#ff6a6a',color:'#ff6a6a'}}>Try Again</Btn>
    </div>
  );
}

// ── TERRA INFINITA ───────────────────────────────────────────────────────────
function TerraInfinita({score,name,setName,lb,setLb}){
  const [revealed,setRevealed]=useState(false);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{
    terraSound();
    setTimeout(()=>setRevealed(true),600);
  },[]);
  const save=async()=>{
    if(!name.trim())return;
    try{
      const r=await window.storage.get('qf:origins:lb',true).catch(()=>null);
      let board=r?JSON.parse(r.value):[];
      const e={name:name.trim().slice(0,20),score,ts:Date.now()};
      const idx=board.findIndex(x=>x.name===e.name);
      if(idx>=0){if(board[idx].score<score)board[idx]=e;}else board.push(e);
      board.sort((a,b)=>b.score-a.score);board=board.slice(0,20);
      await window.storage.set('qf:origins:lb',JSON.stringify(board),true);
      setLb(board);setSaved(true);
    }catch(e){setSaved(true);}
  };
  useEffect(()=>{
    window.storage&&window.storage.get('qf:origins:lb',true).then(r=>{
      if(r)setLb(JSON.parse(r.value));
    }).catch(()=>{});
  },[]);

  return(
    <div style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:40,textAlign:'center',
      background:`radial-gradient(ellipse at center, #0a1d12 0%, ${BG} 70%)`,
    }}>
      <style>{`
        @keyframes glow{0%,100%{text-shadow:0 0 40px ${P}55,0 0 80px ${P}33}50%{text-shadow:0 0 60px ${P},0 0 120px ${P}66}}
        @keyframes star{0%{opacity:0;transform:translateY(0)}100%{opacity:1;transform:translateY(-40px)}}
      `}</style>
      <div style={{fontSize:11,letterSpacing:'.26em',textTransform:'uppercase',color:P,marginBottom:24,
        animation:'glow 2s ease-in-out infinite'}}>
        ACHIEVEMENT UNLOCKED
      </div>
      {revealed&&<>
        <h1 style={{fontSize:'clamp(40px,8vw,80px)',fontWeight:700,color:'#ffd700',margin:'0 0 8px',
          animation:'glow 2s ease-in-out infinite',letterSpacing:'.05em'}}>
          TERRA INFINITA
        </h1>
        <div style={{fontSize:15,color:DIM,maxWidth:520,lineHeight:1.7,margin:'16px 0 32px'}}>
          You reached the horizon. Every gate placed, every phase twisted, every entanglement built —
          all leading to this 4-qubit state at the edge of what's classically describable.
          The physics was real. So was the computation.
        </div>
        <div style={{fontSize:36,color:A,fontWeight:700,marginBottom:32}}>
          {score.toLocaleString()} pts
        </div>
        {!saved&&(
          <div style={{display:'flex',gap:10,marginBottom:24,alignItems:'center'}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="your name"
              maxLength={20} style={{background:'#030a06',border:`1px solid ${LINE}`,color:INK,
                padding:'9px 12px',fontFamily:mono,fontSize:13,outline:'none',width:180}}/>
            <Btn onClick={save} disabled={!name.trim()} style={{color:'#ffd700',borderColor:'#ffd700'}}>
              Save
            </Btn>
          </div>
        )}
        {lb.length>0&&(
          <div style={{border:`1px solid ${LINE}`,minWidth:320,marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:'.14em',color:DIM,padding:'8px 14px',borderBottom:`1px solid ${LINE}`,textTransform:'uppercase'}}>
              Leaderboard
            </div>
            {lb.slice(0,8).map((e,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'28px 1fr 60px',padding:'6px 14px',
                fontSize:12,borderBottom:`1px solid #0d1a11`,color:e.name===name?P:INK}}>
                <span style={{color:DIM}}>{i+1}</span>
                <span>{e.name}</span>
                <span style={{textAlign:'right',color:P}}>{e.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{fontSize:11,color:DIM,marginTop:8}}>
           OEQL — Open-Ended Quantum Liberty — Apache-2.0
        </div>
      </>}
    </div>
  );
}

// ── MAIN GAME ────────────────────────────────────────────────────────────────
export default function OEQLOrigins(){
  const [phase,setPhase]=useState('menu');      // menu/playing/win/over/ti
  const [li,setLi]=useState(0);                  // level index
  const [lives,setLives]=useState(3);
  const [score,setScore]=useState(0);
  const [ops,setOps]=useState([]);               // circuit ops
  const [sel,setSel]=useState('H');              // selected gate
  const [pend,setPend]=useState(null);           // pending CX/CZ {qubit,slot}
  const [tLeft,setTLeft]=useState(60);
  const [hintOn,setHintOn]=useState(false);
  const [hintUsed,setHintUsed]=useState(false);
  const [lastPts,setLastPts]=useState(0);
  const [lb,setLb]=useState([]);
  const [name,setName]=useState('');
  const [highScore,setHighScore]=useState(0);
  const timerRef=useRef(null);

  const level=LEVELS[li];

  // Live quantum simulation — runs on every circuit change
  const sv=useMemo(()=>{try{return runCircuit(ops,level.n);}catch(e){return [];}}, [ops,li]);
  const fid=useMemo(()=>{
    if(!sv.length)return 0;
    try{return fidelity(sv,level.target);}catch(e){return 0;}
  },[sv,li]);
  const solved=fid>0.999;

  // Start a level
  const startLevel=useCallback((idx)=>{
    setLi(idx);setOps([]);setPend(null);setHintOn(false);setHintUsed(false);
    setTLeft(LEVELS[idx].sec||60);setPhase('playing');
  },[]);

  // Timer
  useEffect(()=>{
    if(phase!=='playing'){clearInterval(timerRef.current);return;}
    timerRef.current=setInterval(()=>{
      setTLeft(t=>{
        if(t<=1){
          clearInterval(timerRef.current);
          setLives(l=>{
            if(l<=1){setPhase('over');return 0;}
            loseSound();
            setOps([]);setPend(null);setHintUsed(false);setHintOn(false);
            setTLeft(level.sec||60);
            return l-1;
          });
          return level.sec||60;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[phase,li]);

  // Solve detection
  useEffect(()=>{
    if(phase!=='playing'||!solved)return;
    clearInterval(timerRef.current);
    const pts=Math.max(50, 100 + tLeft*4 + (ops.length<=level.par?250:0) - (hintUsed?60:0));
    setLastPts(pts);
    setScore(s=>{
      const ns=s+pts;
      setHighScore(h=>Math.max(h,ns));
      return ns;
    });
    if(li>=LEVELS.length-1){setTimeout(()=>setPhase('ti'),700);}
    else{setTimeout(()=>setPhase('win'),700);}
  },[solved,phase]);

  // Cell click handler
  const cellClick=useCallback((qubit,slot)=>{
    if(phase!=='playing')return;
    if(sel==='ERASE'){
      setOps(prev=>prev.filter(o=>!(o.slot===slot&&(o.qubit===qubit||o.control===qubit||o.target===qubit))));
      setPend(null);return;
    }
    if(sel==='CX'||sel==='CZ'){
      if(!pend){setPend({qubit,slot});}
      else if(pend.slot===slot&&pend.qubit!==qubit){
        setOps(prev=>[...prev.filter(o=>!(o.slot===slot&&
          (o.qubit===qubit||o.control===qubit||o.target===qubit||
           o.qubit===pend.qubit||o.control===pend.qubit||o.target===pend.qubit))),
          {type:sel,slot,control:pend.qubit,target:qubit}]);
        setPend(null);beep(330,.09);
      } else{setPend({qubit,slot});}
      return;
    }
    setOps(prev=>[...prev.filter(o=>!(o.slot===slot&&(o.qubit===qubit||o.control===qubit||o.target===qubit))),
      {type:sel,slot,qubit}]);
    setPend(null);
    beep(220*Math.pow(1.5,qubit),.07);
  },[sel,pend,phase]);

  // ── Rendering ──────────────────────────────────────────────────────────────
  if(phase==='menu')return<Menu onPlay={()=>startLevel(0)} highScore={highScore}/>;
  if(phase==='over')return<GameOver score={score} onRestart={()=>{setScore(0);setLives(3);startLevel(0);}}/>;
  if(phase==='ti')return<TerraInfinita score={score} name={name} setName={setName} lb={lb} setLb={setLb}/>;
  if(phase==='win')return<LevelComplete level={level} pts={lastPts} total={score}
    gateUsed={ops.length} onNext={()=>startLevel(li+1)}/>;

  // PLAYING
  const fidColor=fid>0.999?P:fid>0.9?'#c8f5c8':fid>0.5?A:'#ff8a8a';
  const timerPct=tLeft/(level.sec||60)*100;
  const n=level.n;
  const dim=1<<n;

  // Find op at position
  const opAt=(q,s)=>ops.find(o=>o.slot===s&&(o.qubit===q||o.control===q||o.target===q));
  const pendAt=(q,s)=>pend&&pend.qubit===q&&pend.slot===s;

  // Probabilities for state visualization
  const probs=sv.map(c=>c.abs2?c.abs2():0);
  const tgtProbs=level.target.map(t=>t[0]*t[0]+t[1]*t[1]);

  return(
    <div style={{...base,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <style>{`button:hover{opacity:.85}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── HUD ── */}
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'10px 20px',
        borderBottom:`1px solid ${LINE}`,flexShrink:0,background:PAN}}>
        <div style={{fontSize:11,color:P,letterSpacing:'.12em'}}>
          LVL {li+1}<span style={{color:LINE}}>/</span>{LEVELS.length}
        </div>
        <div style={{fontSize:13,color:INK,fontWeight:600,flex:1}}>{level.title}</div>
        {/* Timer */}
        <div style={{width:120,position:'relative'}}>
          <div style={{height:6,background:LINE,borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:3,transition:'width .9s linear',
              width:`${timerPct}%`,background:timerPct>50?P:timerPct>20?A:'#ff6a6a'}}/>
          </div>
          <div style={{fontSize:10,color:DIM,textAlign:'center',marginTop:3}}>{tLeft}s</div>
        </div>
        {/* Lives */}
        <div style={{fontSize:16,letterSpacing:4}}>{Array.from({length:3}).map((_,i)=>(
          <span key={i} style={{color:i<lives?P:LINE}}>♥</span>
        ))}</div>
        {/* Score */}
        <div style={{fontSize:13,color:A,minWidth:80,textAlign:'right'}}>{score.toLocaleString()}</div>
      </div>

      {/* ── MAIN ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── LEFT: circuit ── */}
        <div style={{flex:'1.4',display:'flex',flexDirection:'column',borderRight:`1px solid ${LINE}`,overflow:'hidden'}}>
          <div style={{padding:'12px 16px 8px',borderBottom:`1px solid ${LINE}`,flexShrink:0}}>
            <div style={{fontSize:12,color:DIM,lineHeight:1.5}}>{level.brief}</div>
            {hintOn&&<div style={{fontSize:11,color:A,marginTop:4}}>💡 {level.hint}</div>}
          </div>

          {/* Circuit grid */}
          <div style={{flex:1,overflowY:'auto',padding:'8px 16px',position:'relative'}}>
            <div style={{position:'relative',display:'inline-block',minWidth:'100%'}}>
              {Array.from({length:n}).map((_,q)=>(
                <div key={q} style={{display:'flex',height:CELL,alignItems:'center',position:'relative'}}>
                  {/* Wire */}
                  <div style={{position:'absolute',left:36,right:0,top:'50%',height:1,background:'#1a3028',zIndex:0}}/>
                  {/* Label */}
                  <div style={{width:36,fontSize:11,color:DIM,flexShrink:0,zIndex:1}}>q{q}</div>
                  {/* Cells */}
                  {Array.from({length:MAX_SLOTS}).map((_,s)=>{
                    const op=opAt(q,s);
                    const isPend=pendAt(q,s);
                    const isCtrl=op&&op.control===q;
                    const isTgt=op&&op.target===q;
                    const isSingle=op&&op.qubit===q;
                    return(
                      <div key={s} onClick={()=>cellClick(q,s)} style={{
                        width:CELL,height:CELL,flexShrink:0,position:'relative',
                        zIndex:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                      }}>
                        {isPend&&!op&&<div style={{
                          width:14,height:14,borderRadius:'50%',border:`2px dashed ${A}`,
                          animation:'pulse 1s infinite'
                        }}/>}
                        {isSingle&&<div style={{
                          width:38,height:38,background:PAN,border:`1.5px solid ${P}`,
                          color:P,display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:12,fontWeight:700,borderRadius:2,
                          boxShadow:`0 0 10px ${P}33`,
                        }}>{op.type}</div>}
                        {isCtrl&&<div style={{
                          width:14,height:14,borderRadius:'50%',background:P,
                          boxShadow:`0 0 8px ${P}`,
                        }}/>}
                        {isTgt&&op.type==='CX'&&<div style={{
                          width:32,height:32,borderRadius:'50%',border:`2px solid ${P}`,
                          color:P,display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:18,fontWeight:300,
                        }}>⊕</div>}
                        {isTgt&&op.type==='CZ'&&<div style={{
                          width:14,height:14,borderRadius:'50%',background:'transparent',
                          border:`2px solid ${P}`,
                        }}/>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Connector lines */}
              <svg style={{position:'absolute',top:0,left:36,width:`calc(100% - 36px)`,height:'100%',pointerEvents:'none',zIndex:2}}>
                {ops.filter(o=>o.control!==undefined).map((op,i)=>{
                  const x=op.slot*CELL+CELL/2;
                  const y1=op.control*CELL+CELL/2;
                  const y2=op.target*CELL+CELL/2;
                  return<line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={P} strokeWidth={1.5} opacity={.75}/>;
                })}
              </svg>
            </div>
          </div>

          {/* ── Gate toolbar ── */}
          <div style={{padding:'10px 16px',borderTop:`1px solid ${LINE}`,flexShrink:0,background:PAN}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
              {GATES.map(g=>(
                <button key={g} onClick={()=>{setSel(g);setPend(null);}} style={{
                  background:sel===g?`rgba(95,251,192,.12)`:'transparent',
                  border:`1px solid ${sel===g?P:LINE}`,color:sel===g?P:DIM,
                  fontFamily:mono,fontSize:12,padding:'6px 12px',cursor:'pointer',letterSpacing:'.05em',
                  minWidth:48,
                }} title={GATE_DESC[g]}>{g}</button>
              ))}
              <button onClick={()=>{setSel('ERASE');setPend(null);}} style={{
                background:sel==='ERASE'?'rgba(255,100,100,.1)':'transparent',
                border:`1px solid ${sel==='ERASE'?'#ff6a6a':LINE}`,color:sel==='ERASE'?'#ff6a6a':DIM,
                fontFamily:mono,fontSize:12,padding:'6px 12px',cursor:'pointer',
              }}>ERASE</button>
              <button onClick={()=>{setOps([]);setPend(null);}} style={{
                background:'transparent',border:`1px solid ${LINE}`,color:DIM,
                fontFamily:mono,fontSize:12,padding:'6px 12px',cursor:'pointer',marginLeft:'auto',
              }}>Clear</button>
              {!hintOn&&<button onClick={()=>{setHintOn(true);setHintUsed(true);}} style={{
                background:'transparent',border:`1px solid ${LINE}`,color:A,
                fontFamily:mono,fontSize:12,padding:'6px 12px',cursor:'pointer',
              }}>Hint{hintUsed?'':' (−pts)'}</button>}
            </div>
          </div>
        </div>

        {/* ── RIGHT: fidelity + state ── */}
        <div style={{width:240,display:'flex',flexDirection:'column',padding:'16px 14px',overflowY:'auto',flexShrink:0}}>
          {/* Fidelity */}
          <div style={{fontSize:10,letterSpacing:'.14em',color:DIM,textTransform:'uppercase',marginBottom:8}}>
            Fidelity
          </div>
          <div style={{fontSize:52,fontWeight:700,color:fidColor,lineHeight:1,marginBottom:8,
            textShadow:solved?`0 0 20px ${P}`:undefined,
            transition:'color .2s,text-shadow .3s'}}>
            {(fid*100).toFixed(1)}%
          </div>
          <div style={{height:8,background:LINE,marginBottom:12,position:'relative',overflow:'hidden',borderRadius:2}}>
            <div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:2,
              background:fidColor,width:`${Math.min(fid*100,100)}%`,transition:'width .15s ease'}}/>
          </div>
          {solved&&<div style={{fontSize:11,color:P,letterSpacing:'.06em',marginBottom:12}}>⚡ TARGET MATCHED</div>}
          {!solved&&<div style={{fontSize:11,color:DIM,marginBottom:12}}>{ops.length} gate{ops.length!==1?'s':''} placed</div>}

          {/* State viz */}
          <div style={{fontSize:10,letterSpacing:'.14em',color:DIM,textTransform:'uppercase',marginBottom:8}}>
            State vs Target
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,flex:1}}>
            {Array.from({length:Math.min(dim,16)}).map((_,i)=>{
              const bits=i.toString(2).padStart(n,'0').split('').reverse().join('');
              const p=probs[i]||0,t=tgtProbs[i]||0;
              const close=Math.abs(p-t)<0.02;
              return(
                <div key={i} style={{display:'grid',gridTemplateColumns:'36px 1fr',gap:4,fontSize:10}}>
                  <span style={{color:close?P:DIM}}>|{bits}⟩</span>
                  <div style={{display:'flex',gap:2,alignItems:'center',height:10}}>
                    <div style={{background:close?P:'#2a4a3a',height:'100%',
                      width:`${p*100}%`,maxWidth:'50%',minWidth:p>0?2:0,transition:'width .1s'}}/>
                    <div style={{background:A,height:'100%',opacity:.6,
                      width:`${t*100}%`,maxWidth:'50%',minWidth:t>0?2:0}}/>
                  </div>
                </div>
              );
            })}
            <div style={{fontSize:9,color:DIM,marginTop:6,display:'flex',gap:10}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:10,height:8,background:P,display:'inline-block'}}/>yours
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:10,height:8,background:A,opacity:.6,display:'inline-block'}}/>target
              </span>
            </div>
          </div>

          {/* Gates used vs par */}
          <div style={{marginTop:16,paddingTop:12,borderTop:`1px solid ${LINE}`,fontSize:11,color:DIM}}>
            <div>Par: {level.par} gates</div>
            <div style={{color:ops.length<=level.par&&ops.length>0?P:INK}}>
              Used: {ops.length}{ops.length>0&&ops.length<=level.par?' ⚡':''}
            </div>
          </div>
        </div>
      </div>

      {/* CX hint */}
      {(sel==='CX'||sel==='CZ')&&(
        <div style={{padding:'6px 20px',background:'#0a1410',borderTop:`1px solid ${LINE}`,fontSize:11,color:A,flexShrink:0}}>
          {pend?`Control: q${pend.qubit} at slot ${pend.slot} — click target qubit in same column`
               :`${sel} mode: click CONTROL qubit first`}
        </div>
      )}
    </div>
  );
}
