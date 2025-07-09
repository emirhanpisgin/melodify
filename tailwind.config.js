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
            height: {
                // Override h-screen to be 2.25rem shorter than 100vh
                screen: "calc(100vh - 2.25rem)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-in-from-right": {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "zoom-in": {
                    "0%": { transform: "scale(0)" },
                    "100%": { transform: "scale(1)" },
                },
                "fade-out": {
                    "0%": { opacity: "1" },
                    "100%": { opacity: "0" },
                },
                "slide-out-to-right": {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.3s ease-out",
                "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
                "zoom-in": "zoom-in 0.2s ease-out",
                "fade-out": "fade-out 0.3s ease-out",
                "slide-out-to-right": "slide-out-to-right 0.3s ease-out",
                "fade-in-slide-right":
                    "fade-in 0.3s ease-out, slide-in-from-right 0.3s ease-out",
            },
        },
    },
    plugins: [],
};
