"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const TASKS = [
  {
    id: "buy-dip",
    title: "Buy Dip Bot",
    subtitle: "React to sudden market drops before the bounce",
    desc: "A fast-response agent that monitors volatility and executes a buy when a sharp drop is detected.",
    needs: ["llm", "infernet"],
    prefers: ["verify", "sched"],
    risk: "high",
  },
  {
    id: "private-research",
    title: "Private Research Agent",
    subtitle: "Handle sensitive prompts without leaking context",
    desc: "An agent that summarizes confidential research and executes workflow decisions with privacy in mind.",
    needs: ["llm", "tee"],
    prefers: ["verify"],
    risk: "medium",
  },
  {
    id: "news-reaction",
    title: "News Reaction Agent",
    subtitle: "Interpret signals and react to events in real time",
    desc: "An event-driven agent that reads incoming signals and decides whether to trigger an on-chain action.",
    needs: ["llm", "infernet"],
    prefers: ["verify"],
    risk: "medium",
  },
  {
    id: "rebalance",
    title: "Auto Rebalance Vault",
    subtitle: "Keep a vault aligned under changing conditions",
    desc: "A system agent that periodically checks allocations and rebalances positions under changing market conditions.",
    needs: ["sched"],
    prefers: ["verify", "tee"],
    risk: "low",
  },
];

const COMPONENTS = {
  brain: [
    {
      id: "llm",
      name: "LLM",
      short: "Reasoning engine",
      desc: "Interprets context, responds to changing inputs, and makes decisions.",
      color: "#78f0c4",
    },
    {
      id: "rules",
      name: "Rule Engine",
      short: "Deterministic logic",
      desc: "Fast and stable, but less adaptive to novel situations.",
      color: "#8db7ff",
    },
  ],
  security: [
    {
      id: "tee",
      name: "TEE",
      short: "Private execution",
      desc: "Protects sensitive inputs inside a secure enclave.",
      color: "#ffb86b",
    },
    {
      id: "open",
      name: "Open Execution",
      short: "No hardware privacy",
      desc: "Lower protection, but simpler and lighter.",
      color: "#7d8494",
    },
  ],
  trigger: [
    {
      id: "infernet",
      name: "Infernet Trigger",
      short: "Real-time external signal",
      desc: "Lets the agent react quickly to off-chain events or data.",
      color: "#ff89b5",
    },
    {
      id: "sched",
      name: "Scheduled Tx",
      short: "Recurring execution",
      desc: "Runs at fixed times without relying on external bots.",
      color: "#b5a7ff",
    },
  ],
  verify: [
    {
      id: "verify",
      name: "Verification",
      short: "Trust layer",
      desc: "Adds attestation or proof-backed confidence to outputs.",
      color: "#ffd96a",
    },
    {
      id: "none",
      name: "No Verification",
      short: "Faster, lower trust",
      desc: "The result may work, but users must trust it blindly.",
      color: "#7d8494",
    },
  ],
  posture: [
    {
      id: "conservative",
      name: "Conservative",
      short: "Safer, slower",
      desc: "Prioritizes stability and security over raw performance.",
      color: "#78f0c4",
    },
    {
      id: "aggressive",
      name: "Aggressive",
      short: "Faster, riskier",
      desc: "Pushes for speed and upside, but is more fragile under stress.",
      color: "#ff7f7f",
    },
  ],
};

