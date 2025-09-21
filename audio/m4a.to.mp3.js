const ffmpeg = require('ffmpeg');  
const path = require('path');  
const chokidar = require('chokidar');  

const sourceBasicPath = `//DESKTOP-DP2PSM8/share/audio/m4a_to_mp3`;  
const targetBasicPath = `//DESKTOP-DP2PSM8/share/audio/m4a_to_mp3`;  

// Initialize the watcher  
const watcher = chokidar.watch(sourceBasicPath, {  
    persistent: true,  
    ignoreInitial: true, // Ignore initially added files  
});  

// Log when monitoring starts  
console.log(`Monitoring started on: ${sourceBasicPath}`);  

// Callback for when a new file is added  
watcher.on('add', filePath => {  
    // Check if the file has a .m4a extension  
    if (path.extname(filePath) === '.m4a') {  
        const filename = path.basename(filePath, '.m4a'); // Get the file name without the extension  
        const targetFile = path.join(targetBasicPath, `${filename}.mp3`);  

        // Log the detected file  
        console.log(`New file detected: ${filePath}`);  
        
        // Call the conversion function  
        m4aFileToMp3File(filePath, targetFile);  
    }  
});  

// Conversion function  
function m4aFileToMp3File(sourceFile, targetFile) {  
    const process = new ffmpeg(sourceFile);  
    process.then(video => {  
        video.fnExtractSoundToMP3(targetFile, (error, file) => {  
            if (!error) {  
                console.log('Audio file converted: ' + file);  
            } else {  
                console.log('Error during conversion: ' + error);  
            }  
        });  
    }, err => {  
        console.log('Error initializing ffmpeg: ' + err);  
    });  
}