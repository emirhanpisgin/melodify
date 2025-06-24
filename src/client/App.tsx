/// <reference path="../types/global.d.ts" />

import HomePage from "./components/HomePage";
import Navbar from "./components/Navbar";

/**
 * Root application component. Sets up the main layout and theme.
 */
export default function App() {

    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen bg-black text-white">
            <Navbar />
            <HomePage />
        </div>
    );
}
