import { notFound } from "next/navigation";
import { fetchTrack, fetchLatestTracks } from "../../../lib/api";
import TrackDetail from "../../../components/TrackDetail";

export default async function TrackPage({ params }: { params: { id: string } }) {
  const track = await fetchTrack(params.id, { slim: true });
  if (!track) return notFound();
  const related = (await fetchLatestTracks(8, true)).filter((t) => t.id !== track.id);
  return <TrackDetail track={track} related={related} />;
}
