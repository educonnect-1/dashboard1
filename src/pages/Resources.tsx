import { useState, useEffect, useRef } from 'react';
import { resourcesService, groupsService } from '../services';
import { Card, Button, Input, Textarea, Select, Modal, Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../components/Layout';
import type { Resource, Group, CreateResourceForm } from '../types';
import { Plus, Library, Upload, Trash2, Download, FileText } from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<CreateResourceForm>({ title: '', description: '', category: '', target_group_ids: [] });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [resData, grpData] = await Promise.all([
        resourcesService.getAll(),
        groupsService.getAll(),
      ]);
      setResources(resData);
      setGroups(grpData.map((g: any) => ({ ...g })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!form.title.trim() || !file) return;
    setUploading(true);
    try {
      await resourcesService.upload(form, file);
      setShowUpload(false);
      setForm({ title: '', description: '', category: '', target_group_ids: [] });
      setFile(null);
      loadData();
    } catch (error: any) { alert(error.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { await resourcesService.delete(deleting); setDeleting(null); loadData(); }
    catch (error: any) { alert(error.message); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-1">Educational resources library</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload size={16} className="mr-2" /> Upload Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <Card>
          <EmptyState icon={Library} title="No resources" description="Upload educational resources for your students." action={<Button onClick={() => setShowUpload(true)}><Upload size={16} className="mr-2" />Upload</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <Card key={resource.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <button onClick={() => setDeleting(resource.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
              </div>
              <h3 className="font-semibold text-gray-900">{resource.title}</h3>
              {resource.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{resource.description}</p>}
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <span>{resource.category}</span>
                <span>{formatFileSize(resource.file_size)}</span>
              </div>
              <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
                <Download size={14} /> Download
              </a>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Resource">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resource title" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={2} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., Mathematics, Science" />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Target Groups</label>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setForm(prev => ({ ...prev, target_group_ids: prev.target_group_ids.includes(g.id) ? prev.target_group_ids.filter(id => id !== g.id) : [...prev.target_group_ids, g.id] }))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.target_group_ids.includes(g.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">File *</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  <button onClick={() => setFile(null)} className="text-sm text-red-600 mt-2">Remove</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-600 hover:text-primary-700">
                  <Upload size={24} className="mx-auto mb-2" />
                  Click to select file
                </button>
              )}
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!form.title.trim() || !file}>Upload</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete Resource" message="Are you sure you want to delete this resource?" confirmText="Delete" danger />
    </div>
  );
}
