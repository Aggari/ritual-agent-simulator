"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const TASKS = [
  {
    id: "buy-dip",
    title: "Buy Dip Bot",
    subtitle: "React to sudden market drops before the bounce",
    desc: "A fast-response agent that monitors volatility and executes a buy when a sharp drop is detected. Needs real-time signals and fast inference.",
    needs: ["llm", "infernet", "resonance"],
    prefers: ["symphony", "sched"],
    risk: "high",
  },
  {
    id: "private-research",
    title: "Private Research Agent",
    subtitle: "Handle sensitive prompts without leaking context",
    desc: "An agent that summarizes confidential research inside a secure enclave. TEE protects the input, LLM does the reasoning.",
    needs: ["llm", "tee"],
    prefers: ["symphony", "guardians"],
    risk: "medium",
  },
  {
    id: "news-reaction",
    title: "News Reaction Agent",
    subtitle: "Interpret signals and react to events in real time",
    desc: "An event-driven agent that reads incoming signals via Infernet and uses LLM to decide on-chain actions. Guardians filter bad inputs.",
    needs: ["llm", "infernet", "guardians"],
    prefers: ["resonance"],
    risk: "medium",
  },
  {
    id: "rebalance",
    title: "Auto Rebalance Vault",
    subtitle: "Keep a vault aligned under changing conditions",
    desc: "A periodic agent that checks allocations and rebalances. Runs on Scheduled Tx without external keepers. Resonance optimizes execution cost.",
    needs: ["sched", "resonance"],
    prefers: ["tee", "symphony"],
    risk: "low",
  },
  {
    id: "zk-prover",
    title: "ZK Proof Service",
    subtitle: "Generate proofs for external chains",
    desc: "A specialized node that generates zero-knowledge proofs on demand. Requires ZK Sidecar, Symphony for verification, and Resonance for pricing.",
    needs: ["zk", "symphony", "resonance"],
    prefers: ["guardians"],
    risk: "medium",
  },
  {
    id: "model-trader",
    title: "Model IP Trader",
    subtitle: "Trade verified AI models on-chain",
    desc: "An agent that lists, verifies provenance (vTune), and trades AI model weights stored in Modular Storage. Needs LLM for evaluation.",
    needs: ["llm", "storage", "resonance"],
    prefers: ["tee", "symphony"],
    risk: "low",
  },
];

const COMPONENTS = {
  execution: [
    {
      id: "evm",
      name: "EVM++",
      short: "Extended execution layer",
      desc: "The base of all Ritual compute. Adds precompiles for AI workloads. Required for everything else.",
      color: "#5DCAA5",
      ritual: true,
    },
  ],
  sidecar: [
    {
      id: "llm",
      name: "LLM Sidecar",
      short: "Language model inference",
      desc: "Runs any LLM architecture via TGI or llama.cpp. Executes parallel to the EVM++ client.",
      color: "#78f0c4",
      requires: ["evm"],
      ritual: true,
    },
    {
      id: "tee",
      name: "TEE Sidecar",
      short: "Trusted execution environment",
      desc: "Runs code inside hardware enclaves. Protects keys and sensitive inputs. Even the operator can't see inside.",
      color: "#ffb86b",
      requires: ["evm"],
      ritual: true,
    },
    {
      id: "zk",
      name: "ZK Sidecar",
      short: "Zero-knowledge proofs",
      desc: "Generates and verifies ZK proofs. Used by Symphony for verification and by Prover Networks.",
      color: "#8db7ff",
      requires: ["evm"],
      ritual: true,
    },
  ],
  trigger: [
    {
      id: "infernet",
      name: "Infernet",
      short: "Oracle network · 8,000+ nodes",
      desc: "Decentralized oracle network. Delivers off-chain data and triggers on-chain actions in real time.",
      color: "#ff89b5",
      requires: ["evm"],
      ritual: true,
    },
    {
      id: "sched",
      name: "Scheduled Tx",
      short: "Recurring execution",
      desc: "The chain itself wakes the agent on a set cadence. No external keeper bot needed. Part of EVM++ Core.",
      color: "#b5a7ff",
      requires: ["evm"],
      ritual: true,
    },
  ],
  consensus: [
    {
      id: "resonance",
      name: "Resonance",
      short: "Fee mechanism",
      desc: "Two-sided matching: users set valuation, nodes set cost. Brokers find the surplus-maximizing match.",
      color: "#EF9F27",
      requires: ["evm"],
      ritual: true,
    },
    {
      id: "symphony",
      name: "Symphony",
      short: "EOVMT consensus",
      desc: "Execute-once-verify-many-times. One node executes, others verify via TEE attestation or ZK proof. No redundant re-execution.",
      color: "#ffd96a",
      requires: ["resonance"],
      ritual: true,
    },
  ],
  defense: [
    {
      id: "guardians",
      name: "Guardians",
      short: "Semantic firewall",
      desc: "Filters requests at node level using embedding distance. Blocks adversarial or out-of-scope inputs before they reach the agent.",
      color: "#ff7f7f",
      requires: ["evm"],
      ritual: true,
    },
  ],
  storage: [
    {
      id: "storage",
      name: "Modular Storage",
      short: "Arweave + HuggingFace",
      desc: "Permanent storage layer. Smart contracts read/write natively. Stores model weights, proofs, agent state.",
      color: "#B4B2A9",
      requires: ["evm"],
      ritual: true,
    },
  ],
};

