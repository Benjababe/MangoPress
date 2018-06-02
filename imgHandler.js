class Debug {
    static log(str) {
        console.log(`[${(new Date).toLocaleTimeString("en-US")}]  ${str} `);    //Logs with timestamp (US format for AM/PM)
    }
};

//Web Libraries
const request = require("request"),
      fs = require("fs"),
      cheerio = require("cheerio"),
      del = require("del");

//Image libraries
const imagemin = require("imagemin"),
      imageminJpegRecompress = require("imagemin-jpeg-recompress"),
      imageminPngquant = require("imagemin-pngquant"),
      folderSize = require("get-folder-size");


module.exports.delete = () => {
    folderSize("./web/images", (err, size) => {
        if (err) { throw err; }
        let s = (size/1024/1024).toFixed(2);
        del(["./web/images/uncompressed/*", "./web/images/compressed/*"]).then((paths) => {
            Debug.log(`Deleted ${paths.length} paths for ${s} MB`);
        });
    });
}


module.exports.download = (socket, url) => {
    request(url, (err, res, body) => {
        let $ = cheerio.load(body),
            scriptData = $("script[data-type=chapter]").html(),
            JSONdata = JSON.parse(scriptData);

        let images = JSONdata["page_array"],
            dataurl = JSONdata["dataurl"],
            chapterid = JSONdata["chapter_id"],
            dlCount = 0;

        images.forEach((img) => {
            let imgURL = `https://mangadex.org/data/${dataurl}/${img}`,
                imgDir = `/web/images/uncompressed/${chapterid}/`;
                path = `/${imgDir}/${img}`;

            if (!fs.existsSync(__dirname + imgDir)) {
                fs.mkdirSync(__dirname + imgDir, err => {});
            }

            request(imgURL).pipe(fs.createWriteStream(__dirname + path)).on("close", () => {
                dlCount++;
                if (dlCount == images.length) {
                    Debug.log("Download completed");
                    compress(socket, imgDir, chapterid, images);
                }
            });
        });
    });
};

let compress = (socket, path, chapterid, images) => {
    let compressPath = `${__dirname}/web/images/compressed/${chapterid}`;

    imagemin([`${__dirname}/${path}/*.jpg`], compressPath, {
        plugins: [ imageminJpegRecompress( { target: 0.1 } ) ]
    }).then(files => {
        if (files.length > 0) {
            getDifference(socket, path, chapterid);
            sendToSite(socket, chapterid, images);
        }
    }).catch(eror => Debug.log(`JPEG: ${error}`));

    imagemin([`${__dirname}/${path}/*.png`], compressPath, {
        plugins: [  ]
    }).then(files => {
        if (files.length > 0) {
            getDifference(socket, path, chapterid);
            sendToSite(socket, chapterid, images);
        }
    }).catch(error => Debug.log(`PNG ${error}`));
};

let getDifference = (socket, path, chapterid) => {
    folderSize(path, (err, size) => {
        if (err)    { throw err; }
        let uncSize = (size/1024/1024).toFixed(2);
        folderSize(`${__dirname}/web/images/compressed/${chapterid}`, (err, size) => {
            if (err)    { throw err; }
            let cSize = (size/1024/1024).toFixed(2);
            savedSize = (uncSize - cSize).toFixed(2);
            socket.emit("savedsize", savedSize);
        });
    })
}

let sendToSite = (socket, chapterid, images) => {
    let data = {
        chapterid: chapterid,
        images: images
    }
    socket.emit("mango", JSON.stringify(data));
};