const EVENTS = [
  {
    id: "oracle-delay",
    name: "Oracle Delay",
    tone: "warning",
    desc: "The external signal arrived late and the timing edge is shrinking.",
    impact: ({ build, task }) => {
      const effects = [];
      if (task.id === "buy-dip" || task.id === "news-reaction") {
        if (build.trigger !== "infernet") {
          effects.push({ stat: "speed", delta: -28, reason: "Without Infernet, the agent reacted too slowly to a time-sensitive event." });
        } else {
          effects.push({ stat: "speed", delta: 10, reason: "Infernet helped the agent recover despite delayed data." });
        }
      }
      return effects;
    },
  },
  {
    id: "sensitive-input",
    name: "Sensitive Input Detected",
    tone: "danger",
    desc: "The task unexpectedly included confidential data and private context.",
    impact: ({ build, task }) => {
      const effects = [];
      if (task.id === "private-research") {
        if (build.security !== "tee") {
          effects.push({ stat: "security", delta: -38, reason: "Private workflow ran without TEE protection, exposing sensitive input risk." });
          effects.push({ stat: "trust", delta: -20, reason: "Users lost confidence once privacy guarantees broke down." });
        } else {
          effects.push({ stat: "security", delta: 18, reason: "TEE protected the sensitive workflow inside a secure environment." });
        }
      }
      return effects;
    },
  },
  {
    id: "malicious-prompt",
    name: "Malicious Prompt Injection",
    tone: "danger",
    desc: "The incoming request contains manipulative or misleading instructions.",
    impact: ({ build }) => {
      const effects = [];
      if (build.brain === "llm" && build.verify === "none") {
        effects.push({ stat: "trust", delta: -26, reason: "LLM output changed under adversarial input and nothing verified the response." });
      }
      if (build.verify === "verify") {
        effects.push({ stat: "trust", delta: 12, reason: "Verification gave users a stronger trust anchor under attack conditions." });
      }
      return effects;
    },
  },
  {
    id: "gas-spike",
    name: "Gas Spike",
    tone: "warning",
    desc: "Transaction costs suddenly surged during execution.",
    impact: ({ build }) => {
      const effects = [];
      if (build.posture === "aggressive") {
        effects.push({ stat: "performance", delta: -18, reason: "Aggressive execution took the hit during a volatile fee spike." });
      } else {
        effects.push({ stat: "performance", delta: 6, reason: "The conservative posture softened the impact of fee volatility." });
      }
      return effects;
    },
  },
  {
    id: "fake-source",
    name: "Fake Data Source",
    tone: "danger",
    desc: "A misleading or corrupted data source tried to influence the agent's action.",
    impact: ({ build }) => {
      const effects = [];
      if (build.verify !== "verify") {
        effects.push({ stat: "trust", delta: -24, reason: "Without verification, the system had no reliable way to challenge bad data." });
      } else {
        effects.push({ stat: "trust", delta: 14, reason: "Verification reduced the blast radius of fake data." });
      }
      return effects;
    },
  },
  {
    id: "execution-lag",
    name: "Execution Lag",
    tone: "warning",
    desc: "The agent's action window is narrowing as the environment keeps changing.",
    impact: ({ build, task }) => {
      const effects = [];
      if (task.id !== "rebalance" && build.trigger === "sched") {
        effects.push({ stat: "speed", delta: -22, reason: "Scheduled execution missed a situation that demanded immediate reaction." });
      }
      if (task.id === "rebalance" && build.trigger === "sched") {
        effects.push({ stat: "performance", delta: 10, reason: "Scheduled Tx fit the vault maintenance pattern well." });
      }
      return effects;
    },
  },
];

function getRandomEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function useSound() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const tone = (frequency, duration, type = "sine", gainValue = 0.03, delay = 0) => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  };

  return {
    start: () => {
      tone(440, 0.08, "sine", 0.03, 0);
      tone(554, 0.08, "sine", 0.03, 0.08);
      tone(659, 0.12, "sine", 0.03, 0.16);
    },
    choose: () => {
      tone(620, 0.06, "triangle", 0.025, 0);
      tone(760, 0.08, "triangle", 0.02, 0.05);
    },
    deploy: () => {
      tone(240, 0.08, "sawtooth", 0.025, 0);
      tone(320, 0.09, "sawtooth", 0.025, 0.06);
      tone(480, 0.11, "triangle", 0.02, 0.14);
    },
    tick: (i) => {
      tone(400 + i * 60, 0.08, "sine", 0.02, 0);
    },
    success: () => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, "sine", 0.028, i * 0.08));
    },
    fail: () => {
      tone(210, 0.18, "square", 0.03, 0);
      tone(160, 0.24, "square", 0.025, 0.09);
    },
    reset: () => {
      tone(330, 0.05, "triangle", 0.02, 0);
      tone(280, 0.08, "triangle", 0.02, 0.05);
    },
  };
}

