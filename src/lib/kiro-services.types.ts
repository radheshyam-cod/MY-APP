/**
 * TypeScript type definitions for Kiro IDE Services
 * Centralized type definitions following project standards
 */

// Core Service Types
export interface KiroServiceBase {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  lastUpdated: string;
  configuration: Record<string, any>;
}

export interface KiroServiceMetrics {
  uptime: string;
  tasksCompleted: number;
  lastActivity: string;
  errorCount: number;
  performanceScore: number;
}

// Planning Service Types
export interface PlanningProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  budget?: number;
  actualCost?: number;
  owner: string;
  team: TeamMember[];
  milestones: Milestone[];
  tasks: Task[];
  dependencies: ProjectDependency[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  skills: string[];
  availability: number; // percentage
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  dependencies: string[];
  deliverables: string[];
  criteria: string[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'testing' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  reporter: string;
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  dependencies: string[];
  subtasks: SubTask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  labels: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectDependency {
  id: string;
  type: 'blocks' | 'blocked-by' | 'relates-to';
  targetProjectId: string;
  description?: string;
}

// Prototyping Service Types
export interface Prototype {
  id: string;
  name: string;
  description: string;
  version: string;
  framework: 'react' | 'vue' | 'angular' | 'html';
  styling: 'tailwind' | 'css' | 'styled-components' | 'scss';
  status: 'draft' | 'review' | 'approved' | 'deprecated';
  previewUrl: string;
  sourceUrl?: string;
  components: PrototypeComponent[];
  pages: PrototypePage[];
  interactions: Interaction[];
  designTokens: DesignToken[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrototypeComponent {
  id: string;
  name: string;
  type: 'button' | 'input' | 'card' | 'modal' | 'navigation' | 'custom';
  category: string;
  props: ComponentProp[];
  variants: ComponentVariant[];
  code: string;
  documentation?: string;
  examples: ComponentExample[];
}

export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  required: boolean;
  defaultValue?: any;
  description: string;
  options?: string[];
}

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  description: string;
}

export interface ComponentExample {
  name: string;
  code: string;
  description: string;
}

export interface PrototypePage {
  id: string;
  name: string;
  path: string;
  components: string[];
  layout: PageLayout;
  metadata: PageMetadata;
}

export interface PageLayout {
  type: 'grid' | 'flex' | 'absolute';
  configuration: Record<string, any>;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  responsive: boolean;
  accessibility: AccessibilityInfo;
}

export interface AccessibilityInfo {
  level: 'A' | 'AA' | 'AAA';
  features: string[];
  tested: boolean;
}

export interface Interaction {
  id: string;
  name: string;
  trigger: InteractionTrigger;
  action: InteractionAction;
  target: string;
  conditions?: InteractionCondition[];
  animation?: Animation;
}

export interface InteractionTrigger {
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'keypress' | 'load';
  element: string;
  conditions?: Record<string, any>;
}

export interface InteractionAction {
  type: 'navigate' | 'show' | 'hide' | 'toggle' | 'animate' | 'validate' | 'submit';
  parameters: Record<string, any>;
}

export interface InteractionCondition {
  property: string;
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains';
  value: any;
}

export interface Animation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'custom';
  duration: number;
  easing: string;
  delay?: number;
}

export interface DesignToken {
  name: string;
  category: 'color' | 'typography' | 'spacing' | 'shadow' | 'border' | 'animation';
  value: string;
  description?: string;
}

// Documentation Service Types
export interface Documentation {
  id: string;
  title: string;
  type: 'api' | 'user-guide' | 'technical' | 'changelog' | 'tutorial';
  format: 'markdown' | 'html' | 'pdf' | 'json';
  content: string;
  metadata: DocumentationMetadata;
  sections: DocumentationSection[];
  lastGenerated: string;
  autoGenerated: boolean;
  sourceFiles: string[];
  version: string;
}

export interface DocumentationMetadata {
  author: string;
  tags: string[];
  category: string;
  audience: 'developer' | 'user' | 'admin' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections: DocumentationSection[];
}

// Workflow Service Types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'ci-cd' | 'testing' | 'deployment' | 'maintenance' | 'custom';
  status: 'active' | 'paused' | 'disabled' | 'error';
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  environment: WorkflowEnvironment;
  schedule?: WorkflowSchedule;
  notifications: WorkflowNotification[];
  metrics: WorkflowMetrics;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'webhook' | 'file_change';
  conditions: TriggerCondition[];
  enabled: boolean;
}

