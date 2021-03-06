import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";
import os from "os";
import { join } from "path";
import { Config } from ".";

async function config(): Promise<void> {
    const help = await inquirer.prompt([
        {
            type: "list",
            name: "answer",
            message: chalk.bold("Do you want to create a config file?"),
            choices: ["YES", "NO"]
        }
    ]);

    if (help.answer === "NO") {
        process.exit();
    }

    const data = await inquirer.prompt([
        {
            name: "directory",
            message: "Target Directory:",
            default: process.cwd()
        },
        {
            name: "dolphin",
            message: "Dolphin Exe Path:",
            default: join(
                os.homedir(),
                "AppData",
                "Roaming",
                "Slippi Desktop App",
                "dolphin",
                "Dolphin.exe"
            )
        },
        {
            name: "iso",
            message: "Melee ISO Path:",
            default: join(process.cwd(), "game.iso")
        },
        {
            name: "obs_exe",
            message: "OBS Exe Path:",
            default: join(
                "C:",
                "Program Files",
                "obs-studio",
                "bin",
                "64bit",
                "obs64.exe"
            )
        },
        {
            name: "obs_port",
            message: "OBS Websocket Port:",
            default: "4444"
        },
        {
            name: "obs_pass",
            message: "OBS Websocket Password:",
            default: "slippi"
        },
        {
            name: "obs_scene",
            message: "OBS Scene being used for recording:",
            default: "Slippi"
        }
        // {
        //     name: "client",
        //     message: "Youtube Client ID:",
        //     default: "N/A",
        // },
        // {
        //     name: "secret",
        //     message: "Youtube Client ID:",
        //     default: "N/A",
        // },
    ]);

    const configJson: Config = {
        DIR: data.directory.split("\\").join("\\"),
        OBS_PORT: data.obs_port,
        OBS_SCENE: data.obs_scene,
        OBS_PASS: data.obs_pass,
        OBS_EXE: data.obs_exe.split("\\").join("\\"),
        DOLPHIN: data.dolphin.split("\\").join("\\"),
        ISO: data.iso.split("\\").join("\\")
        // CLIENT_ID: data.client,
        // CLIENT_SECRET: data.secret,
    };

    console.log(
        chalk.green("config.json is created! \nRun: slp-recorder config.json")
    );
    fs.writeFileSync("config.json", JSON.stringify(configJson, null, 2));
    process.exit();
}

export default config;
