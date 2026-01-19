import { MessagingPage } from '../../pages/MessagingPage';

export function MessagingAdminPanel() {
  return (
    <div className="h-[calc(100vh-140px)] -m-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MessagingPage embedded={true} />
    </div>
  );
}
