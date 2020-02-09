import OBSWebSocket from "obs-websocket-js";
import "dotenv/config";
import fs from "fs";
import { join } from "path";
import { exec, execSync } from "child_process";
const { default: SlippiGame } = require("slp-parser-js");
import ora from "ora";

const sleep = s => new Promise(resolve => setTimeout(resolve, s * 1000));
const obs = new OBSWebSocket();
const DIR = process.env.DIR;
const BUFFER = 10;

const parseTime = (time: number): string => {
    const sec = time % 60;
    const min = Math.floor(time / 60);
    return `${min} minutes and ${sec} seconds`;
};

export async function record(folder): Promise<boolean> {
    try {
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

async function recordSession(): Promise<boolean> {
    try {
        await obs.connect({
            address: `localhost:${process.env.OBS_PORT}`,
            password: process.env.OBS_PASS,
        });

        console.log("Connection Opened");

        await obs.send("SetCurrentScene", {
            "scene-name": process.env.OBS_SCENE,
        });

        const folders = fs
            .readdirSync(DIR)
            .filter(f => fs.statSync(join(DIR, f)).isDirectory());

        return folders
            .reduce((tasks, folder, index) => {
                return tasks.then(async () => {
                    console.log(`\n${index + 1} / ${folders.length}`);
                    return record(folder);
                });
            }, Promise.resolve(true))
            .then(() => {
                console.log("finished all sets!");
                return true;
            });
    } catch (error) {
        console.error(error);
        obs.send("StopRecording");
        return false;
    }
}

export default recordSession;
