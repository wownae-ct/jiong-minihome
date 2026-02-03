import { ProfileCard } from './ProfileCard';
import { ContactInfo } from './ContactInfo';
import { VisitorCounter } from './VisitorCounter';

export function Sidebar() {
  return (
    <>
      <ProfileCard />
      <ContactInfo />
      <VisitorCounter />
    </>
  );
}
