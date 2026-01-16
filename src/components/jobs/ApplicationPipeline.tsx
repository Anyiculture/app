import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

import { applicationService, JobApplicationWithDetails, ApplicationStatus } from '../../services/applicationService';
import { ApplicationCard } from './ApplicationCard';
import { InterviewScheduler } from './InterviewScheduler';

interface ApplicationPipelineProps {
  jobId: string;
  onScheduleInterview?: (applicationId: string) => void;
}

const PIPELINE_STAGES: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { status: 'screening', label: 'Screening', color: 'bg-yellow-500' },
  { status: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-purple-500' },
  { status: 'interviewed', label: 'Interviewed', color: 'bg-indigo-500' },
  { status: 'offer_extended', label: 'Offer Extended', color: 'bg-green-500' },
  { status: 'hired', label: 'Hired', color: 'bg-emerald-500' },
  { status: 'rejected', label: 'Rejected', color: 'bg-gray-500' }
];

export function ApplicationPipeline({ jobId, onScheduleInterview: _onScheduleInterview }: ApplicationPipelineProps) {

  const [applications, setApplications] = useState<Record<ApplicationStatus, JobApplicationWithDetails[]>>({
    applied: [],
    screening: [],
    interview_scheduled: [],
    interviewed: [],
    offer_extended: [],
    hired: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [collapsedStages, setCollapsedStages] = useState<Set<ApplicationStatus>>(new Set(['rejected']));
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplicationWithDetails | null>(null);

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplicationsByStatus(jobId);
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceStatus = source.droppableId as ApplicationStatus;
    const destStatus = destination.droppableId as ApplicationStatus;

    // Move within the same column
    if (sourceStatus === destStatus) {
      const newApps = Array.from(applications[sourceStatus]);
      const [removed] = newApps.splice(source.index, 1);
      newApps.splice(destination.index, 0, removed);

      setApplications({
        ...applications,
        [sourceStatus]: newApps
      });
      return;
    }

    // Move to different column
    const sourceApps = Array.from(applications[sourceStatus]);
    const destApps = Array.from(applications[destStatus]);
    const [movedApp] = sourceApps.splice(source.index, 1);

    // Update the application status
    movedApp.status = destStatus;
    destApps.splice(destination.index, 0, movedApp);

    // Optimistically update UI
    setApplications({
      ...applications,
      [sourceStatus]: sourceApps,
      [destStatus]: destApps
    });

    // Update on backend
    try {
      await applicationService.updateStatus(draggableId, destStatus);
    } catch (error) {
      console.error('Failed to update application status:', error);
      // Revert on error
      loadApplications();
    }
  };

  const toggleStage = (status: ApplicationStatus) => {
    const newCollapsed = new Set(collapsedStages);
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status);
    } else {
      newCollapsed.add(status);
    }
    setCollapsedStages(newCollapsed);
  };

  const handleScheduleInterview = (applicationId: string) => {
    const app = Object.values(applications)
      .flat()
      .find(a => a.id === applicationId);
    
    if (app) {
      setSelectedApplication(app);
      setSchedulerOpen(true);
    }
  };

  const handleInterviewScheduled = () => {
    loadApplications(); // Reload to reflect any status changes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const totalApplications = Object.values(applications).reduce((sum, apps) => sum + apps.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="text-emerald-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            Applicant Pipeline
          </h2>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {totalApplications} total
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const isCollapsed = collapsedStages.has(stage.status);
            const stageApps = applications[stage.status] || [];

            return (
              <div key={stage.status} className="flex flex-col min-h-[200px]">
                {/* Column Header */}
                <div className="mb-3">
                  <button
                    onClick={() => toggleStage(stage.status)}
                    className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className="font-semibold text-gray-900 text-sm">{stage.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {stageApps.length}
                      </span>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                  </button>
                </div>

                {/* Cards Container */}
                {!isCollapsed && (
                  <Droppable droppableId={stage.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-3 p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-emerald-50 border-2 border-dashed border-emerald-300' : 'bg-gray-50/50'
                        }`}
                      >
                        {stageApps.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            No applicants
                          </div>
                        )}
                        {stageApps.map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <ApplicationCard
                                  application={app}
                                  onScheduleInterview={handleScheduleInterview}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Interview Scheduler Modal */}
      {selectedApplication && (
        <InterviewScheduler
          isOpen={schedulerOpen}
          onClose={() => {
            setSchedulerOpen(false);
            setSelectedApplication(null);
          }}
          applicationId={selectedApplication.id}
          jobId={jobId}
          intervieweeId={selectedApplication.applicant_id}
          intervieweeName={selectedApplication.applicant?.full_name || 'Applicant'}
          onScheduled={handleInterviewScheduled}
        />
      )}
    </div>
  );
}
