import { fetchFeaturedTrack, fetchTrack } from "@/lib/api";
import { tracks as demoTracks } from "@/lib/demoData";
import { GiftPlayerClient } from "@/components/GiftPlayerClient";

export default async function GiftPage({ params }: { params: { gift_id: string } }) {
  const track =
    (await fetchTrack(params.gift_id, { slim: true }).catch(() => null)) ||
    (await fetchFeaturedTrack({ slim: true }).catch(() => null)) ||
    demoTracks[demoTracks.length - 1];

  const shareUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/g/${params.gift_id}`
      : `http://localhost:3000/g/${params.gift_id}`;

  return <GiftPlayerClient track={track} shareUrl={shareUrl} />;
}
