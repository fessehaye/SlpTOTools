import fs from "fs";
import path from "path";
import "cross-fetch/polyfill";
import ApolloClient, { gql } from "apollo-boost";
import _cliProgress from "cli-progress";
import ora from "ora";
import { Config } from ".";
import inquirer from "inquirer";
import chalk from "chalk";

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

const GET_EVENT_COUNT = gql`
    query eventQuery($slug: String) {
        event(slug: $slug) {
            phases {
                name
                id
            }
            phaseGroups {
                id
                phaseId
            }
            sets(sortType: STANDARD, perPage: 20) {
                pageInfo {
                    total
                    totalPages
                }
            }
        }
    }
`;

const GET_EVENT_SETS = gql`
    query eventQuery($slug: String, $page: Int) {
        event(slug: $slug) {
            sets(sortType: STANDARD, perPage: 20, page: $page) {
                nodes {
                    phaseGroupId
                    fullRoundText
                    slots {
                        entrant {
                            name
                        }
                    }
                }
            }
        }
    }
`;

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
    } - ${p1} vs ${p2}`.replace(/[?]/g, "");
};

async function createFolders(config: Config): Promise<boolean> {
    let tournamentSlug: string;
    const DIR: string = config.DIR;

    if (!config.GG_API) {
        throw Error("Smash.gg API Key is missing please add it your config");
    }

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

    const client = new ApolloClient({
        uri: "https://api.smash.gg/gql/alpha",
        request: operation => {
            operation.setContext({
                headers: {
                    authorization: `Bearer ${config.GG_API}`,
                },
            });
        },
    });

    const spinner = ora("Getting data from smash.gg... \n").start();

    const eventInfo = await client.query({
        query: GET_EVENT_COUNT,
        variables: {
            slug: tournamentSlug,
        },
    });

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
        const setData = await client.query({
            query: GET_EVENT_SETS,
            variables: {
                slug: tournamentSlug,
                page: index + 1,
            },
        });

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
