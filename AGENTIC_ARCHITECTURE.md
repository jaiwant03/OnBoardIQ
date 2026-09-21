# OnboardIQ — Autonomous AI Employee Onboarding Architecture

OnboardIQ is an enterprise-grade, state-aware Autonomous AI Employee Onboarding platform. It replaces scattered HR handbooks, IT documentation, and static checklists with an intelligent agentic orchestration loop that observes employee state, retrieves verified company knowledge, reasons about task dependencies, and dynamically recommends the next best action.

---

## 1. High-Level System Architecture

```
+-------------------------------------------------------------------------------+
|                             REACT FRONTEND (Vite)                             |
|  - Dashboard: Live Progress Ring, Real-time Priority Tasks, Adaptive Stepper  |
|  - AI Assistant: Multi-turn Dialogue, Agent Intent Routing, Source Cards      |
|  - Tasks & Roadmap: Interactive Checklists, Dynamic Day 1-30 Milestones      |
|  - Learning Path: Dynamic 4-Stage Role-based Curriculum                      |
|  - Knowledge Center: Document Dropzone, Multi-Stage Indexing Animation        |
+---------------------------------------+---------------------------------------+
                                        | REST API (Axios + JWT)
                                        v
+-------------------------------------------------------------------------------+
|                          NODE.JS / EXPRESS BACKEND                            |
|  - Authentication & RBAC (JWT, bcryptjs)                                      |
|  - MongoDB Persistence (User, Tasks, Progress, LearningPath, Documents)      |
|  - AI Service Client Gateway (HTTP Communication to FastAPI)                 |
|  - Document Processing Pipeline & Real-Time State Synchronizer                |
+---------------------------------------+---------------------------------------+
                                        | HTTP / JSON Payload
                                        v
+-------------------------------------------------------------------------------+
|                         PYTHON FASTAPI AI SERVICE                             |
|                                                                               |
|  +----------------------------- LANGGRAPH ORCHESTRATOR ---------------------+  |
|  |                                                                           |  |
|  |    [START]                                                                |  |
|  |       |                                                                   |  |
|  |       v                                                                   |  |
|  |    [ROUTER] <------- (Analyzes Intent, Context Continuity & History)      |  |
|  |       |                                                                   |  |
|  |       +-----------> [HR Agent]           (Policies, Leaves, Benefits)     |  |
|  |       +-----------> [IT & Security Agent] (Tooling, MFA, Git, Hardware)   |  |
|  |       +-----------> [Learning Agent]      (Personalized Skill Roadmap)    |  |
|  |       +-----------> [Onboarding Agent]    (Roadmap, Next Best Action)     |  |
|  |       |                                                                   |  |
|  |    [TOOLS LAYER]                                                          |  |
|  |       * search_company_knowledge (ChromaDB Cosine Vector Retrieval)       |  |
|  |       * get_employee_profile (Role, Department, Experience, Skills)       |  |
|  |       * get_onboarding_status (Completed vs Pending Tasks, Progress %)    |  |
|  |       * evaluate_next_best_action (LLM Dependency & Priority Reasoner)    |  |
|  |                                                                           |  |
|  |    [END] -------> Structured Response + Agent ID + Sources + Reasoning    |  |
|  +---------------------------------------------------------------------------+  |
|                                                                               |
|  +------------------- CHROMADB VECTOR STORE & EMBEDDINGS --------------------+  |
|  |  * Persistent Cosine Vector Space (./chroma_db)                           |  |
|  |  * Ollama Batch Embeddings: mxbai-embed-large (1024-dim dense vectors)    |  |
|  |  * Strict Similarity Threshold Guard to eliminate hallucinations         |  |
|  +---------------------------------------------------------------------------+  |
|                                                                               |
|  +--------------------------- LOCAL LLM (Ollama) ----------------------------+  |
|  |  * Active Model: qwen2.5:7b (High precision reasoning & tool synthesis)   |  |
+--+----------------------------------------------------------------------------+
```

---

## 2. The Agentic Loop (Observe -> Understand -> Retrieve -> Reason -> Decide -> Act -> Update State -> Re-evaluate)

Unlike traditional chatbots that simply pipe user prompts directly into a language model, OnboardIQ executes a multi-stage autonomous agentic lifecycle:

1. **OBSERVE**: When an employee interacts with the system, the platform gathers the full operational state from MongoDB:
   - User profile (Role, Department, Experience level, Core skills)
   - Completed onboarding task titles
   - Pending tasks with assigned priority and day numbers
   - Quantitative progress percentage
   - Recent multi-turn conversation history

