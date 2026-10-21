import {
  User,
  ClassInfo,
  Topic,
  Assessment,
  SubmissionResult,
  DigitalTwinSummary,
  LearnerState,
  Misconception,
  Intervention,
  InterventionCandidate,
  TeacherReview,
  MultiApproachResponse,
  InterventionOutcome,
  TeacherDecision,
  NotificationItem,
  TutorConversation,
  TutorMessage,
  TutorMode,
  ReviewOutcome,
  StudentDashboardData,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1");

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("agentedu_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }
        const errorMsg =
          errData.detail ||
          errData.message ||
          (response.status === 401
            ? "Session expired or unauthorized. Please re-authenticate."
            : response.status === 403
            ? "Access denied. Insufficient permissions for this portal role."
            : response.status === 404
            ? "Requested resource was not found."
            : response.status >= 500
            ? "Backend service temporarily unavailable. Please retry shortly."
            : `API Error ${response.status}: ${response.statusText || "Request failed"}`);
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`Request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  // --- Auth ---
  async login(payload: { email: string; password: string }) {
    return this.request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async register(payload: { email: string; password: string; full_name: string; role: string }) {
    return this.request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMe() {
    return this.request<User>("/auth/me");
  }

  // --- Classes ---
  async getClasses() {
    return this.request<ClassInfo[]>("/classes");
  }

  async createClass(payload: { name: string; code: string; description?: string }) {
    return this.request<ClassInfo>("/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async enrollInClass(classId: string, studentId: string) {
    return this.request<any>(`/classes/${classId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ student_id: studentId }),
    });
  }

  // --- Topics & Knowledge Graph ---
  async getTopics() {
    return this.request<Topic[]>("/topics");
  }

  async getTopic(topicId: string) {
    return this.request<Topic>(`/topics/${topicId}`);
  }

  async getKnowledgeMap(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<{ nodes: any[]; edges: any[]; student_id: string }>(
      `/learner-model/knowledge-map${query}`
    );
  }

  // --- Assessments & Submissions ---
  async getAssessments(classId?: string, type?: string) {
    const params = new URLSearchParams();
    if (classId) params.append("class_id", classId);
    if (type) params.append("assessment_type", type);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Assessment[]>(`/assessments${query}`);
  }

  async getAssessment(id: string) {
    return this.request<Assessment>(`/assessments/${id}`);
  }

  async submitAssessment(payload: {
    assessment_id: string;
    attempt_id?: string;
    answers: Array<{
      question_id: string;
      selected_option_index?: number;
      text_response?: string;
      code_response?: string;
      student_answer?: string;
      code_language?: string;
    }>;
    time_spent_seconds?: number;
    idempotency_key?: string;
  }) {
    return this.request<SubmissionResult>("/submissions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSubmission(id: string) {
    return this.request<SubmissionResult>(`/submissions/${id}`);
  }

  // --- Student Dashboard ---
  async getStudentDashboard() {
    return this.request<StudentDashboardData>("/learner-model/dashboard");
  }

  // --- Learner Digital Twin & Misconceptions ---
  async getLearnerModel(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<LearnerState>(`/learner-model${query}`);
  }

  async getMisconceptions(studentId?: string, statusFilter?: string) {
    const params = new URLSearchParams();
    if (studentId) params.append("student_id", studentId);
    if (statusFilter) params.append("status_filter", statusFilter);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Misconception[]>(`/misconceptions${query}`);
  }

  async getAllMisconceptions() {
    return this.request<Misconception[]>("/misconceptions/all");
  }

  async updateMisconceptionStatus(misconceptionId: string, status: string) {
    return this.request<Misconception>(`/misconceptions/${misconceptionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // --- Interventions ---
  async getStudentInterventions(statusFilter?: string) {
    const query = statusFilter ? `?status_filter=${statusFilter}` : "";
    return this.request<Intervention[]>(`/interventions${query}`);
  }

  async getInterventionCandidates(interventionId?: string) {
    const query = interventionId ? `?intervention_id=${interventionId}` : "";
    return this.request<InterventionCandidate[]>(`/interventions/candidates${query}`);
  }

  async getIntervention(id: string) {
    return this.request<Intervention>(`/interventions/${id}`);
  }

  async approveIntervention(id: string, payload: {
    decision: "approved" | "rejected";
    selected_candidate_id?: string;
    teacher_notes?: string;
  }) {
    return this.request<Intervention>(`/interventions/${id}/review`, {
      method: "POST",
      body: JSON.stringify({
        action: payload.decision,
        teacher_comments: payload.teacher_notes,
        selected_candidate_id: payload.selected_candidate_id,
      }),
    });
  }

  async completeIntervention(id: string) {
    return this.request<Intervention>(`/interventions/${id}/complete`, {
      method: "POST",
    });
  }

  // --- Intelligent Teacher Review ---
  async getTeacherReviewQueue(statusFilter?: string) {
    const query = statusFilter ? `?status_filter=${statusFilter}` : "";
    return this.request<TeacherReview[]>(`/teacher-reviews${query}`);
  }

  async getTeacherReview(reviewId: string) {
    return this.request<TeacherReview>(`/teacher-reviews/${reviewId}`);
  }

  async submitTeacherDecision(
    reviewId: string,
    payload: {
      decision: string;
      review_outcome: ReviewOutcome;
      awarded_score: number;
      teacher_feedback: string;
      misconception_status?: string;
      is_alternative_accepted?: boolean;
    }
  ) {
    return this.request<TeacherReview>(`/teacher-reviews/${reviewId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        method_review_outcome: payload.review_outcome,
        teacher_comments: payload.teacher_feedback,
        marks_awarded: payload.awarded_score,
        is_alternative_accepted: payload.is_alternative_accepted ?? payload.review_outcome === "correct_alternative_method",
      }),
    });
  }

  async getMultiApproachSuggestions(questionId: string) {
    return this.request<MultiApproachResponse>(
      `/teacher-reviews/suggest-approaches/${questionId}`
    );
  }

  // --- Outcomes & Decision History ---
  async getOutcomes(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<InterventionOutcome[]>(`/outcomes${query}`);
  }

  async getDecisionHistory(teacherId?: string) {
    const query = teacherId ? `?teacher_id=${teacherId}` : "";
    return this.request<TeacherDecision[]>(`/outcomes/decisions${query}`);
  }

  // --- AI Tutor ---
  async getTutorConversations() {
    return this.request<TutorConversation[]>("/ai-tutor/conversations");
  }

  async sendTutorMessage(payload: {
    topic?: string;
    message: string;
    teaching_mode: TutorMode;
    conversation_id?: string;
  }) {
    return this.request<any>("/ai-tutor/chat", {
      method: "POST",
      body: JSON.stringify({
        content: payload.message,
        mode: payload.teaching_mode,
        topic: payload.topic,
        conversation_id: payload.conversation_id,
      }),
    });
  }

  // --- Notifications ---
  async getNotifications() {
    return this.request<NotificationItem[]>("/notifications");
  }

  async markNotificationRead(id: string) {
    return this.request<NotificationItem>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  // --- Admin ---
  async getAdminMetrics() {
    return this.request<any>("/admin/metrics");
  }

  async getUsers(role?: string) {
    const query = role ? `?role=${role}` : "";
    return this.request<User[]>(`/admin/users${query}`);
  }

  async getAuditTrail(action?: string) {
    const query = action ? `?action=${action}` : "";
    return this.request<any[]>(`/admin/audit${query}`);
  }
}

export const api = new ApiClient();
