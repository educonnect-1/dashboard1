import { useState, useEffect } from 'react';
import { examsService, groupsService } from '../services';
import { Card, Button, Input, Textarea, Select, Modal, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Exam, Group, CreateExamForm, CreateQuestionForm, ExamSubmission } from '../types';
import { Plus, FileText, Eye, Trash2, Send } from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [form, setForm] = useState<CreateExamForm>({
    title: '', description: '', group_id: '', deadline: '', start_time: '', total_points: 100,
    questions: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [examData, grpData] = await Promise.all([
        examsService.getAll(),
        groupsService.getAll(),
      ]);
      setExams(examData);
      setGroups(grpData.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, {
        question_text: '', question_type: 'multiple_choice',
        options: [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }],
        points: 10
      }]
    });
  };

  const updateQuestion = (index: number, updates: Partial<CreateQuestionForm>) => {
    const questions = [...form.questions];
    questions[index] = { ...questions[index], ...updates };
    setForm({ ...form, questions });
  };

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.group_id || !form.deadline || form.questions.length === 0) return;
    setSaving(true);
    try {
      await examsService.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', group_id: '', deadline: '', start_time: '', total_points: 100, questions: [] });
      loadData();
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async (id: string) => {
    try { await examsService.publish(id); loadData(); }
    catch (error: any) { alert(error.message); }
  };

  const viewSubmissions = async (exam: Exam) => {
    setViewingExam(exam);
    try {
      const subs = await examsService.getSubmissions(exam.id);
      setSubmissions(subs);
    } catch (error) { console.error(error); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-600 mt-1">Create and manage exams</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No exams" description="Create your first exam." action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Create Exam</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <Card key={exam.id}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant={exam.status === 'published' ? 'success' : exam.status === 'draft' ? 'warning' : 'default'}>
                  {exam.status}
                </Badge>
                <div className="flex gap-1">
                  <button onClick={() => viewSubmissions(exam)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye size={14} className="text-gray-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{exam.title}</h3>
              {exam.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{exam.description}</p>}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>{(exam as any).group?.name}</span>
                <span>{exam.total_points} pts</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>Due: {new Date(exam.deadline).toLocaleDateString()}</span>
                {exam.status === 'draft' && (
                  <Button size="sm" onClick={() => handlePublish(exam.id)}>
                    <Send size={12} className="mr-1" /> Publish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Exam" size="xl">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Group *" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
              <option value="">Select group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <Input label="Total Points" type="number" value={form.total_points} onChange={(e) => setForm({ ...form, total_points: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Deadline *" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>

          {/* Questions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Questions ({form.questions.length})</h3>
              <Button size="sm" variant="outline" onClick={addQuestion}><Plus size={14} className="mr-1" /> Add Question</Button>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {form.questions.map((q, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Q{i + 1}</span>
                    <button onClick={() => removeQuestion(i)} className="text-red-500 text-sm">Remove</button>
                  </div>
                  <Input value={q.question_text} onChange={(e) => updateQuestion(i, { question_text: e.target.value })} placeholder="Question text" className="mb-2" />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Select value={q.question_type} onChange={(e) => updateQuestion(i, { question_type: e.target.value as any })}>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="long_answer">Long Answer</option>
                    </Select>
                    <Input type="number" value={q.points} onChange={(e) => updateQuestion(i, { points: parseInt(e.target.value) || 0 })} placeholder="Points" />
                  </div>
                  {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && q.options && (
                    <div className="space-y-1">
                      {q.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input type="radio" name={`q${i}-correct`} checked={opt.is_correct} onChange={() => {
                            const opts = [...(q.options || [])];
                            opts.forEach((o, k) => o.is_correct = k === j);
                            updateQuestion(i, { options: opts });
                          }} />
                          <input value={opt.option_text} onChange={(e) => {
                            const opts = [...(q.options || [])];
                            opts[j] = { ...opts[j], option_text: e.target.value };
                            updateQuestion(i, { options: opts });
                          }} placeholder={`Option ${j + 1}`} className="flex-1 px-2 py-1 border rounded text-sm" />
                        </div>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'short_answer' && (
                    <Input value={q.correct_answer || ''} onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })} placeholder="Correct answer" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.title.trim() || !form.group_id || !form.deadline || form.questions.length === 0}>
              Create Exam (Draft)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={!!viewingExam} onClose={() => setViewingExam(null)} title={`Submissions: ${viewingExam?.title || ''}`} size="lg">
        {submissions.length === 0 ? (
          <EmptyState icon={FileText} title="No submissions yet" />
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">{sub.student?.full_name?.[0] || 'S'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sub.student?.full_name}</p>
                    <p className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.total_grade !== null && sub.total_grade !== undefined && (
                    <Badge variant="success">{sub.total_grade}/{viewingExam?.total_points}</Badge>
                  )}
                  <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>{sub.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
