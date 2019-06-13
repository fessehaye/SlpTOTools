import 'dotenv/config';
import fs from 'fs';
import { join } from 'path';
import rimraf from 'rimraf';

(async function(){
    const DIR = process.env.DIR;

    const folders = fs.readdirSync(DIR).filter(f => fs.statSync(join(DIR, f)).isDirectory());
    
    folders.forEach( (folder) => {
        const subFolder = `${DIR}\\${folder}`;
        fs.readdir(subFolder, function(err, files) {
            if (err) {
               console.log(err);
            } else {
                if (files.length) {
                    const jsonFile = files.reduce((query,file) => {
                        query.queue.push({path: `${subFolder}\\${file}`.split('\\').join('\\')});
                        return query;
                    },{mode:"queue", queue:[]});
                    fs.writeFile(`${subFolder}\\queue.json`, JSON.stringify(jsonFile), () => { console.log("Queue added!");}); 
                }
                else {
                    rimraf(subFolder, () => { console.log("Folder Deleted"); });
                }
            }
        });
    })

    
})();
