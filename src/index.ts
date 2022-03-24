import { CronJob } from "cron";
import { Client, TextChannel } from "discord.js";
import { config } from "dotenv";
import Youtube, { YoutubeVideoSearchItem } from "youtube.ts";

config();

const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS",
  ],
});

if (!process.env.TOKEN) {
  console.log(
    "Must provide TOKEN in .env file go to https://discordapp.com/developers/applications/me to create one"
  );
  process.exit(1);
}

client.login(process.env.TOKEN);

let latestTime = new Date().toISOString();
let latestId = "";

if (!process.env.API_KEY) {
  console.log(
    "Must provide API_KEY in .env file go to https://developers.google.com/youtube/registering_an_application to create one"
  );
  process.exit(1);
}

const yt = new Youtube(process.env.API_KEY);

if (!process.env.CHANNEL_NAME) {
  console.log(
    "Must provide CHANNEL_NAME in .env file(The youtube channel name)"
  );
  process.exit(1);
}

if (!process.env.YT_CHANNEL_ID) {
  console.log(
    "Must provide YT_CHANNEL_ID in .env file(The youtube channel id)"
  );
  process.exit(1);
}

const handler = async () => {
  try {
    const videos = await yt.videos.search({
      q: process.env.CHANNEL_NAME,
      maxResults: 5,
      publishedAfter: latestTime,
    });

    const sorted = videos.items.filter((a) => {
      return a.snippet.channelId === process.env.YT_CHANNEL_ID;
    });
    const valid = sorted.map((vid) => {
      if (vid.id.videoId !== latestId) {
        return vid;
      }
    }) as YoutubeVideoSearchItem[];

    const timeSort = valid.sort((a, b) => {
      return (
        new Date(b.snippet.publishedAt).getSeconds() -
        new Date(a.snippet.publishedAt).getSeconds()
      );
    });

    if (!valid || valid.length < 0) {
      console.log("No new videos");
      return;
    }
    latestTime = timeSort[0].snippet.publishedAt;
    latestId = timeSort[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${timeSort[0].id.videoId}`;

    const channels = process.env.CHANNEL_ID;
    if (!channels) {
      console.log(
        `Must provide CHANNEL_IDs in array: CHANNEL_ID=["channel1","channel2"] in the .env file`
      );
      return;
    }
    for (const channel of JSON.parse(channels)) {
      (client.channels.cache.get(channel) as TextChannel)?.send(videoUrl);
    }
  } catch (error) {
    console.log(error);
  }
};

client.on("ready", () => {
  console.log("Logged in as " + client.user?.tag);

  new CronJob(
    "0 0 */2 * * *",
    () => {
      handler();
    },
    null,
    true,
    "Europe/Stockholm",
    null,
    true
  );
});
