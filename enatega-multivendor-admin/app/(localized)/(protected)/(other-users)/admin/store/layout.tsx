'use client';
// HOC
import RESTAURANT_GUARD from '@/lib/hoc/RESTAURANT_GUARD';
// Layout
import { RestaurantLayoutProvider } from '@/lib/context/restaurant/layout-restaurant.context';
import RestaurantLayout from '@/lib/ui/layouts/protected/restaurant';
import { ProfileProvider } from '@/lib/context/restaurant/profile.context';
// Lieferando-style live order intake (Orda #157) — always-on popup + tone.
import LiveOrderIntake from '@/lib/ui/useable-components/live-order-intake';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ProtectedLayout = RESTAURANT_GUARD(
    ({ children }: { children: React.ReactNode }) => {
      return <RestaurantLayout>{children}</RestaurantLayout>;
    }
  );

  return (
    <ProtectedLayout>
      <RestaurantLayoutProvider>
        <ProfileProvider>
          {children}
          <LiveOrderIntake />
        </ProfileProvider>
      </RestaurantLayoutProvider>
    </ProtectedLayout>
  );
}
