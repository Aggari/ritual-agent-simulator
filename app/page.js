"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── TASKS ──────────────────────────────────────────────────────
const TASKS = [
  { id:"buy-dip", title:"Buy Dip Bot", subtitle:"React to sudden market drops before the bounce", desc:"A fast-response agent that monitors volatility and executes a buy when a sharp drop is detected.", needs:["llm","infernet","resonance"], prefers:["symphony","sched"], risk:"high" },
  { id:"private-research", title:"Private Research Agent", subtitle:"Handle sensitive prompts without leaking context", desc:"An agent that summarizes confidential research inside a secure enclave. TEE protects the input, LLM does the reasoning.", needs:["llm","tee"], prefers:["symphony","guardians"], risk:"medium" },
  { id:"news-reaction", title:"News Reaction Agent", subtitle:"Interpret signals and react to events in real time", desc:"An event-driven agent that reads incoming signals via Infernet and uses LLM to decide on-chain actions.", needs:["llm","infernet","guardians"], prefers:["resonance"], risk:"medium" },
  { id:"rebalance", title:"Auto Rebalance Vault", subtitle:"Keep a vault aligned under changing conditions", desc:"A periodic agent that checks allocations and rebalances. Runs on Scheduled Tx without external keepers.", needs:["sched","resonance"], prefers:["tee","symphony"], risk:"low" },
  { id:"zk-prover", title:"ZK Proof Service", subtitle:"Generate proofs for external chains", desc:"A specialized node that generates zero-knowledge proofs on demand. Requires ZK Sidecar and Symphony for verification.", needs:["zk","symphony","resonance"], prefers:["guardians"], risk:"medium" },
  { id:"model-trader", title:"Model IP Trader", subtitle:"Trade verified AI models on-chain", desc:"An agent that lists, verifies provenance, and trades AI model weights stored in Modular Storage.", needs:["llm","storage","resonance"], prefers:["tee","symphony"], risk:"low" },
];

// ─── COMPONENTS ─────────────────────────────────────────────────
const COMPONENTS = {
  execution: [
    { id:"evm", name:"EVM++", short:"Extended execution layer", desc:"The base of all Ritual compute. Adds precompiles for AI workloads.", color:"#5DCAA5", requires:[], question:null },
  ],
  sidecar: [
    { id:"llm", name:"LLM Sidecar", short:"Language model inference", desc:"Runs any LLM architecture parallel to the EVM++ client.", color:"#78f0c4", requires:["evm"],
      question:{ q:"Your agent needs to interpret ambiguous, unstructured data. What does it need?", right:"A reasoning engine that can understand context and nuance", wrong:"A fixed rule set that matches patterns", explain:"LLM Sidecars run large language models parallel to the EVM++ client — they give agents the ability to reason about unstructured inputs, not just follow predefined rules." }},
    { id:"tee", name:"TEE Sidecar", short:"Trusted execution environment", desc:"Runs code inside hardware enclaves. Even the operator can't see inside.", color:"#ffb86b", requires:["evm"],
      question:{ q:"Your agent handles data that even the node operator shouldn't see. How do you protect it?", right:"Run execution inside a hardware enclave that isolates the data", wrong:"Encrypt the output after processing", explain:"TEE Sidecars execute code inside hardware enclaves — the data is protected during computation, not just at rest. Even the machine operator cannot access what's inside." }},
    { id:"zk", name:"ZK Sidecar", short:"Zero-knowledge proofs", desc:"Generates and verifies ZK proofs for verifiable computation.", color:"#8db7ff", requires:["evm"],
      question:{ q:"You need to prove a computation was done correctly without revealing the inputs. How?", right:"Generate a zero-knowledge proof that verifies correctness without exposing data", wrong:"Have multiple nodes repeat the same computation", explain:"ZK Sidecars generate zero-knowledge proofs — mathematical guarantees that a computation is correct, without revealing what was computed. This is different from redundant re-execution." }},
  ],
  trigger: [
    { id:"infernet", name:"Infernet", short:"Oracle network · 8,000+ nodes", desc:"Decentralized oracle network. Delivers off-chain data and triggers on-chain actions.", color:"#ff89b5", requires:["evm"],
      question:{ q:"Your agent needs to react to something that happened off-chain (price drop, news event). How does it know?", right:"An oracle network delivers the off-chain signal to the agent in real time", wrong:"The agent periodically checks a public API", explain:"Infernet is a decentralized oracle network with 8,000+ nodes. It pushes off-chain data to on-chain agents in real time — no polling, no centralized API dependency." }},
    { id:"sched", name:"Scheduled Tx", short:"Recurring execution", desc:"The chain itself wakes the agent on a set cadence. No external keeper bot needed.", color:"#b5a7ff", requires:["evm"],
      question:{ q:"Your agent needs to run every hour without anyone manually triggering it. How?", right:"The chain itself schedules the execution — no external bot required", wrong:"Set up a server that sends a transaction every hour", explain:"Scheduled Transactions are built into EVM++ — the chain itself wakes the agent at set intervals. No external keeper bot that could fail, go offline, or be shut down." }},
  ],
  consensus: [
    { id:"resonance", name:"Resonance", short:"Fee mechanism", desc:"Two-sided matching: users set valuation, nodes set cost. Brokers find the surplus-maximizing match.", color:"#EF9F27", requires:["evm"],
      question:{ q:"Different nodes charge different prices for compute. How does your agent find the best deal?", right:"A two-sided matching mechanism where users and nodes negotiate via brokers", wrong:"Pick the cheapest node from a static list", explain:"Resonance is a surplus-maximizing fee mechanism. Users declare what they're willing to pay, nodes declare their cost, and brokers match them to maximize total surplus — not just find the cheapest option." }},
    { id:"symphony", name:"Symphony", short:"EOVMT consensus", desc:"Execute-once-verify-many-times. One node executes, others verify. No redundant re-execution.", color:"#ffd96a", requires:["resonance"],
      question:{ q:"Running LLM inference on every validator node is wasteful. How do you avoid it?", right:"One node executes, others verify the attestation — no redundant re-execution", wrong:"Reduce the number of validator nodes", explain:"Symphony uses EOVMT — Execute Once, Verify Many Times. Only one node runs the computation. Other nodes verify the result via TEE attestation or ZK proof, eliminating redundant re-execution across the network." }},
  ],
  defense: [
    { id:"guardians", name:"Guardians", short:"Semantic firewall", desc:"Filters requests at node level using embedding distance. Blocks adversarial inputs.", color:"#ff7f7f", requires:["evm"],
      question:{ q:"Thousands of requests are hitting your node. Some look legitimate but are actually adversarial. How do you filter them?", right:"Measure semantic distance in embedding space — adversarial inputs cluster differently from real ones", wrong:"Rate-limit all incoming requests equally", explain:"Guardians are semantic firewalls that filter at the node level. They use embedding distance — the mathematical difference between request vectors — to identify adversarial patterns. Unlike rate-limiting, this targets bad actors specifically." }},
  ],
  storage: [
    { id:"storage", name:"Modular Storage", short:"Arweave + HuggingFace", desc:"Permanent storage layer. Smart contracts can read/write natively. Stores model weights, proofs, agent state.", color:"#B4B2A9", requires:["evm"],
      question:{ q:"Your agent needs to store AI model weights permanently — where no one can delete them. Where?", right:"A permanent storage layer wired natively into the chain (Arweave + HuggingFace)", wrong:"Upload to a cloud server and reference the URL", explain:"Modular Storage wires Arweave (permanent, decentralized) and HuggingFace (convenient, model-native) directly into Ritual. Smart contracts can read and write to them natively — no external API calls, no deletable cloud links." }},
  ],
};

