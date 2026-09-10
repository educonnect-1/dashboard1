import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services';
import { Card, LoadingSpinner, Badge } from '../components/Layout';
import type { DashboardStats } from '../types';
import {
  Users, FolderOpen, UserPlus, ClipboardList, FileText,
  CheckCircle, TrendingUp, Calendar, ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, submissions] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentSubmissions(),
      ]);
      setStats(statsData);
      setRecentSubmissions(submissions);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = stats ? [
    { label: 'Total Students', value: stats.total_students, icon: Users, color: 'bg-blue-500', link: '/students' },
    { label: 'Total Groups', value: stats.total_groups, icon: FolderOpen, color: 'bg-purple-500', link: '/groups' },
    { label: 'Pending Invitations', value: stats.pending_invitations, icon: UserPlus, color: 'bg-orange-500', link: '/invitations' },
    { label: 'Upcoming Assignments', value: stats.upcoming_assignments, icon: ClipboardList, color: 'bg-green-500', link: '/assignments' },
    { label: 'Upcoming Exams', value: stats.upcoming_exams, icon: FileText, color: 'bg-red-500', link: '/exams' },
    { label: 'Recent Submissions', value: recentSubmissions.length, icon: CheckCircle, color: 'bg-teal-500', link: '/assignments' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, الأستاذ مروان</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <Link to="/assignments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No recent submissions</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {sub.student?.full_name?.[0] || 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sub.student?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{sub.assignment?.title}</p>
                  </div>
                  <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>
                    {sub.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/invitations" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <UserPlus size={24} className="mx-auto text-primary-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Invite Student</p>
            </Link>
            <Link to="/assignments" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <ClipboardList size={24} className="mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">New Assignment</p>
            </Link>
            <Link to="/exams" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <FileText size={24} className="mx-auto text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Exam</p>
            </Link>
            <Link to="/jitsi" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <Calendar size={24} className="mx-auto text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Start Session</p>
            </Link>
            <Link to="/announcements" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <TrendingUp size={24} className="mx-auto text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Announcement</p>
            </Link>
            <Link to="/attendance" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
              <CheckCircle size={24} className="mx-auto text-teal-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Attendance</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
