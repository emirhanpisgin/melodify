import KickCard from "./KickCard";
import SpotifyCard from "./SpotifyCard";

/**
 * Home page component. Renders the main cards for Spotify and Kick integrations.
 */

export default function HomePage() {
    return (
        <div className="flex-1 flex">
            <SpotifyCard />
            <KickCard />
        </div>
    );
}
