'use client'
// Orda runs as a single-restaurant deployment — there is no marketplace.
// Skip the upstream Enatega marketing landing / location picker / restaurant
// list and take the customer straight into the one active restaurant's menu.
// Falls back to the upstream landing only when no active restaurant can be
// resolved (e.g. it was deactivated), so the root never dead-ends.
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { NEAR_BY_RESTAURANTS_PREVIEW } from "@/lib/api/graphql/queries/restaurants";

const Home = dynamic(
  () => import('@/lib/ui/screens/unprotected/index'),
  { ssr: false }
);

export default function RootPage() {
  const router = useRouter();

  const { data, error } = useQuery(NEAR_BY_RESTAURANTS_PREVIEW, {
    variables: {
      latitude: 0,
      longitude: 0,
      page: 1,
      limit: 1,
      shopType: "restaurant",
    },
    fetchPolicy: "network-only",
  });

  const restaurant = data?.nearByRestaurantsPreview?.restaurants?.[0];

  useEffect(() => {
    if (restaurant?._id && restaurant?.slug) {
      router.replace(`/restaurant/${restaurant.slug}/${restaurant._id}`);
    }
  }, [restaurant, router]);

  // Resolved-but-empty or a backend error → show the upstream landing so the
  // page is never blank.
  if (error || (data && !restaurant)) {
    return <Home />;
  }

  // Resolving / about to redirect — minimal spinner, no marketing flash.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
    </div>
  );
}