2. **UNDERSTAND**: The **Router Node** in LangGraph classifies the incoming query:
   - Evaluates lexical keywords across HR, IT, Learning, and Onboarding domains.
   - Performs **Contextual Resolution** on follow-up questions (`"Why?"`, `"Where do I do that?"`, `"Explain that"`), tying them to the previous conversation turns.

3. **RETRIEVE**:
   - For factual company knowledge questions, the specialized agent invokes the `search_company_knowledge` tool.
   - Queries ChromaDB using dense cosine similarity with Ollama embeddings.
   - If no verified document matches the query above the strict similarity threshold, retrieval reports `"None"`, preventing policy hallucination.

4. **REASON**:
   - When evaluating milestones, the `evaluate_next_best_action` tool feeds the employee's role, completed tasks, and pending milestones into the LLM.
   - The model reasons about prerequisites (e.g., Security training must precede repository access; HR registration must precede payroll setup).

5. **DECIDE & ACT**:
   - The active agent selects the definitive Next Best Action, drafts a concise 1-2 sentence explanation of WHY this task is recommended, attaches verified source citations (document title, section, and text snippet), and computes the confidence level.

6. **UPDATE STATE**:
   - When the employee marks a task completed in the UI, the MongoDB state updates, progress percentages recalculate, and the employee profile is refreshed.

7. **RE-EVALUATE**:
   - On the very next user interaction or dashboard reload, the AI observes the updated state and autonomously adapts its recommendations (e.g., advancing from Day 1 Security to Day 2 Git Environment Setup).

---

## 3. Specialized Agent Roles

| Agent | Responsibility | Key Tools Used | Fallback / Guard |
|---|---|---|---|
| **Onboarding Agent** | Task prioritization, roadmap navigation, progress evaluation, next best action | `get_employee_profile`, `get_onboarding_status`, `evaluate_next_best_action` | Explains dependencies directly from state without guessing |
| **HR Agent** | Annual leave, sick leave, benefits, payroll, handbook rules, work hours | `search_company_knowledge` | Strict refusal if not in verified documents; zero hallucination |
| **IT & Security Agent** | Hardware, VPN, MFA, Git SSH keys, developer tooling, security compliance | `search_company_knowledge` | Grounds setup instructions strictly in IT guides |
| **Learning Agent** | Personalized learning paths, engineering architecture, skill mastery | `get_employee_profile`, `get_onboarding_status`, `search_company_knowledge` | Adapts curriculum based on role (Developer vs HR) and seniority (Fresher vs Senior) |

---

## 4. RAG & Document Intelligence Pipeline

```
[Uploaded Document: PDF / TXT / DOCX]
               |
               v
   [Text & Section Extraction]
               |
               +---> [Chunking Engine (300 chars, 60 overlap)]
               |          |
               |          v
               |     [Batch Embedding: mxbai-embed-large]
               |          |
               |          v
               |     [ChromaDB Cosine Vector Store]
               |
               +---> [AI Task Extractor (document_extractor.py)]
               |          |
               |          v
               |     [MongoDB: OnboardingTask Collection]
               |
               +---> [AI Learning Path Extractor]
                          |
                          v
                     [MongoDB: LearningPath 4-Stage Curriculum]
```

1. **Zero Sample Data Invariant**: No mock tasks or sample policies are pre-seeded. All tasks, roadmaps, and learning paths originate strictly from uploaded company documents.
2. **Chunking & Metadata**: Text is split into semantically coherent sections with metadata (`filename`, `section`, `department`, `category`).
3. **Dual-Path Extractor**:
   - Real-time indexing into ChromaDB for search and conversational Q&A.
   - Synchronous extraction of 4–8 actionable checklist tasks and a 4-stage curriculum (`foundation`, `current`, `next`, `upcoming`) saved directly to MongoDB for active employees.
4. **Cascading Deletion**: When an administrator deletes a document, all associated onboarding tasks (`sourceDocument: filename`) are automatically removed, and user progress is recalculated.

---

## 5. Security and Data Protection

- **JWT Authentication**: Secure Bearer tokens with expiration.
- **Role-Based Access Control (RBAC)**: Enforced separation between `employee` and `admin` API routes.
- **Password Hashing**: Salted bcrypt hashing with 10 rounds.
- **Local-First AI**: All embeddings (`mxbai-embed-large`) and model inferences (`qwen2.5:7b`) run 100% locally via Ollama, ensuring zero corporate data exfiltration.