const ALL_COMPONENTS = Object.values(COMPONENTS).flat();

const EVENTS = [
  {
    id: "oracle-delay",
    name: "Oracle Delay",
    tone: "warning",
    desc: "External signal arrived late. The timing edge is shrinking.",
    impact: ({ build, task }) => {
      const fx = [];
      if (task.id === "buy-dip" || task.id === "news-reaction") {
        if (!build.includes("infernet")) fx.push({ stat: "speed", delta: -28, reason: "Without Infernet, the agent had no real-time signal pipeline and reacted too late." });
        else fx.push({ stat: "speed", delta: 12, reason: "Infernet's 8,000+ node network delivered the signal despite upstream delay." });
      }
      return fx;
    },
  },
  {
    id: "sensitive-leak",
    name: "Sensitive Input Detected",
    tone: "danger",
    desc: "The task unexpectedly included confidential data.",
    impact: ({ build, task }) => {
      const fx = [];
      if (!build.includes("tee")) {
        fx.push({ stat: "security", delta: -35, reason: "Sensitive data processed without TEE protection. Even the node operator could have seen it." });
        fx.push({ stat: "trust", delta: -18, reason: "Users lost confidence — no hardware enclave guaranteed privacy." });
      } else {
        fx.push({ stat: "security", delta: 16, reason: "TEE sidecar isolated the sensitive input inside a secure enclave." });
      }
      return fx;
    },
  },
  {
    id: "prompt-injection",
    name: "Adversarial Prompt Injection",
    tone: "danger",
    desc: "A manipulative prompt tried to alter the agent's behavior.",
    impact: ({ build }) => {
      const fx = [];
      if (build.includes("llm") && !build.includes("guardians")) {
        fx.push({ stat: "trust", delta: -30, reason: "LLM output was manipulated. No Guardians to filter adversarial input by embedding distance." });
      }
      if (build.includes("guardians")) {
        fx.push({ stat: "trust", delta: 14, reason: "Guardians' semantic firewall detected the adversarial pattern and blocked it before reaching the LLM." });
      }
      if (build.includes("symphony")) {
        fx.push({ stat: "trust", delta: 8, reason: "Symphony's verification layer caught the anomalous output during attestation." });
      }
      return fx;
    },
  },
  {
    id: "gas-spike",
    name: "Fee Spike",
    tone: "warning",
    desc: "Transaction costs surged during execution.",
    impact: ({ build }) => {
      const fx = [];
      if (!build.includes("resonance")) {
        fx.push({ stat: "performance", delta: -22, reason: "Without Resonance, the agent paid full fee without surplus-maximizing matching." });
      } else {
        fx.push({ stat: "performance", delta: 10, reason: "Resonance's two-sided matching found a node willing to execute at a competitive price." });
      }
      return fx;
    },
  },
  {
    id: "fake-data",
    name: "Corrupted Data Source",
    tone: "danger",
    desc: "A corrupted data source tried to influence the agent's decision.",
    impact: ({ build }) => {
      const fx = [];
      if (!build.includes("guardians") && !build.includes("symphony")) {
        fx.push({ stat: "trust", delta: -28, reason: "No Guardians to filter bad input, no Symphony to verify output. The agent trusted corrupted data." });
      }
      if (build.includes("guardians")) fx.push({ stat: "trust", delta: 12, reason: "Guardians filtered the corrupted source by semantic distance before it reached the agent." });
      if (build.includes("symphony")) fx.push({ stat: "trust", delta: 8, reason: "Symphony's verification detected inconsistent output and flagged it." });
      return fx;
    },
  },
  {
    id: "node-failure",
    name: "Executing Node Went Down",
    tone: "danger",
    desc: "The node running your agent crashed mid-execution.",
    impact: ({ build }) => {
      const fx = [];
      if (!build.includes("symphony")) {
        fx.push({ stat: "performance", delta: -30, reason: "Without Symphony, there's no mechanism for another node to pick up the failed execution." });
        fx.push({ stat: "speed", delta: -15, reason: "The agent stalled completely until manual intervention." });
      } else {
        fx.push({ stat: "performance", delta: 8, reason: "Symphony's EOVMT allowed another verifier node to re-execute the task." });
        if (build.includes("resonance")) fx.push({ stat: "speed", delta: 6, reason: "Resonance quickly matched the task to an alternative node." });
      }
      return fx;
    },
  },
  {
    id: "sybil-flood",
    name: "Sybil Request Flood",
    tone: "danger",
    desc: "Thousands of fake requests flooded the node.",
    impact: ({ build }) => {
      const fx = [];
      if (!build.includes("guardians")) {
        fx.push({ stat: "performance", delta: -25, reason: "No Guardians firewall. The node processed fake requests alongside real ones." });
        fx.push({ stat: "security", delta: -15, reason: "Sybil requests consumed compute resources meant for legitimate tasks." });
      } else {
        fx.push({ stat: "security", delta: 14, reason: "Guardians' embedding-distance filter dropped sybil requests before they hit the execution layer." });
        fx.push({ stat: "performance", delta: 6, reason: "Node resources stayed available for legitimate compute." });
      }
      return fx;
    },
  },
  {
    id: "reexecution-overhead",
    name: "Re-execution Overhead",
    tone: "warning",
    desc: "Multiple nodes redundantly executed the same task.",
    impact: ({ build }) => {
      const fx = [];
      if (!build.includes("symphony")) {
        fx.push({ stat: "speed", delta: -20, reason: "Without Symphony's EOVMT, every validator re-executed the full computation." });
        fx.push({ stat: "performance", delta: -12, reason: "Redundant execution wasted network resources." });
      } else {
        fx.push({ stat: "speed", delta: 10, reason: "Symphony ensured only one node executed. Others verified the attestation." });
        fx.push({ stat: "performance", delta: 8, reason: "EOVMT eliminated redundant computation across the network." });
      }
      return fx;
    },
  },
];

