// HomePage.tsx
// Main home page component displaying Kick and Spotify authentication cards.

import KickCard from "../../features/kick/components/KickCard";
import SpotifyCard from "../../features/spotify/components/SpotifyCard";

/**
 * HomePage component displays the main interface with authentication cards.
 * Shows Kick and Spotify integration cards for user authentication.
 */
export default function HomePage() {
    return (
        <div className="flex-1 flex">
            <SpotifyCard />
            <KickCard />
        </div>
    );
}
