const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../private/.env') });

const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env['API_KEY_Pexel']

const THEMES = shuffleArray([
  "forest", "mountain", "ocean", "beach", "desert", "waterfall", "jungle",
  "river", "lake", "snow", "volcano", "valley", "canyon", "sunrise",
  "sunset", "thunderstorm", "rain", "sky", "clouds", "stars", "aurora",
  "sand", "ice", "cliff", "fog", "cave", "island", "field", "meadow", "hill"
]);

const DOWNLOAD_DIR = path.join(__dirname, "vid");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

async function fetchVideos(theme, perPage = 10, pages = 3) {
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const res = await axios.get(`https://api.pexels.com/videos/search`, {
      headers: { Authorization: API_KEY },
      params: { query: theme, per_page: perPage, page },
    });

    for (const video of res.data.videos) {
      const filePath = path.join(DOWNLOAD_DIR, `${theme}_${video.id}.mp4`);
      if (fs.existsSync(filePath)) continue;

      for (let i of video.video_files) {
        if (i.width >= 1920) {
          results.push({ url: i.link, id: video.id, theme });
          break; 
        }
      }
    }
  }

  return results;
}

async function downloadVideo({ url, id, theme }) {
  const filepath = path.join(DOWNLOAD_DIR, `${theme}_${id}.mp4`);
  if (fs.existsSync(filepath)) return;

  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(filepath);
  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log(`✅ Downloaded: ${filepath}`);
}

(async () => {
  for (const theme of THEMES) {
    console.log(`🔍 Searching videos for: ${theme}`);
    const videos = await fetchVideos(theme, 10, 3);
    for (const video of videos) {
      try {
        await downloadVideo(video);
      } catch (e) {
        console.error(`❌ Failed to download ${video.url}`, e.message);
      }
    }
  }

  console.log("✅ All downloads completed.");
})();

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
