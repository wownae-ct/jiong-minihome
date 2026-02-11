import { ProfileCard } from './ProfileCard';
import { ContactInfo } from './ContactInfo';
import { AnnouncementBanner } from './AnnouncementBanner';
import { VisitorCounter } from './VisitorCounter';

export function Sidebar() {
  return (
    <>
      <ProfileCard />
      <ContactInfo />
      <AnnouncementBanner />
      <div className="mt-auto">
        <VisitorCounter />
      </div>
    </>
  );
}
