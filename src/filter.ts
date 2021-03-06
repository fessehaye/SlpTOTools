import fs from "fs";
import { join } from "path";
import rimraf from "rimraf";
import chalk from "chalk";
import { Config } from ".";

type Stats = {
    created: number;
    deleted: number;
};

async function filterFolders(config: Config): Promise<boolean> {
    const DIR: string = config.DIR;

    const folders: string[] = fs
        .readdirSync(DIR)
        .filter(f => fs.statSync(join(DIR, f)).isDirectory());

    const stats: Stats = {
        created: 0,
        deleted: 0,
    };

    for (const folder of folders) {
        const subFolder = `${DIR}\\${folder}`;
        const files = fs.readdirSync(subFolder);

        if (files.length) {
            const jsonFile = files.reduce(
                (query, file) => {
                    if (file.includes("slp")) {
                        query.queue.push({
                            path: `${subFolder}\\${file}`
                                .split("\\")
                                .join("\\"),
                        });
                    }
                    return query;
                },
                {
                    mode: "queue",
                    queue: [],
                }
            );
            const queue = `${subFolder}\\queue.json`;
            fs.writeFileSync(queue, JSON.stringify(jsonFile, null, 2));

            const [dolphin, iso] = [config.DOLPHIN, config.ISO];

            fs.writeFileSync(
                `${subFolder}\\start.bat`,
                `START "" "${dolphin}" -i "${queue}" -e "${iso}"`
            );
            stats.created++;
        } else {
            rimraf.sync(subFolder);
            stats.deleted++;
        }
    }

    console.log(
        chalk.green(
            "\nFinished: %d Folders queued, %d empty folders deleted \n"
        ),
        stats.created,
        stats.deleted
    );
    return true;
}

export default filterFolders;
