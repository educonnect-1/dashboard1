import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { groupsService, chatService, assignmentsService, examsService, attendanceService } from '../services';
import { Card, Button, Input, Badge, LoadingSpinner, EmptyState } from '../components/Layout';
import type { Group, GroupMember, Message } from '../types';
import { chatService as chat } from '../services';
import { Users, MessageSquare, ClipboardList, FileText, CheckCircle, Send, Paperclip, Pin } from 'lucide-react';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadGroupData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const subscription = chatService.subscribe(id, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });
    return () => { subscription.unsubscribe(); };
  }, [id]);

  const loadGroupData = async () => {
    if (!id) return;
    try {
      const [groupData, membersData, messagesData, pinned] = await Promise.all([
        groupsService.getById(id),
        groupsService.getMembers(id),
        chatService.getMessages(id),
        chatService.getPinnedMessages(id),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setMessages(messagesData);
      setPinnedMessages(pinned);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !id) return;
    setSending(true);
    try {
      await chatService.sendMessage(id, messageInput.trim());
      setMessageInput('');
    } catch (error: any) { alert(error.message); }
    finally { setSending(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setSending(true);
    try {
      await chatService.sendFile(id, file);
    } catch (error: any) { alert(error.message); }
    finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePin = async (messageId: string, isPinned: boolean) => {
    try {
      if (isPinned) await chatService.unpinMessage(messageId);
      else await chatService.pinMessage(messageId);
      const pinned = await chatService.getPinnedMessages(id!);
      setPinnedMessages(pinned);
    } catch (error) { console.error(error); }
  };

  if (loading) return <LoadingSpinner />;
  if (!group) return <EmptyState icon={Users} title="Group not found" />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        {group.description && <p className="text-gray-600 mt-1">{group.description}</p>}
        {group.schedule_info && <p className="text-sm text-gray-500 mt-1">📅 {group.schedule_info}</p>}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center">
            <Users size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-gray-600">Members</p>
          </Card>
          <Card className="text-center">
            <MessageSquare size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{messages.length}</p>
            <p className="text-sm text-gray-600">Messages</p>
          </Card>
        </div>
      )}

      {activeTab === 'chat' && (
        <Card padding={false} className="flex flex-col h-[600px]">
          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && (
            <div className="border-b bg-yellow-50 px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <Pin size={14} />
                <span className="font-medium">{pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.is_pinned ? 'bg-yellow-50 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary-700">{msg.sender?.full_name?.[0] || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{msg.sender?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    {msg.is_pinned && <Pin size={12} className="text-yellow-600" />}
                  </div>
                  {msg.content && <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>}
                  {msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-1">
                      <Paperclip size={14} /> {msg.file_name || 'File'}
                    </a>
                  )}
                  <button onClick={() => handlePin(msg.id, msg.is_pinned)} className="text-xs text-gray-400 hover:text-yellow-600 mt-1">
                    {msg.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-100">
                <Paperclip size={20} className="text-gray-500" />
              </button>
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={handleSendMessage} loading={sending} disabled={!messageInput.trim()} size="sm">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'members' && (
        <Card>
          {members.length === 0 ? (
            <EmptyState icon={Users} title="No members" description="Invite students and add them to this group." />
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">{member.student?.full_name?.[0] || 'S'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.student?.full_name}</p>
                      <p className="text-xs text-gray-500">{member.student?.email}</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
