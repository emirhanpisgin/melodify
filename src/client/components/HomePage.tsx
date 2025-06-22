import KickAuth from "./KickAuth";
import SpotifyAuth from "./SpotifyAuth";

export default function HomePage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto p-6">
            <SpotifyAuth />
            <KickAuth />
        </div>
    );
}
