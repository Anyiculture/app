import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  personalizationService,
  UserPersonalization,
  UserRole,
  ModuleEngagement,
} from '../services/personalizationService';
import { recommendationEngine } from '../services/recommendationEngine';

interface PersonalizationContextType {
  personalization: UserPersonalization | null;
  roles: UserRole[];
  primaryRole: UserRole | null;
  moduleEngagement: ModuleEngagement[];
  loading: boolean;
  refreshPersonalization: () => Promise<void>;
  setPrimaryRole: (module: string, roleType: string) => Promise<boolean>;
  addRole: (module: string, roleType: string, isPrimary?: boolean) => Promise<boolean>;
  trackModuleVisit: (module: string) => Promise<void>;
  trackContentInteraction: (contentType: string, contentId: string, interactionType: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPersonalization>) => Promise<boolean>;
  addFavoriteModule: (module: string) => Promise<boolean>;
  removeFavoriteModule: (module: string) => Promise<boolean>;
  getRecommendations: (type: string, limit?: number) => Promise<any[]>;
  getRoleHomeRoute: () => string;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [personalization, setPersonalization] = useState<UserPersonalization | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [primaryRole, setPrimaryRoleState] = useState<UserRole | null>(null);
  const [moduleEngagement, setModuleEngagement] = useState<ModuleEngagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPersonalizationData();
    } else {
      setPersonalization(null);
      setRoles([]);
      setPrimaryRoleState(null);
      setModuleEngagement([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadPersonalizationData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [personalizationData, rolesData, primaryRoleData, engagementData] = await Promise.all([
        personalizationService.getUserPersonalization(user.id),
        personalizationService.getUserRoles(user.id),
        personalizationService.getPrimaryRole(user.id),
        personalizationService.getModuleEngagement(user.id),
      ]);

      if (!personalizationData) {
        await personalizationService.initializePersonalization(user.id);
        const newPersonalization = await personalizationService.getUserPersonalization(user.id);
        setPersonalization(newPersonalization);
      } else {
        setPersonalization(personalizationData);
      }

      setRoles(rolesData);
      setPrimaryRoleState(primaryRoleData);
      setModuleEngagement(engagementData);
    } catch (error) {
      console.error('Error loading personalization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPersonalization = async () => {
    await loadPersonalizationData();
  };

  const setPrimaryRole = async (module: string, roleType: string): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await personalizationService.setPrimaryRole(user.id, module, roleType);
    if (success) {
      await refreshPersonalization();
    }
    return success;
  };

  const addRole = async (module: string, roleType: string, isPrimary = false): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await personalizationService.addUserRole(user.id, module, roleType, isPrimary);
    if (success) {
      await refreshPersonalization();
    }
    return success;
  };

  const trackModuleVisit = async (module: string): Promise<void> => {
    if (!user?.id) return;

    await Promise.all([
      personalizationService.trackModuleEngagement(user.id, module, 'view'),
      personalizationService.updateLastVisitedModule(user.id, module),
    ]);

    await refreshPersonalization();
  };

  const trackContentInteraction = async (
    contentType: string,
    contentId: string,
    interactionType: string
  ): Promise<void> => {
    if (!user?.id) return;

    await personalizationService.trackContentInteraction(user.id, {
      content_type: contentType,
      content_id: contentId,
      interaction_type: interactionType as any,
    });
  };

  const updatePreferences = async (preferences: Partial<UserPersonalization>): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await personalizationService.updatePersonalizationPreferences(user.id, preferences);
    if (success) {
      await refreshPersonalization();
    }
    return success;
  };

  const addFavoriteModule = async (module: string): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await personalizationService.addFavoriteModule(user.id, module);
    if (success) {
      await refreshPersonalization();
    }
    return success;
  };

  const removeFavoriteModule = async (module: string): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await personalizationService.removeFavoriteModule(user.id, module);
    if (success) {
      await refreshPersonalization();
    }
    return success;
  };

  const getRecommendations = async (type: string, limit = 10): Promise<any[]> => {
    if (!user?.id) return [];

    switch (type) {
      case 'jobs':
        return recommendationEngine.getJobRecommendations(user.id, limit);
      case 'families':
        return recommendationEngine.getFamilyRecommendations(user.id, limit);
      case 'events':
        return recommendationEngine.getEventRecommendations(user.id, limit);
      case 'marketplace':
        return recommendationEngine.getMarketplaceRecommendations(user.id, limit);
      default:
        return [];
    }
  };

  const getRoleHomeRoute = (): string => {
    return personalizationService.getRoleHomeRoute(primaryRole);
  };

  const value: PersonalizationContextType = {
    personalization,
    roles,
    primaryRole,
    moduleEngagement,
    loading,
    refreshPersonalization,
    setPrimaryRole,
    addRole,
    trackModuleVisit,
    trackContentInteraction,
    updatePreferences,
    addFavoriteModule,
    removeFavoriteModule,
    getRecommendations,
    getRoleHomeRoute,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
}
