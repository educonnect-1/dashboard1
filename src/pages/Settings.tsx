import { useState, useRef } from 'react';
import { useAuthStore } from '../hooks/useAuth';
import { profileService } from '../services';
import { Card, Button, Input } from '../components/Layout';
import { User, Mail, Camera, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshProfile } = useAuthStore();
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await profileService.updateProfile({ full_name: name, phone });
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) { setError(err.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setChangingPassword(true);
    setError('');
    setMessage('');
    try {
      await profileService.changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) { setError(err.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
    try {
      await profileService.uploadAvatar(file);
      await refreshProfile();
      setMessage('Avatar updated!');
    } catch (err: any) { setError(err.message || 'Failed to upload avatar'); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account</p>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><User size={18} /> Profile</h2>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary-700">{user?.full_name?.[0] || 'M'}</span>
              )}
            </div>
            <div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                <Camera size={14} className="mr-1" /> Change Avatar
              </Button>
              <p className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG.</p>
            </div>
          </div>

          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={user?.email || ''} disabled className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          <Button onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
        </div>
      </Card>

      {/* Password */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} /> Change Password</h2>
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button onClick={handleChangePassword} loading={changingPassword} disabled={!currentPassword || !newPassword || !confirmPassword}>
            Update Password
          </Button>
        </div>
      </Card>

      {/* Account Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Role</span>
            <span className="font-medium">Teacher / Admin</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Account Created</span>
            <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Teacher</span>
            <span className="font-medium">الأستاذ مروان الجنيدي</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
