import { bigint, boolean, date, doublePrecision, index, integer, jsonb, pgTable, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { AgentActivityKind, AgentRole, SwitchReport, SwitchScanStatus, TrustFinding } from "@/lib/ai-team";
import type { AgentRunStatus, TaskPriority, TaskStatus, TaskType } from "@/lib/board";
import type {
  AgentTurnInput,
  AnalystPlan,
  MergeBlock,
  MergeMode,
  PullRequestState,
  ReviewResult,
  TaskPickupMode,
  TaskRunStage,
  TaskRunStatus,
  VerificationResult,
} from "@/lib/workflow";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // User id issued by the hosted Better Auth service
  authId: text("auth_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One linked GitHub account per user, used to read and work on repositories.
export const githubConnections = pgTable("github_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  githubUserId: bigint("github_user_id", { mode: "number" }).notNull(),
  login: text("login").notNull(),
  avatarUrl: text("avatar_url"),
  // AES-256-GCM encrypted OAuth token (see lib/crypto.ts). Never store it in plain text.
  accessToken: text("access_token").notNull(),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// A workspace has exactly one GitHub repository that its AI agents work on.
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Key of a built-in icon (components/workspace/workspace-icons.tsx); ignored when logoKey is set
  icon: text("icon").notNull().default("rocket"),
  // S3 object key of an uploaded logo, served through /api/workspaces/[id]/logo
  logoKey: text("logo_key"),
  repoId: bigint("repo_id", { mode: "number" }).notNull(),
  repoFullName: text("repo_full_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  repoDefaultBranch: text("repo_default_branch").notNull(),
  repoPrivate: boolean("repo_private").notNull().default(false),
  // When the board last pulled issues from the repository (see lib/github-issues.ts)
  issuesSyncedAt: timestamp("issues_synced_at"),
  // AI workflow settings (lib/workflow.ts)
  taskPickup: text("task_pickup").$type<TaskPickupMode>().notNull().default("manual"),
  mergeMode: text("merge_mode").$type<MergeMode>().notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// A card on a workspace's Kanban board: an issue, bug or feature.
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Sequential per workspace; shown as the task key, e.g. AWA-12
    number: integer("number").notNull(),
    type: text("type").$type<TaskType>().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<TaskStatus>().notNull().default("todo"),
    priority: text("priority").$type<TaskPriority>().notNull().default("medium"),
    // Order within a column, ascending
    position: doublePrecision("position").notNull().default(0),
    assignee: text("assignee"),
    estimate: integer("estimate"),
    dueDate: date("due_date"),
    // Set when the task was imported from an issue in the workspace's repository
    githubIssueId: bigint("github_issue_id", { mode: "number" }),
    githubIssueNumber: integer("github_issue_number"),
    githubIssueUrl: text("github_issue_url"),
    // The issue's state at the last sync, so only an open/closed change moves the card
    githubIssueState: text("github_issue_state").$type<"open" | "closed">(),
    // Set when an agent is started on the task from the board
    agentRunStatus: text("agent_run_status").$type<AgentRunStatus>(),
    agentRunStartedAt: timestamp("agent_run_started_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("tasks_workspace_number_unique").on(table.workspaceId, table.number),
    unique("tasks_workspace_github_issue_unique").on(table.workspaceId, table.githubIssueId),
    index("tasks_workspace_status_idx").on(table.workspaceId, table.status, table.position),
  ],
);

// An AI agent on a workspace's team. Every workspace gets one agent per role.
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    role: text("role").$type<AgentRole>().notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    // System prompt passed to the OpenAI agent
    instructions: text("instructions").notNull(),
    // Skill ids from lib/ai-team.ts
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    budgetCents: integer("budget_cents").notNull(),
    // Model calls the agent may make in one stage of a task run
    maxTurns: integer("max_turns").notNull().default(20),
    enabled: boolean("enabled").notNull().default(true),
    // 0–100, from the latest trust scan
    trustScore: integer("trust_score"),
    trustFindings: jsonb("trust_findings").$type<TrustFinding[]>().notNull().default([]),
    trustScannedAt: timestamp("trust_scanned_at"),
    // The agent's fingerprint in Switch Trust (agn_<32 hex>), set on its first Switch scan
    switchAgentId: text("switch_agent_id"),
    switchScanStatus: text("switch_scan_status").$type<SwitchScanStatus>(),
    switchScanStartedAt: timestamp("switch_scan_started_at"),
    // 0–100 overall evaluation health from Switch Trust
    switchScore: integer("switch_score"),
    switchReport: jsonb("switch_report").$type<SwitchReport>(),
    switchScannedAt: timestamp("switch_scanned_at"),
    switchError: text("switch_error"),
    // Model spend of the Switch scan in progress, in fractional cents; recorded as one activity when the scan ends
    switchScanCostCents: doublePrecision("switch_scan_cost_cents").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("agents_workspace_role_unique").on(table.workspaceId, table.role)],
);

// A workspace's link to Switch Trust, which red-teams its agents and tracks their cost.
export const switchConnections = pgTable("switch_connections", {
  id: serial("id").primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  // AES-256-GCM encrypted API key (see lib/crypto.ts). Never store it in plain text.
  apiKey: text("api_key").notNull(),
  instance: text("instance").notNull(),
  // Discovered from the API key, which Switch Trust pins to one tenant and workspace
  tenantId: text("tenant_id").notNull(),
  switchWorkspaceId: text("switch_workspace_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// What an agent did, and what it cost. Rows are append-only.
export const agentActivities = pgTable(
  "agent_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    kind: text("kind").$type<AgentActivityKind>().notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    // Model and tool spend for this step, in US cents
    costCents: integer("cost_cents").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_activities_agent_created_idx").on(table.agentId, table.createdAt),
    index("agent_activities_workspace_created_idx").on(table.workspaceId, table.createdAt),
  ],
);

// One pass of a task through the AI team: Analyst → Developer → Reviewer → Tester → pull request.
// Each step runs as a Cloudhike job (lib/task-runs.ts); the row holds everything the next step needs.
export const taskRuns = pgTable(
  "task_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    status: text("status").$type<TaskRunStatus>().notNull().default("running"),
    stage: text("stage").$type<TaskRunStage>().notNull().default("analysis"),
    // Bumped by each job that claims the run, so a duplicate or superseded job does nothing
    step: integer("step").notNull().default(0),
    heartbeatAt: timestamp("heartbeat_at").defaultNow().notNull(),
    // Times review or verification sent the work back to the Developer
    round: integer("round").notNull().default(0),
    // The current stage's conversation: model calls so far, the last response and the tool results to send next
    stageTurns: integer("stage_turns").notNull().default(0),
    previousResponseId: text("previous_response_id"),
    pendingInput: jsonb("pending_input").$type<AgentTurnInput[]>(),
    // Model spend of the current stage in fractional cents; recorded through recordAgentSpend when the stage ends
    pendingCostCents: doublePrecision("pending_cost_cents").notNull().default(0),
    branch: text("branch"),
    baseBranch: text("base_branch"),
    plan: jsonb("plan").$type<AnalystPlan>(),
    developerSummary: text("developer_summary"),
    review: jsonb("review").$type<ReviewResult>(),
    verification: jsonb("verification").$type<VerificationResult>(),
    // What the Reviewer or Tester asked the Developer to fix
    feedback: text("feedback"),
    error: text("error"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_runs_task_created_idx").on(table.taskId, table.createdAt),
    index("task_runs_workspace_status_idx").on(table.workspaceId, table.status),
  ],
);

// A pull request the AI team opened on the workspace's repository.
export const pullRequests = pgTable(
  "pull_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    runId: uuid("run_id").references(() => taskRuns.id, { onDelete: "set null" }),
    openedByAgentId: uuid("opened_by_agent_id").references(() => agents.id, { onDelete: "set null" }),
    number: integer("number").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    headBranch: text("head_branch").notNull(),
    baseBranch: text("base_branch").notNull(),
    state: text("state").$type<PullRequestState>().notNull().default("open"),
    changedFiles: integer("changed_files").notNull().default(0),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    mergeBlock: text("merge_block").$type<MergeBlock>(),
    mergeError: text("merge_error"),
    // The Todo task the Tester filed for a merge conflict or failed check, so it's filed only once
    followUpTaskId: uuid("follow_up_task_id").references(() => tasks.id, { onDelete: "set null" }),
    mergedBy: text("merged_by").$type<"auto" | "user">(),
    mergeCommitSha: text("merge_commit_sha"),
    mergedAt: timestamp("merged_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("pull_requests_workspace_number_unique").on(table.workspaceId, table.number),
    index("pull_requests_workspace_created_idx").on(table.workspaceId, table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GithubConnection = typeof githubConnections.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type SwitchConnection = typeof switchConnections.$inferSelect;
export type AgentActivity = typeof agentActivities.$inferSelect;
export type NewAgentActivity = typeof agentActivities.$inferInsert;
export type TaskRun = typeof taskRuns.$inferSelect;
export type PullRequest = typeof pullRequests.$inferSelect;
