import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobSeekerOnboarding } from '../components/JobSeekerOnboarding';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { messagingService } from '../services/messagingService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

export function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>(); // This is the user_id
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [candidateName, setCandidateName] = useState('Candidate');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCandidateInfo() {
      if (!id) return;
      const { data } = await supabase
        .from('profiles_jobseeker')
        .select('full_name, display_name') // Check if display_name exists in schema, otherwise full_name
        .eq('user_id', id)
        .single();
      
      if (data) {
        setCandidateName(data.full_name || 'Candidate');
      }
    }
    loadCandidateInfo();
  }, [id]);

  const handleMessage = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!id) return;

    try {
      setLoading(true);
      const { conversationId } = await messagingService.createConversationWithMessage({
        otherUserId: id,
        contextType: 'support', // Using 'support' as fallback since 'direct' is not in allowed types
        initialMessage: `Hi ${candidateName}, I viewed your profile and would like to connect.`,
      });
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      showToast('error', 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
       <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft size={16} /> Back
            </Button>
            <span className="font-semibold text-gray-900">{candidateName}</span>
          </div>
          
          <Button 
            onClick={handleMessage} 
            isLoading={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageSquare size={18} />
            Message
          </Button>
       </div>
       
       <div className="max-w-4xl mx-auto pt-8 px-4">
         <JobSeekerOnboarding 
           mode="view" 
           userId={id} 
         />
       </div>
    </div>
  );
}
