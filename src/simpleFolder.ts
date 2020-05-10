import { Config } from ".";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";

async function simpleFolder(config: Config) {
    const DIR = config.DIR;

    const answers = await inquirer.prompt([
        {
            name: "name",
            message: chalk.bold("Please provide folder name:"),
        },
        {
            type: "input",
            name: "quantity",
            default: 1,
            message: "How many folders?",
            validate: function (value) {
                var valid = !isNaN(parseFloat(value));
                return valid || "Please enter a number";
            },
            filter: Number,
        },
    ]);

    const { name, quantity } = answers;

    if (quantity === 1) {
        const folder = `${DIR}/${name}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    } else {
        for (let index = 0; index < quantity; index++) {
            const folder = `${DIR}/${name} (${index + 1}) `;

            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
        }
    }

    console.log(chalk.green("\nFinished: %d Folders created"), quantity);

    return true; // exit async
}

export default simpleFolder;
