import { useState } from 'react';
import { Mail, Phone, FileText, MessageCircle, Calendar, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobApplicationWithDetails } from '../../services/applicationService';

interface ApplicationCardProps {
  application: JobApplicationWithDetails;
  onStatusChange?: (applicationId: string, newStatus: string) => void;
  onScheduleInterview?: (applicationId: string) => void;
  isDragging?: boolean;
}

export function ApplicationCard({
  application,
  onStatusChange: _onStatusChange,
  onScheduleInterview,
  isDragging = false
}: ApplicationCardProps) {

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const applicant = application.applicant;
  const statusColors: Record<string, string> = {
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    screening: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    interview_scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
    interviewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    offer_extended: 'bg-green-50 text-green-700 border-green-200',
    hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  const handleMessage = () => {
    // Navigate to messaging with this applicant
    navigate(`/messaging?userId=${application.applicant_id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 border-gray-100 p-4 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {applicant?.full_name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {applicant?.full_name || 'Applicant'}
            </h3>
            <p className="text-xs text-gray-500">
              Applied {formatDate(application.applied_at)}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical size={18} className="text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onScheduleInterview?.(application.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar size={16} />
                Schedule Interview
              </button>
              <button
                onClick={() => {
                  handleMessage();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <MessageCircle size={16} />
                Send Message
              </button>
              {application.resume_url && (
                <a
                  href={application.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowMenu(false)}
                >
                  <FileText size={16} />
                  View Resume
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-3">
        {applicant?.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail size={14} className="text-gray-400" />
            <span className="truncate">{applicant.email}</span>
          </div>
        )}
        {applicant?.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone size={14} className="text-gray-400" />
            <span>{applicant.phone}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[application.status] || statusColors.applied}`}>
        {application.status.replace('_', ' ')}
      </div>

      {/* Notes Preview */}
      {application.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
          {application.notes}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleMessage}
          className="flex-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
        >
          <MessageCircle size={14} />
          Message
        </button>
        {application.resume_url && (
          <a
            href={application.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            <FileText size={14} />
            Resume
          </a>
        )}
      </div>
    </div>
  );
}
