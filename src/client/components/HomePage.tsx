import KickCard from "./KickCard";
import SpotifyCard from "./SpotifyCard";

export default function HomePage() {
    return (
        <div className="flex-1 flex">
            <SpotifyCard />
            <KickCard />
        </div>
    );
}