const ALL_COMPS = Object.values(COMPONENTS).flat();

// ─── EVENTS (interactive) ───────────────────────────────────────
const EVENTS = [
  {
    id:"sybil-flood", name:"Sybil Request Flood", tone:"danger",
    desc:"Thousands of fake requests flooded your node, mixed in with real ones.",
    choices:[
      { label:"Rate-limit all requests equally", result:"partial",
        effect:[{stat:"performance",delta:-15,reason:"Rate-limiting slowed down legitimate requests alongside fake ones."},{stat:"security",delta:-10,reason:"Some sybil requests still got through below the rate limit."}],
        explain:"Rate-limiting treats all requests the same — it slows down attackers but also slows down real users. It doesn't distinguish between good and bad." },
      { label:"Filter by embedding distance in vector space", result:"correct", needs:"guardians",
        effect:[{stat:"security",delta:14,reason:"Guardians' semantic firewall identified adversarial patterns by embedding distance."},{stat:"performance",delta:6,reason:"Legitimate requests flowed through uninterrupted."}],
        explain:"This is what Guardians do. They measure the semantic distance between request embeddings — adversarial inputs cluster differently from legitimate ones, so they can be filtered without affecting real users." },
      { label:"Shut down the node temporarily", result:"bad",
        effect:[{stat:"performance",delta:-30,reason:"The node went offline. All requests — real and fake — were lost."},{stat:"speed",delta:-20,reason:"Downtime meant the agent missed its execution window completely."}],
        explain:"Shutting down stops the attack but also stops everything else. In a real-time environment, this means missed opportunities and broken agent lifecycles." },
    ],
    flow:{ with:["guardians"], without:[] },
    flowWith:"Request → [Guardians: embedding distance filter] → Legitimate only → Agent processes",
    flowWithout:"Request → All requests hit Agent directly → Sybil + real mixed → Resources drained",
  },
  {
    id:"prompt-injection", name:"Adversarial Prompt Injection", tone:"danger",
    desc:"A manipulative prompt tried to hijack your agent's LLM reasoning.",
    choices:[
      { label:"Let the LLM handle it — it should be robust enough", result:"bad",
        effect:[{stat:"trust",delta:-30,reason:"The LLM's output was altered by the adversarial prompt. No safety net caught it."}],
        explain:"LLMs are susceptible to prompt injection. Without an external check, the manipulated output goes straight to execution." },
      { label:"Use Guardians to filter the input before it reaches the LLM", result:"correct", needs:"guardians",
        effect:[{stat:"trust",delta:14,reason:"Guardians detected the adversarial pattern and blocked it before it reached the LLM."}],
        explain:"Guardians sit before the LLM in the pipeline. They check the semantic distance of the input — adversarial prompts have different embedding patterns from legitimate requests." },
      { label:"Verify the LLM's output with Symphony attestation", result:"partial", needs:"symphony",
        effect:[{stat:"trust",delta:8,reason:"Symphony's verification caught the anomalous output, but the adversarial input still consumed compute."}],
        explain:"Symphony verifies outputs, not inputs. It would catch a bad result, but the adversarial prompt already used compute resources. Guardians on the input side is the more efficient defense." },
    ],
    flow:{ with:["guardians","llm"], without:["llm"] },
    flowWith:"Prompt → [Guardians filter] → Clean prompt → [LLM Sidecar] → Verified output",
    flowWithout:"Prompt → [LLM Sidecar directly] → Manipulated output → Trust broken",
  },
  {
    id:"oracle-delay", name:"Oracle Signal Delay", tone:"warning",
    desc:"The external data signal arrived late. Your agent's timing window is closing.",
    choices:[
      { label:"Wait for the delayed signal and execute late", result:"bad",
        effect:[{stat:"speed",delta:-28,reason:"By the time the signal arrived and the agent acted, the opportunity was gone."}],
        explain:"In time-sensitive scenarios like trading, a late signal means a missed opportunity. The market has already moved." },
      { label:"Use Infernet's redundant node network to get alternative signals", result:"correct", needs:"infernet",
        effect:[{stat:"speed",delta:12,reason:"Infernet's 8,000+ node network provided alternative signal paths despite the primary delay."}],
        explain:"Infernet has 8,000+ nodes. If one path is delayed, others can deliver the signal. This redundancy is the advantage of a decentralized oracle network over a single API endpoint." },
      { label:"Fall back to scheduled execution instead", result:"partial", needs:"sched",
        effect:[{stat:"speed",delta:-10,reason:"Scheduled execution ran at its preset time, but missed the optimal reaction window."}],
        explain:"Scheduled Tx runs on a fixed cadence — it doesn't adapt to real-time events. For a dip-buying bot, you need event-driven triggers, not periodic checks." },
    ],
    flow:{ with:["infernet"], without:[] },
    flowWith:"Market event → [Infernet: 8,000+ nodes] → Multiple signal paths → Agent reacts in time",
    flowWithout:"Market event → Single data source → Delay → Agent misses the window",
  },
  {
    id:"node-crash", name:"Executing Node Crashed", tone:"danger",
    desc:"The node running your agent went down mid-execution.",
    choices:[
      { label:"Wait for the node to come back online", result:"bad",
        effect:[{stat:"performance",delta:-30,reason:"The agent was stuck waiting. No mechanism to transfer execution."},{stat:"speed",delta:-20,reason:"Complete standstill until manual recovery."}],
        explain:"Without redundancy, a single node failure means total downtime. The agent can't execute, and there's no automatic failover." },
      { label:"Symphony routes execution to a verifier node", result:"correct", needs:"symphony",
        effect:[{stat:"performance",delta:10,reason:"Symphony's EOVMT allowed a verifier node to pick up the failed execution."},{stat:"speed",delta:6,reason:"Resonance quickly matched the task to an available node."}],
        explain:"In Symphony's EOVMT model, verifier nodes already have the execution context. When the primary node fails, a verifier can step in — and Resonance finds the best available replacement." },
      { label:"Restart the agent on a new node manually", result:"partial",
        effect:[{stat:"performance",delta:-10,reason:"Manual restart recovered the agent but lost the execution state."},{stat:"speed",delta:-12,reason:"Redeployment took time and the agent missed its window."}],
        explain:"Manual recovery works but is slow and lossy. The agent loses its mid-execution state and has to start over." },
    ],
    flow:{ with:["symphony","resonance"], without:[] },
    flowWith:"Node crash → [Symphony: verifier has context] → [Resonance: matches new node] → Execution continues",
    flowWithout:"Node crash → No failover mechanism → Agent stuck → Manual recovery needed",
  },
  {
    id:"fee-spike", name:"Transaction Fee Spike", tone:"warning",
    desc:"Execution costs surged during your agent's operation.",
    choices:[
      { label:"Pay the full fee and execute immediately", result:"partial",
        effect:[{stat:"performance",delta:-18,reason:"The agent executed but at significantly higher cost than necessary."}],
        explain:"Paying full price works but is inefficient. Without fee optimization, the agent overpays during volatile periods." },
      { label:"Use Resonance to find a node at competitive price", result:"correct", needs:"resonance",
        effect:[{stat:"performance",delta:10,reason:"Resonance's two-sided matching found a node with lower cost despite the fee spike."}],
        explain:"Resonance doesn't just find the cheapest node — it runs a surplus-maximizing auction. Users set what they'll pay, nodes set their cost, and the broker finds the match that maximizes total value." },
      { label:"Delay execution until fees drop", result:"bad",
        effect:[{stat:"speed",delta:-22,reason:"Waiting for lower fees meant the agent missed its execution window entirely."},{stat:"performance",delta:-8,reason:"The delayed action was no longer relevant by the time fees dropped."}],
        explain:"In most agent scenarios, timing matters. Delaying for cheaper fees sacrifices the opportunity the agent was supposed to capture." },
    ],
    flow:{ with:["resonance"], without:[] },
    flowWith:"Fee spike → [Resonance: valuation ↔ cost matching] → Optimal node found → Execution at fair price",
    flowWithout:"Fee spike → Agent pays full price or delays → Overpay or miss window",
  },
  {
    id:"sensitive-data", name:"Sensitive Data in Pipeline", tone:"danger",
    desc:"Your agent's input stream unexpectedly contained confidential information.",
    choices:[
      { label:"Process it normally — the blockchain is decentralized anyway", result:"bad",
        effect:[{stat:"security",delta:-35,reason:"Confidential data was processed in the open. Any node operator could have read it."},{stat:"trust",delta:-20,reason:"Users discovered their private data was exposed during execution."}],
        explain:"Decentralization doesn't mean privacy. On a public blockchain, node operators can see the data they're processing unless it's explicitly protected." },
      { label:"Route processing through TEE hardware enclaves", result:"correct", needs:"tee",
        effect:[{stat:"security",delta:18,reason:"TEE isolated the sensitive data inside a secure enclave during processing."},{stat:"trust",delta:10,reason:"Users verified that their data was processed in a trusted environment."}],
        explain:"TEE Sidecars run computation inside hardware enclaves — sealed environments that even the machine's operator cannot peek into. The data is protected during execution, not just before and after." },
      { label:"Encrypt the output before storing it", result:"partial",
        effect:[{stat:"security",delta:-15,reason:"The data was still exposed during processing — encryption only protected the stored result."}],
        explain:"Encrypting output protects data at rest, but during computation the data was unencrypted and visible. TEE protects data during computation — that's the difference." },
    ],
    flow:{ with:["tee"], without:[] },
    flowWith:"Sensitive input → [TEE: hardware enclave] → Data isolated during compute → Encrypted output",
    flowWithout:"Sensitive input → Open processing → Operator can read data → Privacy breach",
  },
];

