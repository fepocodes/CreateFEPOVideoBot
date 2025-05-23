const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = "../../private/googleAuthToken.json";
const VIDEO_PATH = "video.mp4";

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync("../../private/googleClientSecret.json"));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this URL:", authUrl);
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise(resolve => {
    readline.question("Enter the code from that page here: ", resolve);
  });

  readline.close();
  const token = (await oAuth2Client.getToken(code)).tokens;
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function uploadVideo(auth) {
  try {
    const youtube = google.youtube({ version: "v3", auth });

    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: "Your Draft Video Title",
          description: "Description of the draft video",
          tags: ["example", "draft", "video"],
        },
        status: {
          privacyStatus: "unlisted",
        },
      },
      media: {
        body: fs.createReadStream(VIDEO_PATH),
      },
    });
    if (res?.data?.id) {
      console.log("✅ Video uploaded :", "https://www.youtube.com/watch?v=" + res.data.id);
      return ("https://www.youtube.com/watch?v=" + res.data.id)
    } else return 0
  } catch (e) {
    console.log('Error in upload Youtube', e.message)
    return 0
  }
}

async function start() {
  try {
    let auth = await authorize()
    if (auth) {
      let ytURL = await uploadVideo(auth)
      if (ytURL) {
        
      }
    }
  } catch (e) {
    console.log('Error in start Promote', e.message)
  }
}
start()

