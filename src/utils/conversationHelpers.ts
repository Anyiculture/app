import { messagingService } from '../services/messagingService';

export interface StartConversationParams {
  recipientId: string;
  recipientName?: string;
  contextType: 'job' | 'aupair' | 'visa' | 'event' | 'marketplace' | 'community' | 'education' | 'support';
  contextId?: string;
  itemTitle?: string;
  initialMessage?: string;
}

export async function startConversation(params: StartConversationParams): Promise<string> {
  const {
    recipientId,
    contextType,
    contextId,
    itemTitle,
    initialMessage,
  } = params;

  const result = await messagingService.createConversationWithMessage({
    otherUserId: recipientId,
    contextType,
    contextId,
    relatedItemTitle: itemTitle,
    initialMessage,
    messageType: 'user',
  });

  return result.conversationId;
}

export function navigateToConversation(conversationId: string): string {
  return `/messages?conversation=${conversationId}`;
}

export async function startConversationAndNavigate(
  params: StartConversationParams,
  navigate: (path: string) => void
): Promise<void> {
  try {
    const conversationId = await startConversation(params);
    navigate(navigateToConversation(conversationId));
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
}