export interface TriggerCondition {
  property: string;
  operator: 'equals' | 'contains' | 'matches' | 'not-equals';
  value: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'script' | 'api_call' | 'notification' | 'condition' | 'parallel' | 'custom';
  action: string;
  parameters: Record<string, any>;
  dependsOn: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
  onFailure: 'stop' | 'continue' | 'retry' | 'rollback';
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface WorkflowEnvironment {
  name: string;
  variables: Record<string, string>;
  secrets: string[];
  resources: ResourceRequirements;
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage: string;
  timeout: number;
}

export interface WorkflowSchedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

export interface WorkflowNotification {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  events: ('start' | 'success' | 'failure' | 'completion')[];
  template?: string;
}

export interface WorkflowMetrics {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  lastRun?: WorkflowRun;
  recentRuns: WorkflowRun[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'failure' | 'cancelled' | 'timeout';
  startTime: string;
  endTime?: string;
  duration?: number;
  triggeredBy: string;
  steps: WorkflowStepRun[];
  logs: WorkflowLog[];
}

export interface WorkflowStepRun {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: string;
  error?: string;
}

export interface WorkflowLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
}

// Execution Service Types
export interface ExecutionEnvironment {
  id: string;
  name: string;
  description: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'php';
  version: string;
  runtime: string;
  dependencies: ExecutionDependency[];
  configuration: EnvironmentConfiguration;
  limits: ExecutionLimits;
  security: SecuritySettings;
  status: 'available' | 'busy' | 'maintenance' | 'error';
}

export interface ExecutionDependency {
  name: string;
  version: string;
  type: 'package' | 'library' | 'binary';
  source: string;
}

export interface EnvironmentConfiguration {
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  mountPoints: MountPoint[];
  networkAccess: boolean;
  internetAccess: boolean;
}

export interface MountPoint {
  source: string;
  target: string;
  readonly: boolean;
}

export interface ExecutionLimits {
  maxExecutionTime: number;
  maxMemoryUsage: string;
  maxCpuUsage: string;
  maxFileSize: string;
  maxNetworkRequests: number;
}

export interface SecuritySettings {
  sandboxed: boolean;
  allowedDomains: string[];
  blockedCommands: string[];
  fileSystemAccess: 'none' | 'readonly' | 'readwrite';
  networkPolicy: 'none' | 'restricted' | 'full';
}

export interface ExecutionRequest {
  code: string;
  language: string;
  environment: string;
  input?: string;
  arguments?: string[];
  files?: ExecutionFile[];
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionFile {
  name: string;
  content: string;
  encoding: 'utf8' | 'base64';
}

export interface ExecutionResult {
  id: string;
  status: 'success' | 'error' | 'timeout' | 'cancelled';
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  memoryUsed: string;
  cpuUsed: string;
  filesCreated: string[];
  networkRequests: NetworkRequest[];
  metadata: ExecutionMetadata;
}

export interface NetworkRequest {
  url: string;
  method: string;
  statusCode: number;
  duration: number;
}

export interface ExecutionMetadata {
  startTime: string;
  endTime: string;
  environment: string;
  version: string;
  requestId: string;
}

// API Response Types
export interface KiroApiResponse<T> {
  success: boolean;
  data?: T;
  error?: KiroApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface KiroApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Event Types
export interface KiroEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface KiroEventSubscription {
  id: string;
  eventTypes: string[];
  callback: (event: KiroEvent) => void;
  filters?: Record<string, any>;
}