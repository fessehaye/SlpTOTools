// import fs from "fs";
// import opn from "opn";
// import Lien from "lien";
// import Youtube from "youtube-api";
// import { Config } from ".";
// import { join } from "path";
// import chalk from "chalk";
// import { outputTypes } from "./record";
// import ora from "ora";

// async function uploadAuth(config: Config): Promise<boolean> {
//     try {
//         let server = new Lien({
//             host: "localhost",
//             port: 5000,
//         });
//         // Authenticate
//         // You can access the Youtube resources via OAuth2 only.
//         // https://developers.google.com/youtube/v3/guides/moving_to_oauth#service_accounts
//         let oauth = Youtube.authenticate({
//             type: "oauth",
//             client_id: config.CLIENT_ID,
//             client_secret: config.CLIENT_SECRET,
//             redirect_url: "http://localhost:5000/oauth2callback",
//         });

//         opn(
//             oauth.generateAuthUrl({
//                 access_type: "offline",
//                 scope: ["https://www.googleapis.com/auth/youtube.upload"],
//             })
//         );

//         await auth(server, oauth, config);

//         return true;
//     } catch (error) {
//         console.error(chalk.red(error));
//         return false;
//     }
// }

// async function uploadVideos(config: Config): Promise<boolean> {
//     try {
//         const DIR = config.DIR;
//         const folders = fs
//             .readdirSync(DIR)
//             .filter(f => fs.statSync(join(DIR, f)).isDirectory());

//         for (const folder of folders) {
//             const subFolder = `${DIR}\\${folder}`;
//             const files = fs.readdirSync(subFolder);

//             const video: string[] = files.filter((f: string) => {
//                 return outputTypes.some((output: string) => {
//                     return f.includes(output);
//                 });
//             });

//             if (video.length > 0) {
//                 const spinner = ora(
//                     chalk.green(`Uploading ${video[0]} as ${folder}`)
//                 ).start();
//                 await upload(`${DIR}\\${folder}\\${video}`, folder);
//                 spinner.succeed();
//             } else {
//                 console.log(chalk.red(`No video can be found in ${folder}`));
//             }
//         }
//         console.log(chalk.green(`\n Finished uploading all videos`));
//         return true;
//     } catch (error) {
//         console.error(chalk.red(error));
//         return false;
//     }
// }

// let upload = (video: string, name: string) => {
//     return new Promise((resolve, reject) => {
//         var req = Youtube.videos.insert(
//             {
//                 resource: {
//                     // Video title and description
//                     snippet: {
//                         title: name,
//                         description: "Slippi Recordings",
//                     },
//                     // I don't want to spam my subscribers
//                     status: {
//                         privacyStatus: "private",
//                         madeForKids: false,
//                         selfDeclaredMadeForKids: false,
//                     },
//                 },
//                 // This is for the callback function
//                 part: "snippet,status",

//                 // Create the readable stream to upload the video
//                 media: {
//                     body: fs.createReadStream(video),
//                 },
//             },
//             (err, data) => {
//                 if (err) {
//                     console.error(chalk.red(err));
//                     resolve(true);
//                 }
//                 resolve(true);
//             }
//         );
//     });
// };

// let auth = (server, oauth, config) => {
//     return new Promise((resolve, reject) => {
//         server.addPage("/oauth2callback", lien => {
//             oauth.getToken(lien.query.code, async (err, tokens) => {
//                 if (err) {
//                     lien.lien(err, 400);
//                     reject(err);
//                 }

//                 oauth.setCredentials(tokens);

//                 lien.end(
//                     "You are now connected,please wait as we upload your videos."
//                 );

//                 resolve(await uploadVideos(config));
//             });
//         });
//     });
// };

// export default uploadAuth;