function clamp(n) { return Math.max(0, Math.min(100, n)); }

function useSound() {
  const ctxRef = useRef(null);
  const getCtx = () => { if (!ctxRef.current) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctxRef.current = new C(); } return ctxRef.current; };
  const tone = (f, d, t = "sine", v = 0.03, dl = 0) => {
    try { const c = getCtx(); if (!c) return; const now = c.currentTime + dl; const o = c.createOscillator(); const g = c.createGain();
    o.type = t; o.frequency.setValueAtTime(f, now); g.gain.setValueAtTime(v, now); g.gain.exponentialRampToValueAtTime(0.001, now + d);
    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + d); } catch {}
  };
  return {
    start: () => { tone(440,0.08,"sine",0.03,0); tone(554,0.08,"sine",0.03,0.08); tone(659,0.12,"sine",0.03,0.16); },
    choose: () => { tone(620,0.06,"triangle",0.025,0); tone(760,0.08,"triangle",0.02,0.05); },
    deploy: () => { tone(240,0.08,"sawtooth",0.025,0); tone(320,0.09,"sawtooth",0.025,0.06); tone(480,0.11,"triangle",0.02,0.14); },
    tick: (i) => { tone(400+i*60,0.08,"sine",0.02,0); },
    success: () => { [523,659,784,1047].forEach((f,i)=>tone(f,0.15,"sine",0.028,i*0.08)); },
    fail: () => { tone(210,0.18,"square",0.03,0); tone(160,0.24,"square",0.025,0.09); },
    reset: () => { tone(330,0.05,"triangle",0.02,0); tone(280,0.08,"triangle",0.02,0.05); },
    warn: () => { tone(300,0.1,"square",0.02,0); },
  };
}

