import { useState, useEffect } from 'react';
import { announcementsService, groupsService } from '../services';
import { Card, Button, Input, Textarea, Modal, Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../components/Layout';
import type { Announcement, Group, CreateAnnouncementForm } from '../types';
import { Plus, Megaphone, Trash2 } from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAnnouncementForm>({ title: '', content: '', target_group_ids: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [annData, grpData] = await Promise.all([
        announcementsService.getAll(),
        groupsService.getAll(),
      ]);
      setAnnouncements(annData);
      setGroups(grpData.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await announcementsService.create(form);
      setShowCreate(false);
      setForm({ title: '', content: '', target_group_ids: [] });
      loadData();
    } catch (error: any) { alert(error.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { await announcementsService.delete(deleting); setDeleting(null); loadData(); }
    catch (error: any) { alert(error.message); }
  };

  const toggleGroup = (groupId: string) => {
    setForm(prev => ({
      ...prev,
      target_group_ids: prev.target_group_ids.includes(groupId)
        ? prev.target_group_ids.filter(id => id !== groupId)
        : [...prev.target_group_ids, groupId]
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Send announcements to students</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <EmptyState icon={Megaphone} title="No announcements" description="Create your first announcement." action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Create</Button>} />
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <Card key={ann.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{ann.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-500">{new Date(ann.created_at).toLocaleString()}</span>
                    {(ann as any).creator && <span className="text-xs text-gray-500">by {(ann as any).creator.full_name}</span>}
                  </div>
                </div>
                <button onClick={() => setDeleting(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Announcement" size="lg">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
          <Textarea label="Content *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Announcement content..." rows={5} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Target Groups</label>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.target_group_ids.includes(g.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && <p className="text-sm text-gray-500">No groups available</p>}
            </div>
            <p className="text-xs text-gray-500">Leave empty to send to all students</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.title.trim() || !form.content.trim()}>Publish</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete Announcement" message="Are you sure you want to delete this announcement?" confirmText="Delete" danger />
    </div>
  );
}
