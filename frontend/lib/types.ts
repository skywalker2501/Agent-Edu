export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  code?: string;
  description?: string;
  teacher_id?: string;
  student_count?: number;
  topic_count?: number;
  semester?: string;
  created_at?: string;
}

// Legacy alias
export type ClassItem = ClassInfo;

export interface Topic {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  order_index: number;
  concepts?: Concept[];
  prerequisites?: PrerequisiteLink[];
}

export interface Concept {
  id: string;
  topic_id: string;
  code: string;
  name: string;
  description?: string;
  difficulty_level: string;
}

export interface PrerequisiteLink {
  id: string;
  prerequisite_topic_id: string;
  prerequisite_topic_name?: string;
  prerequisite_topic_code?: string;
  relationship_type: string;
  strength: number;
  explanation?: string;
}

export interface Question {
  id: string;
  title?: string;
  prompt: string;
  question_type: "multiple_choice" | "multiple_select" | "short_answer" | "coding" | "programming";
  topic_id?: string;
  concept_id?: string;
  options?: Array<string | { id?: string; text?: string; [key: string]: any }>;
  difficulty?: string;
  points?: number;
  starter_code?: string;
  constraints?: Record<string, any>;
  reference_answer?: string;
  test_cases?: Array<{ input: string; expected_output: string; is_hidden?: boolean }>;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  class_id?: string;
  topic_id?: string;
  assessment_type: "initial" | "quiz" | "reassessment" | "diagnostic";
  linked_intervention_id?: string;
  time_limit_minutes: number;
  total_points?: number;
  passing_score?: number;
  is_active?: boolean;
  created_at?: string;
  questions?: Question[];
  attempt_count?: number;
}

export interface SubmissionAnswer {
  id: string;
  question_id: string;
  student_answer?: string;
  code_response?: string;
  selected_option_index?: number;
  text_response?: string;
  code_language?: string;
  is_correct?: boolean;
  score_awarded?: number;
  max_score?: number;
  automated_feedback?: string;
  execution_results?: {
    passed: boolean;
    tests_passed?: number;
    tests_total?: number;
    output?: string;
    error?: string;
    execution_time_ms?: number;
    test_details?: Array<{ test_index: number; passed: boolean; input?: string; actual?: string; expected?: string }>;
  };
}

export interface GradingResult {
  id?: string;
  total_score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  topic_breakdown?: Record<string, { score: number; max: number; percentage: number }>;
  graded_at?: string;
}

export interface SubmissionResult {
  submission_id?: string;
  attempt_id?: string;
  assessment_id?: string;
  student_id?: string;
  status?: string;
  submitted_at?: string;
  score?: number;
  max_score?: number;
  percentage?: number;
  feedback?: string;
  next_action?: string;
  grading?: GradingResult;
  answers?: SubmissionAnswer[];
  next_action_recommendation?: string;
}

export interface LearnerState {
  id?: string;
  student_id?: string;
  topic_id?: string;
  topic_name?: string;
  topic_code?: string;
  mastery_score?: number;
  confidence?: number;
  status?: string;
  assessment_count?: number;
  version?: number;
  last_updated?: string;
  // Aggregated properties from dashboard API
  topic_mastery?: Record<string, number>;
  active_misconceptions?: string[];
}

export interface Misconception {
  id: string;
  student_id?: string;
  topic_id?: string;
  topic_name?: string;
  concept?: string;
  title?: string;
  root_cause?: string;
  description?: string;
  status: string;
  confidence: number;
  evidence_summary?: string;
  supporting_evidence?: any[];
  detected_at?: string;
  resolved_at?: string | null;
  relationships?: Array<{
    id: string;
    prerequisite_topic_id: string;
    prerequisite_topic_name?: string;
    strength: number;
    explanation?: string;
  }>;
}

export interface DigitalTwinSummary {
  student_id: string;
  student_name?: string;
  overall_progress?: number;
  topics_mastered?: number;
  topics_needing_attention?: number;
  active_misconceptions_count?: number;
  learner_states?: LearnerState[];
  misconceptions?: Misconception[];
  recent_events?: Array<{ event_type: string; payload: any; created_at: string }>;
}

export interface InterventionCandidate {
  id: string;
  strategy: string;
  title: string;
  description?: string;
  target_concept?: string;
  rationale?: string;
  intended_objective?: string;
  reason?: string;
  supporting_evidence?: string[];
  estimated_time_minutes?: number;
  estimated_effort_minutes?: number;
  difficulty?: string;
  expected_benefit_label?: string;
  expected_benefit_score?: number;
  uncertainty?: number;
  ranking_score?: number;
  score?: number;
  ranking?: number;
  evidence_strength?: number;
  is_recommended?: boolean;
  content_preview?: string;
}

