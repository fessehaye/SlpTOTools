import "dotenv/config";
import fs from "fs";
import path from "path";
import "cross-fetch/polyfill";
import ApolloClient, { gql } from "apollo-boost";
import _cliProgress from "cli-progress";
const DIR = process.env.DIR;

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

async function createFolders() {
    let tournamentSlug = process.env.GG_SLUG;

    const client = new ApolloClient({
        uri: "https://api.smash.gg/gql/alpha",
        request: operation => {
            operation.setContext({
                headers: {
                    authorization: `Bearer ${process.env.GG_API}`,
                },
            });
        },
    });

    console.log("Getting data from smash.gg... \n");

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

    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar.start(sets.length, 0);

    for (var i in sets) {
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
    process.exit();
    return true; // exit async
}

try {
    createFolders();
} catch (error) {
    console.log(error);
    process.exit();
}
