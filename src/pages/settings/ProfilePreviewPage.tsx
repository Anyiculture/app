import { ProfileView } from '../../components/profile/ProfileView';

export function ProfilePreviewPage() {
  return (
    <div className="h-full">
      <ProfileView embedded={true} />
    </div>
  );
}
