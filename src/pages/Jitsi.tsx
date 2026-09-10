import { useState, useEffect } from 'react';
import { jitsiService, groupsService } from '../services';
import { Card, Button, Input, Select, Modal, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { JitsiRoom, Group, CreateJitsiRoomForm } from '../types';
import { Plus, Video, ExternalLink, XCircle } from 'lucide-react';
import { JITSI_DOMAIN } from '../lib/supabase';

export default function JitsiPage() {
  const [rooms, setRooms] = useState<JitsiRoom[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateJitsiRoomForm>({ title: '', target_group_ids: [], scheduled_at: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [roomData, grpData] = await Promise.all([
        jitsiService.getAll(),
        groupsService.getAll(),
      ]);
      setRooms(roomData);
      setGroups(grpData.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (form.target_group_ids.length === 0) return;
    setCreating(true);
    try {
      await jitsiService.create(form);
      setShowCreate(false);
      setForm({ title: '', target_group_ids: [], scheduled_at: '' });
      loadData();
    } catch (error: any) { alert(error.message); }
    finally { setCreating(false); }
  };

  const handleCloseRoom = async (id: string) => {
    try { await jitsiService.closeRoom(id); loadData(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600 mt-1">Create and manage Jitsi meeting rooms</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> Create Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <EmptyState icon={Video} title="No sessions" description="Create a live session for your students." action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Create Room</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map(room => (
            <Card key={room.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video size={20} className="text-purple-600" />
                </div>
                <Badge variant={room.is_active ? 'success' : 'default'}>{room.is_active ? 'Active' : 'Closed'}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{room.title || room.room_name}</h3>
              {room.scheduled_at && (
                <p className="text-sm text-gray-500 mt-1">Scheduled: {new Date(room.scheduled_at).toLocaleString()}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <a href={room.join_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                  <ExternalLink size={14} /> Join Room
                </a>
                {room.is_active && (
                  <button onClick={() => handleCloseRoom(room.id)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                    <XCircle size={14} /> Close
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Live Session">
        <div className="space-y-4">
          <Input label="Session Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Math Review Session" />
          <Input label="Scheduled Time" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Groups *</label>
            <div className="grid grid-cols-2 gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors ${form.target_group_ids.includes(g.id) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              A Jitsi Meet room will be created and a notification will be sent to students in the selected groups.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={form.target_group_ids.length === 0}>Create Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
