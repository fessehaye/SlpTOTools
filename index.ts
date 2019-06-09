import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import smashgg from 'smashgg.js';
import _cliProgress from 'cli-progress';
const DIR = process.env.DIR;

const {Event,Log} = smashgg;

Log.silent = true;
smashgg.initialize(process.env.API);

const formatName = (tag) => {return tag.includes('|') ? tag.split('|')[1].trim() : tag}
const prefix = num => {
    switch (num) {
        case 1:
            return "st"
        case 2: 
            return "nd"
        case 3:
            return "rd"
        default:
            return "th"
    }
}

(async function(){
    let tournamentSlug = 'smash-and-ladders';
    let eventSlug = 'melee-singles';
    console.log("Getting data from smash.gg... \n");

    let eventTarget = await Event.get(tournamentSlug, eventSlug);

    let sets = await eventTarget.getSets();
    const stats = {
        created: 0,
        nested: 0,
    }

    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    bar.start(sets.length, 0);

    for(var i in sets){
        bar.update(i);
        let title = `${String(sets[i].getFullRoundText())} ${formatName(sets[i].player1.tag)} vs ${formatName(sets[i].player2.tag)}`;
        let folder = `${DIR}/${title}`;

        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
            stats.created++
        }
        else {
            let numOfDirectories = fs.readdirSync(folder)
                                    .filter(f => fs.statSync(join(folder, f)).isDirectory()).length;
            fs.mkdirSync(`${folder}/${numOfDirectories+1}${prefix(numOfDirectories+1)} Set`);
            stats.nested++;
        }

    }
    bar.stop();
    console.log("\nFinished: %d Folders created, %d nested",stats.created,stats.nested);
    process.exit();
    return true; // exit async
})()