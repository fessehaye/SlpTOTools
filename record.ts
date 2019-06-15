import OBSWebSocket from "obs-websocket-js";
import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import { execFile } from 'child_process';


(async function(){
    try {
        const dolphin = process.env.DOLPHIN;
        const obs = new OBSWebSocket();
        
        await obs.connect({ address: 'localhost:4444',password: 'slippi' });

        console.log('Connection Opened');

        await obs.send('SetCurrentScene', {
            'scene-name': 'Slippi'
        });

        const DIR = process.env.DIR;

        const folders = fs.readdirSync(DIR).filter(f => fs.statSync(join(DIR, f)).isDirectory());

        const file = `"${DIR}\\${folders[0]}\\queue.json"`.split('\\').join('\\');
        console.log(file);
        execFile(dolphin,['-e',process.env.ISO,'-i',file]);
        folders.forEach( (folder) => {
            

        })
    }
    catch (error) {
        console.error(error);
    }
    
})()