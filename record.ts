import OBSWebSocket from "obs-websocket-js";
import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import { exec,execSync } from 'child_process';
const { default: SlippiGame } = require('slp-parser-js');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const obs = new OBSWebSocket();
const DIR = process.env.DIR;


async function record(folder):Promise<void> {
    try {
        const files = fs.readdirSync(`${DIR}\\${folder}`).filter(file => file.includes("slp"));
        const totalSeconds = files.reduce((acc,curr) => {
            const game = new SlippiGame(`${DIR}\\${folder}\\${curr}`);
            const count = Math.ceil(game.getMetadata().lastFrame/60);
            return acc + count;
        },0);
                
        console.log(`${folder} is being played`);
        const file = `"${DIR}\\${folder}\\start.bat"`;
        
        await obs.send('SetRecordingFolder', {
            'rec-folder': `${DIR}\\${folder}\\`
        });

        exec(file);
        console.log("running dolphin");
        await obs.send('StartStopRecording');

        // wait 5 additional seconds
        console.log(`Waiting ${totalSeconds+10} seconds`);

        await sleep((totalSeconds+10)*1000);
        await obs.send('StartStopRecording');
        execSync('taskkill /F /IM "Dolphin.exe" /T');
        return Promise.resolve();
    } catch (error) {
        console.log(error);
    }
}
(async function(){
    try {

        await obs.connect({ address: 'localhost:4444',password: 'slippi' });

        console.log('Connection Opened');

        await obs.send('SetCurrentScene', {
            'scene-name': 'Slippi'
        });

        const folders = fs.readdirSync(DIR).filter(f => fs.statSync(join(DIR, f)).isDirectory());

        const recordTasks = folders.reduce((tasks,folder,index) => {
            return tasks.then(async () => {
                return record(folder);
            });
        },Promise.resolve());
        
    }
    catch (error) {
        console.error(error);
    }
    
})()