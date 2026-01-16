import { useState } from 'react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { Check, ChevronDown } from 'lucide-react';

export function RoleSwitcher() {
  const { roles, primaryRole, setPrimaryRole } = usePersonalization();
  const [isOpen, setIsOpen] = useState(false);

  if (roles.length <= 1) {
    return null;
  }

  const handleRoleSelect = async (module: string, roleType: string) => {
    await setPrimaryRole(module, roleType);
    setIsOpen(false);
  };

  const getRoleLabel = (module: string, roleType: string): string => {
    const labels: Record<string, string> = {
      'jobs:job_seeker': 'Job Seeker',
      'jobs:employer': 'Employer',
      'au_pair:au_pair': 'Au Pair',
      'au_pair:host_family': 'Host Family',
      'events:attendee': 'Event Attendee',
      'events:organizer': 'Event Organizer',
      'marketplace:buyer': 'Buyer',
      'marketplace:seller': 'Seller',
      'education:student': 'Student',
      'education:educator': 'Educator',
    };

    return labels[`${module}:${roleType}`] || `${module} ${roleType}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          {primaryRole
            ? getRoleLabel(primaryRole.module, primaryRole.role_type)
            : 'Select Role'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {roles.map((role) => {
                const isActive =
                  primaryRole?.module === role.module &&
                  primaryRole?.role_type === role.role_type;

                return (
                  <button
                    key={`${role.module}:${role.role_type}`}
                    onClick={() => handleRoleSelect(role.module, role.role_type)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{getRoleLabel(role.module, role.role_type)}</span>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
