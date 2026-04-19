import { adminApi } from "@/lib/api";
import { TrackForm } from "@/components/TrackForm";
import { notFound } from "next/navigation";
import { LyricsAdminPanel } from "@/components/LyricsAdminPanel";

export default async function TrackEditPage({ params }: { params: { id: string } }) {
  const track = await adminApi.getTrack(params.id, { slim: true }).catch(() => null);
  if (!track) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Редактировать трек</h1>
      <TrackForm trackId={params.id} initial={track} />
      <LyricsAdminPanel trackId={params.id} />
    </div>
  );
}
