import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentsService } from '../services';
import { Card, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Profile } from '../types';
import { Mail, Phone, Users, Calendar, BookOpen, ClipboardList, FileText, CheckCircle } from 'lucide-react';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  const loadStudent = async () => {
    if (!id) return;
    try {
      const [studentData, statsData] = await Promise.all([
        studentsService.getById(id),
        studentsService.getStudentStats(id),
      ]);
      setStudent(studentData);
      setStats(statsData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!student) return <EmptyState icon={Users} title="Student not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/students" className="text-sm text-primary-600 hover:text-primary-700">← Back to Students</Link>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700">{student.full_name?.[0] || 'S'}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Mail size={14} />{student.email}</span>
              {student.phone && <span className="flex items-center gap-1"><Phone size={14} />{student.phone}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={student.is_online ? 'success' : 'default'}>
                {student.is_online ? 'Online' : 'Offline'}
              </Badge>
              {student.last_seen && (
                <span className="text-xs text-gray-500">Last seen: {new Date(student.last_seen).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Groups */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users size={18} /> Groups
        </h2>
        {(student.group_members || []).length === 0 ? (
          <p className="text-sm text-gray-500">Not assigned to any groups</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {student.group_members.map((gm: any, i: number) => (
              <Link key={i} to={`/groups/${gm.group_id}`} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100">
                {gm.groups?.name}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <ClipboardList size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.assignments.length}</p>
            <p className="text-sm text-gray-600">Assignment Submissions</p>
          </Card>
          <Card className="text-center">
            <FileText size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.exams.length}</p>
            <p className="text-sm text-gray-600">Exam Submissions</p>
          </Card>
          <Card className="text-center">
            <CheckCircle size={24} className="mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{stats.attendance.length}</p>
            <p className="text-sm text-gray-600">Attendance Records</p>
          </Card>
        </div>
      )}

      {/* Assignment History */}
      {stats && stats.assignments.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Assignment History</h2>
          <div className="space-y-2">
            {stats.assignments.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sub.assignment?.title}</p>
                  <p className="text-xs text-gray-500">Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sub.grade !== null && sub.grade !== undefined && (
                    <Badge variant="success">{sub.grade}/{sub.max_grade}</Badge>
                  )}
                  <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>{sub.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance Summary */}
      {stats && stats.attendance.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Attendance Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.attendance.filter((a: any) => a.status === 'present').length}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.attendance.filter((a: any) => a.status === 'absent').length}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.attendance.filter((a: any) => a.status === 'late').length}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
