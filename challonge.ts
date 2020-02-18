import fs from "fs";
import _cliProgress from "cli-progress";
import axios from "axios";
import { Config } from ".";
import ora from "ora";
import inquirer from "inquirer";

const formatRound = (round: number) => {
    return round > 0 ? `Winners Round ${round}` : `Losers Round ${round * -1}`;
};

async function createFolders(config: Config) {
    const DIR = config.DIR;

    let eventSlug;

    if (!config.CHALLONGE_API) {
        throw Error("Challonge API Key is missing, please add it your config");
    }

    if (!config.CHALLONGE_EVENT) {
        const answers = await inquirer.prompt([
            {
                name: "slug",
                message: "Please provide Challonge Event Slug:",
            },
        ]);

        eventSlug = answers.slug;
    } else {
        eventSlug = config.CHALLONGE_EVENT;
    }

    const API = config.CHALLONGE_API;
    const spinner = ora("Getting data from challonge... \n").start();

    const matchResponse = await axios.get(
        `https://api.challonge.com/v1/tournaments/${eventSlug}/matches.json?api_key=${API}`
    );

    const partResponse = await axios.get(
        `https://api.challonge.com/v1/tournaments/${eventSlug}/participants.json?api_key=${API}`
    );

    spinner.succeed();

    const stats = {
        created: 0,
        skipped: 0,
    };

    const matches: any[] = await matchResponse.data;
    const playerData = await partResponse.data;
    const players = playerData.reduce((acc, curr) => {
        acc[curr.participant.id] = curr.participant.name;
        return acc;
    }, {});

    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar.start(matches.length, 0);

    for (const i in matches) {
        bar.update(Number(i));
        const match = matches[i].match;
        let title = `${formatRound(match.round)} ${
            players[match.player1_id]
        } vs ${players[match.player2_id]}`;
        let folder = `${DIR}/${title}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            stats.created++;
        } else {
            stats.skipped++;
        }
    }

    bar.update(matches.length);
    bar.stop();
    console.log(
        "\nFinished: %d Folders created, %d skipped",
        stats.created,
        stats.skipped
    );

    return true; // exit async
}

export default createFolders;
