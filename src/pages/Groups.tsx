import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupsService } from '../services';
import { Card, Button, Input, Modal, ConfirmDialog, LoadingSpinner, EmptyState, Badge } from '../components/Layout';
import type { Group, CreateGroupForm } from '../types';
import { Plus, Edit2, Trash2, Users, MessageSquare, FolderOpen } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState<CreateGroupForm>({ name: '', description: '', schedule_info: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getAll();
      setGroups(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await groupsService.create(form);
      setShowCreate(false);
      setForm({ name: '', description: '', schedule_info: '' });
      loadGroups();
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;
    setSaving(true);
    try {
      await groupsService.update(editingGroup.id, form);
      setEditingGroup(null);
      setForm({ name: '', description: '', schedule_info: '' });
      loadGroups();
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      await groupsService.delete(deletingGroup.id);
      setDeletingGroup(null);
      loadGroups();
    } catch (error: any) { alert(error.message); }
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setForm({ name: group.name, description: group.description || '', schedule_info: group.schedule_info || '' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Manage your student groups</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="No groups yet"
            description="Create your first group to start organizing students."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Create Group</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: any) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(group)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit2 size={14} className="text-gray-500" /></button>
                  <button onClick={() => setDeletingGroup(group)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>
              <Link to={`/groups/${group.id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-primary-600">{group.name}</h3>
              </Link>
              {group.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users size={14} />{group.member_count?.[0]?.count || 0} students</span>
                <Link to={`/groups/${group.id}?tab=chat`} className="flex items-center gap-1 hover:text-primary-600"><MessageSquare size={14} />Chat</Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Group">
        <div className="space-y-4">
          <Input label="Group Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Grade 10 - Section A" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          <Input label="Schedule Info" value={form.schedule_info} onChange={(e) => setForm({ ...form, schedule_info: e.target.value })} placeholder="e.g., Mon/Wed 3:00 PM" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.name.trim()}>Create Group</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} title="Edit Group">
        <div className="space-y-4">
          <Input label="Group Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Schedule Info" value={form.schedule_info} onChange={(e) => setForm({ ...form, schedule_info: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={saving} disabled={!form.name.trim()}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${deletingGroup?.name}"? This will remove all group memberships.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
