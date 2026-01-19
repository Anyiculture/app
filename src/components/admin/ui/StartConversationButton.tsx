import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { messagingService } from '../../../services/messagingService';
import { useToast } from '../../ui/Toast';
import { useI18n } from '../../../contexts/I18nContext';

interface StartConversationButtonProps {
  userId: string;
  userName: string;
  contextType: 'job' | 'aupair' | 'visa' | 'event' | 'marketplace' | 'community' | 'lifestyle' | 'education' | 'support' | 'violation' | 'account' | 'payment';
  sourceContext?: string; // e.g. "Visa Application #123"
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  label?: string;
}

export function StartConversationButton({
  userId,
  contextType,
  sourceContext,
  className,
  size = 'sm',
  variant = 'secondary',
  label
}: StartConversationButtonProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const systemMessage = `[System Message] Admin initiated contact regarding ${sourceContext || contextType}.`;
      
      // Fallback mapping for context types if DB constraints haven't been updated
      // Original allowed types: job_application, interview, support, general
      const allowedTypes = ['job_application', 'interview', 'support', 'general'];
      let safeContextType = contextType;
      
      if (!allowedTypes.includes(contextType as string)) {
          // Map unknown types to 'support' to avoid constraint violation
          safeContextType = 'support' as any;
      }

      const conversationId = await messagingService.startAdminConversation(
        userId,
        safeContextType as any,
        systemMessage
      );

      showToast('success', t('admin.messages.conversationStarted') || 'Conversation started');
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      showToast('error', t('admin.messages.startError') || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartConversation}
      className={className}
      disabled={loading}
      title="Start Conversation"
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <MessageSquare size={16} />
      )}
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
}
