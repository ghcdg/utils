const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const readline = require('readline');

// 如果你已经成功将FFmpeg的bin目录添加到系统PATH环境变量中，并且重启了命令行终端和代码编辑器/IDE，那么理论上fluent-ffmpeg会自动找到它。
// 无需特殊配置，你的代码可以保持得非常简洁，直接使用 ffmpeg() 即可
// 显式设置ffmpeg的绝对路径
// ffmpeg.setFfmpegPath("C:\\rick\\Software\\FFmpeg\\ffmpeg-8.0-full_build\\bin\\ffmpeg.exe");
// 通常ffprobe也在一起，如果需要也可以设置（例如用于获取视频时长等信息）
// ffmpeg.setFfprobePath("C:\\rick\\Software\\FFmpeg\\ffmpeg-8.0-full_build\\bin\\ffprobe.exe");


// 创建读取命令行输入的接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 设置源目录和目标目录
const sourceBasicPath = `//DESKTOP-DP2PSM8/share/video`;
const targetBasicPath = `//DESKTOP-DP2PSM8/share/video/converted`;

// 配置对象 - 可以在这里修改剪辑参数
// 支持多个片段配置，程序会依次处理每个片段
const clipConfigs = [
    {
        // 特殊配置：处理整个视频
        processFullVideo: false, // 设置为true表示处理整个视频
    },
    {
        startTime: '00:07:55', // 开始时间 (时:分:秒)
        endTime: '00:08:00',   // 结束时间 (时:分:秒)
        // 程序会自动计算持续时间
    },
    {
        startTime: '00:12:03', // 另一个片段开始时间
        endTime: '00:12:10',   // 另一个片段结束时间
    }
    // 可以继续添加更多片段配置...
];

// 计算每个片段的持续时间（秒）
clipConfigs.forEach(config => {
    if (config.processFullVideo) {
        // 完整视频处理不需要计算持续时间
        config.isFullVideo = true;
        return;
    }
    
    const startParts = config.startTime.split(':').map(Number);
    const endParts = config.endTime.split(':').map(Number);
    
    const startSeconds = startParts[0] * 3600 + startParts[1] * 60 + startParts[2];
    const endSeconds = endParts[0] * 3600 + endParts[1] * 60 + endParts[2];
    
    config.durationSeconds = endSeconds - startSeconds;
    config.duration = secondsToTimeString(config.durationSeconds);
});

// 辅助函数：将秒数转换为时间字符串 (时:分:秒)
function secondsToTimeString(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

// 确保目标目录存在
if (!fs.existsSync(targetBasicPath)) {
    fs.mkdirSync(targetBasicPath, { recursive: true });
    console.log(`创建目标目录: ${targetBasicPath}`);
}

// 初始化文件监视器 - 只监控源目录，不监控目标目录
const watcher = chokidar.watch(sourceBasicPath, {
    persistent: true,
    ignored: [targetBasicPath, /(^|[\/\\])\../], // 忽略目标目录和隐藏文件
    ignoreInitial: true, // 忽略初始已存在的文件
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }, // 等待文件完全写入
    depth: 1 // 只监控一级目录，避免监控子目录
});

// 日志记录监控开始
console.log(`开始监控目录: ${sourceBasicPath}`);
console.log(`转换后的文件将保存至: ${targetBasicPath}`);
console.log(`配置了 ${clipConfigs.length} 个剪辑片段:`);
clipConfigs.forEach((config, index) => {
    if (config.processFullVideo) {
        console.log(`  片段 ${index + 1}: 完整视频`);
    } else {
        console.log(`  片段 ${index + 1}: ${config.startTime} 到 ${config.endTime} (持续时间: ${config.duration})`);
    }
});
console.log('等待新文件...');
console.log('按 Ctrl+C 停止程序');

// 当有新文件添加时的回调
watcher.on('add', filePath => {
    // 检查文件是否为.mp4格式
    if (path.extname(filePath).toLowerCase() === '.mp4') {
        const filename = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        
        // 检查文件是否在目标目录中（避免处理已转换的文件）
        if (filePath.includes(targetBasicPath)) {
            console.log(`忽略目标目录中的文件: ${path.basename(filePath)}`);
            return;
        }
        
        // 日志记录检测到的文件
        console.log(`\n检测到新文件: ${path.basename(filePath)}`);
        
        // 询问用户是否要处理这个文件
        rl.question(`是否要处理文件 "${path.basename(filePath)}"? (y/N): `, (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                // 处理所有配置的片段
                processAllClips(filePath, filename, ext);
            } else {
                console.log(`跳过文件: ${path.basename(filePath)}`);
                console.log('等待新文件...');
            }
        });
    }
});

// 处理所有配置的片段
function processAllClips(sourceFile, baseFilename, ext) {
    console.log(`开始处理 ${clipConfigs.length} 个片段...`);
    
    // 使用Promise.all并行处理所有片段
    const conversionPromises = clipConfigs.map((config, index) => {
        return new Promise((resolve, reject) => {
            // 生成输出文件名
            let outputFilename;
            if (config.processFullVideo) {
                outputFilename = `${baseFilename}_full_video${ext}`;
            } else {
                outputFilename = `${baseFilename}_clip_${config.startTime.replace(/:/g, '-')}_to_${config.endTime.replace(/:/g, '-')}${ext}`;
            }
            
            const targetFile = path.join(targetBasicPath, outputFilename);
            
            // 检查输出文件是否已存在
            if (fs.existsSync(targetFile)) {
                console.log(`片段 ${index + 1} 已存在，跳过: ${outputFilename}`);
                resolve(); // 跳过已存在的文件
                return;
            }
            
            // 延迟启动以减轻系统负载
            setTimeout(() => {
                if (config.processFullVideo) {
                    convertFullVideoToH264(sourceFile, targetFile, index + 1)
                        .then(resolve)
                        .catch(reject);
                } else {
                    convertClipToH264(sourceFile, targetFile, config, index + 1)
                        .then(resolve)
                        .catch(reject);
                }
            }, index * 1000); // 每个片段延迟1秒启动
        });
    });
    
    // 等待所有片段处理完成
    Promise.all(conversionPromises)
        .then(() => {
            console.log('所有片段处理完成!');
            console.log('等待新文件...');
        })
        .catch(err => {
            console.error('处理片段时出错:', err);
            console.log('等待新文件...');
        });
}

