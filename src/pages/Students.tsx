import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsService } from '../services';
import { Card, Input, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Profile } from '../types';
import { Search, GraduationCap, Mail, Phone } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadStudents(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = async () => {
    try {
      const data = await studentsService.getAll(search || undefined);
      setStudents(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading && !search) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-1">Manage and view your students</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Invite students to get started."
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Groups</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/students/${student.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{student.full_name?.[0] || 'S'}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 hover:text-primary-600">{student.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(student.group_members || []).map((gm: any, i: number) => (
                          <Badge key={i} variant="info">{gm.groups?.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={student.is_online ? 'success' : 'default'}>
                        {student.is_online ? 'Online' : 'Offline'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
