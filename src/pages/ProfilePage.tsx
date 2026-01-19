import { useParams } from 'react-router-dom';
import { ProfileView } from '../components/profile/ProfileView';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <ProfileView userId={id} />;
}