// 转换函数 - 转换整个视频
function convertFullVideoToH264(sourceFile, targetFile, clipIndex) {
    return new Promise((resolve, reject) => {
        console.log(`开始转换完整视频 ${clipIndex}: ${path.basename(sourceFile)}`);
        
        let lastReportedProgress = 0;
        
        ffmpeg(sourceFile)
            .videoCodec('libx264')          // 使用H.264编码器
            .outputOptions([
                '-crf 23', // 设置CRF值（18-28，值越小质量越高） CRF值 (当前设置为23): 范围通常是18-28，值越小质量越高但文件越大
                '-preset medium', // 设置编码速度与压缩比的平衡 preset (短视频可以设置为 fast, 长视频可以设置为 medium) 可选值有 ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow。越慢的预设压缩效率越高
                '-pix_fmt yuv420p', // 设置像素格式，确保兼容性
                '-movflags +faststart' // 优化网络播放
            ])
            .audioCodec('aac')              // 使用AAC音频编码
            .audioFrequency(44100)
            .on('start', (commandLine) => {
                console.log(`片段 ${clipIndex} 执行命令: ${commandLine}`);
            })
            .on('progress', (progress) => {
                // 显示转换进度
                if (progress.percent) {
                    // 避免过于频繁的进度更新
                    if (progress.percent - lastReportedProgress >= 5 || progress.percent >= 100) {
                        console.log(`片段 ${clipIndex} 转换进度: ${progress.percent.toFixed(1)}%`);
                        lastReportedProgress = progress.percent;
                    }
                }
            })
            .on('end', () => {
                console.log(`片段 ${clipIndex} 转换完成: ${path.basename(targetFile)}`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`片段 ${clipIndex} 转换错误: ${err.message}`);
                reject(err);
            })
            .save(targetFile); // 保存输出文件
    });
}

// 转换函数 - 只转换指定片段
function convertClipToH264(sourceFile, targetFile, config, clipIndex) {
    return new Promise((resolve, reject) => {
        console.log(`开始转换片段 ${clipIndex}: ${path.basename(sourceFile)} [${config.startTime} - ${config.endTime}]`);
        
        let lastReportedProgress = 0;
        
        ffmpeg(sourceFile)
            .setStartTime(config.startTime) // 设置开始时间
            .duration(config.duration)      // 设置持续时间
            .videoCodec('libx264')          // 使用H.264编码器
            .outputOptions([
                '-crf 23', // 设置CRF值（18-28，值越小质量越高） CRF值 (当前设置为23): 范围通常是18-28，值越小质量越高但文件越大
                '-preset fast', // 设置编码速度与压缩比的平衡 preset (短视频可以设置为 fast, 长视频可以设置为 medium) 可选值有 ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow。越慢的预设压缩效率越高
                '-pix_fmt yuv420p', // 设置像素格式，确保兼容性
                '-movflags +faststart' // 优化网络播放
            ])
            .audioCodec('aac')              // 使用AAC音频编码
            .audioFrequency(44100)
            .on('start', (commandLine) => {
                console.log(`片段 ${clipIndex} 执行命令: ${commandLine}`);
            })
            .on('progress', (progress) => {
                // 优化进度计算：基于片段时长而非整个视频时长
                if (progress.timemark) {
                    // 将时间标记转换为秒数
                    const timeParts = progress.timemark.split(':');
                    const progressSeconds = parseInt(timeParts[0]) * 3600 + 
                                           parseInt(timeParts[1]) * 60 + 
                                           parseFloat(timeParts[2]);
                    
                    // 将开始时间转换为秒数
                    const startParts = config.startTime.split(':');
                    const startSeconds = parseInt(startParts[0]) * 3600 + 
                                        parseInt(startParts[1]) * 60 + 
                                        parseInt(startParts[2]);
                    
                    // 计算相对于片段的进度
                    const segmentProgress = Math.min(100, Math.max(0, 
                        ((progressSeconds - startSeconds) / config.durationSeconds) * 100
                    ));
                    
                    // 避免过于频繁的进度更新
                    if (segmentProgress - lastReportedProgress >= 5 || segmentProgress >= 100) {
                        console.log(`片段 ${clipIndex} 转换进度: ${segmentProgress.toFixed(1)}%`);
                        lastReportedProgress = segmentProgress;
                    }
                }
            })
            .on('end', () => {
                console.log(`片段 ${clipIndex} 转换完成: ${path.basename(targetFile)}`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`片段 ${clipIndex} 转换错误: ${err.message}`);
                reject(err);
            })
            .save(targetFile); // 保存输出文件
    });
}

// 处理程序退出
process.on('SIGINT', () => {
    console.log('\n停止监控...');
    watcher.close();
    rl.close();
    process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error(`未捕获异常: ${err.message}`);
    console.log('程序将继续运行...');
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    console.log('程序将继续运行...');
});