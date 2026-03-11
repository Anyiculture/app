import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { messagingService, type ConversationContextType } from '../../services/messagingService';

interface ContactAdminButtonProps {
  contextType?: ConversationContextType;
  contextId?: string;
  relatedItemTitle?: string;
  initialMessage?: string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient-pink';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function ContactAdminButton({
  contextType = 'support',
  contextId,
  relatedItemTitle,
  initialMessage,
  label = 'Contact Admin',
  className,
  variant = 'outline',
  size = 'md',
}: ContactAdminButtonProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const conversationId = await messagingService.contactAdmin({
        contextType,
        contextId,
        relatedItemTitle,
        initialMessage,
      });

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      const errorMessage = messagingService.getConversationErrorMessage(
        error,
        'Failed to contact admin'
      );

      if (/not authenticated/i.test(errorMessage)) {
        const redirectPath = `${window.location.pathname}${window.location.search}`;
        navigate(`/signin?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      isLoading={loading}
    >
      {!loading && <MessageSquare size={16} className="mr-2" />}
      {label}
    </Button>
  );
}
