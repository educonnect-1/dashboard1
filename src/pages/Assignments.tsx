import { useState, useEffect } from 'react';
import { assignmentsService, groupsService } from '../services';
import { Card, Button, Input, Textarea, Select, Modal, Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../components/Layout';
import type { Assignment, Group, CreateAssignmentForm, AssignmentSubmission } from '../types';
import { Plus, ClipboardList, Eye, Trash2, Edit2, Image, Star } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [form, setForm] = useState<CreateAssignmentForm>({ title: '', description: '', group_id: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [assignData, grpData] = await Promise.all([
        assignmentsService.getAll(),
        groupsService.getAll(),
      ]);
      setAssignments(assignData);
      setGroups(grpData.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.group_id || !form.deadline) return;
    setSaving(true);
    try {
      await assignmentsService.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', group_id: '', deadline: '' });
      loadData();
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await assignmentsService.delete(id); loadData(); }
    catch (error: any) { alert(error.message); }
  };

  const viewSubmissions = async (assignment: Assignment) => {
    setViewingAssignment(assignment);
    try {
      const subs = await assignmentsService.getSubmissions(assignment.id);
      setSubmissions(subs);
    } catch (error) { console.error(error); }
  };

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    try {
      await assignmentsService.gradeSubmission(gradingSubmission.id, parseFloat(grade), comment);
      setGradingSubmission(null);
      setGrade('');
      setComment('');
      if (viewingAssignment) {
        const subs = await assignmentsService.getSubmissions(viewingAssignment.id);
        setSubmissions(subs);
      }
    } catch (error: any) { alert(error.message); }
  };

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Create and manage assignments</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No assignments"
            description="Create your first assignment for students."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Create Assignment</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(assignment => (
            <Card key={assignment.id}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant={isDeadlinePassed(assignment.deadline) ? 'danger' : 'success'}>
                  {isDeadlinePassed(assignment.deadline) ? 'Closed' : 'Active'}
                </Badge>
                <div className="flex gap-1">
                  <button onClick={() => viewSubmissions(assignment)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye size={14} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(assignment.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
              {assignment.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.description}</p>}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>{(assignment as any).group?.name}</span>
                <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Assignment">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instructions for students" rows={3} />
          <Select label="Group *" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
            <option value="">Select a group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Input label="Deadline *" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.title.trim() || !form.group_id || !form.deadline}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={!!viewingAssignment} onClose={() => setViewingAssignment(null)} title={`Submissions: ${viewingAssignment?.title || ''}`} size="xl">
        {submissions.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No submissions yet" description="Students haven't submitted their work." />
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">{sub.student?.full_name?.[0] || 'S'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sub.student?.full_name}</p>
                      <p className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.grade !== null && sub.grade !== undefined && (
                      <Badge variant="success">{sub.grade}/{sub.max_grade}</Badge>
                    )}
                    <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>{sub.status}</Badge>
                  </div>
                </div>
                {/* Submission Images */}
                {sub.image_urls && sub.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sub.image_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Submission ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border hover:opacity-80" />
                      </a>
                    ))}
                  </div>
                )}
                {sub.teacher_comment && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">💬 {sub.teacher_comment}</p>
                )}
                <div className="mt-3">
                  {sub.status !== 'graded' ? (
                    <Button size="sm" onClick={() => { setGradingSubmission(sub); setGrade(''); setComment(''); }}>
                      <Star size={14} className="mr-1" /> Grade
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setGradingSubmission(sub); setGrade(sub.grade?.toString() || ''); setComment(sub.teacher_comment || ''); }}>
                      Edit Grade
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={!!gradingSubmission} onClose={() => setGradingSubmission(null)} title="Grade Submission">
        <div className="space-y-4">
          <Input label="Grade" type="number" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Enter grade" />
          <Textarea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Feedback for student" rows={3} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setGradingSubmission(null)}>Cancel</Button>
            <Button onClick={handleGrade} disabled={!grade}>Save Grade</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
