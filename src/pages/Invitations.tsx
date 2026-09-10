import { useState, useEffect } from 'react';
import { invitationsService, groupsService } from '../services';
import { Card, Button, Input, Select, Modal, Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../components/Layout';
import type { Invitation, Group, InviteStudentForm } from '../types';
import { UserPlus, Mail, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<InviteStudentForm>({ email: '', group_ids: [] });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [invData, grpData] = await Promise.all([
        invitationsService.getAll(),
        groupsService.getAll(),
      ]);
      setInvitations(invData);
      setGroups(grpData.map((g: any) => ({ ...g, member_count: g.member_count?.[0]?.count || 0 })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleInvite = async () => {
    setError('');
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.group_ids.length === 0) { setError('Select at least one group'); return; }
    setSending(true);
    try {
      await invitationsService.send(form);
      setShowInvite(false);
      setForm({ email: '', group_ids: [] });
      loadData();
    } catch (err: any) { setError(err.message || 'Failed to send invitation'); }
    finally { setSending(false); }
  };

  const handleResend = async (id: string) => {
    try { await invitationsService.resend(id); loadData(); }
    catch (err: any) { alert(err.message); }
  };

  const handleCancel = async (id: string) => {
    try { await invitationsService.cancel(id); loadData(); }
    catch (err: any) { alert(err.message); }
  };

  const toggleGroup = (groupId: string) => {
    setForm(prev => ({
      ...prev,
      group_ids: prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'registered': return <Badge variant="success">Registered</Badge>;
      case 'expired': return <Badge variant="danger">Expired</Badge>;
      case 'cancelled': return <Badge variant="default">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-gray-600 mt-1">Invite students to join your platform</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus size={16} className="mr-2" /> Send Invitation
        </Button>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Mail}
            title="No invitations sent"
            description="Send your first invitation to get started."
            action={<Button onClick={() => setShowInvite(true)}><UserPlus size={16} className="mr-2" />Send Invitation</Button>}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Groups</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{inv.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(inv.groups || []).map((g: any, i: number) => (
                          <Badge key={i} variant="info">{g.groups?.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(inv.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleResend(inv.id)} className="p-1 rounded hover:bg-gray-100" title="Resend">
                            <RefreshCw size={14} className="text-gray-500" />
                          </button>
                          <button onClick={() => handleCancel(inv.id)} className="p-1 rounded hover:bg-red-50" title="Cancel">
                            <XCircle size={14} className="text-red-500" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => { setShowInvite(false); setError(''); }} title="Send Invitation" size="lg">
        <div className="space-y-4">
          <Input
            label="Student Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@example.com"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Groups *</label>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500">No groups available. Create a group first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors ${form.group_ids.includes(group.id) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="font-medium">{group.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The student will receive an email with a secure registration link.
              The invitation expires in 7 days. The student must register with the exact email provided.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} loading={sending} disabled={!form.email.trim() || form.group_ids.length === 0}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
