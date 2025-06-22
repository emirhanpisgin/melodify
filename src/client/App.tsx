/// <reference path="../types/global.d.ts" />

import HomePage from "./components/HomePage";

export default function App() {

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-zinc-900 text-white">
            <HomePage />
        </div>
    );
}
