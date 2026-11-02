# DevCrew — AI Development Team Platform

DevCrew is an autonomous AI software engineering platform for your GitHub repositories. By initializing a **workspace** linked to a repository, four specialized AI agents (**Analyst**, **Developer**, **Reviewer**, and **Tester**) handle your backlog directly from an interactive Kanban board—planning features, authoring code on isolated branches, performing peer code reviews, verifying functionality, and opening ready-to-merge Pull Requests.

- **Workspaces:** Configurable workspace environments paired with exactly one linked GitHub repository.
- **Interactive Kanban Board:** Real-time drag-and-drop board (Todo, In Development, In Review, Testing, Done) synchronized automatically with GitHub Issues.
- **AI Agent Team:** Granular customization of each agent's system instructions, tools, budget limits, and max execution turns.
- **Automated Task Pipeline:** Multi-stage execution pipeline taking raw user requests or issue tickets to fully tested Pull Requests.
- **Pull Request & Resolution Lifecycle:** One-click PR merging, manual or auto-merge strategies, and automated bug regression reporting by the Tester.
- **Pixel-Art Live Agent Office:** Interactive 2D visualization tracking live agent status, location, and execution metrics in real time.
- **Switch Trust & ROI Integration:** Automated trust scoring and ROI tracking for autonomous agent behaviors via [switchagents.ai](https://www.switchagents.ai/).

---

## 📋 Table of Contents

- [DevCrew — AI Development Team Platform](#devcrew--ai-development-team-platform)
  - [📋 Table of Contents](#-table-of-contents)
  - [🔍 Project Overview](#-project-overview)
  - [✨ Key Features](#-key-features)
  - [🛠 Tech Stack](#-tech-stack)
  - [🏛 Architecture \& Technical Documentation](#-architecture--technical-documentation)
    - [1. Multi-Agent Workflow \& System Architecture](#1-multi-agent-workflow--system-architecture)
    - [2. Database Architecture \& Data Isolation](#2-database-architecture--data-isolation)
    - [3. Background Job Execution Engines (Cloudhike vs Inngest vs Trigger.dev)](#3-background-job-execution-engines-cloudhike-vs-inngest-vs-triggerdev)
    - [4. Secure GitHub OAuth \& Token Encryption](#4-secure-github-oauth--token-encryption)
  - [📁 Documentation Links (Techdocs)](#-documentation-links-techdocs)
    - [📑 Architecture \& Engineering Documents (PDF)](#-architecture--engineering-documents-pdf)
    - [🖼 Structural Diagrams \& Schematics](#-structural-diagrams--schematics)
  - [⚡ Installation \& Local Development](#-installation--local-development)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Step-by-Step Setup](#2-step-by-step-setup)
    - [3. Environment Variables (.env)](#3-environment-variables-env)
    - [4. Local Database Initialization](#4-local-database-initialization)
    - [5. Launch Development Server](#5-launch-development-server)
    - [6. Configuring GitHub OAuth App](#6-configuring-github-oauth-app)
  - [🚀 Deployment](#-deployment)
  - [📜 License](#-license)
  - [📬 Connect with me](#-connect-with-me)

---

## 🔍 Project Overview

DevCrew automates end-to-end software delivery by replacing manual developer triage with an orchestrated multi-agent workflow. When a task is queued on the Kanban board, DevCrew executes an isolated pipeline across four AI personae:

```
Todo ──▶ Analyst ──▶ Developer ──▶ Reviewer ──▶ Tester ──▶ Pull Request ──▶ Merge
            plans      commits to     reviews      verifies    opened by       manual
                       a new branch     │            │          the Tester      or auto
                           ▲            │            │
                           └── rework ──┴────────────┘   (up to MAX_REWORK_ROUNDS)
```

1. **Analyst:** Inspects the repository state, parses prompt specifications, and creates a comprehensive implementation plan.
2. **Developer:** Cuts a temporary feature branch, uses secure file tools to implement code, and commits changes.
3. **Reviewer:** Conducts code reviews, enforces style/architecture guidelines, and requests rework if necessary.
4. **Tester:** Runs builds, type checks, unit tests, and verifies features before opening a Pull Request on GitHub.

---

## ✨ Key Features

- 🤖 **Autonomous Multi-Agent Crew:** Specialized agent roles working in concert to resolve complex software tasks.
- 📌 **GitHub Issue Synchronization:** Two-way sync between your GitHub project backlog and the DevCrew board.
- 🔒 **Encrypted Token Management:** AES-256 encrypted storage of GitHub OAuth tokens at rest.
- 📊 **Real-time Cost & Budget Guardrails:** Token consumption tracking and turn-limit enforcement per agent stage.
- 🏢 **Gamified Live Agent Office:** Visual canvas showing agent movement, active tasks, and processing states.
- 🔄 **Resilient Background Execution:** Supports async background jobs via Cloudhike Jobs or native Next.js fallback.
- 🛡️ **Switch Trust Protocol:** Automated security scanning and ROI performance auditing for autonomous agents.

---

## 🛠 Tech Stack

| Category                     | Technology                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| **Framework**                | Next.js 16 (App Router, React 19, Server Components, Server Actions)                |
| **Language**                 | TypeScript (Strict Mode)                                                            |
| **Styling**                  | Tailwind CSS v4, dynamic CSS design tokens in `app/globals.css`                     |
| **UI Components**            | shadcn/ui (`base-nova` on `@base-ui/react`), Lucide React, `@dnd-kit` drag-and-drop |
| **Authentication**           | Hosted Better Auth (Email, Google OAuth, GitHub OAuth)                              |
| **Database & ORM**           | PostgreSQL + Drizzle ORM                                                            |
| **Storage**                  | S3-compatible private object storage                                                |
| **GitHub Integration**       | Custom GitHub App / OAuth App with token encryption at rest                         |
| **AI Orchestration**         | OpenAI Responses API (`openai` SDK)                                                 |
| **Background Orchestration** | Cloudhike Jobs / Next.js Background Execution (`after()`)                           |
| **Trust Audit**              | Switch Trust API                                                                    |

---

## 🏛 Architecture & Technical Documentation

This section provides technical insights into DevCrew's internal architecture based on the specifications located in the `/techdocs` directory.

### 1. Multi-Agent Workflow & System Architecture

The core of DevCrew is a resilient state machine managing agent state transitions, rework loops, and budget enforcement.

![DevCrew Multi-Agent Workflow and System Architecture](./techdocs/DevCrew_Multi-Agent%20Workflow_and_System_Architecture.jpg)

For an in-depth system specification covering state transition edge cases, turn limits, and agent tool execution, refer to:

- <a href="./techdocs/Complete_Devcrew_Platform_Technical_Specification.pdf" target="_blank">Complete Devcrew Platform Technical Specification (PDF)</a>
- <a href="./techdocs/Technical%20specification%20and%20system%20architecture%20of%20DevCrew%20platform.pdf" target="_blank">Technical Specification & System Architecture of DevCrew Platform (PDF)</a>

---

### 2. Database Architecture & Data Isolation

DevCrew utilizes PostgreSQL via Drizzle ORM to maintain strict relational integrity across multi-tenant workspaces, GitHub access tokens, agent budgets, and execution logs.

![DevCrew Database Architecture](./techdocs/DevCrew_data_base_architecture.jpg)

---

### 3. Background Job Execution Engines (Cloudhike vs Inngest vs Trigger.dev)

DevCrew evaluates multiple background execution models for scalable task execution.

![Architecture Comparison](./techdocs/Architecture_comparison.jpg)

#### Individual Job Handler Architectures:

- **Cloudhike Jobs Execution Model:**
  ![Cloudhike Jobs](./techdocs/CloudhikeJobs.jpg)

- **Inngest Job Execution Model:**
  ![Inngest Job](./techdocs/InngestJob.jpg)

For a detailed comparative evaluation between background processing engines, consult:

- <a href="./techdocs/Cloudhike%20Jobs%2C%20Inngest%20and%20Trigger.dev%20comparison.pdf" target="_blank">Cloudhike Jobs, Inngest and Trigger.dev Comparison (PDF)</a>

---

### 4. Secure GitHub OAuth & Token Encryption

Security is paramount when managing repository write access. DevCrew encrypts repository tokens at rest using symmetrical encryption.

![Token Encryption and Decryption Architecture](./techdocs/Token_Encryption%2Band_Decryption_Architecture_in_DevCrew.jpg)

![Cloudhike Integration & GitHub Auth Setup](./techdocs/Cloudhike_Integration_&_GitHu_Auth_Setup_in_DevCrew.jpg)

For detailed instructions on configuring GitHub OAuth and setting up Cloudhike integrations, see:

- <a href="./techdocs/Guidance%20on%20integrating%20the%20Cloudhike%20platform%20and%20setting%20up%20GitHub%20authentication%20in%20the%20DevCrew%20project.pdf" target="_blank">Guidance on Integrating Cloudhike Platform & Setting Up GitHub Authentication (PDF)</a>

---

## 📁 Documentation Links

Access the root documentation directory directly:

- 📁 <a href="./techdocs" target="_blank">/techdocs Directory</a>

### 📑 Architecture & Engineering Documents (PDF)

- <a href="./techdocs/Complete_DevCrew_Platform_Technical_Specification.pdf" target="_blank">Complete_Devcrew_Platform_Technical_Specification</a>
- <a href="./techdocs/Cloudhike%20Jobs%2C%20Inngest%20and%20Trigger.dev%20comparison.pdf" target="_blank">Cloudhike Jobs, Inngest and Trigger.dev comparison</a>

- <a href="./techdocs/Technical%20specification%20and%20system%20architecture%20of%20DevCrew%20platform.pdf" target="_blank">Technical specification and system architecture of DevCrew platform</a>

- <a href="./techdocs/Guidance%20on%20integrating%20the%20Cloudhike%20platform%20and%20setting%20up%20GitHub%20authentication%20in%20the%20DevCrew%20project.pdf" target="_blank">Guidance on integrating the Cloudhike platform and setting up GitHub authentication in the DevCrew project</a>

- <a href="./techdocs/Engineering_review_of_the_token_accounting_system__cost_calculation_and_budget_control_in_DevCrew.pdf" target="_blank">Engineering review of the token accounting system cost calculation and budget control in DevCrew</a>

### 🖼 Structural Diagrams & Schematics

- <a href="./techdocs/DevCrew_Multi-Agent%20Workflow_and_System_Architecture.jpg" target="_blank">DevCrew Multi-Agent Workflow and System Architecture</a>
- <a href="./techdocs/DevCrew_data_base_architecture.jpg" target="_blank">DevCrew data base architecture</a>
- <a href="./techdocs/Cloudhike_Integration_%26_GitHu_Auth_Setup_in_DevCrew.jpg" target="_blank">Cloudhike Integration & GitHub Auth Setup in DevCrew</a>

- <a href="./techdocs/Architecture_comparison.jpg" target="_blank">Architecture comparison</a>
- <a href="./techdocs/CloudhikeJobs.jpg" target="_blank">Cloudhike Jobs</a>
- <a href="./techdocs/InngestJob.jpg" target="_blank">Inngest Job</a>

- <a href="./techdocs/Token_Encryption%2Band_Decryption_Architecture_in_DevCrew.jpg" target="_blank">Token Encryption and Decryption Architecture in DevCrew</a>

---

## ⚡ Installation & Local Development

### 1. Prerequisites

- **Node.js**: v20.9.0 or newer
- **Package Manager**: `npm`
- **Database**: PostgreSQL 14+ (Local installation, Docker, Neon, or Supabase)
- **Hosted Better Auth Account**: Cloudhike Auth service ([cloudhike.dev](https://cloudhike.dev))
- **GitHub OAuth App**: For connecting repositories
- **OpenAI API Key**: Access to `gpt-4o` models via OpenAI API

### 2. Step-by-Step Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/sxidsvit/ai-devcrew.git devcrew
cd devcrew
npm install
```

### 3. Environment Variables (.env)

Copy the environment variable example file:

```bash
cp .env.example .env
```

Fill in the required fields in `.env`:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devcrew"
AUTH_URL="https://your-auth-domain.cloudhike.dev"
AUTH_PUBLISHABLE_KEY="your-auth-publishable-key"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
TOKEN_ENCRYPTION_KEY="openssl rand -base64 48"
OPENAI_API_KEY="sk-proj-..."
```

_(Optional: Set up local Postgres via Docker)_

```bash
docker run -d --name devcrew-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=devcrew postgres:16
```

### 4. Local Database Initialization

Sync your Drizzle ORM schema to the PostgreSQL database:

```bash
npm run db:push
```

### 5. Launch Development Server

Start the Next.js local development environment:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to create a workspace and link your repository.

---

### 6. Configuring GitHub OAuth App

To allow agents to read code, create branches, and open PRs:

1. Navigate to **GitHub Settings** → **Developer Settings** → **OAuth Apps** → **New OAuth App**.
2. Set **Homepage URL** to `http://localhost:3000`.
3. Set **Authorization callback URL** to `http://localhost:3000/api/github/callback`.
4. Copy the **Client ID** and generate a **Client Secret**, adding both to your `.env` file.

---

## 🚀 Deployment

1. **Vercel / Hosting Provider:** Deploy the application code base. Set `NEXT_PUBLIC_APP_URL` to your production domain.
2. **Background Jobs (Cloudhike Jobs):** Set `JOBS_API_URL` and `JOBS_API_KEY` to route background execution steps securely.
3. **Database:** Supply production PostgreSQL connection string in `DATABASE_URL` and run `npm run db:push`.
4. **OAuth Callbacks:** Add production authorization callback URL (`https://your-domain.com/api/github/callback`) in GitHub OAuth App settings.

---

### 📬 Connect with me

<a href="https://www.linkedin.com/in/sergiy-antonyuk/" target="_blank">
<img alt="Sergiy Antonyuk | LinkedIn" src="https://img.shields.io/badge/LinkedIn-0077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white" />
</a>

#### 🙏 Acknowledgements

This project is a version of the original project <a href='https://www.youtube.com/watch?v=mtrMRzUyFIE' target='_blank'>DevCrew</a>.

A heartfelt thank you to <a href='https://www.youtube.com/@tubeguruji' target='_blank'>TubeGuruji</a> for his invaluable contributions.

I used it for educational purposes to study its device in detail and created detailed technical documentation.
