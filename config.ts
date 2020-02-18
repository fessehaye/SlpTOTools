import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";

async function config(): Promise<void> {
    const help = await inquirer.prompt([
        {
            type: "list",
            name: "answer",
            message: chalk.blue("Do you want to create a config file?"),
            choices: ["YES", "NO"],
        },
    ]);

    if (help.answer === "NO") {
        process.exit();
    }

    const data = await inquirer.prompt([
        {
            name: "directory",
            message: "Target Directory:",
        },
        {
            name: "obs_exe",
            message: "OBS Exe Path:",
        },
        {
            name: "obs_port",
            message: "OBS Websocket Port:",
            default: "4444",
        },
        {
            name: "obs_pass",
            message: "OBS Websocket Password:",
        },
        {
            name: "obs_scene",
            message: "OBS Scene being used for recording:",
            default: "Slippi",
        },
        {
            name: "iso",
            message: "Melee ISO Path:",
        },
        {
            name: "dolphin",
            message: "Dolphin Exe Path:",
        },
        {
            name: "gg",
            message: "Smash.gg API Key:",
            default: "N/A",
        },
        {
            name: "challonge",
            message: "Challonge API Key:",
            default: "N/A",
        },
    ]);

    const configJson = {
        DIR: data.directory.split("\\").join("\\"),
        GG_API: data.gg,
        CHALLONGE_API: data.challonge,
        OBS_PORT: data.obs_port,
        OBS_SCENE: data.obs_scene,
        OBS_PASS: data.obs_pass,
        OBS_EXE: data.obs_exe.split("\\").join("\\"),
        DOLPHIN: data.dolphin.split("\\").join("\\"),
        ISO: data.iso.split("\\").join("\\"),
    };

    console.log(
        chalk.green("config.json is created! \nRun: slp-recorder config.json")
    );
    fs.writeFileSync("config.json", JSON.stringify(configJson, null, 2));
    process.exit();
}

export default config;
