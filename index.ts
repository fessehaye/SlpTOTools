#!/usr/bin/env node

import SmashGG from "./gg";
import Challonge from "./challonge";
import Filter from "./filter";
import Record from "./record";
import fs from "fs";
import inquirer from "inquirer";
import chalk from "chalk";

export interface Config {
    DIR: string;
    GG_SLUG?: string;
    GG_API?: string;
    CHALLONGE_API?: string;
    CHALLONGE_EVENT?: string;
    DOLPHIN?: string;
    OBS_PORT?: string;
    ISO?: string;
    OBS_SCENE?: string;
    OBS_PASS?: string;
    OBS_EXE?: string;
    OBS_BUFFER: number;
}

async function index(): Promise<void> {
    try {
        if (process.argv.length < 3) {
            throw Error("Config json is missing");
        }

        const rawdata: Buffer = fs.readFileSync(
            process.argv[process.argv.length - 1]
        );
        const config: Config = JSON.parse(rawdata.toString());

        console.clear();
        console.log(
            chalk.yellow(
                "Make sure you setup your OBS websocket and settings! \n"
            )
        );

        while (true) {
            const choice = await inquirer.prompt([
                {
                    type: "list",
                    name: "option",
                    message: chalk.blue("Which option do you need?"),
                    choices: [
                        "Create Folders from Challonge bracket",
                        "Create Folders from Smash.gg bracket",
                        new inquirer.Separator(),
                        "Filter and setup folder replays",
                        "Setup and Record Slippi Sessions",
                        new inquirer.Separator(),
                        "Upload to Youtube",
                        new inquirer.Separator(),
                        "Quit",
                        new inquirer.Separator(),
                    ],
                },
            ]);

            switch (choice.option) {
                case "Create Folders from Challonge bracket":
                    await Challonge(config);
                    break;
                case "Create Folders from Smash.gg bracket":
                    await SmashGG(config);
                    break;
                case "Filter and setup folder replays":
                    await Filter(config);
                    break;
                case "Setup and Record Slippi Sessions":
                    await Filter(config);
                    await Record(config);
                    break;
                case "Upload to Youtube":
                    console.log(chalk.red("Coming soon..."));
                    break;
                case "Quit":
                    process.exit();
                default:
                    break;
            }
        }
    } catch (error) {
        console.error(chalk.red(error));
        process.exit();
    }
}

index();
