import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { messagingService } from '../../services/messagingService';
import { useNavigate } from 'react-router-dom';

interface QuickChatButtonProps {
  employerId: string;
  employerName: string;
  jobId: string;
  jobTitle: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function QuickChatButton({
  employerId,
  employerName,
  jobId,
  jobTitle,
  className = '',
  variant = 'secondary'
}: QuickChatButtonProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    try {
      setLoading(true);
      
      const { conversationId } = await messagingService.createConversationWithMessage({
        otherUserId: employerId,
        contextType: 'job',
        contextId: jobId,
        relatedItemTitle: jobTitle,
        initialMessage: `Hi ${employerName}, I'm interested in the ${jobTitle} position.`
      });

      // Navigate to messaging page with this conversation selected
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      if (error.message?.includes('Not authenticated')) {
        navigate('/login', { state: { from: window.location.pathname } });
      } else {
        alert(t('common.failedToStartChat') || 'Failed to start conversation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const variantStyles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100',
    outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles[variant]} ${className}`}
    >
      <MessageSquare size={18} />
      {loading ? t('jobs.startingChat') : t('jobs.chat')}
    </button>
  );
}
