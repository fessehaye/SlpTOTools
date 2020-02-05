import SmashGG from "./gg";
import Challonge from "./challonge";
import Filter from "./filter";
import Record from "./record";

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});

const prompt = require("prompt-sync")();

(async function() {
    try {
        console.log(
            "Make sure you setup your .env file and your OBS websocket and settings! \n"
        );

        while (true) {
            console.log("Which option do you need? \n");

            console.log("1: Create Folders from Challonge bracket");
            console.log("2: Create Folders from Smash.gg bracket");
            console.log("3: Filter and setup folder replays");
            console.log("4: Record Slippi Sessions \n");
            console.log("5: Quit \n");

            const choice = prompt("");
            switch (choice) {
                case "1":
                    await Challonge();
                    break;
                case "2":
                    await SmashGG();
                    break;
                case "3":
                    await Filter();
                    break;
                case "4":
                    await Record();
                    break;
                case "5":
                    process.exit();
                    break;
                default:
                    console.log("choose a real option...");
                    break;
            }
        }
    } catch (error) {
        console.log(error);
        process.exit();
    }
})();
