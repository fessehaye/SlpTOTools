import fs from "fs";
import { Config } from ".";
import { join } from "path";
import chalk from "chalk";
import { google } from "googleapis";
import { outputTypes } from "./record";

const OAuth2 = google.auth.OAuth2;

async function upload(config: Config): Promise<boolean> {
    try {
        const DIR = config.DIR;
        const folders = fs
            .readdirSync(DIR)
            .filter(f => fs.statSync(join(DIR, f)).isDirectory());
        for (const folder of folders) {
            const subFolder = `${DIR}\\${folder}`;
            const files = fs.readdirSync(subFolder);

            const video: string[] = files.filter((f: string) => {
                return outputTypes.some((output: string) => {
                    return f.includes(output);
                });
            });

            if (video.length === 1) {
                console.log(
                    chalk.greenBright(`Uploading ${video[0]} as ${folder}`)
                );
            }
        }
        return true;
    } catch (error) {
        console.error(chalk.red(error));
    }
}

export default upload;
