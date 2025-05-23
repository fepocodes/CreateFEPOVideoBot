const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const NAME = "AcceptUserBot";

const VIDEO_DIR = path.join(__dirname, "vid");
const REPO_FOLDER = path.join(__dirname, "../", NAME);
const IMAGES_DIR = path.join(REPO_FOLDER, "public");
const OUTPUT = path.join(REPO_FOLDER, "public/output.mp4");
const FINAL = path.join(REPO_FOLDER, "public/final.mp4");

function getRandomBackgroundVideo() {
  const videos = fs.readdirSync(VIDEO_DIR).filter(f => /\.(mp4|mov|mkv)$/i.test(f));
  if (videos.length === 0) throw new Error("No background videos found in /vid");
  const random = videos[Math.floor(Math.random() * videos.length)];
  return path.join(VIDEO_DIR, random);
}

function generateFilter(images) {
  let filter = "";
  let lastOutput = "scaled";

  filter += `[0:v]scale=1920:1080[${lastOutput}];`;

  images.forEach((img, i) => {
    const imgLabel = `img${i}`;
    const resized = `resized${i}`;
    const next = `bg${i + 1}`;

    filter += `[${i + 1}:v]scale='if(lt(iw,500),500,iw)':'if(lt(ih,250),250,ih)':force_original_aspect_ratio=increase[${resized}];`;
    filter += `[${resized}]format=rgba[${imgLabel}];`;
    filter += `[${lastOutput}][${imgLabel}]overlay=(W-w)/2:(H-h)/2:enable='between(t,${i * 5},${(i + 1) * 5})'[${next}];`;

    lastOutput = next;
  });

  filter += `[${lastOutput}]format=yuv420p[outv]`;

  return filter.replace(/\n/g, '');
}

function createVideo() {
  const images = fs.readdirSync(IMAGES_DIR)
    .filter(file => /^\d+\.png$/.test(file))
    .sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]))
    .map(file => path.join(IMAGES_DIR, file));

  if (images.length === 0) {
    console.error("No images found in the public folder.");
    return;
  }

  const bgVideo = getRandomBackgroundVideo();
  const inputFiles = [`-i "${bgVideo}"`, ...images.map(img => `-i "${img}"`)].join(" ");
  const filterGraph = generateFilter(images);
  const duration = images.length * 5;

  const cmd = `ffmpeg -y ${inputFiles} -filter_complex "${filterGraph}" -map "[outv]" -t ${duration} "${OUTPUT}"`;

  console.log("Generating video from images...");
  exec(cmd, (err) => {
    if (err) return console.error("FFmpeg error (image video):", err);

    console.log("✅ Video generated. Launching audio transcription...");

    exec(`python mp3ToSRT.py ${NAME}`, (err2) => {
      if (err2) return console.error("Transcription error (.srt):", err2);

      console.log("✅ Subtitles generated. Creating final.mp4...");

      const finalCmd = `ffmpeg -y -i "../${NAME}/public/output.mp4" -i "../${NAME}/public/audio.mp3" -vf subtitles="../${NAME}/public/output.srt" -map 0:v -map 1:a -c:v libx264 -c:a aac -shortest "${FINAL}"`;

      exec(finalCmd, (err3) => {
        if (err3) return console.error("FFmpeg error (final.mp4):", err3);
        console.log("🎉 Final video generated with audio and subtitles:", FINAL);
      });
    });
  });
}

createVideo();
