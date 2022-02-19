import { CronJob } from "cron";
import { Client, TextChannel } from "discord.js";
import { config } from "dotenv";
import Youtube from "youtube.ts";

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

if(!process.env.TOKEN) {
    console.log("Must provide TOKEN in .env file go to https://discordapp.com/developers/applications/me to create one");
    process.exit(1)
}

client.login(process.env.TOKEN);

let latestId = "2022-02-18T07:34:41Z";

if(!process.env.API_KEY) {
    console.log("Must provide API_KEY in .env file go to https://developers.google.com/youtube/registering_an_application to create one");
    process.exit(1)
}

const yt = new Youtube(process.env.API_KEY);

if(!process.env.CHANNEL_NAME) {
    console.log("Must provide CHANNEL_NAME in .env file(The youtube channel name)");
    process.exit(1)
}

const handler = async () => {
    console.log("Fetching new videos");
  const videos = await yt.videos.search({
    q: process.env.CHANNEL_NAME,
    maxResults: 1,
    publishedAfter: latestId,
  });
  if (latestId === videos.items[0].id.videoId) {
    console.log("No new videos");
    return;
  }
  latestId = videos.items[0].id.videoId;
  const videoUrl = `https://www.youtube.com/watch?v=${videos.items[0].id.videoId}`;

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
};

client.on("ready", () => {
  console.log("Logged in as " + client.user?.tag);

  new CronJob(
    "0 0 */2 * * *",
    () => {
        handler()
    },
    null,
    true,
    "Europe/Stockholm",
    null,
    true
  );
});
