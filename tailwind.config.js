/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                "spotify-green": "#1DB954",
                "spotify-green-dark": "#1AA34A",
                "spotify-green-darker": "#168F3D",
                "kick-green": "#53fc18",
                "kick-green-dark": "#3b9e0f",
                "kick-green-darker": "#2a6b0a",
            },
        },
    },
    plugins: [],
};
