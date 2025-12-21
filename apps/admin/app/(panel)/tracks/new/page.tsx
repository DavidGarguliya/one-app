import { TrackForm } from "@/components/TrackForm";

export default function TrackCreatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Загрузить трек</h1>
      <TrackForm />
    </div>
  );
}