function pickById(group, id) {
  return COMPONENTS[group].find((item) => item.id === id);
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

function ChoiceCard({ item, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.choiceCard,
        borderColor: selected ? item.color : "rgba(255,255,255,0.08)",
        background: selected ? `${item.color}12` : "rgba(255,255,255,0.02)",
        boxShadow: selected ? `0 0 0 1px ${item.color}22 inset, 0 16px 40px rgba(0,0,0,0.28)` : "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div style={styles.choiceTop}>
        <span style={{ ...styles.dot, background: item.color }} />
        <span style={styles.choiceName}>{item.name}</span>
      </div>
      <div style={styles.choiceShort}>{item.short}</div>
      <div style={styles.choiceDesc}>{item.desc}</div>
    </button>
  );
}

export default function Page() {
  const [screen, setScreen] = useState("menu");
  const [difficulty, setDifficulty] = useState("standard");
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [build, setBuild] = useState({
    brain: "llm",
    security: "tee",
    trigger: "infernet",
    verify: "verify",
    posture: "conservative",
  });
  const [event, setEvent] = useState(null);
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const sound = useSound();

  const selectedTask = useMemo(() => TASKS.find((task) => task.id === taskId), [taskId]);

  const summaryChips = useMemo(() => {
    return [
      pickById("brain", build.brain)?.name,
      pickById("security", build.security)?.name,
      pickById("trigger", build.trigger)?.name,
      pickById("verify", build.verify)?.name,
      pickById("posture", build.posture)?.name,
    ].filter(Boolean);
  }, [build]);

  const evaluateRun = () => {
    const stats = {
      performance: 58,
      security: 54,
      speed: 56,
      trust: 55,
    };

    const notes = [];

    const push = (stat, delta, reason) => {
      stats[stat] = clamp(stats[stat] + delta);
      notes.push(reason);
    };

    const requireOrPenalty = (id, stat, amount, successReason, failReason) => {
      const hasIt = Object.values(build).includes(id);
      if (hasIt) {
        push(stat, Math.abs(amount), successReason);
      } else {
        push(stat, -Math.abs(amount), failReason);
      }
    };

    if (selectedTask.id === "buy-dip") {
      requireOrPenalty(
        "infernet",
        "speed",
        18,
        "Infernet gave the bot faster awareness of the dip.",
        "The dip bot lacked a real-time trigger and reacted late."
      );
      if (build.posture === "aggressive") {
        push("performance", 14, "Aggressive posture chased the opportunity more decisively.");
        push("security", -8, "The aggressive setup traded away some resilience.");
      } else {
        push("trust", 6, "A more measured posture improved operator confidence.");
      }
    }

    if (selectedTask.id === "private-research") {
      requireOrPenalty(
        "tee",
        "security",
        24,
        "TEE protected confidential context during execution.",
        "This workflow handled private data without TEE protection."
      );
      requireOrPenalty(
        "llm",
        "performance",
        10,
        "LLM improved interpretation of research material.",
        "Without an LLM, the agent struggled to synthesize nuanced research."
      );
    }

    if (selectedTask.id === "news-reaction") {
      requireOrPenalty(
        "llm",
        "performance",
        16,
        "LLM helped the agent interpret ambiguous news context.",
        "A rule-only setup struggled with nuanced and shifting narratives."
      );
      requireOrPenalty(
        "infernet",
        "speed",
        16,
        "Infernet kept the reaction loop timely.",
        "Without Infernet, the signal pipeline felt too delayed for breaking events."
      );
    }

    if (selectedTask.id === "rebalance") {
      requireOrPenalty(
        "sched",
        "performance",
        18,
        "Scheduled Tx matched the periodic nature of rebalancing.",
        "The vault lacked a reliable recurring execution path."
      );
      if (build.posture === "conservative") {
        push("security", 10, "The conservative profile fit vault maintenance better.");
      }
    }

    if (build.verify === "verify") {
      push("trust", 15, "Verification made the agent's output easier to trust.");
    } else {
      push("trust", -12, "No verification lowered confidence in the final output.");
    }

    if (build.brain === "rules" && selectedTask.id !== "rebalance") {
      push("performance", -10, "A rule engine felt too rigid for a dynamic task.");
    }

    const chosenEvent = getRandomEvent();
    const eventEffects = chosenEvent.impact({ build, task: selectedTask });
    eventEffects.forEach(({ stat, delta, reason }) => push(stat, delta, reason));

    const total = Math.round((stats.performance + stats.security + stats.speed + stats.trust) / 4);
    const verdict = total >= 76 ? "Agent executed" : total >= 58 ? "Mission unstable" : "Agent compromised";

    const highlight =
      total >= 76
        ? "Your build handled the scenario with strong ritual-native coordination."
        : total >= 58
        ? "The agent survived, but some architectural choices made it fragile."
        : "The environment exposed architectural weaknesses in the build.";

    return {
      stats,
      total,
      verdict,
      highlight,
      event: chosenEvent,
      notes: Array.from(new Set(notes)).slice(0, 6),
    };
  };

  const deploy = () => {
    sound.deploy();
    setIsRunning(true);
    setEvent(null);
    setResult(null);
    setScreen("sim");
    setPhaseIndex(0);
  };

  useEffect(() => {
    if (screen !== "sim" || !isRunning) return;

    if (phaseIndex > 3) {
      const evaluated = evaluateRun();
      setEvent(evaluated.event);
      setResult(evaluated);
      setIsRunning(false);
      setScreen("result");
      if (evaluated.total >= 76) sound.success();
      else sound.fail();
      return;
    }

    const id = setTimeout(() => {
      sound.tick(phaseIndex);
      setPhaseIndex((prev) => prev + 1);
    }, 700);

    return () => clearTimeout(id);
  }, [screen, isRunning, phaseIndex]);

  const resetAll = () => {
    sound.reset();
    setTaskId(TASKS[0].id);
    setBuild({
      brain: "llm",
      security: "tee",
      trigger: "infernet",
      verify: "verify",
      posture: "conservative",
    });
    setEvent(null);
    setResult(null);
    setPhaseIndex(-1);
    setIsRunning(false);
    setScreen("menu");
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} />
      <div style={styles.glowA} />
      <div style={styles.glowB} />

      <div style={styles.shell}>
        <header style={styles.topbar}>
          <div style={styles.brandWrap}>
            <div style={styles.logo}>◆</div>
            <div>
              <div style={styles.brand}>Ritual Agent Simulator</div>
              <div style={styles.brandSub}>Build. Deploy. Stress test.</div>
            </div>
          </div>
          <div style={styles.credit}>created by badang</div>
        </header>

        {screen === "menu" && (
          <section style={styles.heroCard}>
            <div style={styles.heroLeft}>
              <div style={styles.kicker}>Interactive Learning Game</div>
              <h1 style={styles.heroTitle}>Learn Ritual by building agents that survive real conditions.</h1>
              <p style={styles.heroText}>
                Pick a task, assemble the stack, and see whether your agent executes, stalls, or gets compromised.
              </p>

              <div style={styles.diffRow}>
                {["standard", "hard"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setDifficulty(item);
                      sound.choose();
                    }}
                    style={{
                      ...styles.diffBtn,
                      borderColor: difficulty === item ? "#78f0c4" : "rgba(255,255,255,0.08)",
                      background: difficulty === item ? "rgba(120,240,196,0.10)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {item === "standard" ? "Standard" : "Hard"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  sound.start();
                  setScreen("build");
                }}
                style={styles.primaryBtn}
              >
                Start Building →
              </button>
            </div>

            <div style={styles.heroRight}>
              <div style={styles.previewPanel}>
                <div style={styles.previewTop}>Simulation Overview</div>
                <div style={styles.previewLine}><span>Tasks</span><strong>4</strong></div>
                <div style={styles.previewLine}><span>Modules</span><strong>5 categories</strong></div>
                <div style={styles.previewLine}><span>Live event stress</span><strong>Enabled</strong></div>
                <div style={styles.previewLine}><span>Sound design</span><strong>On-chain arcade vibe</strong></div>
              </div>
            </div>
          </section>
        )}

        {screen === "build" && (
          <section style={styles.buildGrid}>
            <div style={styles.mainPanel}>
              <div style={styles.sectionHead}>
                <div>
                  <div style={styles.kicker}>Step 1</div>
                  <h2 style={styles.sectionTitle}>Choose a task</h2>
                </div>
              </div>

              <div style={styles.taskGrid}>
                {TASKS.map((task) => {
                  const selected = task.id === taskId;
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        setTaskId(task.id);
                        sound.choose();
                      }}
                      style={{
                        ...styles.taskCard,
                        borderColor: selected ? "#78f0c4" : "rgba(255,255,255,0.08)",
                        background: selected ? "rgba(120,240,196,0.08)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={styles.taskTop}>
                        <span style={styles.taskTitle}>{task.title}</span>
                        <span style={styles.taskRisk}>{task.risk}</span>
                      </div>
                      <div style={styles.taskSubtitle}>{task.subtitle}</div>
                      <div style={styles.taskDesc}>{task.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div style={styles.sectionHeadSpacing}>
                <div>
                  <div style={styles.kicker}>Step 2</div>
                  <h2 style={styles.sectionTitle}>Configure the stack</h2>
                </div>
              </div>

              {[
                ["brain", "Brain"],
                ["security", "Security"],
                ["trigger", "Execution Trigger"],
                ["verify", "Verification"],
                ["posture", "Risk Posture"],
              ].map(([group, label]) => (
                <div key={group} style={styles.choiceSection}>
                  <div style={styles.groupLabel}>{label}</div>
                  <div style={styles.choiceGrid}>
                    {COMPONENTS[group].map((item) => (
                      <ChoiceCard
                        key={item.id}
                        item={item}
                        selected={build[group] === item.id}
                        onClick={() => {
                          setBuild((prev) => ({ ...prev, [group]: item.id }));
                          sound.choose();
                        }}
                      />
                    ))}
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
                  <div style={styles.sideMiniTitle}>Core fit</div>
                  <div style={styles.chipsWrap}>
                    {selectedTask.needs.map((item) => (
                      <span key={item} style={styles.chipStrong}>{item}</span>
                    ))}
                    {selectedTask.prefers.map((item) => (
                      <span key={item} style={styles.chipSoft}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.sideCard}>
                <div style={styles.sideKicker}>Build summary</div>
                <div style={styles.chipsWrap}>
                  {summaryChips.map((chip) => (
                    <span key={chip} style={styles.summaryChip}>{chip}</span>
                  ))}
                </div>
                <div style={styles.sideHint}>
                  Hard mode is cosmetic for now, but it sets the tone for future expansion with multi-event runs.
                </div>
              </div>

              <button onClick={deploy} style={styles.primaryBtnLarge}>
                Deploy Agent →
              </button>
            </aside>
          </section>
        )}

        {screen === "sim" && (
          <section style={styles.simWrap}>
            <div style={styles.simCard}>
              <div style={styles.simKicker}>Deployment in progress</div>
              <div style={styles.simTitle}>Running your Ritual-native agent</div>
              <div style={styles.simPipeline}>
                {[
                  "Initializing task context",
                  "Binding execution modules",
                  "Listening for event conditions",
                  "Processing live environment",
                ].map((label, i) => {
                  const active = i <= phaseIndex;
                  return (
                    <div
                      key={label}
                      style={{
                        ...styles.phaseCard,
                        borderColor: active ? "#78f0c4" : "rgba(255,255,255,0.08)",
                        background: active ? "rgba(120,240,196,0.08)" : "rgba(255,255,255,0.02)",
                        transform: active ? "translateY(-2px)" : "translateY(0)",
                      }}
                    >
                      <div style={styles.phaseIndex}>{String(i + 1).padStart(2, "0")}</div>
                      <div style={styles.phaseLabel}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {screen === "result" && result && (
          <section style={styles.resultGrid}>
            <div style={styles.resultMain}>
              <div style={styles.resultStatus}>{result.verdict}</div>
              <div style={styles.resultHeadline}>{result.highlight}</div>
              <div style={styles.eventCard}>
                <div style={styles.eventKicker}>Live event</div>
                <div style={styles.eventName}>{event?.name}</div>
                <div style={styles.eventDesc}>{event?.desc}</div>
              </div>

              <div style={styles.notesCard}>
                <div style={styles.eventKicker}>Why this happened</div>
                <div style={styles.notesList}>
                  {result.notes.map((note, idx) => (
                    <div key={idx} style={styles.noteItem}>{note}</div>
                  ))}
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
                <button
                  onClick={() => {
                    sound.choose();
                    setScreen("build");
                  }}
                  style={styles.primaryBtnLarge}
                >
                  Rebuild →
                </button>
                <button onClick={resetAll} style={styles.secondaryBtnLarge}>
                  Menu
                </button>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#06070a",
    color: "#f4f7fb",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    opacity: 0.08,
    pointerEvents: "none",
  },
  glowA: {
    position: "absolute",
    width: 640,
    height: 640,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(120,240,196,0.13) 0%, rgba(120,240,196,0.02) 38%, transparent 68%)",
    top: -140,
    left: -120,
    filter: "blur(18px)",
    pointerEvents: "none",
  },
  glowB: {
    position: "absolute",
    width: 620,
    height: 620,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(141,183,255,0.14) 0%, rgba(141,183,255,0.02) 36%, transparent 70%)",
    bottom: -220,
    right: -180,
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1360,
    margin: "0 auto",
    padding: "26px 24px 40px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
    padding: "16px 18px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 14 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(120,240,196,0.2), rgba(141,183,255,0.16))",
    border: "1px solid rgba(120,240,196,0.24)",
    color: "#78f0c4",
    fontSize: 20,
    fontWeight: 800,
  },
  brand: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  brandSub: { fontSize: 12, color: "rgba(244,247,251,0.55)", marginTop: 2 },
  credit: {
    fontSize: 12,
    color: "rgba(244,247,251,0.55)",
    letterSpacing: 0.6,
    textTransform: "lowercase",
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  heroCard: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 22,
    padding: 28,
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
  },
  heroLeft: { padding: 12 },
  heroRight: { display: "flex", alignItems: "stretch" },
  kicker: {
    fontSize: 11,
    color: "#78f0c4",
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: "clamp(32px, 4vw, 62px)",
    lineHeight: 1.02,
    letterSpacing: -1.9,
    maxWidth: 720,
    margin: 0,
  },
  heroText: {
    marginTop: 16,
    color: "rgba(244,247,251,0.68)",
    fontSize: 16,
    lineHeight: 1.7,
    maxWidth: 630,
  },
  diffRow: { display: "flex", gap: 10, marginTop: 24, marginBottom: 24 },
  diffBtn: {
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "#f4f7fb",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryBtn: {
    border: 0,
    borderRadius: 18,
    padding: "16px 22px",
    background: "linear-gradient(135deg, #78f0c4, #8db7ff)",
    color: "#081018",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(120,240,196,0.2)",
  },
  primaryBtnLarge: {
    width: "100%",
    border: 0,
    borderRadius: 20,
    padding: "18px 22px",
    background: "linear-gradient(135deg, #78f0c4, #8db7ff)",
    color: "#081018",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(120,240,196,0.2)",
  },
  secondaryBtnLarge: {
    width: "100%",
    borderRadius: 20,
    padding: "16px 22px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#f4f7fb",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  previewPanel: {
    flex: 1,
    borderRadius: 28,
    padding: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(9,12,18,0.7)",
    backdropFilter: "blur(18px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 14,
  },
  previewTop: { fontSize: 14, fontWeight: 700, color: "rgba(244,247,251,0.72)", marginBottom: 8 },
  previewLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(244,247,251,0.62)",
    fontSize: 14,
  },
  buildGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.52fr",
    gap: 22,
    alignItems: "start",
  },
  mainPanel: {
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    padding: 24,
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    position: "sticky",
    top: 22,
  },
  sideCard: {
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    padding: 20,
    boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
  },
  sideKicker: { fontSize: 11, color: "rgba(244,247,251,0.5)", textTransform: "uppercase", letterSpacing: 1.1 },
  sideTitle: { fontSize: 24, fontWeight: 800, marginTop: 10, letterSpacing: -0.8 },
  sideDesc: { marginTop: 10, color: "rgba(244,247,251,0.68)", lineHeight: 1.7, fontSize: 14 },
  sideMiniTitle: { fontSize: 12, color: "rgba(244,247,251,0.5)", marginBottom: 10 },
  needsWrap: { marginTop: 18 },
  chipsWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  chipStrong: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(120,240,196,0.12)",
    border: "1px solid rgba(120,240,196,0.2)",
    color: "#78f0c4",
    fontSize: 12,
    fontWeight: 700,
  },
  chipSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(141,183,255,0.10)",
    border: "1px solid rgba(141,183,255,0.18)",
    color: "#b8cdff",
    fontSize: 12,
    fontWeight: 700,
  },
  summaryChip: {
    padding: "9px 11px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f4f7fb",
    fontSize: 12,
    fontWeight: 700,
  },
  sideHint: { marginTop: 14, color: "rgba(244,247,251,0.48)", fontSize: 13, lineHeight: 1.7 },
  sectionHead: { marginBottom: 18 },
  sectionHeadSpacing: { marginTop: 28, marginBottom: 18 },
  sectionTitle: { margin: 0, fontSize: 28, letterSpacing: -0.9 },
  taskGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
  taskCard: {
    textAlign: "left",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 18,
    cursor: "pointer",
    background: "rgba(255,255,255,0.02)",
    transition: "all 160ms ease",
  },
  taskTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  taskTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.4 },
  taskRisk: {
    fontSize: 11,
    textTransform: "uppercase",
    color: "rgba(244,247,251,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: "7px 9px",
  },
  taskSubtitle: { marginTop: 10, color: "#78f0c4", fontSize: 13, fontWeight: 700 },
  taskDesc: { marginTop: 10, color: "rgba(244,247,251,0.65)", lineHeight: 1.7, fontSize: 14 },
  choiceSection: { marginTop: 22 },
  groupLabel: {
    marginBottom: 12,
    fontSize: 12,
    color: "rgba(244,247,251,0.52)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  choiceCard: {
    textAlign: "left",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 16,
    cursor: "pointer",
    minHeight: 136,
    transition: "all 160ms ease",
  },
  choiceTop: { display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  choiceName: { fontWeight: 800, fontSize: 16, letterSpacing: -0.3 },
  choiceShort: { marginTop: 12, color: "rgba(244,247,251,0.72)", fontSize: 13, fontWeight: 700 },
  choiceDesc: { marginTop: 8, color: "rgba(244,247,251,0.52)", lineHeight: 1.65, fontSize: 13 },
  simWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 160px)",
  },
  simCard: {
    width: "min(900px, 100%)",
    borderRadius: 32,
    padding: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
  },
  simKicker: { color: "#78f0c4", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 },
  simTitle: { marginTop: 12, fontSize: 34, fontWeight: 800, letterSpacing: -1.2 },
  simPipeline: { display: "grid", gap: 12, marginTop: 28 },
  phaseCard: {
    borderRadius: 22,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    transition: "all 180ms ease",
  },
  phaseIndex: { fontSize: 12, color: "rgba(244,247,251,0.48)", fontWeight: 700 },
  phaseLabel: { marginTop: 6, fontSize: 18, fontWeight: 700 },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 0.42fr",
    gap: 22,
    alignItems: "start",
  },
  resultMain: {
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    padding: 28,
  },
  resultSide: {
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    padding: 24,
  },
  resultStatus: { color: "#78f0c4", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 },
  resultHeadline: { marginTop: 12, fontSize: 34, lineHeight: 1.1, fontWeight: 800, letterSpacing: -1.2 },
  eventCard: {
    marginTop: 22,
    borderRadius: 24,
    padding: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },
  eventKicker: { fontSize: 11, color: "rgba(244,247,251,0.48)", textTransform: "uppercase", letterSpacing: 1.1 },
  eventName: { marginTop: 10, fontSize: 22, fontWeight: 800, letterSpacing: -0.6 },
  eventDesc: { marginTop: 10, color: "rgba(244,247,251,0.64)", lineHeight: 1.7, fontSize: 14 },
  notesCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },
  notesList: { display: "grid", gap: 10, marginTop: 14 },
  noteItem: {
    borderRadius: 18,
    padding: "14px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(244,247,251,0.78)",
    lineHeight: 1.65,
    fontSize: 14,
  },
  scoreOrb: {
    width: 144,
    height: 144,
    margin: "0 auto",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at 30% 30%, rgba(120,240,196,0.34), rgba(141,183,255,0.16), rgba(255,255,255,0.04))",
    border: "1px solid rgba(120,240,196,0.24)",
    fontSize: 48,
    fontWeight: 800,
    letterSpacing: -2,
    boxShadow: "0 20px 60px rgba(120,240,196,0.16)",
  },
  scoreLabel: { textAlign: "center", marginTop: 12, color: "rgba(244,247,251,0.55)", fontSize: 13 },
  statsCard: {
    marginTop: 22,
    borderRadius: 24,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    display: "grid",
    gap: 14,
  },
  statRow: { display: "grid", gap: 8 },
  statLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 13, color: "rgba(244,247,251,0.62)", fontWeight: 700 },
  statValue: { fontSize: 13, color: "#f4f7fb", fontWeight: 800 },
  statTrack: { height: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" },
  statFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #78f0c4, #8db7ff)",
    boxShadow: "0 8px 22px rgba(120,240,196,0.18)",
  },
  resultButtons: { display: "grid", gap: 10, marginTop: 18 },
};

