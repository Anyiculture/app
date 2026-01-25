import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { messagingService, Conversation, Message, Attachment, Meeting } from '../services/messagingService';
import { adminService } from '../services/adminService';
import { Send, MessageSquare, ArrowLeft, Search, Paperclip, Calendar, X, FileText, Check, Clock, ShieldCheck, Video, MapPin, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { presenceService, UserPresence } from '../services/presenceService';

export function MessagingPage({ embedded = false }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Attachments & Scheduling
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);
  const [scheduleData, setScheduleData] = useState({
    title: '',
    date: '',
    time: '',
    platform: 'Zoom',
    location: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  
  // Presence tracking
  const [otherUserPresence, setOtherUserPresence] = useState<UserPresence | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  // Initial Load
  useEffect(() => {
    mountedRef.current = true;
    if (user) {
      loadConversations();
      checkAdminStatus();
      // Initialize presence tracking
      presenceService.initialize();
    } else {
      setLoading(false);
    }
    return () => { 
      mountedRef.current = false;
      presenceService.cleanup();
    };
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await adminService.checkIsAdmin();
      if (mountedRef.current) setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  // URL Sync
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      setShowMobileChat(true);
    }
  }, [searchParams]);

  // Messages Subscription
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    loadMessages(selectedConversationId);
    
    // Optimistic update subscription
    const subscription = messagingService.subscribeToMessages(selectedConversationId, (newMsg) => {
      if (!mountedRef.current) return;
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        messagingService.markMessagesAsRead(selectedConversationId);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [selectedConversationId, user]);

  // Get selected conversation
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Presence Subscription
  useEffect(() => {
    if (!selectedConversation || !user) return;
    
    const otherUserId = selectedConversation.other_user.id;
    
    // Load initial presence
    presenceService.getUserPresence(otherUserId).then((presence) => {
      if (mountedRef.current && presence) {
        setOtherUserPresence(presence);
      }
    });
    
    // Subscribe to presence changes
    const subscription = presenceService.subscribeToPresence(otherUserId, (presence) => {
      if (mountedRef.current) {
        setOtherUserPresence(presence);
      }
    });
    
    return () => { subscription.unsubscribe(); };
  }, [selectedConversation, user]);

  // Sidebar Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments]);

  // Filtering
  useEffect(() => {
    let filtered = conversations;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(conv => conv.context_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.other_user.full_name?.toLowerCase().includes(query) ||
        conv.other_user.email.toLowerCase().includes(query) ||
        conv.related_item_title?.toLowerCase().includes(query) ||
        conv.last_message?.content.toLowerCase().includes(query)
      );
    }
    setFilteredConversations(filtered);
  }, [searchQuery, conversations, activeFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      if (mountedRef.current) {
        setConversations(data);
        setFilteredConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      if (!id || id === 'undefined') return;
      const data = await messagingService.getMessages(id);
      if (mountedRef.current) {
        setMessages(data);
        await messagingService.markMessagesAsRead(id);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;

    try {
      setDeletingConversation(true);
      await messagingService.deleteConversation(selectedConversationId);
      // Remove from list locally
      setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
      setFilteredConversations(prev => prev.filter(c => c.id !== selectedConversationId));
      setSelectedConversationId(null);
      setSearchParams({});
      setShowMobileChat(false);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversationId || sending) return;

    const content = newMessage.trim();
    const currentAttachments = [...attachments]; // Copy
    setNewMessage('');
    setAttachments([]);

    try {
      setSending(true);
      // If user is admin, send as 'admin' type to mask identity
      const messageType = isAdmin ? 'admin' : 'user';
      const sentMessage = await messagingService.sendMessage(selectedConversationId, content, messageType, currentAttachments);
      
      // Manual state update to ensure immediate feedback
      setMessages(prev => [...prev, sentMessage]);
      
      await loadConversations(); // Refresh list for last message
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore state on error
      setNewMessage(content);
      setAttachments(currentAttachments);
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    try {
      setSending(true);
      const url = await messagingService.uploadAttachment(file);
      setAttachments(prev => [...prev, {
        url,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name
      }]);
    } catch (err) {
      console.error('Failed to upload:', err);
      alert(t('messaging.uploadFailed'));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !scheduleData.date || !scheduleData.time) return;

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    try {
      setSending(true);
      const startTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default

      await messagingService.createMeeting({
        conversationId: selectedConversationId,
        recipientId: selectedConv.other_user.id,
        title: scheduleData.title || 'Meeting',
        startTime,
        endTime,
        platform: scheduleData.platform,
        location: scheduleData.location
      });
      setShowScheduleModal(false);
      setScheduleData({ title: '', date: '', time: '', platform: 'Zoom', location: '' });
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
      alert(t('messaging.scheduleFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleViewMeeting = async (meetingId: string) => {
    try {
      const meeting = await messagingService.getMeeting(meetingId);
      if (meeting) {
        setViewingMeeting(meeting);
      }
    } catch (error) {
      console.error('Failed to fetch meeting details:', error);
    }
  };

  // Format last seen time
  const formatLastSeen = (lastSeenAt: string): string => {
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messaging.justNow');
    if (diffMins < 60) return t('messaging.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('messaging.hoursAgo', { count: diffHours });
    if (diffDays === 1) return t('messaging.yesterday');
    if (diffDays < 7) return t('messaging.daysAgo', { count: diffDays });
    return format(lastSeen, 'MMM d');
  };





  // UI Components
  const MessageBubble = ({ msg, isOwn }: { msg: Message; isOwn: boolean }) => {
    const isAdminMessage = msg.message_type === 'admin';
    
    return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 md:mb-4 group animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`max-w-[90%] sm:max-w-[70%] lg:max-w-[60%]`}>
        {/* Admin/Support Badge for received messages */}
        {isAdminMessage && !isOwn && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            <div className="bg-blue-100 text-blue-700 p-1 rounded-full">
              <ShieldCheck size={12} />
            </div>
            <span className="text-xs font-bold text-blue-700">AnYiculture Support</span>
          </div>
        )}

        {/* Attachment */}
        {msg.attachment_url && (
          <div className={`mb-3 rounded-2xl overflow-hidden border ${
            isOwn ? 'border-gray-100' : 'border-gray-100'
          } shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
            {msg.attachment_type === 'image' ? (
              <img src={msg.attachment_url} alt="attachment" className="max-w-full h-auto" />
            ) : (
              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 md:p-4 bg-white hover:bg-gray-50 transition-colors gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate">{msg.attachment_name || 'Attached File'}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.download')}</span>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Meeting Invite Card */}
        {msg.message_type === 'system' && msg.content.includes('Scheduled a meeting') && (
           <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-3xl mb-3 flex items-center gap-3 md:gap-4 shadow-sm group-hover:shadow-md transition-all duration-300">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200 shrink-0">
               <Calendar size={18} className="md:w-5 md:h-5" />
             </div>
             <div className="flex-1 min-w-0">
               <p className="font-bold text-gray-900 text-sm">{t('messaging.meetingInvitation')}</p>
               <p className="text-gray-400 text-[11px] font-medium mt-0.5 truncate">{msg.content.replace('Scheduled a meeting: ', '')}</p>
             </div>
             <button 
               onClick={() => msg.meeting_id && handleViewMeeting(msg.meeting_id)}
               className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-900 transition-colors shrink-0"
             >
                {t('common.view')}
             </button>
           </div>
        )}

        {/* Text */}
        {msg.content && !msg.content.startsWith('Scheduled a meeting') && (msg.content !== 'Sent an attachment') && (
          <div className={`px-3 py-2 md:px-4 md:py-3 rounded-[18px] md:rounded-[24px] shadow-sm relative transition-all duration-300 ${
            isOwn 
              ? 'bg-gray-900 text-white rounded-br-sm shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]' 
              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm group-hover:border-gray-200'
          }`}>
            <p className="text-[12px] md:text-[13px] font-medium break-words whitespace-pre-wrap leading-relaxed">
              {msg.content.startsWith('TRANSLATE:') ? (() => {
                  try {
                    const { key, params } = JSON.parse(msg.content.substring(10));
                    return t(key, params);
                  } catch (e) {
                    return msg.content;
                  }
                })() : msg.content}
            </p>
          </div>
        )}
        
        {/* Metadata */}
        <div className={`flex items-center gap-2 mt-2 px-1 transition-opacity duration-300 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {format(new Date(msg.created_at), 'HH:mm')}
          </span>
          {isOwn && (
            <div className={`flex items-center gap-0.5 ${msg.read ? 'text-blue-500' : 'text-gray-300'}`}>
              <Check size={10} strokeWidth={4} />
              {msg.read && <Check size={10} strokeWidth={4} className="-ml-1.5" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )};

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'h-full' : 'h-[calc(100vh-4rem)] mt-16'} bg-white flex overflow-hidden border-t border-gray-100/50`}>
      {/* Sidebar - List */}
      <div 
        style={{ width: window.innerWidth >= 768 ? `${sidebarWidth}px` : '100%' }}
        className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col border-r border-gray-100 bg-gray-50 relative shrink-0`}
      >
        {/* Resize Handle */}
        <div
          className="hidden md:flex absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize items-center justify-center hover:bg-blue-500/20 z-50 group transition-colors"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="w-0.5 h-8 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
        </div>

        {/* Sidebar Header */}
        <div className="px-4 md:px-6 py-3 md:py-6 flex flex-col gap-3 md:gap-4 shrink-0 border-b border-gray-100 bg-white md:bg-transparent sticky top-0 md:relative z-40">
          <div className="flex items-center justify-between">
            <h1 className="text-sm md:text-xl font-black text-gray-900 uppercase tracking-tight md:tracking-tight">{t('messaging.title')}</h1>
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white md:bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <MessageSquare size={14} className="md:size-4" />
                </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100/50 md:bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
            {['all', 'job', 'aupair', 'marketplace'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                  activeFilter === filter 
                    ? 'bg-gray-900 text-white shadow-sm scale-105' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t(`messaging.filters.${filter}`)}
              </button>
            ))}
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messaging.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-white md:bg-white border border-gray-100 rounded-xl text-xs focus:border-gray-900 focus:ring-0 transition-all outline-none placeholder:text-gray-400 font-bold"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
                <MessageSquare size={24} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">{t('messaging.noConversations')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv, idx) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    setSearchParams({ conversation: conv.id });
                    setShowMobileChat(true);
                  }}
                  className={`w-full p-3 md:p-4 flex gap-3 md:gap-4 rounded-2xl transition-all duration-300 group animate-in fade-in slide-in-from-left-2`}
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className={`relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                    selectedConversationId === conv.id ? 'scale-105' : ''
                  }`}>
                    {conv.other_user.avatar_url ? (
                      <img src={conv.other_user.avatar_url} alt="" className="w-12 h-12 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white font-semibold text-lg md:text-xl shadow-sm">
                        {(conv.other_user.full_name || conv.other_user.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conv.other_user.full_name && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                    )}
                  </div>
                  
                  <div className={`flex-1 min-w-0 text-left py-1 flex flex-col justify-between`}>
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-sm md:text-[15px] font-bold truncate transition-colors ${
                        selectedConversationId === conv.id ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {conv.other_user.full_name || conv.other_user.email}
                      </h3>
                      <span className="text-[10px] md:text-[11px] text-gray-400 font-medium ml-2 shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message?.created_at || conv.updated_at || new Date()), { addSuffix: false })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate transition-colors ${
                        conv.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-400 group-hover:text-gray-500'
                      }`}>
                        {conv.last_message?.content || 'Started a conversation'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-lg shadow-gray-200">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white relative`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="min-h-[60px] md:h-[104px] px-4 md:px-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 shrink-0 py-2 md:py-0 sticky top-0">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <button 
                  onClick={() => setShowMobileChat(false)} 
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-gray-900 text-sm md:text-lg tracking-tight truncate uppercase">
                      {selectedConversation.other_user.full_name || selectedConversation.other_user.email}
                    </h2>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      otherUserPresence?.is_online 
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                        : 'bg-gray-300'
                    }`}></span>
                  </div>
                  {selectedConversation.related_item_title && (
                    <span className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-widest mt-0.5 truncate">
                      {selectedConversation.context_type} 
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 italic lowercase font-bold truncate">{selectedConversation.related_item_title}</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.status')}</span>
                  <span className={`text-xs font-bold ${
                    otherUserPresence?.is_online ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {otherUserPresence?.is_online 
                      ? t('messaging.onlineNow') 
                      : otherUserPresence?.last_seen_at 
                        ? formatLastSeen(otherUserPresence.last_seen_at)
                        : t('messaging.offline')
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} className="md:size-5" />
                  </button>
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer">
                    <Search size={16} className="md:size-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-white custom-scrollbar-light">
              <div className="max-w-5xl mx-auto">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user?.id} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="px-4 md:px-6 py-3 border-t border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                    {file.type === 'image' ? (
                      <img src={file.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText size={20} className="md:w-6 md:h-6" />
                      </div>
                    )}
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                    >
                      <X size={10} className="md:w-3 md:h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-center text-white truncate px-1">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="px-3 py-2 md:px-6 md:py-4 bg-white border-t border-gray-100 z-20 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-end max-w-5xl mx-auto">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleUpload} 
                />
                
                <div className="flex gap-1 md:gap-2 pb-1">
                   <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 active:scale-90"
                    title={t('messaging.uploadFile')}
                  >
                    <Paperclip size={18} className="md:w-5 md:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 active:scale-90"
                    title={t('messaging.scheduleMeeting')}
                  >
                    <Calendar size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                <div className="flex-1 bg-gray-50/50 border border-transparent rounded-[18px] md:rounded-[22px] flex items-center px-3 md:px-5 py-1 focus-within:bg-white focus-within:border-gray-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t('messaging.typeMessage')}
                    className="flex-1 bg-transparent border-none focus:outline-none text-[12px] md:text-[13px] py-2.5 resize-none custom-scrollbar font-medium"
                    disabled={sending}
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                  className="w-10 h-10 md:w-11 md:h-11 bg-blue-600 text-white rounded-[14px] md:rounded-[18px] flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all duration-300 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0"
                >
                  <Send size={16} className="md:w-5 md:h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-white">
            {/* Header Placeholder for Symmetry */}
            <div className="h-[104px] border-b border-gray-100 bg-white/80 backdrop-blur-xl invisible md:visible flex items-center px-8" />
            
            <div className="flex-1 flex flex-col items-center justify-center text-gray-200">
              <div className="w-24 h-24 rounded-[40px] bg-gray-50 flex items-center justify-center mb-6">
                <MessageSquare size={40} className="stroke-1 opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('messaging.selectConversation')}</h3>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{t('messaging.startConversationDesc')}</p>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-5 md:p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-blue-600 md:w-6 md:h-6" size={20} />
                  {t('messaging.scheduleMeeting')}
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} className="md:w-6 md:h-6" />
                </button>
              </div>

              <form onSubmit={handleScheduleMeeting} className="space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar px-1">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('messaging.meetingTopic')}</label>
                  <input
                    type="text"
                    value={scheduleData.title}
                    onChange={e => setScheduleData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Interview, Follow-up"
                    className="w-full px-3 py-2 md:px-4 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('common.date')}</label>
                    <input
                      type="date"
                      value={scheduleData.date}
                      onChange={e => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 md:px-4 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('common.time')}</label>
                    <input
                      type="time"
                      value={scheduleData.time}
                      onChange={e => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 md:px-4 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('common.platform')}</label>
                  <select
                    value={scheduleData.platform}
                    onChange={e => setScheduleData(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-2 md:px-4 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Zoom">{t('messaging.meeting.zoom')}</option>
                    <option value="WeChat">{t('messaging.meeting.wechat')}</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="In-person">{t('messaging.meeting.inPerson')}</option>
                    <option value="Phone">{t('messaging.meeting.phone')}</option>
                    <option value="Other">{t('messaging.meeting.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('common.locationLink')}</label>
                  <input
                    type="text"
                    value={scheduleData.location}
                    onChange={e => setScheduleData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t('messaging.locationPlaceholder') || "e.g. https://zoom.us/j/... or 123 Main St"}
                    className="w-full px-3 py-2 md:px-4 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full mt-2 bg-blue-600 text-white py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  {sending ? t('messaging.scheduling') : t('messaging.confirmSchedule')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Meeting Modal */}
        {viewingMeeting && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-5 md:p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-4 md:mb-6 shrink-0">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{viewingMeeting.title}</h3>
                  <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">{t('messaging.meetingDetails')}</p>
                </div>
                <button onClick={() => setViewingMeeting(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar px-1">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-900">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar size={18} className="md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-blue-400 mb-0.5">{t('common.date')}</p>
                    <p className="font-semibold text-sm md:text-base">{format(new Date(viewingMeeting.start_time), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                    <Clock size={18} className="md:w-5 md:h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('common.time')}</p>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">
                      {format(new Date(viewingMeeting.start_time), 'h:mm a')} - {format(new Date(viewingMeeting.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>

                {viewingMeeting.platform && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                      <Video size={18} className="md:w-5 md:h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('common.platform')}</p>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">{viewingMeeting.platform}</p>
                    </div>
                  </div>
                )}

                {viewingMeeting.location && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                      <MapPin size={18} className="md:w-5 md:h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('common.locationLink')}</p>
                      {viewingMeeting.location.startsWith('http') ? (
                        <a href={viewingMeeting.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium truncate block text-sm md:text-base">
                          {viewingMeeting.location}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 truncate text-sm md:text-base">{viewingMeeting.location}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  onClick={() => setViewingMeeting(null)}
                  className="px-5 py-2 md:px-6 md:py-2.5 bg-gray-900 text-white rounded-xl text-sm md:text-base font-bold hover:bg-black transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConversation}
        title={t('messaging.deleteConfirmTitle')}
        message={t('messaging.deleteConfirmMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        isLoading={deletingConversation}
      />
    </div>
  );
}
