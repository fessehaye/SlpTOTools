import 'dotenv/config';
import fs from 'fs';
import smashgg from 'smashgg.js';
import _cliProgress from 'cli-progress';
const DIR = process.env.DIR;

const {Event,Log} = smashgg;

Log.silent = true;
smashgg.initialize(process.env.API);

const formatName = (tag) => {return tag.includes('|') ? tag.split('|')[1].trim() : tag}

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
            stats.nested++;
        }

    }
    bar.stop();
    console.log("\nFinished: %d Folders created, %d skipped",stats.created,stats.nested);
    process.exit();
    return true; // exit async
})()