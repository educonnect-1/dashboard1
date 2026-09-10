import { supabase } from '../lib/supabase';
import { getSignedUrl, getChatFileSignedUrl, getResourceSignedUrl, isStoragePath } from '../lib/storage';
import type {
  Group, GroupMember, Invitation, Message, Assignment, AssignmentSubmission,
  Exam, ExamSubmission, Attendance, Announcement, Resource, JitsiRoom,
  CalendarEvent, Notification, Grade, DashboardStats, Profile,
  CreateGroupForm, CreateAssignmentForm, CreateExamForm, CreateAnnouncementForm,
  CreateResourceForm, CreateJitsiRoomForm, InviteStudentForm,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ==================== DASHBOARD ====================
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [studentsRes, groupsRes, invitationsRes, assignmentsRes, examsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('groups').select('id', { count: 'exact', head: true }),
      supabase.from('invitations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('assignments').select('id', { count: 'exact', head: true }).gte('deadline', new Date().toISOString()),
      supabase.from('exams').select('id', { count: 'exact', head: true }).gte('deadline', new Date().toISOString()),
    ]);

    return {
      total_students: studentsRes.count || 0,
      total_groups: groupsRes.count || 0,
      pending_invitations: invitationsRes.count || 0,
      registered_students: studentsRes.count || 0,
      upcoming_assignments: assignmentsRes.count || 0,
      upcoming_exams: examsRes.count || 0,
      recent_submissions: 0,
      today_attendance_rate: 0,
    };
  },

  async getRecentActivity() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  },

  async getRecentSubmissions() {
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url), assignment:assignments!assignment_id(title)')
      .order('submitted_at', { ascending: false })
      .limit(5);
    return data || [];
  },
};

// ==================== GROUPS ====================
export const groupsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('groups')
      .select('*, member_count:group_members(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as (Group & { member_count: { count: number }[] })[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Group;
  },

  async create(form: CreateGroupForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('groups')
      .insert({ ...form, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    return data as Group;
  },

  async update(id: string, form: Partial<CreateGroupForm>) {
    const { data, error } = await supabase
      .from('groups')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Group;
  },

  async delete(id: string) {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
  },

  async getMembers(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, student:profiles!student_id(*)')
      .eq('group_id', groupId);
    if (error) throw error;
    return (data || []) as GroupMember[];
  },

  async addMember(groupId: string, studentId: string) {
    // Verify student exists and has student role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', studentId)
      .single();

    if (profileError || !profile) {
      throw new Error('Student not found');
    }
    if (profile.role !== 'student') {
      throw new Error('Can only add students to groups');
    }

    // Check for duplicate membership
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      throw new Error('Student is already a member of this group');
    }

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, student_id: studentId });
    if (error) throw error;
  },

  async removeMember(groupId: string, studentId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);
    if (error) throw error;
  },
};

