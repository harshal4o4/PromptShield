# PromptShield — Prompt Injection & Data-Exfiltration Defense

PromptShield is a local-first security operations platform engineered to inspect untrusted text inputs, identify adversarial prompt-injection and data-exfiltration vectors, enforce configurable policy decisions, maintain an immutable audit trail, and empirically benchmark detection accuracy against labelled datasets.

---

## 1. System Architecture

PromptShield adheres to a **local-first, instrument-grade architecture**:
- **Backend**: FastAPI (Python 3.11+ / 3.14), SQLite WAL persistence, layered detection engine, and policy enforcement service.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, and Google Fonts (`Geist` & `JetBrains Mono`), modeled directly from the Google Stitch prototype.
- **Zero Cloud Leakage**: Evaluates inputs entirely in local memory with zero external LLM dependencies for core classification.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PromptShield Frontend (React/TypeScript)             │
│  Overview  │  Prompt Inspector  │  Evaluation Lab  │  Event Log  │ ... │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP / REST (/api/v1)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    FastAPI Application Core (Uvicorn)                  │
│                                                                        │
│  ┌───────────────────┐    ┌───────────────────┐   ┌─────────────────┐ │
│  │   Normalization   │───►│ Security Detector │──►│  Policy Engine  │ │
│  │ (NFKC / Control)  │    │  (6 Rule Families)│   │ (ALLOW / BLOCK) │ │
│  └───────────────────┘    └───────────────────┘   └────────┬────────┘ │
│                                                            │           │
│  ┌───────────────────┐    ┌───────────────────┐            │           │
│  │ Evaluation Runner │    │   Audit Logger    │◄───────────┘           │
│  │ (Precision / F1)  │    │ (Bounded Excerpt) │                        │
│  └───────────────────┘    └─────────┬─────────┘                        │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                         ┌────────────▼───────────┐
                         │   SQLite WAL Database  │
                         │ (Events, Policy, Runs) │
                         └────────────────────────┘
```

---

## 2. Quick Start & Local Setup

### Prerequisites
- Python 3.11+ (Python 3.14 supported via `py` launcher)
- Node.js 20+ and npm 10+

### Option A: Backend Setup

```powershell
# In Windows PowerShell:
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run initial demo seed & benchmark evaluation
python seed.py

# Launch development server (Port 8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option B: Frontend Setup

```powershell
# In Windows PowerShell:
cd frontend
npm install

# Start Vite dev server (Port 5173)
npm run dev
```

The web console is accessible at `http://127.0.0.1:5173/`.

---

## 3. Approved Screen Scope & Functionality

1. **Overview (`/overview`)**:
   - Primary KPI metric cards: *Prompts Analyzed*, *Attacks Detected*, *Requests Blocked*, and mitigation percentage rates.
   - Interactive 7-day activity timeline chart powered by real SQLite events.
   - Compact recent audit events table.
   - Direct shortcut action to *Analyze a Prompt*.

2. **Prompt Inspector (`/prompt-inspector`)**:
   - Untrusted payload inspection workbench supporting raw prompts, retrieved documents, web scrapes, and tool outputs.
   - Pre-configured test presets (*Direct Jailbreak*, *Canary Secret Extraction*, *Indirect Resume Injection*, *Obfuscated Injection*, *Benign Query*).
   - Real-time decision banner (`ALLOW`, `BLOCK`, `SANITIZE`, `ESCALATE`), severity rating, policy rationale, and evidence excerpts.
   - Defensible sanitization panel when applicable.
   - Traceable Audit Event UUID copy button.

3. **Evaluation Lab (`/evaluation-lab`)**:
   - Empirical evaluation metrics: Precision, Recall, F1 Score, and False Positive Rate calculated from the versioned `synthetic-v1.0` benchmark dataset.
   - One-click *Run Evaluation Benchmark* action.
   - Expandable **Detailed Benchmark Results** revealing a 2x2 confusion matrix (TP, FP, TN, FN), per-category precision/recall tables, and failure case audits.

4. **Event Log (`/event-log`)**:
   - Paginated security audit trail with full-text search and filters by Decision (`ALLOW`, `BLOCK`, `SANITIZE`, `ESCALATE`) and Risk Level.
   - Interactive slide-over **Audit Record Detail** drawer displaying full event metadata and fired signals.

5. **Policies (`/policies`)**:
   - Active profile management (`Production-US-East`).
   - Detection rule toggles and custom action overrides for each of the 6 rule families:
     - `DIRECT_OVERRIDE` (Instruction override & jailbreak personas)
     - `SYSTEM_PROMPT_LEAK` (Initial instructions exfiltration)
     - `SYNTHETIC_SECRET_EXTRACTION` (Canary token disclosure)
     - `DATA_EXFILTRATION` (Covert markdown images & webhook forwarders)
     - `INDIRECT_INJECTION` (Embedded prompts in third-party content)
     - `OBFUSCATION_EVASION` (Zero-width chars, base64 payloads)
   - Severity-based action precedence mappings.
   - Reset to Defaults confirmation workflow.

6. **Settings & Support (`/settings`)**:
   - Audit payload retention mode (`redacted_excerpt`, `hash_only`, `full_text_local_only`).
   - Alert threshold configuration and telemetry toggles.
   - Verified runtime status pings (API status, SQLite health, version numbers).
   - Expandable operational guidance accordions for SecOps analysts.

---

## 4. Automated Testing

### Backend Unit & Integration Tests
PromptShield includes comprehensive automated tests covering normalization, rule detection, benign hard negatives, policy engine logic, sanitization, metrics, and API endpoints:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest tests/
```

### Frontend Typecheck & Build
```powershell
cd frontend
npm run build
```

---

## 5. Security Guardrails & Limitations

- **Untrusted Input Handling**: Analyzed prompts are strictly treated as passive data; they are never executed, interpreted as instructions, or used to trigger external requests.
- **Zero Real Secrets**: Test fixtures strictly use synthetic canary identifiers (`PS_DEMO_SECRET_7F3A`). No real credentials or API keys exist in the repository or seed datasets.
- **Evidence-Based Decisions**: The platform returns the exact rule IDs and excerpts that triggered a determination.
- **Scope Note**: PromptShield only mediates prompts passed through its inspection pipeline; it does not passively sniff operating system traffic without middleware integration.
