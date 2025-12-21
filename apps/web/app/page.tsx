import { fetchFeaturedTrack, fetchLatestTracks } from "../lib/api";
import { tracks as demoTracks } from "../lib/demoData";
import { HomeClient } from "../components/HomeClient";

export default async function HomePage() {
  const featured = (await fetchFeaturedTrack()) ?? demoTracks[demoTracks.length - 1];
  const latest = await fetchLatestTracks(12);
  const latestTracks = latest.length ? latest : demoTracks.slice(-12).reverse();
  const pick = (pred: (t: any) => boolean) => {
    const list = latestTracks.filter(pred);
    return list.length ? list : latestTracks;
  };
  const playlists = [
    { title: "Новогоднее настроение", tracks: pick((t) => (t.occasion || "").toLowerCase().includes("нов") || (t.mood || "").toLowerCase().includes("рад")) },
    { title: "Романтика", tracks: pick((t) => (t.occasion || "").toLowerCase().includes("люб") || (t.mood || "").toLowerCase().includes("тепл")) },
    { title: "Для мамы", tracks: pick((t) => (t.occasion || "").toLowerCase().includes("мам")) }
  ];
  return <HomeClient featured={featured} latest={latestTracks} playlists={playlists} />;
}
