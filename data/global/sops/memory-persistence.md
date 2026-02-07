# OpenClaw Memory Persistence SOP

**Author:** Steve Vettori  
**Created:** 2026-02-06

---

## Problem

OpenClaw agents "forget" tasks across days. This is not a model issue — it's a memory-lifecycle configuration issue.

---

## 1. Memory Scopes

| Scope | Persistence | Default |
|-------|-------------|---------|
| Task memory | Ephemeral (cleared when task ends) | ❌ Lost |
| Session memory | Lost on agent restart | ❌ Lost |
| Long-term memory | Persistent only if explicitly written | ✅ Survives |

**Root cause:** Most task outcomes are never written to long-term memory.

---

## 2. Ensure Long-Term Memory Is Persistent

Confirm that:
- Long-term memory is enabled
- Memory is written to disk (not /tmp, RAM, or container overlay)
- Memory directory survives restarts, sleep, and gateway reloads

**If memory does not survive a reboot, continuity is impossible.**

---

## 3. Force Explicit Memory Writes in Agent Prompts

Memory writes are not automatic. Agents must be instructed what to persist.

Add to system/agent prompt:

```
You maintain persistent long-term memory.

You MUST write to long-term memory when:
- A task spans multiple days
- A TODO, follow-up, or commitment is created
- A task is partially completed
- A recurring responsibility is identified
- A user preference or operating rule is learned

Always persist:
- What was completed
- What remains
- When it should be revisited
```

**This alone resolves most "forgetting."**

---

## 4. Daily State Snapshot (Critical)

Once per day (manual or automated), one agent should:

1. Summarize:
   - Active tasks
   - Open loops
   - Pending follow-ups
   - Assumptions

2. Write one canonical daily state object to long-term memory

**This prevents fragmented memory and allows clean resumption the next day.**

Implementation: `memory/WORKING.md` + `memory/YYYY-MM-DD.md`

---

## 5. Single "Executive Memory" Agent

In multi-agent setups:

- Individual agents should not own truth
- One designated agent should:
  - Receive summaries from others
  - Write authoritative long-term memory
  - Act as the single source of continuity

**Without this, memory becomes siloed and appears "lost."**

Implementation: Clawson = Master Agent / memory authority

---

## 6. Rehydrate Memory on Startup

On agent startup or gateway restart, force this step:

1. Read long-term memory
2. Summarize current state
3. Reload active tasks
4. Resume unfinished work

**If memory exists but is never reloaded, it will appear broken.**

Implementation: `HEARTBEAT.md` startup checklist

---

## Bottom Line

> OpenClaw does not forget — it only remembers what it is explicitly designed to remember.

Day-to-day memory loss is caused by:
- Ephemeral task memory
- Session resets
- Missing persistence rules
- No daily snapshot
- No canonical memory owner

Once these are addressed, continuity stabilizes.

---

## Our Implementation

| Pattern | File |
|---------|------|
| Daily snapshot | `memory/WORKING.md` |
| Daily log | `memory/YYYY-MM-DD.md` |
| Startup rehydration | `HEARTBEAT.md` |
| Executive memory | Clawson (Master Agent) |
| Long-term curated | `MEMORY.md` |
