---
id: thesis
title: senior thesis (in progress)
href: '#projects/thesis'
---
# Senior thesis: monitoring LLM agents under drift
İTÜ senior thesis, Sep 2026 – present. Advisor: Prof. Gülşen Cebiroğlu Eryiğit. Official title: Graph-Based Detection of Failed Tool-Calling Runs in LLM Agents under Workload Drift. Every result below is preliminary.

## The question
Can a monitor that learns only from successful tool-calling runs flag failed ones, and does it keep working, without a flood of false alarms, when the model or the environment changes?

## Data
- Public: the released MCPMark runs. After removing duplicates: 10,298 runs over 5 MCP services (filesystem, GitHub, Notion, Playwright, Postgres), 127 tasks and 22 model configurations from 8 provider families. 17.2% of runs pass.
- 825 runs (8%) stopped on a harness error (context overflow, provider errors, the 100-turn limit), so a failed run is not always the agent's fault.
- Own runs: about 2,800, from two open-weight models, Qwen3-8B and gpt-oss-20b, in the MCPMark filesystem environment, deliberately modified for the drift tests. About 45% of Qwen's runs pass on the 10 easy tasks.
- Profiled but not used in the results: TOUCAN, RAS-Eval, AgentDrift.

## Labels
- Pass or fail comes automatically from MCPMark's own checker script; normal means passed.
- Failure types are not classified. The project moved from "predict failure" to anomaly detection: an anomaly is a run that deviates from a profile learned on normal runs. Failed runs are used only as true anomalies when scoring.
- Some labels are wrong because of the checker (one check hard-codes "Sarah Brown" and rejects "Sarah_Brown"); this is a stated limitation.

## Graph encoding
- Node: one tool call, with the tool's raw name or an abstract action type (explore, read, search, write, delete, execute, navigate, invalid; SQL calls typed by their verb), an error flag, whether the result was empty, the log length of the arguments and of the result, and the step index (capped).
- Edges: sequential (the next call), data-flow (a value from an earlier result reused in a later call's arguments, found by automatic matching) and repeat (the same tool with the same or similar arguments), each also in reverse: 6 edge types. A check of 50 sampled data-flow edges found about two thirds correct.

## Models and baselines
- Core detector: one-class kNN (k = 5) fitted on normal runs only, run over a ladder of encodings: run length, counts, action-type n-grams, graph with raw names, graph with abstract types, TF-IDF content, graph plus content.
- GNN: GINE in PyTorch Geometric, 2–3 layers, with and without edges. The result is negative, twice: edges add nothing. The 95% interval rules out gains above +0.034 on all runs and above +0.04 on runs of 18 or more calls.
- Strongest model so far: logistic regression on text plus action types, 0.685 length-matched AUROC, against 0.59–0.63 for the GNNs.
- Baselines run: run length, counts, n-grams, TF-IDF + logistic regression. Not run yet: an LLM judge, the XGBoost/GraphSAGE replication of the closest prior work, Deep SVDD, a one-class GNN.

## Drift
- Model drift: fit on seven provider families' normal runs, test on the eighth, and rotate.
- Environment drift: distractor files added to MCPMark filesystem tasks, each checked so that every correct answer stays the same.
- Cost of drift: the false-alarm rate on normal runs after drift, at a threshold set to 5% before drift.
- Splits are grouped by (model, service, task) so repeated runs cannot leak across them.

## Results (all preliminary)
- Graph edges add no detection gain. Pre-registered and negative twice; the most settled result.
- Model change: no average rise in false alarms when trained on several families (about 0.05 before and after); 0.11–0.14 when trained on a single family. Pre-registered, corrected after an internal audit.
- Distractor files: on the 4 tasks where the agent meets them, correct runs look clearly more anomalous (AUROC 0.67–0.89), and up to 57% of correct runs alarm at a 5% threshold. Confirmed on fresh runs.
- Recalibrating on about 50 new normal runs brings false alarms back to about 5%. One measurement.
- Monitors that ignore tool outputs lose nothing on the filesystem service; across all services there is no clear cost or gain (−0.008, 95% interval −0.062 to +0.041). Pre-registered; not shown either way.
- Harmful drift raises label-free batch alarm rates and benign exposure does not. Exploratory: 16 small cells on 2 tasks.

## Stack and compute
- Analysis and GNNs: Python, PyTorch, PyTorch Geometric, scikit-learn, on an RTX 4080 laptop GPU (12 GB); the first pilot ran there too, with Ollama.
- Agent runs: a patched MCPMark harness with vLLM on İTÜ's HPC centre (UHeM), H200 nodes; about 910 of 25,000 allocated core-hours used so far.

## Status and plans
- Being prepared for a 2027 ML workshop submission. Nothing is public yet: the code is in a private repository, and an arXiv preprint with public code is planned for around March 2027.

## Open problems
- Harm and exposure cannot yet be told apart: every case where drift lowered the pass rate is on the 2 tasks built so that the agent meets the distractors.
- Widening the study failed so far: on the 30 standard filesystem tasks Qwen passed 3 tasks and gpt-oss 1, and a third of runs overflowed the context limit.
- The framing is undecided: either "drift reaches monitors two ways, through what tools return and through what the agent does", or "shift is not harm".
- Novelty is an open question: harmful-shift detection already exists for general ML (Podkopaev & Ramdas, "Tracking the risk of a deployed model and detecting harmful distribution shifts"; Amoukou et al., "Sequential Harmful Shift Detection Without Labels"), so this would be its version for agent traces.