function StatBar({ label, value }) {
  return (
    <div style={styles.statRow}>
      <div style={styles.statLabelRow}>
        <span style={styles.statLabel}>{label}</span>
        <span style={styles.statValue}>{value}</span>
      </div>
      <div style={styles.statTrack}>
        <div style={{ ...styles.statFill, width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Page() {
  const [screen, setScreen] = useState("menu");
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [build, setBuild] = useState(["evm"]);
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const sound = useSound();

  const selectedTask = useMemo(() => TASKS.find(t => t.id === taskId), [taskId]);

  const toggleComponent = (id) => {
    if (id === "evm") return;
    const comp = ALL_COMPONENTS.find(c => c.id === id);
    if (build.includes(id)) {
      const dependents = ALL_COMPONENTS.filter(c => c.requires?.includes(id) && build.includes(c.id));
      if (dependents.length > 0) {
        setWarnings([`Remove ${dependents.map(d=>d.name).join(", ")} first — they depend on ${comp.name}`]);
        sound.warn();
        setTimeout(() => setWarnings([]), 2500);
        return;
      }
      setBuild(b => b.filter(x => x !== id));
    } else {
      const missing = (comp.requires || []).filter(r => !build.includes(r));
      if (missing.length > 0) {
        const names = missing.map(m => ALL_COMPONENTS.find(c => c.id === m)?.name || m);
        setWarnings([`${comp.name} needs ${names.join(" + ")} first`]);
        sound.warn();
        setTimeout(() => setWarnings([]), 2500);
        return;
      }
      setBuild(b => [...b, id]);
      sound.choose();
    }
  };

  const missingNeeds = useMemo(() => {
    return selectedTask.needs.filter(n => !build.includes(n));
  }, [selectedTask, build]);

  const missingPrefers = useMemo(() => {
    return selectedTask.prefers.filter(n => !build.includes(n));
  }, [selectedTask, build]);

  const evaluateRun = () => {
    const stats = { performance: 55, security: 50, speed: 52, trust: 50 };
    const notes = [];
    const push = (stat, delta, reason) => { stats[stat] = clamp(stats[stat] + delta); notes.push(reason); };

    selectedTask.needs.forEach(n => {
      const comp = ALL_COMPONENTS.find(c => c.id === n);
      if (build.includes(n)) push("performance", 12, `${comp.name} fulfilled a core requirement for this task.`);
      else push("performance", -20, `Missing ${comp.name} — a core requirement for ${selectedTask.title}.`);
    });
    selectedTask.prefers.forEach(n => {
      const comp = ALL_COMPONENTS.find(c => c.id === n);
      if (build.includes(n)) push("performance", 6, `${comp.name} strengthened the build as a recommended component.`);
    });

    if (build.includes("resonance")) push("performance", 8, "Resonance optimized execution cost via surplus-maximizing matching.");
    if (build.includes("symphony")) { push("trust", 12, "Symphony's EOVMT reduced redundant execution and added verification."); push("speed", 6, "Only one node executed. Others verified attestations."); }
    if (build.includes("guardians")) push("security", 10, "Guardians filtered adversarial inputs at node level using semantic distance.");
    if (build.includes("tee")) push("security", 10, "TEE sidecar isolated execution inside hardware enclaves.");
    if (build.includes("storage")) push("trust", 6, "Modular Storage provided permanent, verifiable data persistence via Arweave.");

    const chosenEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    chosenEvent.impact({ build, task: selectedTask }).forEach(({ stat, delta, reason }) => push(stat, delta, reason));

    const total = Math.round((stats.performance + stats.security + stats.speed + stats.trust) / 4);
    const verdict = total >= 72 ? "Agent executed" : total >= 54 ? "Mission unstable" : "Agent compromised";
    const highlight = total >= 72
      ? "Your Ritual-native stack handled the scenario with strong coordination."
      : total >= 54
      ? "The agent survived, but missing components created fragility."
      : "Critical components were missing. The environment exposed architectural gaps.";

    return { stats, total, verdict, highlight, event: chosenEvent, notes: [...new Set(notes)].slice(0, 8) };
  };

  const deploy = () => {
    sound.deploy(); setIsRunning(true); setResult(null); setScreen("sim"); setPhaseIndex(0);
  };

  useEffect(() => {
    if (screen !== "sim" || !isRunning) return;
    if (phaseIndex > 4) {
      const evaluated = evaluateRun(); setResult(evaluated); setIsRunning(false); setScreen("result");
      if (evaluated.total >= 72) sound.success(); else sound.fail(); return;
    }
    const id = setTimeout(() => { sound.tick(phaseIndex); setPhaseIndex(p => p + 1); }, 700);
    return () => clearTimeout(id);
  }, [screen, isRunning, phaseIndex]);

  const resetAll = () => { sound.reset(); setBuild(["evm"]); setResult(null); setPhaseIndex(-1); setIsRunning(false); setWarnings([]); setScreen("menu"); };

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} /><div style={styles.glowA} /><div style={styles.glowB} />
      <div style={styles.shell}>
        <header style={styles.topbar}>
          <div style={styles.brandWrap}>
            <div style={styles.logo}>◆</div>
            <div>
              <div style={styles.brand}>Ritual Agent Simulator</div>
              <div style={styles.brandSub}>Build. Deploy. Stress test.</div>
            </div>
          </div>
        </header>

        {screen === "menu" && (
          <section style={styles.heroCard}>
            <div style={styles.heroLeft}>
              <div style={styles.kicker}>Interactive Learning Game</div>
              <h1 style={styles.heroTitle}>Build agents with the real Ritual stack.</h1>
              <p style={styles.heroText}>Pick a task, assemble Ritual components with correct dependencies, and see whether your agent survives real-world stress events.</p>
              <button onClick={() => { sound.start(); setScreen("build"); }} style={styles.primaryBtn}>Start Building →</button>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.previewPanel}>
                <div style={styles.previewTop}>Stack Overview</div>
                <div style={styles.previewLine}><span>Tasks</span><strong>{TASKS.length} scenarios</strong></div>
                <div style={styles.previewLine}><span>Components</span><strong>{ALL_COMPONENTS.length} Ritual modules</strong></div>
                <div style={styles.previewLine}><span>Dependencies</span><strong>Enforced</strong></div>
                <div style={styles.previewLine}><span>Stress events</span><strong>{EVENTS.length} types</strong></div>
              </div>
            </div>
          </section>
        )}

        {screen === "build" && (
          <section style={styles.buildGrid}>
            <div style={styles.mainPanel}>
              <div style={styles.sectionHead}><div style={styles.kicker}>Step 1</div><h2 style={styles.sectionTitle}>Choose a task</h2></div>
              <div style={styles.taskGrid}>
                {TASKS.map(task => (
                  <button key={task.id} onClick={() => { setTaskId(task.id); sound.choose(); }} style={{
                    ...styles.taskCard,
                    borderColor: task.id === taskId ? "#78f0c4" : "rgba(255,255,255,0.08)",
                    background: task.id === taskId ? "rgba(120,240,196,0.08)" : "rgba(255,255,255,0.02)",
                  }}>
                    <div style={styles.taskTop}>
                      <span style={styles.taskTitle}>{task.title}</span>
                      <span style={{ ...styles.taskRisk, color: task.risk === "high" ? "#ff7f7f" : task.risk === "medium" ? "#ffb86b" : "#78f0c4" }}>{task.risk}</span>
                    </div>
                    <div style={styles.taskSubtitle}>{task.subtitle}</div>
                    <div style={styles.taskDesc}>{task.desc}</div>
                  </button>
                ))}
              </div>

              <div style={styles.sectionHeadSpacing}><div style={styles.kicker}>Step 2</div><h2 style={styles.sectionTitle}>Assemble the stack</h2>
                <p style={{ fontSize: 13, color: "rgba(244,247,251,0.45)", marginTop: 6 }}>EVM++ is always on. Toggle other components. Dependencies are enforced.</p>
              </div>

              {Object.entries(COMPONENTS).map(([group, items]) => (
                <div key={group} style={styles.choiceSection}>
                  <div style={styles.groupLabel}>{group === "execution" ? "Execution Layer" : group === "sidecar" ? "Execution Sidecars" : group === "trigger" ? "Triggers" : group === "consensus" ? "Consensus + Fee" : group === "defense" ? "Defense" : "Storage"}</div>
                  <div style={styles.choiceGrid}>
                    {items.map(item => {
                      const active = build.includes(item.id);
                      const isBase = item.id === "evm";
                      return (
                        <button key={item.id} onClick={() => toggleComponent(item.id)} style={{
                          ...styles.choiceCard,
                          borderColor: active ? item.color : "rgba(255,255,255,0.08)",
                          background: active ? `${item.color}12` : "rgba(255,255,255,0.02)",
                          opacity: isBase ? 0.7 : 1,
                          cursor: isBase ? "default" : "pointer",
                        }}>
                          <div style={styles.choiceTop}>
                            <span style={{ ...styles.dot, background: active ? item.color : "rgba(255,255,255,0.15)" }} />
                            <span style={styles.choiceName}>{item.name}</span>
                            {isBase && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>always on</span>}
                            {active && !isBase && <span style={{ fontSize: 10, color: item.color, marginLeft: "auto" }}>active</span>}
                          </div>
                          <div style={styles.choiceShort}>{item.short}</div>
                          <div style={styles.choiceDesc}>{item.desc}</div>
                          {item.requires && <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Requires: {item.requires.map(r => ALL_COMPONENTS.find(c=>c.id===r)?.name).join(", ")}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <aside style={styles.sidePanel}>
              <div style={styles.sideCard}>
                <div style={styles.sideKicker}>Selected task</div>
                <div style={styles.sideTitle}>{selectedTask.title}</div>
                <div style={styles.sideDesc}>{selectedTask.desc}</div>
                <div style={styles.needsWrap}>
                  <div style={styles.sideMiniTitle}>Required</div>
                  <div style={styles.chipsWrap}>
                    {selectedTask.needs.map(n => {
                      const comp = ALL_COMPONENTS.find(c=>c.id===n);
                      const has = build.includes(n);
                      return <span key={n} style={{ ...styles.chipStrong, opacity: has ? 1 : 0.4, textDecoration: has ? "none" : "line-through" }}>{comp?.name || n}</span>;
                    })}
                  </div>
                  <div style={{ ...styles.sideMiniTitle, marginTop: 12 }}>Recommended</div>
                  <div style={styles.chipsWrap}>
                    {selectedTask.prefers.map(n => {
                      const comp = ALL_COMPONENTS.find(c=>c.id===n);
                      const has = build.includes(n);
                      return <span key={n} style={{ ...styles.chipSoft, opacity: has ? 1 : 0.4 }}>{comp?.name || n}</span>;
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.sideCard}>
                <div style={styles.sideKicker}>Your build ({build.length} components)</div>
                <div style={{ ...styles.chipsWrap, marginTop: 10 }}>
                  {build.map(id => {
                    const comp = ALL_COMPONENTS.find(c=>c.id===id);
                    return <span key={id} style={{ ...styles.summaryChip, borderColor: `${comp?.color}40`, color: comp?.color }}>{comp?.name}</span>;
                  })}
                </div>
                {missingNeeds.length > 0 && (
                  <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "rgba(255,127,127,0.06)", border: "1px solid rgba(255,127,127,0.15)" }}>
                    <span style={{ fontSize: 11, color: "#ff7f7f", fontWeight: 600 }}>Missing core: {missingNeeds.map(n => ALL_COMPONENTS.find(c=>c.id===n)?.name).join(", ")}</span>
                  </div>
                )}
              </div>

              {warnings.map((w, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,127,127,0.06)", border: "1px solid rgba(255,127,127,0.15)", fontSize: 12, color: "#ff7f7f", fontWeight: 600 }}>{w}</div>
              ))}

              <button onClick={deploy} style={styles.primaryBtnLarge}>Deploy Agent →</button>
            </aside>
          </section>
        )}

        {screen === "sim" && (
          <section style={styles.simWrap}>
            <div style={styles.simCard}>
              <div style={styles.simKicker}>Deployment in progress</div>
              <div style={styles.simTitle}>Running your Ritual-native agent</div>
              <div style={styles.simPipeline}>
                {["Initializing EVM++ core", "Binding sidecars + triggers", "Connecting consensus layer", "Guardians scanning inputs", "Processing live event"].map((label, i) => (
                  <div key={label} style={{
                    ...styles.phaseCard,
                    borderColor: i <= phaseIndex ? "#78f0c4" : "rgba(255,255,255,0.08)",
                    background: i <= phaseIndex ? "rgba(120,240,196,0.08)" : "rgba(255,255,255,0.02)",
                  }}>
                    <div style={styles.phaseIndex}>{String(i + 1).padStart(2, "0")}</div>
                    <div style={styles.phaseLabel}>{label}</div>
                    {i <= phaseIndex && !build.includes("evm") && i === 0 && <div style={{ color: "#ff7f7f", fontSize: 12, marginTop: 4 }}>EVM++ missing!</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {screen === "result" && result && (
          <section style={styles.resultGrid}>
            <div style={styles.resultMain}>
              <div style={{ ...styles.resultStatus, color: result.total >= 72 ? "#78f0c4" : result.total >= 54 ? "#ffb86b" : "#ff7f7f" }}>{result.verdict}</div>
              <div style={styles.resultHeadline}>{result.highlight}</div>
              <div style={styles.eventCard}>
                <div style={styles.eventKicker}>Live stress event</div>
                <div style={styles.eventName}>{result.event?.name}</div>
                <div style={styles.eventDesc}>{result.event?.desc}</div>
              </div>
              <div style={styles.notesCard}>
                <div style={styles.eventKicker}>What happened and why</div>
                <div style={styles.notesList}>
                  {result.notes.map((note, i) => <div key={i} style={styles.noteItem}>{note}</div>)}
                </div>
              </div>
            </div>
            <aside style={styles.resultSide}>
              <div style={styles.scoreOrb}>{result.total}</div>
              <div style={styles.scoreLabel}>Overall score</div>
              <div style={styles.statsCard}>
                <StatBar label="Performance" value={result.stats.performance} />
                <StatBar label="Security" value={result.stats.security} />
                <StatBar label="Speed" value={result.stats.speed} />
                <StatBar label="Trust" value={result.stats.trust} />
              </div>
              <div style={styles.resultButtons}>
                <button onClick={() => { sound.choose(); setScreen("build"); }} style={styles.primaryBtnLarge}>Rebuild →</button>
                <button onClick={resetAll} style={styles.secondaryBtnLarge}>Menu</button>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight:"100vh", background:"#06070a", color:"#f4f7fb", fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,sans-serif", position:"relative", overflow:"hidden" },
  bgGrid: { position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize:"24px 24px", opacity:0.08, pointerEvents:"none" },
  glowA: { position:"absolute", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle, rgba(120,240,196,0.13) 0%, transparent 68%)", top:-140, left:-120, filter:"blur(18px)", pointerEvents:"none" },
  glowB: { position:"absolute", width:620, height:620, borderRadius:"50%", background:"radial-gradient(circle, rgba(141,183,255,0.14) 0%, transparent 70%)", bottom:-220, right:-180, filter:"blur(30px)", pointerEvents:"none" },
  shell: { position:"relative", zIndex:1, maxWidth:1360, margin:"0 auto", padding:"26px 24px 40px" },
  topbar: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, marginBottom:28, padding:"16px 18px", borderRadius:24, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)" },
  brandWrap: { display:"flex", alignItems:"center", gap:14 },
  logo: { width:48, height:48, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg, rgba(120,240,196,0.2), rgba(141,183,255,0.16))", border:"1px solid rgba(120,240,196,0.24)", color:"#78f0c4", fontSize:20, fontWeight:800 },
  brand: { fontSize:18, fontWeight:800, letterSpacing:-0.3 },
  brandSub: { fontSize:12, color:"rgba(244,247,251,0.55)", marginTop:2 },
  heroCard: { display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:22, padding:28, borderRadius:32, border:"1px solid rgba(255,255,255,0.08)", background:"linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))" },
  heroLeft: { padding:12 },
  heroRight: { display:"flex", alignItems:"stretch" },
  kicker: { fontSize:11, color:"#78f0c4", fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", marginBottom:14 },
  heroTitle: { fontSize:"clamp(32px, 4vw, 58px)", lineHeight:1.05, letterSpacing:-1.9, maxWidth:720, margin:0 },
  heroText: { marginTop:16, color:"rgba(244,247,251,0.68)", fontSize:16, lineHeight:1.7, maxWidth:630 },
  primaryBtn: { marginTop:24, border:0, borderRadius:18, padding:"16px 22px", background:"linear-gradient(135deg, #78f0c4, #8db7ff)", color:"#081018", fontWeight:800, fontSize:15, cursor:"pointer" },
  primaryBtnLarge: { width:"100%", border:0, borderRadius:20, padding:"18px 22px", background:"linear-gradient(135deg, #78f0c4, #8db7ff)", color:"#081018", fontWeight:800, fontSize:15, cursor:"pointer" },
  secondaryBtnLarge: { width:"100%", borderRadius:20, padding:"16px 22px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"#f4f7fb", fontWeight:700, fontSize:15, cursor:"pointer" },
  previewPanel: { flex:1, borderRadius:28, padding:24, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(9,12,18,0.7)", display:"flex", flexDirection:"column", justifyContent:"center", gap:14 },
  previewTop: { fontSize:14, fontWeight:700, color:"rgba(244,247,251,0.72)", marginBottom:8 },
  previewLine: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", color:"rgba(244,247,251,0.62)", fontSize:14 },
  buildGrid: { display:"grid", gridTemplateColumns:"1.15fr 0.52fr", gap:22, alignItems:"start" },
  mainPanel: { borderRadius:32, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)", padding:24 },
  sidePanel: { display:"flex", flexDirection:"column", gap:18, position:"sticky", top:22 },
  sideCard: { borderRadius:26, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)", padding:20 },
  sideKicker: { fontSize:11, color:"rgba(244,247,251,0.5)", textTransform:"uppercase", letterSpacing:1.1 },
  sideTitle: { fontSize:24, fontWeight:800, marginTop:10, letterSpacing:-0.8 },
  sideDesc: { marginTop:10, color:"rgba(244,247,251,0.68)", lineHeight:1.7, fontSize:14 },
  sideMiniTitle: { fontSize:12, color:"rgba(244,247,251,0.5)", marginBottom:10 },
  needsWrap: { marginTop:18 },
  chipsWrap: { display:"flex", flexWrap:"wrap", gap:8 },
  chipStrong: { padding:"8px 10px", borderRadius:999, background:"rgba(120,240,196,0.12)", border:"1px solid rgba(120,240,196,0.2)", color:"#78f0c4", fontSize:12, fontWeight:700, transition:"all 0.2s" },
  chipSoft: { padding:"8px 10px", borderRadius:999, background:"rgba(141,183,255,0.10)", border:"1px solid rgba(141,183,255,0.18)", color:"#b8cdff", fontSize:12, fontWeight:700, transition:"all 0.2s" },
  summaryChip: { padding:"9px 11px", borderRadius:999, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", fontSize:12, fontWeight:700 },
  sectionHead: { marginBottom:18 },
  sectionHeadSpacing: { marginTop:28, marginBottom:18 },
  sectionTitle: { margin:0, fontSize:28, letterSpacing:-0.9 },
  taskGrid: { display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:14 },
  taskCard: { textAlign:"left", borderRadius:24, border:"1px solid", padding:18, cursor:"pointer", transition:"all 160ms ease" },
  taskTop: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 },
  taskTitle: { fontSize:18, fontWeight:800, letterSpacing:-0.4 },
  taskRisk: { fontSize:11, textTransform:"uppercase", border:"1px solid rgba(255,255,255,0.08)", borderRadius:999, padding:"7px 9px" },
  taskSubtitle: { marginTop:10, color:"#78f0c4", fontSize:13, fontWeight:700 },
  taskDesc: { marginTop:10, color:"rgba(244,247,251,0.65)", lineHeight:1.7, fontSize:14 },
  choiceSection: { marginTop:22 },
  groupLabel: { marginBottom:12, fontSize:12, color:"rgba(244,247,251,0.52)", textTransform:"uppercase", letterSpacing:1.1 },
  choiceGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 },
  choiceCard: { textAlign:"left", borderRadius:22, border:"1px solid", padding:16, cursor:"pointer", minHeight:120, transition:"all 160ms ease" },
  choiceTop: { display:"flex", alignItems:"center", gap:10 },
  dot: { width:10, height:10, borderRadius:999 },
  choiceName: { fontWeight:800, fontSize:16, letterSpacing:-0.3 },
  choiceShort: { marginTop:10, color:"rgba(244,247,251,0.72)", fontSize:13, fontWeight:700 },
  choiceDesc: { marginTop:8, color:"rgba(244,247,251,0.52)", lineHeight:1.65, fontSize:13 },
  simWrap: { display:"flex", justifyContent:"center", alignItems:"center", minHeight:"calc(100vh - 160px)" },
  simCard: { width:"min(900px, 100%)", borderRadius:32, padding:28, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)" },
  simKicker: { color:"#78f0c4", fontSize:12, textTransform:"uppercase", letterSpacing:1.1, fontWeight:700 },
  simTitle: { marginTop:12, fontSize:34, fontWeight:800, letterSpacing:-1.2 },
  simPipeline: { display:"grid", gap:12, marginTop:28 },
  phaseCard: { borderRadius:22, padding:18, border:"1px solid", transition:"all 180ms ease" },
  phaseIndex: { fontSize:12, color:"rgba(244,247,251,0.48)", fontWeight:700 },
  phaseLabel: { marginTop:6, fontSize:18, fontWeight:700 },
  resultGrid: { display:"grid", gridTemplateColumns:"1fr 0.42fr", gap:22, alignItems:"start" },
  resultMain: { borderRadius:32, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)", padding:28 },
  resultSide: { borderRadius:32, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(18px)", padding:24 },
  resultStatus: { fontSize:12, textTransform:"uppercase", letterSpacing:1.2, fontWeight:700 },
  resultHeadline: { marginTop:12, fontSize:34, lineHeight:1.1, fontWeight:800, letterSpacing:-1.2 },
  eventCard: { marginTop:22, borderRadius:24, padding:20, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" },
  eventKicker: { fontSize:11, color:"rgba(244,247,251,0.48)", textTransform:"uppercase", letterSpacing:1.1 },
  eventName: { marginTop:10, fontSize:22, fontWeight:800, letterSpacing:-0.6 },
  eventDesc: { marginTop:10, color:"rgba(244,247,251,0.64)", lineHeight:1.7, fontSize:14 },
  notesCard: { marginTop:18, borderRadius:24, padding:20, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" },
  notesList: { display:"grid", gap:10, marginTop:14 },
  noteItem: { borderRadius:18, padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(244,247,251,0.78)", lineHeight:1.65, fontSize:14 },
  scoreOrb: { width:144, height:144, margin:"0 auto", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"radial-gradient(circle at 30% 30%, rgba(120,240,196,0.34), rgba(141,183,255,0.16), rgba(255,255,255,0.04))", border:"1px solid rgba(120,240,196,0.24)", fontSize:48, fontWeight:800, letterSpacing:-2 },
  scoreLabel: { textAlign:"center", marginTop:12, color:"rgba(244,247,251,0.55)", fontSize:13 },
  statsCard: { marginTop:22, borderRadius:24, padding:18, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", display:"grid", gap:14 },
  statRow: { display:"grid", gap:8 },
  statLabelRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  statLabel: { fontSize:13, color:"rgba(244,247,251,0.62)", fontWeight:700 },
  statValue: { fontSize:13, color:"#f4f7fb", fontWeight:800 },
  statTrack: { height:10, borderRadius:999, background:"rgba(255,255,255,0.06)", overflow:"hidden" },
  statFill: { height:"100%", borderRadius:999, background:"linear-gradient(90deg, #78f0c4, #8db7ff)" },
  resultButtons: { display:"grid", gap:10, marginTop:18 },
};