function clamp(n){return Math.max(0,Math.min(100,n));}

function useSound(){
  const ctxRef=useRef(null);
  const getCtx=()=>{if(!ctxRef.current){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctxRef.current=new C();}return ctxRef.current;};
  const tone=(f,d,t="sine",v=0.03,dl=0)=>{try{const c=getCtx();if(!c)return;const now=c.currentTime+dl;const o=c.createOscillator();const g=c.createGain();o.type=t;o.frequency.setValueAtTime(f,now);g.gain.setValueAtTime(v,now);g.gain.exponentialRampToValueAtTime(0.001,now+d);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+d);}catch{}};
  return{
    start:()=>{tone(440,0.08,"sine",0.03,0);tone(554,0.08,"sine",0.03,0.08);tone(659,0.12,"sine",0.03,0.16);},
    choose:()=>{tone(620,0.06,"triangle",0.025,0);tone(760,0.08,"triangle",0.02,0.05);},
    deploy:()=>{tone(240,0.08,"sawtooth",0.025,0);tone(320,0.09,"sawtooth",0.025,0.06);tone(480,0.11,"triangle",0.02,0.14);},
    tick:(i)=>{tone(400+i*60,0.08,"sine",0.02,0);},
    success:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,0.15,"sine",0.028,i*0.08));},
    fail:()=>{tone(210,0.18,"square",0.03,0);tone(160,0.24,"square",0.025,0.09);},
    correct:()=>{tone(660,0.08,"sine",0.04,0);tone(880,0.12,"sine",0.04,0.08);},
    wrong:()=>{tone(200,0.15,"square",0.04,0);},
    warn:()=>{tone(300,0.1,"square",0.02,0);},
    reset:()=>{tone(330,0.05,"triangle",0.02,0);tone(280,0.08,"triangle",0.02,0.05);},
  };
}

function StatBar({label,value}){
  return(<div style={st.statRow}><div style={st.statLabelRow}><span style={st.statLabel}>{label}</span><span style={st.statValue}>{value}</span></div><div style={st.statTrack}><div style={{...st.statFill,width:`${value}%`}}/></div></div>);
}

