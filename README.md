# Melodify

**The Ultimate Spotify + Kick Chat Song Request App for Streamers**

Melodify is a next-generation desktop app that lets your viewers control the music on your stream—directly from your Kick chat! Instantly turn your Kick channel into a live, interactive jukebox powered by Spotify. Delight your community, boost engagement, and keep your stream's vibe fresh—all with a beautiful, modern UI.

---

## 🚀 Features

- **Seamless Kick & Spotify Integration**
    - Securely authenticate with both Kick and Spotify
    - Manage API secrets locally—your data stays private
    - Instantly detect and display your Spotify playback status and devices
    - Listen to Kick chat in real time and respond to song requests automatically

- **Effortless Song Requests from Chat**
    - Viewers request songs in Kick chat using a simple command (e.g., `!sr <song name>`)
    - Melodify searches Spotify and queues the requested track on your device
    - Customizable feedback and status messages sent to chat

- **Modern, Streamer-Friendly UI**
    - Built with React, Tailwind CSS, and TypeScript
    - Responsive, accessible, and dark-mode ready
    - Intuitive settings and onboarding—no tech skills required

- **Smart Notifications & Error Handling**
    - Toast notifications for errors, info, and success
    - Automatic error logging—get a log file for support if anything goes wrong

- **Fully Customizable**
    - Change your song request prefix, reply messages, and more in the settings
    - Open source and easy to extend

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/yourusername/melodify.git
    cd melodify
    ```
2. **Install dependencies:**
    ```sh
    yarn install
    # or
    npm install
    ```
3. **Start the app in development mode:**
    ```sh
    yarn start
    # or
    npm start
    ```

### Build for Production

```sh
yarn make
# or
npm run make
```

---

## 🎤 How It Works

1. **Connect your Spotify and Kick accounts** in the app settings.
2. **Start your Kick stream and open chat.**
3. **Viewers request songs** by typing `!sr <song name/url>` in Kick chat (prefix is customizable).
4. Melodify searches Spotify and plays the requested song on your connected device.
5. The app sends a customizable reply message to chat, confirming the song request.

---

## 📁 Project Structure

- `src/`
    - `client/` — React UI components
    - `ipc/` — Electron IPC handlers
    - `lib/` — Utilities, config, and API logic
    - `types/` — TypeScript type definitions
    - `index.ts` — Electron main process

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

## 📄 License

[MIT](LICENSE)

---

**Not affiliated with Kick or Spotify. Use at your own risk.**

> **Melodify: Let your community DJ your stream!**