// ==================== STUDENTS ====================
export const studentsService = {
  async getAll(search?: string) {
    let query = supabase
      .from('profiles')
      .select('*, group_members(group_id, groups(name))')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as (Profile & { group_members: { group_id: string; groups: { name: string } }[] })[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, group_members(group_id, groups(name))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Profile & { group_members: { group_id: string; groups: { name: string } }[] };
  },

  async getStudentStats(studentId: string) {
    const [assignments, exams, attendance] = await Promise.all([
      supabase.from('assignment_submissions').select('*, assignment:assignments(title)').eq('student_id', studentId),
      supabase.from('exam_submissions').select('*, exam:exams(title)').eq('student_id', studentId),
      supabase.from('attendance').select('*').eq('student_id', studentId),
    ]);
    return {
      assignments: assignments.data || [],
      exams: exams.data || [],
      attendance: attendance.data || [],
    };
  },
};

// ==================== INVITATIONS ====================
export const invitationsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, invitation_groups(group_id, groups(name))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async send(form: InviteStudentForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!form.email.trim()) throw new Error('Email is required');
    if (form.group_ids.length === 0) throw new Error('Select at least one group');

    // Generate cryptographically strong token
    const token = uuidv4() + '-' + uuidv4() + '-' + uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const normalizedEmail = form.email.toLowerCase().trim();

    // Check for existing pending invitation for same email
    const { data: existing } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new Error('A pending invitation already exists for this email. Cancel or resend the existing one.');
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email: normalizedEmail,
        token,
        group_ids: form.group_ids,
        status: 'pending',
        created_by: user.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert into normalized invitation_groups table
    if (form.group_ids.length > 0) {
      const groupRecords = form.group_ids.map(groupId => ({
        invitation_id: invitation.id,
        group_id: groupId,
      }));

      const { error: groupsError } = await supabase
        .from('invitation_groups')
        .insert(groupRecords);

      if (groupsError) {
        console.error('Failed to insert invitation_groups:', groupsError);
        // Continue anyway - invitation is created, groups can be fixed
      }
    }

    // Call edge function to send email - DO NOT silently swallow errors
    const { error: emailError, data: emailResult } = await supabase.functions.invoke('send-invitation-email', {
      body: { invitation_id: invitation.id, email: normalizedEmail, token },
    });

    if (emailError) {
      // Email failed - invitation is saved but email was not sent
      // Teacher can resend from the invitations list
      throw new Error(`Invitation created but email failed to send: ${emailError.message || 'Unknown error'}. You can resend from the invitations list.`);
    }

    if (emailResult && (emailResult as any).error) {
      throw new Error(`Invitation created but email failed: ${(emailResult as any).error}. You can resend from the invitations list.`);
    }

    return invitation;
  },

  async resend(id: string) {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.status === 'registered') throw new Error('Cannot resend - invitation already used');
    if (invitation.status === 'cancelled') throw new Error('Cannot resend - invitation was cancelled');

    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Reset status to pending (in case it was expired) and update expiry
    await supabase
      .from('invitations')
      .update({ expires_at: newExpiry, status: 'pending' })
      .eq('id', id);

    // Call edge function to send email
    const { error: emailError, data: emailResult } = await supabase.functions.invoke('send-invitation-email', {
      body: { invitation_id: id, email: invitation.email, token: invitation.token },
    });

    if (emailError) {
      throw new Error(`Email resend failed: ${emailError.message || 'Unknown error'}`);
    }

    if (emailResult && (emailResult as any).error) {
      throw new Error(`Email resend failed: ${(emailResult as any).error}`);
    }
  },

  async cancel(id: string) {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== CHAT ====================
export const chatService = {
  async getMessages(groupId: string, limit = 50, before?: string) {
    let query = supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url, role)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data || []) as Message[];

    // Generate signed URLs for any files that use storage paths
    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.file_url && isStoragePath(msg.file_url)) {
          const signedUrl = await getChatFileSignedUrl(msg.file_url);
          return { ...msg, file_url: signedUrl || msg.file_url };
        }
        return msg;
      })
    );

    return messagesWithUrls.reverse();
  },

  async sendMessage(groupId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({ group_id: groupId, sender_id: user.id, content })
      .select('*, sender:profiles!sender_id(full_name, avatar_url, role)')
      .single();
    if (error) throw error;
    return data as Message;
  },

  async sendFile(groupId: string, file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    const ext = file.name.split('.').pop();
    const path = `${groupId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(path, file);
    if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

    // Store the STORAGE PATH (not a public URL) in the database
    // The path will be resolved to a signed URL when displaying
    const { data, error } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        file_url: path, // Store path, not public URL
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      })
      .select('*, sender:profiles!sender_id(full_name, avatar_url, role)')
      .single();
    if (error) throw error;

    // Generate signed URL for the response
    const signedUrl = await getChatFileSignedUrl(path);
    const message = data as Message;
    if (signedUrl) {
      message.file_url = signedUrl;
    }

    return message;
  },

  async pinMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: true })
      .eq('id', messageId);
    if (error) throw error;
  },

  async unpinMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: false })
      .eq('id', messageId);
    if (error) throw error;
  },

  async getPinnedMessages(groupId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url, role)')
      .eq('group_id', groupId)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const messages = (data || []) as Message[];

    // Generate signed URLs for files
    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.file_url && isStoragePath(msg.file_url)) {
          const signedUrl = await getChatFileSignedUrl(msg.file_url);
          return { ...msg, file_url: signedUrl || msg.file_url };
        }
        return msg;
      })
    );

    return messagesWithUrls;
  },

  subscribe(groupId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      }, async (payload) => {
        const newMessage = payload.new as Message;
        // Generate signed URL for file if needed
        if (newMessage.file_url && isStoragePath(newMessage.file_url)) {
          const signedUrl = await getChatFileSignedUrl(newMessage.file_url);
          if (signedUrl) {
            newMessage.file_url = signedUrl;
          }
        }
        callback(newMessage);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};

// ==================== ASSIGNMENTS ====================
export const assignmentsService = {
  async getAll(groupId?: string) {
    let query = supabase
      .from('assignments')
      .select('*, group:groups(name)')
      .order('created_at', { ascending: false });

    if (groupId) query = query.eq('group_id', groupId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Assignment[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, group:groups(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Assignment;
  },

  async create(form: CreateAssignmentForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assignments')
      .insert({ ...form, created_by: user.id, status: 'published' })
      .select()
      .single();
    if (error) throw error;

    // Create calendar event
    await supabase.from('calendar_events').insert({
      title: form.title,
      description: form.description,
      event_type: 'assignment',
      event_date: form.deadline,
      group_id: form.group_id,
      reference_id: data.id,
    });

    return data as Assignment;
  },

  async update(id: string, form: Partial<CreateAssignmentForm>) {
    const { data, error } = await supabase
      .from('assignments')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Assignment;
  },

  async delete(id: string) {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
  },

  async getSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data || []) as AssignmentSubmission[];
  },

  async gradeSubmission(submissionId: string, grade: number, comment: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({ grade, teacher_comment: comment, status: 'graded' })
      .eq('id', submissionId)
      .select()
      .single();
    if (error) throw error;
    return data as AssignmentSubmission;
  },
};

// ==================== EXAMS ====================
export const examsService = {
  async getAll(groupId?: string) {
    let query = supabase
      .from('exams')
      .select('*, group:groups(name)')
      .order('created_at', { ascending: false });

    if (groupId) query = query.eq('group_id', groupId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Exam[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('*, group:groups(name), exam_questions(*, exam_options(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Exam;
  },

  async create(form: CreateExamForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title: form.title,
        description: form.description,
        group_id: form.group_id,
        deadline: form.deadline,
        start_time: form.start_time,
        total_points: form.total_points,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;

    // Insert questions
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      const { data: question } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: exam.id,
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: i,
        })
        .select()
        .single();

      if (q.options && question) {
        for (let j = 0; j < q.options.length; j++) {
          await supabase.from('exam_options').insert({
            question_id: question.id,
            option_text: q.options[j].option_text,
            is_correct: q.options[j].is_correct,
            order_index: j,
          });
        }
      }
    }

    return exam as Exam;
  },

  async publish(id: string) {
    const { data, error } = await supabase
      .from('exams')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Exam;
  },

  async getSubmissions(examId: string) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url)')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ExamSubmission[];
  },

  async gradeSubmission(submissionId: string, totalGrade: number) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .update({ total_grade: totalGrade, status: 'graded' })
      .eq('id', submissionId)
      .select()
      .single();
    if (error) throw error;
    return data as ExamSubmission;
  },
};

// ==================== ATTENDANCE ====================
export const attendanceService = {
  async getByGroupAndDate(groupId: string, date: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, student:profiles!student_id(full_name, avatar_url)')
      .eq('group_id', groupId)
      .eq('session_date', date);
    if (error) throw error;
    return (data || []) as Attendance[];
  },

  async markAttendance(groupId: string, date: string, records: { student_id: string; status: string }[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete existing records for this date
    await supabase
      .from('attendance')
      .delete()
      .eq('group_id', groupId)
      .eq('session_date', date);

    // Insert new records
    const toInsert = records.map(r => ({
      group_id: groupId,
      student_id: r.student_id,
      session_date: date,
      status: r.status,
      marked_by: user.id,
    }));

    const { error } = await supabase.from('attendance').insert(toInsert);
    if (error) throw error;
  },

  async getHistory(groupId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('session_date')
      .eq('group_id', groupId)
      .order('session_date', { ascending: false });
    if (error) throw error;
    const dates = [...new Set((data || []).map(d => d.session_date))];
    return dates;
  },

  async getSummary(groupId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('group_id', groupId);
    if (error) throw error;

    const summary: Record<string, { present: number; absent: number; total: number }> = {};
    (data || []).forEach(record => {
      if (!summary[record.student_id]) {
        summary[record.student_id] = { present: 0, absent: 0, total: 0 };
      }
      summary[record.student_id].total++;
      if (record.status === 'present') summary[record.student_id].present++;
      else summary[record.student_id].absent++;
    });
    return summary;
  },
};

// ==================== ANNOUNCEMENTS ====================
export const announcementsService = {
  async getAll(groupId?: string) {
    let query = supabase
      .from('announcements')
      .select('*, creator:profiles!created_by(full_name)')
      .order('created_at', { ascending: false });

    if (groupId) query = query.contains('target_group_ids', [groupId]);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Announcement[];
  },

  async create(form: CreateAnnouncementForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('announcements')
      .insert({ ...form, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    return data as Announcement;
  },

  async delete(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== RESOURCES ====================
export const resourcesService = {
  async getAll(groupId?: string) {
    let query = supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupId) query = query.contains('target_group_ids', [groupId]);

    const { data, error } = await query;
    if (error) throw error;

    // Resolve signed URLs for file paths
    const resources = (data || []) as Resource[];
    const resolvedResources = await Promise.all(
      resources.map(async (resource) => {
        if (resource.file_url && isStoragePath(resource.file_url)) {
          const signedUrl = await getResourceSignedUrl(resource.file_url);
          return { ...resource, file_url: signedUrl || resource.file_url };
        }
        return resource;
      })
    );

    return resolvedResources;
  },

  async upload(form: CreateResourceForm, file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size must be less than 50MB');
    }

    const ext = file.name.split('.').pop();
    const path = `${uuidv4()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(path, file);
    if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

    // Store the STORAGE PATH (not a public URL) in the database
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: form.title,
        description: form.description,
        category: form.category,
        file_url: path, // Store path, not public URL
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        target_group_ids: form.target_group_ids,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;

    // Generate signed URL for the response
    const signedUrl = await getResourceSignedUrl(path);
    const resource = data as Resource;
    if (signedUrl) {
      resource.file_url = signedUrl;
    }

    return resource;
  },

  async delete(id: string) {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== JITSI ROOMS ====================
export const jitsiService = {
  async getAll() {
    const { data, error } = await supabase
      .from('jitsi_rooms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as JitsiRoom[];
  },

  async create(form: CreateJitsiRoomForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (form.target_group_ids.length === 0) {
      throw new Error('Select at least one group');
    }

    const roomId = uuidv4();
    const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
    const joinUrl = `https://${domain}/${roomId}`;

    const { data, error } = await supabase
      .from('jitsi_rooms')
      .insert({
        room_name: form.title || `Meeting ${new Date().toLocaleDateString()}`,
        room_id: roomId,
        join_url: joinUrl,
        target_group_ids: form.target_group_ids,
        created_by: user.id,
        scheduled_at: form.scheduled_at,
        title: form.title,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;

    // Create calendar event
    await supabase.from('calendar_events').insert({
      title: data.title || data.room_name,
      event_type: 'jitsi',
      event_date: data.scheduled_at || data.created_at,
      reference_id: data.id,
    });

    return data as JitsiRoom;
  },

  async closeRoom(id: string) {
    const { error } = await supabase
      .from('jitsi_rooms')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationsService = {
  async getTeacherNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []) as Notification[];
  },

  async markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  },

  async getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    return count || 0;
  },
};

// ==================== GRADES ====================
export const gradesService = {
  async getGradebook(groupId?: string) {
    let query = supabase
      .from('assignment_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url), assignment:assignments(title, group_id, deadline)')
      .order('submitted_at', { ascending: false });

    if (groupId) {
      query = supabase
        .from('assignment_submissions')
        .select('*, student:profiles!student_id(full_name, avatar_url), assignment:assignments!inner(title, group_id, deadline)')
        .eq('assignment.group_id', groupId)
        .order('submitted_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AssignmentSubmission[];
  },

  async getExamGrades(groupId?: string) {
    let query = supabase
      .from('exam_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url), exam:exams(title, group_id, total_points)');

    if (groupId) {
      query = supabase
        .from('exam_submissions')
        .select('*, student:profiles!student_id(full_name, avatar_url), exam:exams!inner(title, group_id, total_points)')
        .eq('exam.group_id', groupId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExamSubmission[];
  },
};

// ==================== CALENDAR ====================
export const calendarService = {
  async getEvents(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, group:groups(name)')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });
    if (error) throw error;
    return (data || []) as CalendarEvent[];
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data as CalendarEvent;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== SEARCH ====================
export const searchService = {
  async search(query: string) {
    const [students, groups, assignments, exams, resources, announcements] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('role', 'student').ilike('full_name', `%${query}%`).limit(5),
      supabase.from('groups').select('id, name').ilike('name', `%${query}%`).limit(5),
      supabase.from('assignments').select('id, title').ilike('title', `%${query}%`).limit(5),
      supabase.from('exams').select('id, title').ilike('title', `%${query}%`).limit(5),
      supabase.from('resources').select('id, title').ilike('title', `%${query}%`).limit(5),
      supabase.from('announcements').select('id, title').ilike('title', `%${query}%`).limit(5),
    ]);

    return {
      students: students.data || [],
      groups: groups.data || [],
      assignments: assignments.data || [],
      exams: exams.data || [],
      resources: resources.data || [],
      announcements: announcements.data || [],
    };
  },
};

// ==================== PROFILE ====================
export const profileService = {
  async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Avatar file size must be less than 5MB');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const ext = file.name.split('.').pop();
    const path = `${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

    // Avatars bucket is public, so getPublicUrl is appropriate here
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await profileService.updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};