// ─── ARCH MAP (mini diagram) ────────────────────────────────────
function ArchMap({build}){
  const nodes=[
    {id:"evm",x:40,y:5,w:20,label:"EVM++"},
    {id:"llm",x:8,y:35,w:16,label:"LLM"},
    {id:"tee",x:30,y:35,w:16,label:"TEE"},
    {id:"zk",x:52,y:35,w:16,label:"ZK"},
    {id:"infernet",x:75,y:8,w:18,label:"Infernet"},
    {id:"sched",x:8,y:18,w:18,label:"Sched Tx"},
    {id:"resonance",x:8,y:60,w:20,label:"Resonance"},
    {id:"symphony",x:36,y:60,w:20,label:"Symphony"},
    {id:"guardians",x:64,y:35,w:18,label:"Guardians"},
    {id:"storage",x:64,y:60,w:20,label:"Storage"},
    {id:"agents",x:8,y:82,w:22,label:"Agents"},
    {id:"market",x:40,y:82,w:22,label:"Model Mkt"},
  ];
  const lines=[
    ["evm","llm"],["evm","tee"],["evm","zk"],["evm","sched"],["evm","infernet"],
    ["resonance","symphony"],["llm","agents"],["tee","agents"],["sched","agents"],
    ["resonance","market"],["evm","guardians"],["evm","resonance"],
  ];
  return(
    <div style={{position:"relative",width:"100%",height:180,background:"rgba(0,0,0,0.3)",borderRadius:16,border:"1px solid rgba(255,255,255,0.05)",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(94,228,188,0.03) 1px, transparent 1px)",backgroundSize:"16px 16px"}}/>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
        {lines.map(([a,b],i)=>{
          const na=nodes.find(n=>n.id===a),nb=nodes.find(n=>n.id===b);
          const on=build.includes(a)&&build.includes(b);
          return <line key={i} x1={`${na.x+na.w/2}%`} y1={`${na.y+4}%`} x2={`${nb.x+nb.w/2}%`} y2={`${nb.y+4}%`}
            stroke={on?"rgba(94,228,188,0.3)":"rgba(255,255,255,0.03)"} strokeWidth={on?1.5:0.5} strokeDasharray={on?"none":"3 3"}/>;
        })}
      </svg>
      {nodes.map(n=>{
        const on=build.includes(n.id);
        const comp=ALL_COMPS.find(c=>c.id===n.id);
        return <div key={n.id} style={{
          position:"absolute",left:`${n.x}%`,top:`${n.y}%`,width:`${n.w}%`,padding:"4px 0",
          background:on?"rgba(94,228,188,0.08)":"rgba(255,255,255,0.02)",
          border:`1px solid ${on?(comp?.color||"#5DCAA5")+"60":"rgba(255,255,255,0.04)"}`,
          borderRadius:6,textAlign:"center",transition:"all 0.4s",
          boxShadow:on?`0 0 10px ${(comp?.color||"#5DCAA5")}20`:"none",
        }}>
          <span style={{fontSize:8,fontWeight:700,color:on?(comp?.color||"#5DCAA5"):"rgba(255,255,255,0.08)",letterSpacing:0.5}}>{n.label}</span>
          {on&&<div style={{position:"absolute",top:2,right:3,width:4,height:4,borderRadius:"50%",background:comp?.color||"#5DCAA5"}}/>}
        </div>;
      })}
    </div>
  );
}

// ─── FLOW DIAGRAM ───────────────────────────────────────────────
function FlowDiagram({flow,label,good}){
  const steps=flow.split(" → ");
  return(
    <div style={{marginTop:8}}>
      <div style={{fontSize:10,color:good?"rgba(120,240,196,0.6)":"rgba(255,127,127,0.6)",marginBottom:6,fontWeight:700,letterSpacing:1}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        {steps.map((s,i)=>{
          const isBracket=s.startsWith("[")&&s.endsWith("]");
          return <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{
              fontSize:11,padding:"4px 8px",borderRadius:6,fontWeight:isBracket?700:400,
              background:isBracket?(good?"rgba(120,240,196,0.08)":"rgba(255,127,127,0.06)"):"rgba(255,255,255,0.03)",
              border:`1px solid ${isBracket?(good?"rgba(120,240,196,0.2)":"rgba(255,127,127,0.15)"):"rgba(255,255,255,0.05)"}`,
              color:isBracket?(good?"#78f0c4":"#ff7f7f"):"rgba(255,255,255,0.5)",
            }}>{s}</span>
            {i<steps.length-1&&<span style={{color:"rgba(255,255,255,0.15)",fontSize:12}}>→</span>}
          </div>;
        })}
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Page(){
  const [screen,setScreen]=useState("menu");
  const [taskId,setTaskId]=useState(TASKS[0].id);
  const [build,setBuild]=useState(["evm"]);
  const [pendingComp,setPendingComp]=useState(null); // component awaiting question answer
  const [phaseIndex,setPhaseIndex]=useState(-1);
  const [event,setEvent]=useState(null);
  const [chosenChoice,setChosenChoice]=useState(null);
  const [result,setResult]=useState(null);
  const [isRunning,setIsRunning]=useState(false);
  const [warnings,setWarnings]=useState([]);
  const sound=useSound();

  const selectedTask=useMemo(()=>TASKS.find(t=>t.id===taskId),[taskId]);
  const missingNeeds=useMemo(()=>selectedTask.needs.filter(n=>!build.includes(n)),[selectedTask,build]);

  // ── Toggle component ──
  const tryToggle=(id)=>{
    if(id==="evm")return;
    const comp=ALL_COMPS.find(c=>c.id===id);
    if(build.includes(id)){
      const deps=ALL_COMPS.filter(c=>c.requires?.includes(id)&&build.includes(c.id));
      if(deps.length>0){setWarnings([`Remove ${deps.map(d=>d.name).join(", ")} first`]);sound.warn();setTimeout(()=>setWarnings([]),2500);return;}
      setBuild(b=>b.filter(x=>x!==id));sound.choose();return;
    }
    const missing=(comp.requires||[]).filter(r=>!build.includes(r));
    if(missing.length>0){const names=missing.map(m=>ALL_COMPS.find(c=>c.id===m)?.name||m);setWarnings([`${comp.name} needs ${names.join(" + ")} first`]);sound.warn();setTimeout(()=>setWarnings([]),2500);return;}
    if(comp.question){setPendingComp(comp);return;}
    setBuild(b=>[...b,id]);sound.choose();
  };

  const answerQuestion=(correct)=>{
    if(!pendingComp)return;
    if(correct){sound.correct();setBuild(b=>[...b,pendingComp.id]);}
    else{sound.wrong();}
    setTimeout(()=>setPendingComp(null),correct?1500:3000);
  };

  // ── Deploy ──
  const deploy=()=>{sound.deploy();setIsRunning(true);setResult(null);setChosenChoice(null);setEvent(null);setScreen("sim");setPhaseIndex(0);};

  useEffect(()=>{
    if(screen!=="sim"||!isRunning)return;
    if(phaseIndex>3){
      const ev=EVENTS[Math.floor(Math.random()*EVENTS.length)];
      setEvent(ev);setIsRunning(false);setScreen("event");return;
    }
    const id=setTimeout(()=>{sound.tick(phaseIndex);setPhaseIndex(p=>p+1);},700);
    return()=>clearTimeout(id);
  },[screen,isRunning,phaseIndex]);

  // ── Choose event response ──
  const chooseResponse=(choice)=>{
    setChosenChoice(choice);
    if(choice.result==="correct")sound.correct();
    else if(choice.result==="bad")sound.wrong();
    else sound.choose();

    setTimeout(()=>{
      const stats={performance:55,security:50,speed:52,trust:50};
      const notes=[];
      const push=(s,d,r)=>{stats[s]=clamp(stats[s]+d);notes.push(r);};

      selectedTask.needs.forEach(n=>{const c=ALL_COMPS.find(x=>x.id===n);if(build.includes(n))push("performance",12,`${c.name} fulfilled a core requirement.`);else push("performance",-18,`Missing ${c.name} — a core requirement.`);});
      selectedTask.prefers.forEach(n=>{if(build.includes(n)){const c=ALL_COMPS.find(x=>x.id===n);push("performance",5,`${c.name} strengthened the build.`);}});
      if(build.includes("resonance"))push("performance",6,"Resonance optimized execution cost.");
      if(build.includes("symphony")){push("trust",10,"Symphony added verification via EOVMT.");push("speed",5,"No redundant re-execution.");}
      if(build.includes("guardians"))push("security",8,"Guardians filtered adversarial inputs.");
      if(build.includes("tee"))push("security",8,"TEE isolated execution in enclaves.");
      if(build.includes("storage"))push("trust",5,"Modular Storage ensured data persistence.");

      choice.effect.forEach(({stat,delta,reason})=>push(stat,delta,reason));

      const total=Math.round((stats.performance+stats.security+stats.speed+stats.trust)/4);
      const verdict=total>=72?"Agent executed":total>=54?"Mission unstable":"Agent compromised";
      const highlight=total>=72?"Your Ritual stack handled the scenario well.":total>=54?"The agent survived, but gaps created fragility.":"Critical architecture gaps were exposed.";
      setResult({stats,total,verdict,highlight,notes:[...new Set(notes)].slice(0,8)});
      setScreen("result");
      if(total>=72)sound.success();else sound.fail();
    },2500);
  };

  const resetAll=()=>{sound.reset();setBuild(["evm"]);setResult(null);setPhaseIndex(-1);setIsRunning(false);setWarnings([]);setEvent(null);setChosenChoice(null);setPendingComp(null);setScreen("menu");};

  // ─── RENDER ───────────────────────────────────────────────────
  return(
    <div style={st.page}>
      <div style={st.bgGrid}/><div style={st.glowA}/><div style={st.glowB}/>
      <div style={st.shell}>
        <header style={st.topbar}>
          <div style={st.brandWrap}><div style={st.logo}>◆</div><div><div style={st.brand}>Ritual Agent Simulator</div><div style={st.brandSub}>Build. Deploy. Stress test.</div></div></div>
          <div style={st.credit}>created by <a href="https://twitter.com/Livinginaprayer" target="_blank" rel="noopener noreferrer" style={st.creditLink}>@Livinginaprayer</a></div>
        </header>

        {/* MENU */}
        {screen==="menu"&&(
          <section style={st.heroCard}>
            <div style={st.heroLeft}>
              <div style={st.kicker}>Interactive Learning Game</div>
              <h1 style={st.heroTitle}>Build agents with the real Ritual stack.</h1>
              <p style={st.heroText}>Pick a task, assemble Ritual components, and survive real-world stress events. Each component teaches you how it works before you can use it.</p>
              <button onClick={()=>{sound.start();setScreen("build");}} style={st.primaryBtn}>Start Building →</button>
            </div>
            <div style={st.heroRight}>
              <div style={st.previewPanel}>
                <div style={st.previewTop}>What's different</div>
                <div style={st.previewLine}><span>Components</span><strong>{ALL_COMPS.length} real Ritual modules</strong></div>
                <div style={st.previewLine}><span>Dependencies</span><strong>Enforced</strong></div>
                <div style={st.previewLine}><span>Activation</span><strong>Answer to unlock</strong></div>
                <div style={st.previewLine}><span>Events</span><strong>You choose the response</strong></div>
                <div style={st.previewLine}><span>Results</span><strong>Visual data flow diagrams</strong></div>
              </div>
            </div>
          </section>
        )}

        {/* BUILD */}
        {screen==="build"&&(
          <section style={st.buildGrid}>
            <div style={st.mainPanel}>
              <div style={st.sectionHead}><div style={st.kicker}>Step 1</div><h2 style={st.sectionTitle}>Choose a task</h2></div>
              <div style={st.taskGrid}>
                {TASKS.map(task=>(
                  <button key={task.id} onClick={()=>{setTaskId(task.id);sound.choose();}} style={{...st.taskCard,borderColor:task.id===taskId?"#78f0c4":"rgba(255,255,255,0.08)",background:task.id===taskId?"rgba(120,240,196,0.08)":"rgba(255,255,255,0.02)"}}>
                    <div style={st.taskTop}><span style={st.taskTitle}>{task.title}</span><span style={{...st.taskRisk,color:task.risk==="high"?"#ff7f7f":task.risk==="medium"?"#ffb86b":"#78f0c4"}}>{task.risk}</span></div>
                    <div style={st.taskSubtitle}>{task.subtitle}</div>
                    <div style={st.taskDesc}>{task.desc}</div>
                  </button>
                ))}
              </div>

              <div style={st.sectionHeadSpacing}><div style={st.kicker}>Step 2</div><h2 style={st.sectionTitle}>Assemble the stack</h2><p style={{fontSize:13,color:"rgba(244,247,251,0.4)",marginTop:6}}>Answer a question to unlock each component. Dependencies are enforced.</p></div>

              {Object.entries(COMPONENTS).map(([group,items])=>(
                <div key={group} style={st.choiceSection}>
                  <div style={st.groupLabel}>{group==="execution"?"Execution Layer":group==="sidecar"?"Execution Sidecars":group==="trigger"?"Triggers":group==="consensus"?"Consensus + Fee":group==="defense"?"Defense":"Storage"}</div>
                  <div style={st.choiceGrid}>
                    {items.map(item=>{
                      const active=build.includes(item.id);
                      const isBase=item.id==="evm";
                      return(
                        <button key={item.id} onClick={()=>tryToggle(item.id)} style={{...st.choiceCard,borderColor:active?item.color:"rgba(255,255,255,0.08)",background:active?`${item.color}12`:"rgba(255,255,255,0.02)",opacity:isBase?0.7:1,cursor:isBase?"default":"pointer"}}>
                          <div style={st.choiceTop}>
                            <span style={{...st.dot,background:active?item.color:"rgba(255,255,255,0.15)"}}/>
                            <span style={st.choiceName}>{item.name}</span>
                            {isBase&&<span style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginLeft:"auto"}}>always on</span>}
                            {active&&!isBase&&<span style={{fontSize:10,color:item.color,marginLeft:"auto"}}>active</span>}
                          </div>
                          <div style={st.choiceShort}>{item.short}</div>
                          <div style={st.choiceDesc}>{item.desc}</div>
                          {item.requires?.length>0&&<div style={{marginTop:8,fontSize:10,color:"rgba(255,255,255,0.2)"}}>Requires: {item.requires.map(r=>ALL_COMPS.find(c=>c.id===r)?.name).join(", ")}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <aside style={st.sidePanel}>
              <div style={st.sideCard}>
                <div style={st.sideKicker}>Selected task</div>
                <div style={st.sideTitle}>{selectedTask.title}</div>
                <div style={st.sideDesc}>{selectedTask.desc}</div>
                <div style={{marginTop:14}}>
                  <div style={st.sideMiniTitle}>Required</div>
                  <div style={st.chipsWrap}>{selectedTask.needs.map(n=>{const c=ALL_COMPS.find(x=>x.id===n);const has=build.includes(n);return <span key={n} style={{...st.chipStrong,opacity:has?1:0.4,textDecoration:has?"none":"line-through"}}>{c?.name}</span>;})}</div>
                  <div style={{...st.sideMiniTitle,marginTop:10}}>Recommended</div>
                  <div style={st.chipsWrap}>{selectedTask.prefers.map(n=>{const c=ALL_COMPS.find(x=>x.id===n);const has=build.includes(n);return <span key={n} style={{...st.chipSoft,opacity:has?1:0.4}}>{c?.name}</span>;})}</div>
                </div>
              </div>

              <div style={st.sideCard}>
                <div style={st.sideKicker}>Architecture ({build.length})</div>
                <ArchMap build={build}/>
              </div>

              {missingNeeds.length>0&&<div style={{padding:"10px 14px",borderRadius:12,background:"rgba(255,127,127,0.06)",border:"1px solid rgba(255,127,127,0.15)",fontSize:12,color:"#ff7f7f",fontWeight:600}}>Missing core: {missingNeeds.map(n=>ALL_COMPS.find(c=>c.id===n)?.name).join(", ")}</div>}

              {warnings.map((w,i)=><div key={i} style={{padding:"10px 14px",borderRadius:12,background:"rgba(255,127,127,0.06)",border:"1px solid rgba(255,127,127,0.15)",fontSize:12,color:"#ff7f7f",fontWeight:600}}>{w}</div>)}

              <button onClick={deploy} style={st.primaryBtnLg}>Deploy Agent →</button>
            </aside>

            {/* Question modal */}
            {pendingComp&&(
              <div style={st.modalOverlay}>
                <div style={st.modalCard}>
                  <div style={{fontSize:11,color:pendingComp.color,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>Unlock {pendingComp.name}</div>
                  <div style={{fontSize:18,fontWeight:800,marginTop:12,lineHeight:1.4}}>{pendingComp.question.q}</div>
                  {!chosenChoice?(
                    <div style={{display:"grid",gap:10,marginTop:20}}>
                      <button onClick={()=>{setChosenChoice("right");answerQuestion(true);}} style={{...st.answerBtn,borderColor:"rgba(120,240,196,0.2)"}}>{pendingComp.question.right}</button>
                      <button onClick={()=>{setChosenChoice("wrong");answerQuestion(false);}} style={{...st.answerBtn,borderColor:"rgba(255,127,127,0.15)"}}>{pendingComp.question.wrong}</button>
                    </div>
                  ):(
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:14,fontWeight:700,color:chosenChoice==="right"?"#78f0c4":"#ff7f7f",marginBottom:8}}>{chosenChoice==="right"?"Correct!":"Not quite."}</div>
                      <div style={{fontSize:13,color:"rgba(244,247,251,0.7)",lineHeight:1.7}}>{pendingComp.question.explain}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SIM */}
        {screen==="sim"&&(
          <section style={st.simWrap}>
            <div style={st.simCard}>
              <div style={st.simKicker}>Deployment in progress</div>
              <div style={st.simTitle}>Running your Ritual-native agent</div>
              <div style={st.simPipeline}>
                {["Initializing EVM++ core","Binding sidecars + triggers","Connecting consensus layer","Processing environment"].map((label,i)=>(
                  <div key={label} style={{...st.phaseCard,borderColor:i<=phaseIndex?"#78f0c4":"rgba(255,255,255,0.08)",background:i<=phaseIndex?"rgba(120,240,196,0.08)":"rgba(255,255,255,0.02)"}}>
                    <div style={st.phaseIndex}>{String(i+1).padStart(2,"0")}</div>
                    <div style={st.phaseLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* EVENT — interactive choice */}
        {screen==="event"&&event&&!chosenChoice&&(
          <section style={st.simWrap}>
            <div style={{...st.simCard,maxWidth:720}}>
              <div style={{fontSize:11,color:event.tone==="danger"?"#ff7f7f":"#ffb86b",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>Stress event</div>
              <div style={{fontSize:28,fontWeight:800,marginTop:10,letterSpacing:-0.8}}>{event.name}</div>
              <div style={{fontSize:15,color:"rgba(244,247,251,0.65)",lineHeight:1.7,marginTop:10}}>{event.desc}</div>
              <div style={{fontSize:12,color:"rgba(244,247,251,0.4)",marginTop:18,marginBottom:10,fontWeight:700,letterSpacing:1}}>HOW DO YOU RESPOND?</div>
              <div style={{display:"grid",gap:10}}>
                {event.choices.map((ch,i)=>{
                  const hasReq=!ch.needs||build.includes(ch.needs);
                  return(
                    <button key={i} onClick={()=>chooseResponse(ch)} style={{...st.answerBtn,opacity:hasReq?1:0.5,borderColor:hasReq?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)"}}>
                      <span>{ch.label}</span>
                      {ch.needs&&!hasReq&&<span style={{fontSize:10,color:"#ff7f7f",marginTop:4,display:"block"}}>Requires {ALL_COMPS.find(c=>c.id===ch.needs)?.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* EVENT — response feedback */}
        {screen==="event"&&event&&chosenChoice&&(
          <section style={st.simWrap}>
            <div style={{...st.simCard,maxWidth:720}}>
              <div style={{fontSize:11,color:chosenChoice.result==="correct"?"#78f0c4":chosenChoice.result==="partial"?"#ffb86b":"#ff7f7f",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>{chosenChoice.result==="correct"?"Optimal response":chosenChoice.result==="partial"?"Partial — could be better":"Suboptimal response"}</div>
              <div style={{fontSize:16,fontWeight:800,marginTop:10}}>{chosenChoice.label}</div>
              <div style={{fontSize:14,color:"rgba(244,247,251,0.7)",lineHeight:1.7,marginTop:12}}>{chosenChoice.explain}</div>

              <div style={{marginTop:20,padding:16,borderRadius:16,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:11,color:"rgba(244,247,251,0.4)",fontWeight:700,letterSpacing:1,marginBottom:10}}>DATA FLOW</div>
                <FlowDiagram flow={event.flowWith} label="With the right components" good={true}/>
                <div style={{marginTop:12}}/>
                <FlowDiagram flow={event.flowWithout} label="Without them" good={false}/>
              </div>

              <div style={{marginTop:12,fontSize:12,color:"rgba(244,247,251,0.4)"}}>Calculating final score...</div>
            </div>
          </section>
        )}

        {/* RESULT */}
        {screen==="result"&&result&&(
          <section style={st.resultGrid}>
            <div style={st.resultMain}>
              <div style={{...st.resultStatus,color:result.total>=72?"#78f0c4":result.total>=54?"#ffb86b":"#ff7f7f"}}>{result.verdict}</div>
              <div style={st.resultHeadline}>{result.highlight}</div>
              {event&&(
                <div style={st.eventCard}>
                  <div style={st.eventKicker}>Stress event faced</div>
                  <div style={st.eventName}>{event.name}</div>
                  <div style={{marginTop:12}}>
                    <FlowDiagram flow={event.flowWith} label="Optimal path" good={true}/>
                    <div style={{marginTop:8}}/>
                    <FlowDiagram flow={event.flowWithout} label="Without protection" good={false}/>
                  </div>
                </div>
              )}
              <div style={st.notesCard}>
                <div style={st.eventKicker}>What happened</div>
                <div style={st.notesList}>{result.notes.map((n,i)=><div key={i} style={st.noteItem}>{n}</div>)}</div>
              </div>
            </div>
            <aside style={st.resultSide}>
              <div style={st.scoreOrb}>{result.total}</div>
              <div style={st.scoreLabel}>Overall score</div>
              <div style={st.statsCard}>
                <StatBar label="Performance" value={result.stats.performance}/>
                <StatBar label="Security" value={result.stats.security}/>
                <StatBar label="Speed" value={result.stats.speed}/>
                <StatBar label="Trust" value={result.stats.trust}/>
              </div>
              <div style={{marginTop:16}}><ArchMap build={build}/></div>
              <div style={st.resultButtons}>
                <button onClick={()=>{sound.choose();setChosenChoice(null);setEvent(null);setScreen("build");}} style={st.primaryBtnLg}>Rebuild →</button>
                <button onClick={resetAll} style={st.secondaryBtnLg}>Menu</button>
              </div>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${result.total} on the Ritual Agent Simulator — assembled ${build.length} Ritual components and ${result.total>=72?"my agent executed successfully":"learned what went wrong"}\n\nCan you build a better stack?\n\nhttps://ritual-simulator-badang.vercel.app/\n\n@ritualfnd @dunken9718 @Jez_Cryptoz @joshsimenhoff @0xMadScientist`)}`} target="_blank" rel="noopener noreferrer" style={st.shareBtn}>
                Share on X →
              </a>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const st={
  page:{minHeight:"100vh",background:"#06070a",color:"#f4f7fb",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,sans-serif",position:"relative",overflow:"hidden"},
  bgGrid:{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",backgroundSize:"24px 24px",opacity:0.08,pointerEvents:"none"},
  glowA:{position:"absolute",width:640,height:640,borderRadius:"50%",background:"radial-gradient(circle,rgba(120,240,196,0.13) 0%,transparent 68%)",top:-140,left:-120,filter:"blur(18px)",pointerEvents:"none"},
  glowB:{position:"absolute",width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle,rgba(141,183,255,0.14) 0%,transparent 70%)",bottom:-220,right:-180,filter:"blur(30px)",pointerEvents:"none"},
  shell:{position:"relative",zIndex:1,maxWidth:1360,margin:"0 auto",padding:"26px 24px 40px"},
  topbar:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:28,padding:"16px 18px",borderRadius:24,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)"},
  brandWrap:{display:"flex",alignItems:"center",gap:14},
  logo:{width:48,height:48,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,rgba(120,240,196,0.2),rgba(141,183,255,0.16))",border:"1px solid rgba(120,240,196,0.24)",color:"#78f0c4",fontSize:20,fontWeight:800},
  brand:{fontSize:18,fontWeight:800,letterSpacing:-0.3},
  brandSub:{fontSize:12,color:"rgba(244,247,251,0.55)",marginTop:2},
  heroCard:{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:22,padding:28,borderRadius:32,border:"1px solid rgba(255,255,255,0.08)",background:"linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))"},
  heroLeft:{padding:12},heroRight:{display:"flex",alignItems:"stretch"},
  kicker:{fontSize:11,color:"#78f0c4",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:14},
  heroTitle:{fontSize:"clamp(28px,4vw,54px)",lineHeight:1.08,letterSpacing:-1.9,maxWidth:720,margin:0},
  heroText:{marginTop:16,color:"rgba(244,247,251,0.68)",fontSize:15,lineHeight:1.7,maxWidth:630},
  primaryBtn:{marginTop:24,border:0,borderRadius:18,padding:"16px 22px",background:"linear-gradient(135deg,#78f0c4,#8db7ff)",color:"#081018",fontWeight:800,fontSize:15,cursor:"pointer"},
  primaryBtnLg:{width:"100%",border:0,borderRadius:20,padding:"18px 22px",background:"linear-gradient(135deg,#78f0c4,#8db7ff)",color:"#081018",fontWeight:800,fontSize:15,cursor:"pointer"},
  secondaryBtnLg:{width:"100%",borderRadius:20,padding:"16px 22px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",color:"#f4f7fb",fontWeight:700,fontSize:15,cursor:"pointer"},
  previewPanel:{flex:1,borderRadius:28,padding:24,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(9,12,18,0.7)",display:"flex",flexDirection:"column",justifyContent:"center",gap:14},
  previewTop:{fontSize:14,fontWeight:700,color:"rgba(244,247,251,0.72)",marginBottom:8},
  previewLine:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"rgba(244,247,251,0.62)",fontSize:13},
  buildGrid:{display:"grid",gridTemplateColumns:"1.15fr 0.52fr",gap:22,alignItems:"start",position:"relative"},
  mainPanel:{borderRadius:32,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)",padding:24},
  sidePanel:{display:"flex",flexDirection:"column",gap:18,position:"sticky",top:22},
  sideCard:{borderRadius:26,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)",padding:20},
  sideKicker:{fontSize:11,color:"rgba(244,247,251,0.5)",textTransform:"uppercase",letterSpacing:1.1},
  sideTitle:{fontSize:22,fontWeight:800,marginTop:10,letterSpacing:-0.8},
  sideDesc:{marginTop:10,color:"rgba(244,247,251,0.68)",lineHeight:1.7,fontSize:14},
  sideMiniTitle:{fontSize:12,color:"rgba(244,247,251,0.5)",marginBottom:8},
  chipsWrap:{display:"flex",flexWrap:"wrap",gap:8},
  chipStrong:{padding:"7px 10px",borderRadius:999,background:"rgba(120,240,196,0.12)",border:"1px solid rgba(120,240,196,0.2)",color:"#78f0c4",fontSize:11,fontWeight:700,transition:"all 0.2s"},
  chipSoft:{padding:"7px 10px",borderRadius:999,background:"rgba(141,183,255,0.10)",border:"1px solid rgba(141,183,255,0.18)",color:"#b8cdff",fontSize:11,fontWeight:700,transition:"all 0.2s"},
  sectionHead:{marginBottom:18},sectionHeadSpacing:{marginTop:28,marginBottom:18},
  sectionTitle:{margin:0,fontSize:26,letterSpacing:-0.9},
  taskGrid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12},
  taskCard:{textAlign:"left",borderRadius:22,border:"1px solid",padding:16,cursor:"pointer",transition:"all 160ms ease"},
  taskTop:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12},
  taskTitle:{fontSize:16,fontWeight:800,letterSpacing:-0.4},
  taskRisk:{fontSize:10,textTransform:"uppercase",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,padding:"6px 8px"},
  taskSubtitle:{marginTop:8,color:"#78f0c4",fontSize:12,fontWeight:700},
  taskDesc:{marginTop:8,color:"rgba(244,247,251,0.6)",lineHeight:1.6,fontSize:13},
  choiceSection:{marginTop:20},
  groupLabel:{marginBottom:10,fontSize:11,color:"rgba(244,247,251,0.52)",textTransform:"uppercase",letterSpacing:1.1},
  choiceGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10},
  choiceCard:{textAlign:"left",borderRadius:20,border:"1px solid",padding:14,cursor:"pointer",minHeight:110,transition:"all 160ms ease"},
  choiceTop:{display:"flex",alignItems:"center",gap:10},
  dot:{width:10,height:10,borderRadius:999},
  choiceName:{fontWeight:800,fontSize:15,letterSpacing:-0.3},
  choiceShort:{marginTop:8,color:"rgba(244,247,251,0.72)",fontSize:12,fontWeight:700},
  choiceDesc:{marginTop:6,color:"rgba(244,247,251,0.48)",lineHeight:1.6,fontSize:12},
  modalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(8px)"},
  modalCard:{maxWidth:520,width:"90%",borderRadius:28,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(12,14,20,0.98)",padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.5)"},
  answerBtn:{textAlign:"left",width:"100%",padding:"14px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)",color:"#f4f7fb",fontSize:14,fontWeight:600,cursor:"pointer",lineHeight:1.5,transition:"all 160ms ease"},
  simWrap:{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"calc(100vh - 160px)"},
  simCard:{width:"min(900px,100%)",borderRadius:32,padding:28,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)"},
  simKicker:{color:"#78f0c4",fontSize:12,textTransform:"uppercase",letterSpacing:1.1,fontWeight:700},
  simTitle:{marginTop:12,fontSize:32,fontWeight:800,letterSpacing:-1.2},
  simPipeline:{display:"grid",gap:12,marginTop:28},
  phaseCard:{borderRadius:22,padding:18,border:"1px solid",transition:"all 180ms ease"},
  phaseIndex:{fontSize:12,color:"rgba(244,247,251,0.48)",fontWeight:700},
  phaseLabel:{marginTop:6,fontSize:18,fontWeight:700},
  resultGrid:{display:"grid",gridTemplateColumns:"1fr 0.42fr",gap:22,alignItems:"start"},
  resultMain:{borderRadius:32,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)",padding:28},
  resultSide:{borderRadius:32,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(18px)",padding:24},
  resultStatus:{fontSize:12,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700},
  resultHeadline:{marginTop:12,fontSize:30,lineHeight:1.1,fontWeight:800,letterSpacing:-1.2},
  eventCard:{marginTop:22,borderRadius:24,padding:20,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)"},
  eventKicker:{fontSize:11,color:"rgba(244,247,251,0.48)",textTransform:"uppercase",letterSpacing:1.1},
  eventName:{marginTop:10,fontSize:20,fontWeight:800,letterSpacing:-0.6},
  notesCard:{marginTop:18,borderRadius:24,padding:20,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)"},
  notesList:{display:"grid",gap:8,marginTop:14},
  noteItem:{borderRadius:14,padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(244,247,251,0.78)",lineHeight:1.6,fontSize:13},
  scoreOrb:{width:130,height:130,margin:"0 auto",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 30% 30%,rgba(120,240,196,0.34),rgba(141,183,255,0.16),rgba(255,255,255,0.04))",border:"1px solid rgba(120,240,196,0.24)",fontSize:44,fontWeight:800,letterSpacing:-2},
  scoreLabel:{textAlign:"center",marginTop:10,color:"rgba(244,247,251,0.55)",fontSize:13},
  statsCard:{marginTop:18,borderRadius:24,padding:16,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",display:"grid",gap:12},
  statRow:{display:"grid",gap:6},statLabelRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  statLabel:{fontSize:12,color:"rgba(244,247,251,0.62)",fontWeight:700},statValue:{fontSize:12,color:"#f4f7fb",fontWeight:800},
  statTrack:{height:8,borderRadius:999,background:"rgba(255,255,255,0.06)",overflow:"hidden"},
  statFill:{height:"100%",borderRadius:999,background:"linear-gradient(90deg,#78f0c4,#8db7ff)"},
  resultButtons:{display:"grid",gap:10,marginTop:18},
  shareBtn:{display:"block",textAlign:"center",marginTop:14,padding:"14px 20px",borderRadius:16,background:"rgba(29,155,240,0.1)",border:"1px solid rgba(29,155,240,0.2)",color:"#1d9bf0",fontSize:13,fontWeight:700,letterSpacing:1,textDecoration:"none",cursor:"pointer"},
  credit:{fontSize:12,color:"rgba(244,247,251,0.45)",padding:"8px 14px",borderRadius:999,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"},
  creditLink:{color:"#78f0c4",textDecoration:"none",fontWeight:600},
};
