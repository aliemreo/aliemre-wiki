---
id: cv
title: CV (November 2026)
href: '#experience'
---
# Ali Emre Özcan — CV, November 2026
B.Sc. candidate in Computer Engineering, Istanbul Technical University (İTÜ), Istanbul. Email: hi@aliemreozcan.com · GitHub: github.com/aliemreo. Applying to PhD and master's programs for Fall 2027.

## Research interests
Reliable LLM agents and agentic systems: detecting and diagnosing agent failures under distribution shift. Reinforcement learning for robotics. Machine learning systems that hold up in production.

## Education
- Istanbul Technical University, B.Sc. in Computer Engineering (100% English-taught), 2022–2027 (expected). GPA 3.94/4.00, top-ranking student in the department; High Honor List. Senior thesis: see Research. Selected coursework: Learning From Data, Real-Time Systems Software.
- Tampere University, Finland: exchange student in Computer Engineering, Spring 2026. Selected coursework: Fine-Tuning Large Language Models, Internet of Things.

## Research
### Senior thesis (Sep 2026 – present, İTÜ): Graph-Based Detection of Failed Tool-Calling Runs in LLM Agents under Workload Drift
Advisor: Prof. Gülşen Cebiroğlu Eryiğit. Full details in the thesis file.
- Learns a profile of normal (passing) tool-calling runs of LLM agents and flags runs that deviate (one-class anomaly detection), over encodings from run length and action n-grams to tool-call graphs and text.
- Measures what drift does to the monitor: a new model family, or distractor files added to the environment.
- Data: 10,298 public MCPMark runs plus about 2,800 own runs on İTÜ's HPC; results are preliminary.
- Being prepared for a 2027 ML workshop submission; preprint and public code planned for around March 2027.

### Target-Aware Whole-Body Throwing (Jul 2026, Audi Development Camp, Győr, Hungary) — project manager and RL lead
- Led a six-person, five-country team in a program run by Széchenyi István University with Audi Hungaria.
- Trained an RL controller in MuJoCo for a Unitree G1 humanoid to hit distance-varying targets while walking. The final TD3 policy reached a 0.177 m mean landing miss, a 100% hit rate within 0.5 m and 0% falls across a held-out target sweep.
- Staged curriculum (fixed throw, then throw while walking, then changing target) with potential-based reward shaping; benchmarked PPO against TD3 and adopted TD3 for its off-policy sample efficiency.

### Earlier research (high school)
Making antibacterial soap with silver nanoparticles instead of triclocarban. Presented at the 4th National Science Congress, METU, Ankara, June 2021.

## Professional experience
### TAZI AI, Istanbul — Forward Deployed ML Engineer (part-time, following an internship), Aug 2026 – present
- Builds ML pipelines with banking and brokerage clients. For a customer-churn proof of value with a major Turkish brokerage, built on-premise ETL that turns the client-trained model's outputs into churn segments, insights and retention actions; LLM steps run vendor-side and ship as static artifacts because the client environment has no LLM access.
- Works on production churn models inside a bank's environment: detecting label leakage, defining the churn label and monthly prediction horizon, and setting up an A/B test for the production model.
- Analyzed shifts in a bank's customer segmentation before and after a market crisis and reported the findings to C-level executives.
- Built a Customer Success Management agent over account documents, with sensitivity-labelled retrieval that excludes confidential files, long-term vector memory and meeting-transcript input.
- Developing an agent and MCP server that let customers run the TAZI platform end to end: creating inputs, training models, inspecting results and building dashboards.

### MAT Consultancy, Istanbul — Digital Transformation Specialist, Mar 2024 – Jan 2026
- Built an ML-driven specification management platform to optimize packaging processes.
- Built an integrated CRM and project management platform, and mapped company operations onto a digital architecture.

### NETAŞ, Istanbul — R&D Intern, Jun – Aug 2025
- Built an NLP pipeline with automated web data collection that extracts and analyzes public reactions to the weekly articles of the Presidency of Religious Affairs.

### Genarion, Istanbul — GenAI Solution Architect, Feb – Apr 2025
- Developed AI agents and end-to-end generative AI solutions for client problems.

## Selected projects
- Kürsü: AI parliamentary debate game (İTÜ senior software project, Fall 2026). Product owner, project manager and AI lead for a four-person team building a debate game in which players argue against AI party representatives grounded in Turkish parliamentary transcripts (ParlaMint-TR). Owns the LLM pipeline (LangChain/LangGraph), the model fine-tuning experiments and the evaluation of the AI opponents.
- This site: a personal portfolio with an agent that answers visitors' questions about the work.

## Technical skills
- Programming: Python, C, C++, SQL, web development.
- Machine learning: LLM fine-tuning, agentic systems (LangChain/LangGraph, MCP), retrieval and vector memory, graph neural networks, anomaly detection, reinforcement learning (PPO, TD3), MuJoCo.
- Data and deployment: on-premise ETL pipelines, model monitoring and A/B testing, Kibana dashboards.
- Languages: Turkish (native), English (fluent).

## Honors and activities
- High Honor List (Dean's List), İTÜ, Feb 2025.
- KKB Agentic Solutions Hackathon, Dec 2025.
- Member, ACM Student Chapter, İTÜ.
- Team captain, high-school FIRST LEGO League robotics team, 2020.
