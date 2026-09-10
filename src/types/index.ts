// Database Types matching Supabase schema

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student';
  phone?: string;
  parent_phone?: string;
  age?: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_seen?: string;
  is_online?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  schedule_info?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
  student?: Profile;
  group?: Group;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  group_ids: string[];
  status: 'pending' | 'registered' | 'expired' | 'cancelled';
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
  groups?: Group[];
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_pinned: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  group_id: string;
  deadline: string;
  attachments?: string[];
  status: 'draft' | 'published' | 'closed';
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: Group;
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  image_urls: string[];
  submitted_at: string;
  grade?: number;
  max_grade?: number;
  teacher_comment?: string;
  status: 'submitted' | 'graded' | 'returned';
  student?: Profile;
  assignment?: Assignment;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  group_id: string;
  start_time?: string;
  deadline: string;
  total_points: number;
  status: 'draft' | 'published' | 'closed' | 'graded';
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: Group;
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'long_answer';
  options?: ExamOption[];
  correct_answer?: string;
  points: number;
  order_index: number;
}

export interface ExamOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  submitted_at: string;
  total_grade?: number;
  status: 'submitted' | 'graded';
  student?: Profile;
  answers?: ExamAnswer[];
}

export interface ExamAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text?: string;
  selected_option_id?: string;
  points_awarded?: number;
  teacher_feedback?: string;
}

export interface Attendance {
  id: string;
  group_id: string;
  student_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  created_at: string;
  student?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_group_ids: string[];
  attachment_url?: string;
  created_by: string;
  created_at: string;
  groups?: Group[];
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  target_group_ids: string[];
  created_by: string;
  created_at: string;
  groups?: Group[];
}

export interface JitsiRoom {
  id: string;
  room_name: string;
  room_id: string;
  join_url: string;
  target_group_ids: string[];
  created_by: string;
  created_at: string;
  scheduled_at?: string;
  title?: string;
  is_active: boolean;
  groups?: Group[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'assignment' | 'exam' | 'jitsi' | 'announcement' | 'other';
  event_date: string;
  end_date?: string;
  group_id?: string;
  reference_id?: string;
  created_at: string;
  group?: Group;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  assignment_id?: string;
  exam_id?: string;
  grade: number;
  max_grade: number;
  created_at: string;
  student?: Profile;
}

export interface DashboardStats {
  total_students: number;
  total_groups: number;
  pending_invitations: number;
  registered_students: number;
  upcoming_assignments: number;
  upcoming_exams: number;
  recent_submissions: number;
  today_attendance_rate: number;
}

// Form Types
export interface CreateGroupForm {
  name: string;
  description?: string;
  schedule_info?: string;
}

export interface CreateAssignmentForm {
  title: string;
  description?: string;
  group_id: string;
  deadline: string;
}

export interface CreateExamForm {
  title: string;
  description?: string;
  group_id: string;
  deadline: string;
  start_time?: string;
  total_points: number;
  questions: CreateQuestionForm[];
}

export interface CreateQuestionForm {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'long_answer';
  options?: { option_text: string; is_correct: boolean }[];
  correct_answer?: string;
  points: number;
}

export interface CreateAnnouncementForm {
  title: string;
  content: string;
  target_group_ids: string[];
}

export interface CreateResourceForm {
  title: string;
  description?: string;
  category: string;
  target_group_ids: string[];
}

export interface CreateJitsiRoomForm {
  title?: string;
  target_group_ids: string[];
  scheduled_at?: string;
}

export interface InviteStudentForm {
  email: string;
  group_ids: string[];
}
