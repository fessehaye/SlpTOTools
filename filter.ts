import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import rimraf from 'rimraf';

(async function(){
    const DIR = process.env.DIR;

    const folders = fs.readdirSync(DIR).filter(f => fs.statSync(join(DIR, f)).isDirectory());
    
    folders.forEach( (folder) => {
        const subFolder = `${DIR}\\${folder}`;
        const files = fs.readdirSync(subFolder);
        if (files.length) {
            const jsonFile = files.reduce((query,file) => {
                if(file.includes("slp")){query.queue.push({path: `${subFolder}\\${file}`.split('\\').join('\\')})};
                return query;
            },{mode:"queue", queue:[]});
            const queue = `${subFolder}\\queue.json`;
            fs.writeFile(queue, JSON.stringify(jsonFile, null, 2), () => { console.log("Queue added!");}); 

            const [dolphin,iso] = [process.env.DOLPHIN,process.env.ISO];
            fs.writeFileSync(`${subFolder}\\start.bat`,`START "" "${dolphin}" -i "${queue}" -e "${iso}"`);
        }
        else {
            rimraf(subFolder, () => { console.log("Folder Deleted"); });
        }
    })

    
})();
