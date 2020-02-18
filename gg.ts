import fs from "fs";
import path from "path";
import "cross-fetch/polyfill";
import ApolloClient, { gql } from "apollo-boost";
import _cliProgress from "cli-progress";
import ora from "ora";
import { Config } from ".";
import inquirer from "inquirer";

export const GET_EVENT_COUNT = gql`
    query eventQuery($slug: String) {
        event(slug: $slug) {
            sets(sortType: STANDARD, perPage: 20) {
                pageInfo {
                    total
                    totalPages
                }
            }
        }
    }
`;

export const GET_EVENT_SETS = gql`
    query eventQuery($slug: String, $page: Int) {
        event(slug: $slug) {
            sets(sortType: STANDARD, perPage: 20, page: $page) {
                nodes {
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

type EntrantData = {
    entrant: { name: string };
};
type Set = {
    fullRoundText: string;
    slots: EntrantData[];
};

const formatName = (tag: string): string => {
    return tag.includes("|") ? tag.split("|")[1].trim() : tag;
};

const createTitle = (set: Set): string => {
    const [p1, p2] = [
        formatName(set.slots[0].entrant.name),
        formatName(set.slots[1].entrant.name),
    ];
    return `${set.fullRoundText} ${p1} vs ${p2}`;
};

async function createFolders(config: Config): Promise<boolean> {
    let tournamentSlug;
    const DIR = config.DIR;

    if (!config.GG_API) {
        throw Error("Smash.gg API Key is missing please add it your config");
    }

    if (!config.GG_SLUG) {
        const answers = await inquirer.prompt([
            {
                name: "slug",
                message: "Please provide Smash.gg Event Slug:",
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
    const { totalPages } = pageInfo;

    const queries = [...new Array(totalPages).keys()].map(index => {
        return client.query({
            query: GET_EVENT_SETS,
            variables: {
                slug: tournamentSlug,
                page: index + 1,
            },
        });
    });
    const sets: Set[] = (await Promise.all(queries)).reduce((prev, curr) => {
        return [...prev, ...curr.data.event.sets.nodes];
    }, []);

    const stats = {
        created: 0,
        skipped: 0,
    };

    spinner.succeed();
    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar.start(sets.length, 0);

    for (let i in sets) {
        bar.update(parseInt(i));
        let title = createTitle(sets[i]);
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
        "\nFinished: %d Folders created, %d skipped",
        stats.created,
        stats.skipped
    );

    return true; // exit async
}

export default createFolders;
