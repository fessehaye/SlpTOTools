import OBSWebSocket from "obs-websocket-js";
import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import { exec,execSync } from 'child_process';
const { default: SlippiGame } = require('slp-parser-js');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


(async function(){
    try {
        
        const obs = new OBSWebSocket();
        
        await obs.connect({ address: 'localhost:4444',password: 'slippi' });

        console.log('Connection Opened');

        await obs.send('SetCurrentScene', {
            'scene-name': 'Slippi'
        });

        const DIR = process.env.DIR;

        const folders = fs.readdirSync(DIR).filter(f => fs.statSync(join(DIR, f)).isDirectory());

        folders.forEach( async (folder) => {
            const files = fs.readdirSync(`${DIR}\\${folder}`).filter(file => file.includes("slp"));
            const totalSeconds = files.reduce((acc,curr) => {
                const game = new SlippiGame(`${DIR}\\${folder}\\${curr}`);
                const count = Math.ceil(game.getMetadata().lastFrame/60);
                return acc + count;
            },0);
            console.log("calc files");
            const file = `"${DIR}\\${folders}\\start.bat"`;
           
            execSync(file);
            console.log("running dolpin");
            await sleep((totalSeconds+30)*1000);
            execSync('taskkill /F /IM "Dolphin.exe" /T');

        })
    }
    catch (error) {
        console.error(error);
    }
    
})()