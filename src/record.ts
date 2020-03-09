import OBSWebSocket from "obs-websocket-js";
import fs from "fs";
import { join } from "path";
import { exec, execSync, execFile } from "child_process";
import SlippiGame from "slp-parser-js";
import ora from "ora";
import { Config } from ".";
import chalk from "chalk";

const sleep = (s: number) =>
    new Promise(resolve => setTimeout(resolve, s * 1000));

const obs = new OBSWebSocket();

const parseTime = (time: number): string => {
    const sec = time % 60;
    const min = Math.floor(time / 60);
    return `${min} minutes and ${sec} seconds`;
};

export const outputTypes: string[] = ["mp4", "flv", "ts", "mov", "mkv", "m3u8"];

export async function record(
    folder: string,
    DIR: string,
    BUFFER: number
): Promise<boolean> {
    try {
        const currentDirectory: string = `${DIR}\\${folder}`;
        const allfiles: string[] = fs.readdirSync(currentDirectory);

        const videoIncluded: boolean = allfiles.some((f: string) => {
            return outputTypes.some((output: string) => {
                return f.includes(output);
            });
        });

        if (videoIncluded) {
            console.log(
                chalk.yellow(
                    `Video file found in ${currentDirectory}, skipping this folder!`
                )
            );

            return true;
        }

        const files: string[] = fs
            .readdirSync(`${DIR}\\${folder}`)
            .filter(file => file.includes("slp"));

        const totalSeconds = files.reduce((acc, curr) => {
            const game = new SlippiGame(`${DIR}\\${folder}\\${curr}`);
            const count = Math.ceil(game.getMetadata().lastFrame / 60);
            return acc + count;
        }, 0);

        console.log(chalk.bold.bgGreen(`${folder} is being played`));
        const file = `"${DIR}\\${folder}\\start.bat"`;

        await obs.send("SetRecordingFolder", {
            "rec-folder": `${DIR}\\${folder}\\`,
        });

        await obs.send("SetFilenameFormatting", {
            "filename-formatting": `${folder}`,
        });

        exec(file);
        await obs.send("StartRecording");

        const calculatedWait: number = totalSeconds + BUFFER * files.length;
        // wait additional seconds
        const spinner = ora(`Waiting ${parseTime(calculatedWait)}`).start();

        await sleep(calculatedWait);
        await obs.send("StopRecording");

        spinner.succeed();
        //might have to change these sleep timing depending on how slow your computer is
        await sleep(3);
        console.log(chalk.green("Recording Saved!"));

        execSync('taskkill /F /IM "Dolphin.exe" /T');
        await sleep(2);
        return true;
    } catch (error) {
        console.error(chalk.red(error));
    }
}

async function recordSession(config: Config): Promise<boolean> {
    try {
        const DIR = config.DIR;
        const BUFFER = config.OBS_BUFFER | 10;

        process.chdir(
            config.OBS_EXE.split("\\")
                .slice(0, -1)
                .join("\\")
        );

        let isOBSon = execSync("tasklist /FO CSV")
            .toString()
            .includes("obs");

        if (!isOBSon) {
            console.log("Starting OBS...");
            execFile(config.OBS_EXE);
        }

        while (!isOBSon) {
            await sleep(3);
            isOBSon = execSync("tasklist /FO CSV")
                .toString()
                .includes("obs");
        }

        await obs.connect({
            address: `localhost:${config.OBS_PORT}`,
            password: config.OBS_PASS,
        });

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
                    console.log(`\n${index + 1}/${folders.length}`);
                    return record(folder, DIR, BUFFER);
                });
            }, Promise.resolve(true))
            .then(() => {
                console.log(chalk.green("\nFinished all sets! \n"));
                obs.disconnect();
                return true;
            });
    } catch (error) {
        console.error(chalk.red(error));
        obs.send("StopRecording");
        return false;
    }
}

export default recordSession;
