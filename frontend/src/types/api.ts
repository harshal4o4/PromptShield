export type Decision = 'ALLOW' | 'BLOCK' | 'SANITIZE' | 'ESCALATE';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SourceType = 'user' | 'document' | 'web' | 'tool';
export type TrustLevel = 'trusted' | 'untrusted' | 'semi-trusted';

export interface SignalItem {
  rule_id: string;
  label: string;
  severity: RiskLevel;
  evidence: string;
}

export interface AnalysisRequest {
  text: string;
  source_type?: SourceType;
  trust_level?: TrustLevel;
  context?: Record<string, any>;
}

export interface AnalysisResponse {
  event_id: string;
  decision: Decision;
  risk_level: RiskLevel;
  summary: string;
  signals: SignalItem[];
  sanitized_text: string | null;
  analyzed_at: string;
  detector_version: string;
  policy_version: string;
}

export interface EventItem {
  id: string;
  timestamp: string;
  source_type: string;
  trust_level: string;
  decision: Decision;
  risk_level: RiskLevel;
  summary: string;
  signals_count: number;
  primary_rule: string | null;
  redacted_excerpt: string;
  is_attack: boolean;
  is_demo: boolean;
}

export interface EventDetail {
  id: string;
  timestamp: string;
  source_type: string;
  trust_level: string;
  decision: Decision;
  risk_level: RiskLevel;
  summary: string;
  signals: SignalItem[];
  redacted_excerpt: string;
  sanitized_text: string | null;
  detector_version: string;
  policy_version: string;
  is_attack: boolean;
  is_demo: boolean;
}

export interface EventsListResponse {
  items: EventItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OverviewKPIs {
  prompts_analyzed: number;
  attacks_detected: number;
  requests_blocked: number;
  sanitized_count: number;
  escalated_count: number;
  attack_rate_pct: number;
  block_rate_pct: number;
}

export interface ActivityPoint {
  label: string;
  total: number;
  attacks: number;
  blocked: number;
}

export interface OverviewResponse {
  kpis: OverviewKPIs;
  activity: ActivityPoint[];
  recent_events: EventItem[];
}

export interface RuleConfig {
  name: string;
  enabled: boolean;
  severity: RiskLevel;
  action: Decision;
  description: string;
}

export interface PolicyConfig {
  version: string;
  updated_at: string;
  sanitization_enabled: boolean;
  ambiguous_escalation: boolean;
  rules: Record<string, RuleConfig>;
  severity_actions: Record<string, Decision>;
}

export interface ConfusionMatrix {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

export interface CategoryMetric {
  category: string;
  total: number;
  true_positives: number;
  false_positives: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface FailureCase {
  id: string;
  text_excerpt: string;
  ground_truth: string;
  predicted_decision: string;
  predicted_risk: string;
  failure_type: 'false_positive' | 'false_negative';
  rationale: string;
}

export interface EvaluationResult {
  id: string;
  run_at: string;
  dataset_version: string;
  total_samples: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  confusion_matrix: ConfusionMatrix;
  category_metrics: Record<string, CategoryMetric>;
  failure_cases: FailureCase[];
}

export interface DatasetSummary {
  version: string;
  total_samples: number;
  malicious_count: number;
  benign_count: number;
  categories: Record<string, number>;
}

export interface AppSettings {
  retention_mode: 'redacted_excerpt' | 'hash_only' | 'full_text_local_only';
  telemetry_enabled: boolean;
  alert_threshold: RiskLevel;
  max_text_length: number;
}
