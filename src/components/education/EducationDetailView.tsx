import { useI18n } from '../../contexts/I18nContext';
import { EducationResource } from '../../services/educationService';
import { Button } from '../ui/Button';
import { 
  translateEducationLevel, 
  translateProgramType, 
  translateDeliveryMode, 
  translateScheduleType 
} from '../../utils/educationTranslations';
import {
  GraduationCap, Clock, Globe, MapPin, Calendar, BookOpen, Award, CheckCircle, Heart, MessageCircle, User
} from 'lucide-react';

interface EducationDetailViewProps {
  program: EducationResource;
  isOwner: boolean;
  isFavorited: boolean;
  hasInterest: boolean;
  onToggleFavorite: () => void;
  onContact: () => void;
  onApply: () => void;
  onEdit: () => void;
  onViewApplications?: () => void;
  isAuthenticated: boolean;
  onSignIn: () => void;
  isAdminView?: boolean;
}

export function EducationDetailView({
  program,
  isOwner,
  isFavorited,
  hasInterest,
  onToggleFavorite,
  onContact,
  onApply,
  onEdit,
  onViewApplications,
  isAuthenticated,
  onSignIn,
  isAdminView = false
}: EducationDetailViewProps) {
  const { t, language } = useI18n();

  const title = language === 'zh' && program.title_zh ? program.title_zh : program.title;
  const description = language === 'zh' && program.description_zh ? program.description_zh : program.description;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-64 sm:h-80 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center overflow-hidden">
            {program.image_url || (program.images && program.images.length > 0) ? (
              <img
                src={program.image_url || program.images![0]}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : program.institution_logo ? (
              <img
                src={program.institution_logo}
                alt={program.institution_name || t('common.institution')}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <GraduationCap className="text-teal-600" size={128} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {program.program_type && (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-semibold rounded-lg">
                {translateProgramType(program.program_type, t)}
              </span>
            )}
            {program.education_level && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-lg">
                {translateEducationLevel(program.education_level, t)}
              </span>
            )}
            {program.delivery_mode && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-lg">
                {translateDeliveryMode(program.delivery_mode, t)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-start gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            {!isAdminView && isAuthenticated && (
               <button
               onClick={onToggleFavorite}
               className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors flex-shrink-0"
             >
               <Heart
                 size={20}
                 className={isFavorited ? 'fill-red-500 text-red-500' : ''}
               />
               <span className="hidden sm:inline">{isFavorited ? t('education.detail.saved') : t('common.save')}</span>
             </button>
            )}
          </div>

          {program.institution_name && (
            <div className="flex items-center gap-2 text-lg text-gray-700 mb-6">
              <MapPin size={20} />
              <span className="font-medium">{program.institution_name}</span>
              {program.institution_country && (
                <span className="text-gray-500">• {program.institution_city}, {program.institution_country}</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-6 mb-8 text-gray-600">
            {program.duration_value && (
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-teal-600" />
                <span>{program.duration_value} {program.duration_unit}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-teal-600" />
              <span>{program.language === 'en' ? t('education.english') : t('education.chinese')}</span>
            </div>
            {program.schedule_type && (
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-teal-600" />
                <span className="capitalize">{translateScheduleType(program.schedule_type, t)}</span>
              </div>
            )}
            {program.spots_remaining !== undefined && program.capacity !== undefined && (
              <div className="flex items-center gap-2">
                <User size={20} className="text-teal-600" />
                <span>{program.spots_remaining} / {program.capacity} {t('education.detail.spots')}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('education.detail.aboutProgram')}</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          </div>

          {program.eligibility_requirements && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-teal-600" />
                {t('education.create.eligibilityRequirements')}
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{program.eligibility_requirements}</p>
            </div>
          )}

          {program.academic_requirements && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen size={20} className="text-teal-600" />
                {t('education.create.academicRequirements')}
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{program.academic_requirements}</p>
            </div>
          )}

          {program.language_requirements && program.language_requirements.length > 0 && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('education.create.languageRequirements')}</h3>
              <ul className="space-y-2">
                {program.language_requirements.map((req: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    {typeof req === 'string' ? req : `${req.language}: ${req.requirement}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {program.documents_required && program.documents_required.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('education.create.requiredDocuments')}</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {program.documents_required.map((doc: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={16} className="text-teal-600 flex-shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6 space-y-6">
          {(program.tuition_fee !== null && program.tuition_fee !== undefined) && (
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('education.create.tuitionFeeLabel')}</p>
              <p className="text-4xl font-bold text-teal-600">
                {program.currency || 'CAD'} ${program.tuition_fee.toLocaleString()}
              </p>
              {program.scholarship_amount && program.scholarship_amount > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Award size={18} />
                    <span className="font-semibold">{t('education.scholarships')}</span>
                  </div>
                  <p className="text-green-600 font-bold mt-1">
                    {t('jobs.upTo')} ${program.scholarship_amount.toLocaleString()}
                  </p>
                </div>
              )}
              {program.financial_aid_available && (
                <p className="text-sm text-gray-600 mt-2">{t('education.create.financialAidAvailable')}</p>
              )}
            </div>
          )}

          {(program.start_date || program.application_deadline) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('education.create.importantDates')}</h3>
              <div className="space-y-2 text-sm">
                {program.application_deadline && (
                  <div>
                    <p className="text-gray-600">{t('education.create.applicationDeadlineLabel')}</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(program.application_deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {program.start_date && (
                  <div>
                    <p className="text-gray-600">{t('education.create.programStartDate')}</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(program.start_date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {program.institution_website && (
            <div className="border-t pt-6">
              <a
                href={program.institution_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-2"
              >
                <Globe size={16} />
                {t('education.detail.visitWebsite')}
              </a>
            </div>
          )}

          {!isAdminView && (
            <div className="border-t pt-6 space-y-3">
              {isAuthenticated && !isOwner ? (
                <>
                  {hasInterest ? (
                    <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                      <p className="text-green-700 font-semibold">{t('education.detail.applicationSubmitted')}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {t('education.detail.trackApplication')}
                      </p>
                      <Button
                        variant="outline"
                        onClick={onViewApplications}
                        className="mt-3"
                        size="sm"
                      >
                        {t('education.myApplications')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={onApply}
                      size="lg"
                    >
                      {t('education.apply.button')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onContact}
                  >
                    <MessageCircle size={18} />
                    {t('education.detail.contactProgram')}
                  </Button>
                </>
              ) : !isAuthenticated ? (
                <>
                  <Button
                    className="w-full"
                    onClick={onSignIn}
                    size="lg"
                  >
                    {t('common.signInToApply')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onSignIn}
                  >
                    <MessageCircle size={18} />
                    {t('education.detail.contactProgram')}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm">{t('education.detail.createdByYou')}</p>
                  <Button
                    variant="outline"
                    onClick={onEdit}
                    className="mt-3"
                    size="sm"
                  >
                    {t('education.editProgram')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {program.contact_email && (
            <div className="border-t pt-6 text-sm text-gray-600">
              <p className="font-medium mb-1">{t('education.detail.contact')}</p>
              <p>{program.contact_email}</p>
              {program.contact_phone && <p>{program.contact_phone}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
