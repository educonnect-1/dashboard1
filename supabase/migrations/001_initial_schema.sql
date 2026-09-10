-- =====================================================
-- Teacher Dashboard - Database Schema
-- For Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  phone TEXT,
  parent_phone TEXT,
  age INTEGER,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_info TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GROUP MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- =====================================================
-- INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  group_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'registered', 'expired', 'cancelled')) DEFAULT 'pending',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Invitation groups (for relational display)
CREATE TABLE IF NOT EXISTS invitation_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(invitation_id, group_id)
);

-- =====================================================
-- MESSAGES TABLE (Group Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_group_created ON messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(group_id, is_pinned) WHERE is_pinned = true;

-- =====================================================
-- ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'closed')) DEFAULT 'published',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);

-- =====================================================
-- ASSIGNMENT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade NUMERIC,
  max_grade NUMERIC,
  teacher_comment TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'graded', 'returned')) DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

-- =====================================================
-- EXAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ,
  deadline TIMESTAMPTZ NOT NULL,
  total_points NUMERIC NOT NULL DEFAULT 100,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'closed', 'graded')) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXAM QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'long_answer')),
  correct_answer TEXT,
  points NUMERIC NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- EXAM OPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- EXAM SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  total_grade NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'graded')) DEFAULT 'submitted',
  UNIQUE(exam_id, student_id)
);

-- =====================================================
-- EXAM ANSWERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES exam_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  selected_option_id UUID REFERENCES exam_options(id),
  points_awarded NUMERIC,
  teacher_feedback TEXT
);

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_group_date ON attendance(group_id, session_date);

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_group_ids UUID[] DEFAULT '{}',
  attachment_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  target_group_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- JITSI ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jitsi_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_name TEXT NOT NULL,
  room_id TEXT NOT NULL UNIQUE,
  join_url TEXT NOT NULL,
  target_group_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  title TEXT,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- CALENDAR EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('assignment', 'exam', 'jitsi', 'announcement', 'other')),
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- GRADES TABLE (General gradebook)
-- =====================================================
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  grade NUMERIC NOT NULL,
  max_grade NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE jitsi_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is in group
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND student_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Teachers can view all profiles" ON profiles
  FOR SELECT USING (is_teacher());

CREATE POLICY "Students can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Teachers can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- GROUPS policies
CREATE POLICY "Teachers can manage all groups" ON groups
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view groups they belong to" ON groups
  FOR SELECT USING (
    is_group_member(id) OR is_teacher()
  );

-- GROUP MEMBERS policies
CREATE POLICY "Teachers can manage all group members" ON group_members
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view their group memberships" ON group_members
  FOR SELECT USING (student_id = auth.uid() OR is_teacher());

-- INVITATIONS policies
CREATE POLICY "Teachers can manage invitations" ON invitations
  FOR ALL USING (is_teacher());

CREATE POLICY "Public can read invitation by token" ON invitations
  FOR SELECT USING (true);

-- MESSAGES policies
CREATE POLICY "Teachers can manage all messages" ON messages
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view messages in their groups" ON messages
  FOR SELECT USING (is_group_member(group_id) OR is_teacher());

CREATE POLICY "Students can send messages in their groups" ON messages
  FOR INSERT WITH CHECK (is_group_member(group_id));

-- ASSIGNMENTS policies
CREATE POLICY "Teachers can manage all assignments" ON assignments
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view assignments in their groups" ON assignments
  FOR SELECT USING (is_group_member(group_id) OR is_teacher());

-- ASSIGNMENT SUBMISSIONS policies
CREATE POLICY "Teachers can manage all submissions" ON assignment_submissions
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view own submissions" ON assignment_submissions
  FOR SELECT USING (student_id = auth.uid() OR is_teacher());

CREATE POLICY "Students can submit assignments" ON assignment_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- EXAMS policies
CREATE POLICY "Teachers can manage all exams" ON exams
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view published exams in their groups" ON exams
  FOR SELECT USING ((is_group_member(group_id) OR is_teacher()) AND status = 'published');

-- EXAM QUESTIONS policies
CREATE POLICY "Teachers can manage exam questions" ON exam_questions
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view questions of published exams" ON exam_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND status = 'published' AND (is_group_member(group_id) OR is_teacher()))
  );

-- EXAM OPTIONS policies
CREATE POLICY "Teachers can manage exam options" ON exam_options
  FOR ALL USING (is_teacher());

-- ATTENDANCE policies
CREATE POLICY "Teachers can manage attendance" ON attendance
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (student_id = auth.uid() OR is_teacher());

-- ANNOUNCEMENTS policies
CREATE POLICY "Teachers can manage announcements" ON announcements
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view relevant announcements" ON announcements
  FOR SELECT USING (
    is_teacher() OR
    array_length(target_group_ids, 1) IS NULL OR
    EXISTS (SELECT 1 FROM unnest(target_group_ids) AS gid WHERE is_group_member(gid))
  );

-- RESOURCES policies
CREATE POLICY "Teachers can manage resources" ON resources
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view resources for their groups" ON resources
  FOR SELECT USING (
    is_teacher() OR
    array_length(target_group_ids, 1) IS NULL OR
    EXISTS (SELECT 1 FROM unnest(target_group_ids) AS gid WHERE is_group_member(gid))
  );

-- JITSI ROOMS policies
CREATE POLICY "Teachers can manage jitsi rooms" ON jitsi_rooms
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view active rooms for their groups" ON jitsi_rooms
  FOR SELECT USING (
    is_teacher() OR
    (is_active AND EXISTS (SELECT 1 FROM unnest(target_group_ids) AS gid WHERE is_group_member(gid)))
  );

-- CALENDAR EVENTS policies
CREATE POLICY "Teachers can manage calendar events" ON calendar_events
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view events for their groups" ON calendar_events
  FOR SELECT USING (
    is_teacher() OR
    group_id IS NULL OR
    is_group_member(group_id)
  );

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- GRADES policies
CREATE POLICY "Teachers can manage grades" ON grades
  FOR ALL USING (is_teacher());

CREATE POLICY "Students can view own grades" ON grades
  FOR SELECT USING (student_id = auth.uid() OR is_teacher());

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- These should be created via Supabase Dashboard or API:
-- 1. avatars - Public read, authenticated write
-- 2. chat-files - Private, group members can read
-- 3. chat-images - Private, group members can read
-- 4. assignment-submissions - Private, teacher + submitting student
-- 5. resources - Public read for authorized groups

-- =====================================================
-- REALTIME
-- =====================================================
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
