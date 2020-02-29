import fs from "fs";
import path from "path";
import _cliProgress from "cli-progress";
import ora from "ora";
import { Config } from ".";
import inquirer from "inquirer";
import chalk from "chalk";
import axios from "axios";

type EntrantData = {
    entrant: { name: string };
};

type Set = {
    phaseGroupId: number;
    fullRoundText: string;
    slots: EntrantData[];
};

type Phase = {
    name: string;
    id: number;
};

type PhaseGroup = {
    phaseId: number;
    id: number;
};

type Stats = {
    created: number;
    skipped: number;
};

const formatName = (tag: string): string => {
    return tag.includes("|") ? tag.split("|")[1].trim() : tag;
};

const createTitle = (set: Set, phaseGroupsMap: any): string => {
    const [p1, p2] = [
        formatName(set.slots[0].entrant.name),
        formatName(set.slots[1].entrant.name),
    ];
    return `${phaseGroupsMap[set.phaseGroupId]} - ${
        set.fullRoundText
    } - ${p1} vs ${p2}`.replace(/[.?]/g, "");
};

async function createFolders(config: Config): Promise<boolean> {
    let tournamentSlug: string;
    const DIR: string = config.DIR;

    if (!config.GG_SLUG) {
        const answers = await inquirer.prompt([
            {
                name: "slug",
                message: chalk.blue("Please provide Smash.gg Event Slug:"),
            },
        ]);

        tournamentSlug = answers.slug;
    } else {
        tournamentSlug = config.GG_SLUG;
    }

    const spinner = ora("Getting data from smash.gg... \n").start();

    const eventInfo = await axios.get(
        `https://align-lby.begin.app/gg_info?slug=${encodeURIComponent(
            tournamentSlug
        )}`
    );

    const pageInfo = eventInfo.data.event.sets.pageInfo;
    const phaseGroups: PhaseGroup[] = eventInfo.data.event.phaseGroups;
    const phases: Phase[] = eventInfo.data.event.phases;
    const phasesMap = phases.reduce((prev, curr) => {
        prev[curr.id] = curr.name;
        return prev;
    }, {});
    const phaseGroupsMap = phaseGroups.reduce((prev, curr) => {
        prev[curr.id] = phasesMap[curr.phaseId];
        return prev;
    }, {});

    const { totalPages } = pageInfo;

    let sets: Set[] = [];

    for (let index = 0; index < totalPages; index++) {
        const setData = await axios.get(
            `https://align-lby.begin.app/gg_set?slug=${encodeURIComponent(
                tournamentSlug
            )}&page=${index + 1}`
        );

        const newSets: Set[] = setData.data.event.sets.nodes;
        sets = [...sets, ...newSets];
    }

    const stats: Stats = {
        created: 0,
        skipped: 0,
    };

    spinner.succeed();

    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar.start(sets.length, 0);

    for (let i in sets) {
        bar.update(parseInt(i));
        let title = createTitle(sets[i], phaseGroupsMap);
        let folder = path.join(DIR, title);

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            stats.created++;
        } else {
            stats.skipped++;
        }
    }
    bar.stop();
    console.log(
        chalk.green("\nFinished: %d Folders created, %d skipped"),
        stats.created,
        stats.skipped
    );

    return true; // exit async
}

export default createFolders;
