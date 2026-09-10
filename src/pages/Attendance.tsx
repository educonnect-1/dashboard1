import { useState, useEffect } from 'react';
import { attendanceService, groupsService } from '../services';
import { Card, Button, Select, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Group, Attendance as AttendanceType } from '../types';
import { CheckCircle, Calendar, Users } from 'lucide-react';

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (selectedGroup) loadGroupData();
  }, [selectedGroup, selectedDate]);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getAll();
      setGroups(data.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
  };

  const loadGroupData = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const [membersData, attendanceData, historyData] = await Promise.all([
        groupsService.getMembers(selectedGroup),
        attendanceService.getByGroupAndDate(selectedGroup, selectedDate),
        attendanceService.getHistory(selectedGroup),
      ]);
      setMembers(membersData);
      setHistory(historyData);

      const attMap: Record<string, string> = {};
      attendanceData.forEach((a: AttendanceType) => { attMap[a.student_id] = a.status; });
      // Default all to present if no record
      membersData.forEach(m => {
        if (!attMap[m.student_id]) attMap[m.student_id] = 'present';
      });
      setAttendance(attMap);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }));
      await attendanceService.markAttendance(selectedGroup, selectedDate, records);
      const historyData = await attendanceService.getHistory(selectedGroup);
      setHistory(historyData);
      alert('Attendance saved successfully!');
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const setStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const statusColors: Record<string, string> = {
    present: 'bg-green-100 text-green-700 border-green-300',
    absent: 'bg-red-100 text-red-700 border-red-300',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    excused: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Track student attendance</p>
      </div>

      {/* Controls */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Group" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="">Select a group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSave} loading={saving} disabled={!selectedGroup || members.length === 0} className="w-full">
              Save Attendance
            </Button>
          </div>
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16} /> Recent Sessions</h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 10).map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1 rounded-lg text-sm ${date === selectedDate ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {new Date(date).toLocaleDateString()}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance List */}
      {!selectedGroup ? (
        <Card>
          <EmptyState icon={Users} title="Select a group" description="Choose a group and date to mark attendance." />
        </Card>
      ) : loading ? (
        <LoadingSpinner />
      ) : members.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No members" description="This group has no students yet." />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map(member => (
                  <tr key={member.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{member.student?.full_name?.[0] || 'S'}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{member.student?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {['present', 'absent', 'late', 'excused'].map(status => (
                          <button
                            key={status}
                            onClick={() => setStatus(member.student_id, status)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${attendance[member.student_id] === status ? statusColors[status] : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
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
