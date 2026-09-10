import { useState, useEffect } from 'react';
import { gradesService, groupsService } from '../services';
import { Card, Select, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Group, AssignmentSubmission, ExamSubmission } from '../types';
import { BarChart3, Users } from 'lucide-react';

export default function GradesPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentSubmission[]>([]);
  const [examGrades, setExamGrades] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (selectedGroup) loadGrades();
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getAll();
      setGroups(data.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
  };

  const loadGrades = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const [assignGrades, exGrades] = await Promise.all([
        gradesService.getGradebook(selectedGroup),
        gradesService.getExamGrades(selectedGroup),
      ]);
      setAssignmentGrades(assignGrades);
      setExamGrades(exGrades);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  // Group by student
  const studentGrades = assignmentGrades.reduce((acc, sub) => {
    const studentId = sub.student_id;
    if (!acc[studentId]) acc[studentId] = { name: sub.student?.full_name || 'Unknown', assignments: [], exams: [] };
    acc[studentId].assignments.push(sub);
    return acc;
  }, {} as Record<string, { name: string; assignments: AssignmentSubmission[]; exams: ExamSubmission[] }>);

  examGrades.forEach(sub => {
    const studentId = sub.student_id;
    if (!studentGrades[studentId]) studentGrades[studentId] = { name: sub.student?.full_name || 'Unknown', assignments: [], exams: [] };
    studentGrades[studentId].exams.push(sub);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
        <p className="text-gray-600 mt-1">Gradebook overview</p>
      </div>

      <Card>
        <Select label="Filter by Group" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </Card>

      {!selectedGroup ? (
        <Card>
          <EmptyState icon={BarChart3} title="Select a group" description="Choose a group to view grades." />
        </Card>
      ) : loading ? (
        <LoadingSpinner />
      ) : Object.keys(studentGrades).length === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title="No grades yet" description="No graded submissions for this group." />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Assignments</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Assignment</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Exams</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Exam</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(studentGrades).map(([id, data]) => {
                  const assignAvg = data.assignments.filter(a => a.grade != null).length > 0
                    ? (data.assignments.filter(a => a.grade != null).reduce((sum, a) => sum + (a.grade || 0), 0) / data.assignments.filter(a => a.grade != null).length).toFixed(1)
                    : '-';
                  const examAvg = data.exams.filter(e => e.total_grade != null).length > 0
                    ? (data.exams.filter(e => e.total_grade != null).reduce((sum, e) => sum + (e.total_grade || 0), 0) / data.exams.filter(e => e.total_grade != null).length).toFixed(1)
                    : '-';

                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">{data.name[0]}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{data.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{data.assignments.length}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={assignAvg !== '-' ? 'success' : 'default'}>{assignAvg}</Badge></td>
                      <td className="px-4 py-3 text-center text-sm">{data.exams.length}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={examAvg !== '-' ? 'success' : 'default'}>{examAvg}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
