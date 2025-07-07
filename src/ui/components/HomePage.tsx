import KickCard from "../../features/kick/components/KickCard";
import SpotifyCard from "../../features/spotify/components/SpotifyCard";

export default function HomePage() {
    return (
        <div className="flex-1 flex">
            <SpotifyCard />
            <KickCard />
        </div>
    );
}
