# Songülfy

Songülfy is a modern Electron desktop app that connects your Spotify account with your Kick chat, allowing users to play songs directly from Kick chat commands. It provides a seamless way for streamers and their communities to interact with music playback in real time.

## Features

- **Kick & Spotify Integration:**
  - Authenticate with both Kick and Spotify
  - Manage API secrets securely (stored locally)
  - Detect and display Spotify playback status and devices
  - Listen to Kick chat and respond to song requests
- **Play Songs from Kick Chat:**
  - Users can request songs in Kick chat using commands (e.g., `!sr(by default) <song name>`)
  - The app searches Spotify and plays the requested track
  - Feedback and status messages are sent to chat
- **Modern UI:**
  - Built with React, Tailwind CSS, and TypeScript
  - Responsive, accessible, and dark-mode friendly
- **Notifications:**
  - Toast notifications for errors, info, and success

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/songulfy.git
   cd songulfy
   ```
2. Install dependencies:
   ```sh
   yarn install
   # or
   npm install
   ```
3. Start the app in development mode:
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

## Usage

1. **Connect your Spotify and Kick accounts** in the app settings.
2. **Start your Kick stream and open chat.**
3. **Viewers can request songs** by typing `!sr(by default) <song name>` in Kick chat.
4. The app will search Spotify and play the requested song on your connected device.

## Project Structure

- `src/`
  - `client/` — React UI components
  - `ipc/` — Electron IPC handlers
  - `lib/` — Utilities, config, and API logic
  - `types/` — TypeScript type definitions
  - `index.ts` — Electron main process

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

---

**Note:** This project is not affiliated with Kick or Spotify. Use at your own risk.
