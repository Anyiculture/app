import { useEffect, useCallback } from 'react';
import { usePersonalization } from '../contexts/PersonalizationContext';

export function useContentTracking(module: string) {
  const { trackModuleVisit, trackContentInteraction } = usePersonalization();

  useEffect(() => {
    trackModuleVisit(module);
  }, [module]);

  const trackView = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'view');
  }, [module, trackContentInteraction]);

  const trackClick = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'click');
  }, [module, trackContentInteraction]);

  const trackSave = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'save');
  }, [module, trackContentInteraction]);

  const trackApply = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'apply');
  }, [module, trackContentInteraction]);

  const trackMessage = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'message');
  }, [module, trackContentInteraction]);

  const trackShare = useCallback((contentId: string) => {
    trackContentInteraction(module, contentId, 'share');
  }, [module, trackContentInteraction]);

  return {
    trackView,
    trackClick,
    trackSave,
    trackApply,
    trackMessage,
    trackShare,
  };
}
