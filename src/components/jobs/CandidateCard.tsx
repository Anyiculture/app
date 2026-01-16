
import { Heart, MapPin, Users, Briefcase } from 'lucide-react';

interface CandidateCardProps {
  profile: any;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onView: (id: string) => void;
}

export function CandidateCard({ profile, isFavorited, onToggleFavorite, onView }: CandidateCardProps) {
  const displayName = profile.full_name || profile.display_name || 'Candidate';
  
  const location = `${profile.current_location_city || ''}, ${profile.current_location_country || ''}`;
  const cleanLocation = location.replace(/^, |, $/g, '').replace(', ,', ',');

  // Use profile photo or fallback
  // const image = profile.profile_photos?.[0] || profile.resume_url ? null : null; 
  
  const badges = [];
  if (profile.desired_job_title) badges.push(profile.desired_job_title);
  if (profile.highest_education) badges.push(profile.highest_education);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(e, profile.id || profile.user_id);
  };

  return (
    <div 
      onClick={() => onView(profile.user_id || profile.id)}
      className="group flex flex-col h-full bg-white rounded-xl border border-black shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative cursor-pointer"
    >
      {/* Image Container - 3:4 Aspect Ratio */}
      <div className="aspect-[3/4] relative bg-gray-50 overflow-hidden">
        {profile.profile_photos && profile.profile_photos.length > 0 ? (
          <img
            src={profile.profile_photos[0]}
            alt={displayName}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                 <Users size={32} className="opacity-40" />
            </div>
          </div>
        )}

        {/* Favorite Button - Top Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 group/btn z-10"
        >
          <Heart
            size={14}
            className={`transition-colors duration-200 ${
              isFavorited
                ? 'fill-red-500 text-red-500'
                : 'text-gray-400 group-hover/btn:text-red-500'
            }`}
          />
        </button>

        {/* Role Badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 backdrop-blur-sm bg-indigo-600/90 text-white text-[9px] font-semibold uppercase tracking-wide rounded shadow-sm">
          Candidate
        </span>
      </div>

      {/* Content Section */}
      <div className="p-3 flex flex-col flex-grow bg-white space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {displayName}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin size={10} />
          <span className="truncate">{cleanLocation || 'Location N/A'}</span>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-1 mt-1">
          {badges.slice(0, 3).map((badge, i) => (
             <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded border border-gray-100 truncate max-w-[80px]">
               {badge}
             </span>
          ))}
        </div>

        {/* Bottom Row: Key Info */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
             <div className="flex items-center gap-1">
               <Briefcase size={10} className="text-gray-400" />
               <span>{profile.years_experience || 0} yrs exp</span>
             </div>
           
           {/* Arrow Icon */}
           <div className="text-gray-300 group-hover:text-indigo-600 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
