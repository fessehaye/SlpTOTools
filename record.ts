import OBSWebSocket from "obs-websocket-js";
import fs from "fs";
import { join } from "path";
import { exec, execSync, execFile } from "child_process";
import SlippiGame from "slp-parser-js";
import ora from "ora";
import { Config } from ".";

const sleep = (s: number) =>
    new Promise(resolve => setTimeout(resolve, s * 1000));

const obs = new OBSWebSocket();

const BUFFER = 10;

const parseTime = (time: number): string => {
    const sec = time % 60;
    const min = Math.floor(time / 60);
    return `${min} minutes and ${sec} seconds`;
};

const outputTypes: string[] = ["mp4", "flv", "ts", "mov", "mkv", "m3u8"];

export async function record(folder, DIR: string): Promise<boolean> {
    try {
        const allfiles = fs.readdirSync(`${DIR}\\${folder}`);

        const videoIncluded: boolean = allfiles.some((f: string) => {
            return outputTypes.some((output: string) => {
                return f.includes(output);
            });
        });

        if (videoIncluded) {
            console.log("Video file found in directory, skipping this folder!");
            return true;
        }

        const files = fs
            .readdirSync(`${DIR}\\${folder}`)
            .filter(file => file.includes("slp"));
        const totalSeconds = files.reduce((acc, curr) => {
            const game = new SlippiGame(`${DIR}\\${folder}\\${curr}`);
            const count = Math.ceil(game.getMetadata().lastFrame / 60);
            return acc + count;
        }, 0);

        console.log(`${folder} is being played`);
        const file = `"${DIR}\\${folder}\\start.bat"`;

        await obs.send("SetRecordingFolder", {
            "rec-folder": `${DIR}\\${folder}\\`,
        });

        exec(file);
        console.log("Running dolphin");
        await obs.send("StartRecording");

        // wait additional seconds
        const spinner = ora(
            `Waiting ${parseTime(totalSeconds + BUFFER * files.length)}`
        ).start();

        await sleep(totalSeconds + BUFFER * files.length);
        await obs.send("StopRecording");

        spinner.succeed();
        //might have to change these sleep timing depending on how slow your computer is
        await sleep(3);

        console.log("Clearing Dolphin Instance");
        execSync('taskkill /F /IM "Dolphin.exe" /T');
        await sleep(2);
        return true;
    } catch (error) {
        console.log(error);
    }
}

async function recordSession(config: Config): Promise<boolean> {
    try {
        const DIR = config.DIR;

        console.log("Starting OBS...");

        process.chdir(
            config.OBS_EXE.split("\\")
                .slice(0, -1)
                .join("\\")
        );
        execFile(config.OBS_EXE);

        await sleep(3);

        await obs.connect({
            address: `localhost:${config.OBS_PORT}`,
            password: config.OBS_PASS,
        });

        console.log("Connection Opened");

        await obs.send("SetCurrentScene", { "scene-name": config.OBS_SCENE });

        const folders = fs
            .readdirSync(DIR)
            .filter(f => fs.statSync(join(DIR, f)).isDirectory());

        // Create a chain of promises to record each set on OBS
        return folders
            .reduce((tasks, folder, index) => {
                return tasks.then(async () => {
                    // Record Set one after another, wait for the previous recording to resolve
                    // before starting another session
                    console.log(`\n${index + 1} / ${folders.length}`);
                    return record(folder, DIR);
                });
            }, Promise.resolve(true))
            .then(() => {
                console.log("Finished all sets! \n");
                obs.disconnect();
                return true;
            });
    } catch (error) {
        console.error(error);
        obs.send("StopRecording");
        return false;
    }
}

export default recordSession;