export interface InterventionVersion {
  id: string;
  version_num: number;
  title: string;
  strategy: string;
  content: {
    steps?: Array<{ step_num: number; title: string; type: string; body?: string }>;
    overview?: string;
    preview?: string;
  };
  created_by_role: "ai" | "teacher";
  author_id?: string;
  change_notes?: string;
  created_at: string;
}

export interface Intervention {
  id: string;
  student_id?: string;
  target_concept?: string;
  target_topic_id?: string;
  target_topic_name?: string;
  selected_strategy?: string;
  reason?: string;
  confidence?: number;
  expected_goal?: string;
  status: "proposed" | "approved" | "modified" | "rejected" | "in_progress" | "completed";
  teacher_status?: "pending_review" | "approved" | "rejected" | "modified" | "more_evidence_requested";
  current_version_num?: number;
  trigger_assessment_id?: string;
  reassessment_id?: string;
  created_at?: string;
  approved_at?: string | null;
  completed_at?: string | null;
  candidates?: InterventionCandidate[];
  current_version?: InterventionVersion;
}

export interface TeacherReview {
  id: string;
  submission_id?: string;
  teacher_id?: string | null;
  student_id?: string;
  student_name?: string;
  question_id?: string;
  question_title?: string;
  review_type?: string;
  teacher_name?: string | null;
  status: "pending" | "completed" | "approved" | "rejected";
  method_review_outcome?: string;
  ai_evaluation?: {
    method_name?: string;
    reasoning?: string;
    is_valid_alternative?: boolean;
    confidence?: number;
    detected_misconceptions?: string[];
    suggested_outcome?: string;
  };
  ai_preliminary_evaluation?: {
    suggested_outcome?: string;
    confidence?: number;
    reasoning?: string;
  };
  ai_suggested_marks?: number;
  teacher_comments?: string | null;
  marks_awarded?: number | null;
  awarded_score?: number;
  is_alternative_accepted?: boolean;
  alternative_approach_name?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
}

// Legacy alias
export type TeacherReviewItem = TeacherReview;

export type ReviewOutcome =
  | "correct_method_and_answer"
  | "correct_alternative_method"
  | "correct_answer_incomplete_reasoning"
  | "partially_correct"
  | "incorrect_valid_intermediate"
  | "incorrect_method_and_answer"
  | "insufficient_evidence"
  | "requires_manual_review";

export interface SolutionApproach {
  approach_name: string;
  method_category: string;
  time_complexity: string;
  space_complexity: string;
  code_example: string;
  main_advantage: string;
  tradeoffs_and_risks: string;
  correctness_status: string;
  educational_suitability: string;
  matches_student_submission: boolean;
}

export interface MultiApproachResponse {
  question_id: string;
  question_title: string;
  question_prompt: string;
  student_submission_snippet?: string;
  approaches: SolutionApproach[];
  ai_recommendation_reason: string;
}

export interface InterventionOutcome {
  id: string;
  intervention_id?: string;
  student_id?: string;
  baseline_score?: number;
  post_score?: number;
  score_difference?: number;
  success?: boolean;
  objective_met?: boolean;
  topic_mastery_before?: Record<string, number>;
  topic_mastery_after?: Record<string, number>;
  remaining_misconceptions?: any[];
  next_recommendation?: string;
  measured_at?: string;
}

export interface TeacherDecision {
  id: string;
  teacher_id?: string;
  teacher_name?: string;
  entity_type?: string;
  entity_id?: string;
  decision_type?: string;
  original_state?: any;
  new_state?: any;
  justification?: string;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  notification_type?: string;
  link_url?: string;
  is_read: boolean;
  created_at?: string;
}

export type TutorMode = "explain" | "hint" | "worked_example" | "guide_step_by_step" | "test_understanding";

export interface TutorMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  teaching_mode?: TutorMode;
  hints?: string[];
  code_snippet?: string;
  suggested_followups?: string[];
  created_at?: string;
}

export interface TutorConversation {
  id: string;
  student_id?: string;
  topic_id?: string;
  mode?: TutorMode;
  title?: string;
  messages?: TutorMessage[];
  created_at?: string;
  updated_at?: string;
}

export interface StudentDashboardData {
  student_id?: string;
  enrolled_classes?: ClassInfo[];
  active_assessments?: Assessment[];
  pending_interventions?: Intervention[];
  recent_events?: any[];
  mastery_summary?: Record<string, number>;
}
