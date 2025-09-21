const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// 如果你已经成功将FFmpeg的bin目录添加到系统PATH环境变量中，并且重启了命令行终端和代码编辑器/IDE，那么理论上fluent-ffmpeg会自动找到它。
// 无需特殊配置，你的代码可以保持得非常简洁，直接使用 ffmpeg() 即可
// 显式设置ffmpeg的绝对路径
// ffmpeg.setFfmpegPath("C:\\rick\\Software\\FFmpeg\\ffmpeg-8.0-full_build\\bin\\ffmpeg.exe");
// 通常ffprobe也在一起，如果需要也可以设置（例如用于获取视频时长等信息）
// ffmpeg.setFfprobePath("C:\\rick\\Software\\FFmpeg\\ffmpeg-8.0-full_build\\bin\\ffprobe.exe");

// 设置源目录和目标目录
const sourceBasicPath = `//DESKTOP-DP2PSM8/share`;
const targetBasicPath = `//DESKTOP-DP2PSM8/share`;

// 确保目标目录存在
if (!fs.existsSync(targetBasicPath)) {
    fs.mkdirSync(targetBasicPath, { recursive: true });
    console.log(`创建目标目录: ${targetBasicPath}`);
}

// 初始化文件监视器
const watcher = chokidar.watch(sourceBasicPath, {
    persistent: true,
    ignoreInitial: true, // 忽略初始已存在的文件
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }, // 等待文件完全写入
    depth: 99 // 监控子目录深度
});

// 日志记录监控开始
console.log(`开始监控目录: ${sourceBasicPath}`);
console.log(`转换后的文件将保存至: ${targetBasicPath}`);
console.log('等待新文件...');

// 当有新文件添加时的回调
watcher.on('add', filePath => {
    // 检查文件是否为.mp4格式
    if (path.extname(filePath).toLowerCase() === '.mp4') {
        const filename = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        const targetFile = path.join(targetBasicPath, `${filename}_h264${ext}`);
        
        // 检查输出文件是否已存在
        if (fs.existsSync(targetFile)) {
            console.log(`文件已存在，跳过转换: ${targetFile}`);
            return;
        }
        
        // 日志记录检测到的文件
        console.log(`检测到新文件: ${filePath}`);
        
        // 调用转换函数
        convertToH264(filePath, targetFile);
    }
});

// 转换函数
function convertToH264(sourceFile, targetFile) {
    console.log(`开始转换: ${path.basename(sourceFile)}`);
    
    ffmpeg(sourceFile)
        .videoCodec('libx264') // 使用H.264编码器
        .outputOptions([
            '-crf 23', // 设置CRF值（18-28，值越小质量越高） CRF值 (当前设置为23): 范围通常是18-28，值越小质量越高但文件越大
            '-preset medium', // 设置编码速度与压缩比的平衡 preset (当前设置为medium): 可选值有 ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow。越慢的预设压缩效率越高
            '-pix_fmt yuv420p', // 设置像素格式，确保兼容性
            '-movflags +faststart' // 优化网络播放
        ])
        .audioCodec('aac') // 使用AAC音频编码 音频编码 (当前设置为aac): 如果需要保持原始音频，可以改为 .audioCodec('copy')
        .audioFrequency(44100)
        .on('start', (commandLine) => {
            console.log(`执行命令: ${commandLine}`);
        })
        .on('progress', (progress) => {
            // 计算进度百分比
            if (progress.percent) {
                console.log(`转换进度: ${progress.percent.toFixed(2)}%`);
            }
        })
        .on('end', () => {
            console.log(`转换完成: ${path.basename(targetFile)}`);
            console.log('等待新文件...');
        })
        .on('error', (err) => {
            console.error(`转换错误: ${err.message}`);
            console.log('等待新文件...');
        })
        .save(targetFile); // 保存输出文件
}

// 处理程序退出
process.on('SIGINT', () => {
    console.log('停止监控...');
    watcher.close();
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