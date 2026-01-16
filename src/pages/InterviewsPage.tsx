import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { interviewService, Interview } from '../services/interviewService';
import { Loading } from '../components/ui/Loading';

export function InterviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      loadInterviews();
    }
  }, [user, filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let data: Interview[];
      
      if (filter === 'upcoming') {
        data = await interviewService.getUpcomingInterviews();
      } else {
        data = await interviewService.getMyInterviews();
        if (filter === 'past') {
          data = data.filter(i => new Date(i.scheduled_at) < new Date());
        }
      }
      
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (interviewId: string) => {
    try {
      await interviewService.confirmInterview(interviewId);
      loadInterviews();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm interview');
    }
  };

  const handleCancel = async (interviewId: string) => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;
    
    try {
      await interviewService.cancelInterview(interviewId);
      loadInterviews();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel interview');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'zoom':
      case 'teams':
        return Video;
      default:
        return MapPin;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading interviews..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Calendar className="text-emerald-600" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
                <p className="text-gray-600">Manage your interview schedule</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {['upcoming', 'all', 'past'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === f
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No {filter === 'upcoming' ? 'Upcoming' : filter === 'past' ? 'Past' : ''} Interviews
            </h2>
            <p className="text-gray-600">
              {filter === 'upcoming'
                ? 'You have no scheduled interviews at the moment'
                : filter === 'past'
                ? 'No past interviews found'
                : 'You have no interviews scheduled'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map(interview => {
              const { date, time } = formatDateTime(interview.scheduled_at);
              const LocationIcon = getLocationIcon(interview.location);
              const isInterviewer = interview.interviewer_id === user?.id;

              return (
                <div
                  key={interview.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {isInterviewer ? 'Interview with Candidate' : 'Interview with Employer'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{time} ({interview.duration_minutes} min)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <LocationIcon size={16} />
                          <span className="capitalize">{interview.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {interview.meeting_url && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium mb-1">Meeting Link:</p>
                      <a
                        href={interview.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {interview.meeting_url}
                      </a>
                    </div>
                  )}

                  {interview.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">Notes:</p>
                      <p className="text-sm text-gray-700">{interview.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {interview.status === 'scheduled' && (
                    <div className="flex gap-2 pt-4 border-t">
                      {!isInterviewer && (
                        <button
                          onClick={() => handleConfirm(interview.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle size={16} />
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(interview.id)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
