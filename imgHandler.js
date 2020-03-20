class Debug {
    static log(str) {
        console.log(`[${(new Date).toLocaleTimeString("en-US")}]  ${str} `);    //Logs with timestamp (US format for AM/PM)
    }
};

//Web Libraries
const request = require("request"),
      fs = require("fs"),
      del = require("del");

//Conversion handling
const compressImages = require("compress-images"),
      folderSize = require("get-folder-size");

//Stuff
const chapterAPIURL = "https://mangadex.org/api/chapter/";

//Delete all unconverted and converted images; log variable is for logging in console
module.exports.delete = (log = false) => {
    folderSize("./web/images", (err, size) => {
        if (err) { throw err; }
        let s = (size/1024/1024).toFixed(2);
        del(["./web/images/uncompressed/*", "./web/images/compressed/*"]).then((paths) => {
            if (log)
                Debug.log(`Deleted ${paths.length} paths for ${s} MB`);
        });
    });
}

module.exports.download = (socket, info) => {
    let url = info.url,
        temp = url.split("/"),
        chapterid = parseInt(temp[temp.indexOf("chapter") + 1]),
        apiURL = chapterAPIURL + chapterid;

    let options = {
        url: apiURL,
        headers: {
            "Cookie": "__cfduid=0; PHPSESSID=0; mangadex=0"
        }
    }

    request(options, (err, res, body) => {
       let parsed = JSON.parse(body),
           pageArray = parsed["page_array"],
           hash = parsed["hash"],
           dlCount = 0;
        //if (!fs.existsSync(`./web/images/uncompressed/${chapterid}`))
        //    fs.mkdirSync(`./web/images/uncompressed/${chapterid}`);
        pageArray.forEach((img) => {
           let imgURL = `https://mangadex.org/data/${hash}/${img}`,
               imgDir = `/web/images/uncompressed/${chapterid}`,
               path = `${imgDir}/${img}`;

            while (path.includes("//")) {
                path = path.replace("//", "/");
            }

            if (!fs.existsSync(__dirname + imgDir)) {
                fs.mkdirSync(__dirname + imgDir, err => {});
            }

            request(imgURL).pipe(fs.createWriteStream(__dirname + path)).on("close", () => {
                dlCount++;
                if (dlCount == pageArray.length) {
                    Debug.log(`Download completed for ID:${chapterid}`);
                    compress(socket, imgDir, chapterid, pageArray, jpegQual = info.jpegQual, pngQual = info.pngQual);
                }
            })
        });
    });
}

//Compress downloaded Mangoes
let compress = (socket, path, chapterid, images, jpegQual = "40", pngQual = 5) => {
    let inputPath = "./" + path,
        outputPath = `./web/images/compressed/${chapterid}/`;
    inputPath = inputPath.split("//").join("/");
    if (!fs.existsSync(outputPath))
        fs.mkdirSync(outputPath);
    let inputFiles = inputPath + "/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}";

    compressImages(inputFiles, outputPath, {compress_force: true, statistic: false, autoupdate: true}, false,
        {jpg: {engine: 'mozjpeg', command: ['-quality', jpegQual]}},
        {png: {engine: 'pngquant', command: ['--quality=' + pngQual]}},
        {svg: {engine: 'svgo'}},
        {gif: {engine: 'gifsicle'}}, function(error, completed){
            if (error)
                Debug.log(`Error: ${error}`);
            if (completed) {
                Debug.log(`Conversion completed for ID:${chapterid}...`);
                getDifference(socket, inputPath, outputPath);
                sendData(socket, chapterid, images);
            }
        }
    );
};

//Get size difference between compressed and uncompressed
let getDifference = (socket, inputPath, outputPath) => {
    folderSize(inputPath, (err, size) => {
        if (err)    { throw err; }
        let uncSize = (size/1024/1024).toFixed(2);
        folderSize(outputPath, (err, size) => {
            if (err)    { throw err; }
            let cSize = (size/1024/1024).toFixed(2);
            let savedSize = (uncSize - cSize).toFixed(2);
            socket.emit("savedsize", savedSize + "_" + uncSize);
        });
    });
}

//Sends compressed image data to client
let sendData = (socket, chapterid, images) => {
    let data = {
        chapterid: chapterid,
        images: images
    }
    socket.emit("mango", JSON.stringify(data));
};
