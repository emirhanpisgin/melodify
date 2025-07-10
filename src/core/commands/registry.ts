import {
    playSong,
    getSpotifyApi,
} from "../../features/spotify/playback/player";
import Config from "../config";
import { sendKickMessage } from "../../features/kick/chat/listener";
import { logError, logSongRequest } from "../logging";
import { Command, CommandContext } from "./manager";
import { incrementSongRequestCount } from "../ipc/handlers";

function formatTemplate(
    template: string,
    vars: Record<string, string | number>
) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return vars[key]?.toString() || match;
    });
}

// Song Request Command
const SongRequestCommand: Command = {
    name: "sr",
    description: "Request a song to be played on Spotify",
    usage: "{prefix}sr <song name or URL>",
    enabled: true,
    handler: async (ctx, args, commandManager) => {
        // Check permissions first
        const canAnyonePlaySong = Config.get("canAnyonePlaySong");
        const userRoles = Config.get("allowedBadges") || [
            "og",
            "vip",
            "subscriber",
        ];
        const allowedRoles = [...userRoles, "broadcaster", "moderator"]; // Broadcaster and moderator can always request songs
        if (
            !canAnyonePlaySong &&
            !ctx.badges.some((b) => allowedRoles.includes(b))
        ) {
            if (Config.get("replyOnSongRequestError")) {
                await sendKickMessage(
                    `@${ctx.username} You don't have permission to request songs.`
                );
            }
            return;
        }

        // Check cooldowns and find the longest remaining time
        let longestRemainingTime = 0;
        let isOnCooldown = false;

        // Check global cooldown
        if (commandManager && commandManager.checkGlobalCooldown()) {
            const globalRemainingTime = commandManager.getRemainingCooldownTime(
                commandManager.getGlobalCooldownEnd()
            );
            longestRemainingTime = Math.max(
                longestRemainingTime,
                globalRemainingTime
            );
            isOnCooldown = true;
        }

        // Check user cooldown
        if (commandManager && commandManager.checkUserCooldown(ctx.username)) {
            const userCooldownEnd = commandManager.getUserCooldownEnd(
                ctx.username
            );
            if (userCooldownEnd) {
                const userRemainingTime =
                    commandManager.getRemainingCooldownTime(userCooldownEnd);
                longestRemainingTime = Math.max(
                    longestRemainingTime,
                    userRemainingTime
                );
                isOnCooldown = true;
            }
        }

        // If on any cooldown, send simple message and return
        if (isOnCooldown && Config.get("replyOnCooldown")) {
            const cooldownMessage = formatTemplate(
                Config.get("cooldownMessageTemplate") ||
                    "Please wait {time} seconds before requesting another song.",
                { time: longestRemainingTime }
            );
            await sendKickMessage(`@${ctx.username} ${cooldownMessage}`);
            return;
        }

        const songQuery = args.join(" ").trim();
        if (!songQuery) {
            if (Config.get("replyOnSongRequestError")) {
                await sendKickMessage(
                    `@${ctx.username} Please provide a song name or Spotify URL.`
                );
            }
            return;
        }

        // Process the song request
        const songInfo = await playSong(songQuery, ctx.username);

        if (songInfo && commandManager) {
            // Set cooldowns after successful song request
            commandManager.setGlobalCooldown();
            commandManager.setUserCooldown(ctx.username);

            // Log the song request to the logging system
            logSongRequest(songInfo.title, songInfo.artist, ctx.username);

            // Increment song request count with song info
            incrementSongRequestCount(songInfo);

            if (Config.get("replyOnSongRequest")) {
                await sendKickMessage(
                    `@${ctx.username} ` +
                        formatTemplate(
                            Config.get("songRequestReplyTemplate") ||
                                "Added to queue: {title} by {artist}",
                            { title: songInfo.title, artist: songInfo.artist }
                        )
                );
            }
        }
    },
};

// Volume Command
const VolumeCommand: Command = {
    name: "volume",
    description: "Get or change the Spotify playback volume (moderators only)",
    usage: "{prefix}volume [0-100]",
    enabled: true,
    modOnly: true,
    handler: async (ctx, args, commandManager) => {
        const spotifyApi = getSpotifyApi();
        if (!spotifyApi) {
            if (Config.get("replyOnVolumeError")) {
                await sendKickMessage(
                    `@${ctx.username} Spotify is not connected. Please connect to Spotify first.`
                );
            }
            return;
        }

        // If no arguments provided, return current volume
        if (!args[0]) {
            try {
                const playbackState =
                    await spotifyApi.getMyCurrentPlaybackState();
                const currentVolume =
                    playbackState.body.device?.volume_percent || 0;
                if (Config.get("replyOnVolumeGet")) {
                    await sendKickMessage(
                        `@${ctx.username} ` +
                            formatTemplate(
                                Config.get("volumeGetReplyTemplate") ||
                                    "Current Spotify volume is {volume}%",
                                { volume: currentVolume }
                            )
                    );
                }
            } catch (error) {
                logError(error, "volume:getCurrentVolume");
                if (Config.get("replyOnVolumeError")) {
                    await sendKickMessage(
                        `@${ctx.username} Something went wrong, please try again.`
                    );
                }
            }
            return;
        }

        // Validate volume argument
        if (isNaN(Number(args[0]))) {
            if (Config.get("replyOnVolumeError")) {
                await sendKickMessage(
                    `@${ctx.username} Please enter a volume between 0 and 100.`
                );
            }
            return;
        }

        const vol = Math.max(0, Math.min(100, Number(args[0])));

        try {
            await spotifyApi.setVolume(vol);
            if (Config.get("replyOnVolumeChange")) {
                await sendKickMessage(
                    `@${ctx.username} ` +
                        formatTemplate(
                            Config.get("volumeChangeReplyTemplate") ||
                                "Spotify volume changed to {volume}%",
                            { volume: vol }
                        )
                );
            }
        } catch (error) {
            logError(error, "volume:setVolume");
            if (Config.get("replyOnVolumeError")) {
                await sendKickMessage(
                    `@${ctx.username} Something went wrong, please try again.`
                );
            }
        }
    },
};

/**
 * Registers all core commands to the provided CommandManager instance.
 * @param commandManager The CommandManager instance to register commands to.
 */
export function registerAllCommands(
    commandManager: import("./manager").CommandManager
) {
    commandManager.register(SongRequestCommand);
    commandManager.register(VolumeCommand);
}
