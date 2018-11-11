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

//Stuff
const chapterURL = "https://mangadex.org/api/chapter/";


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


module.exports.download = (socket, url) => {
    let temp = url.split("/"),
        chapterid = parseInt(temp[temp.indexOf("chapter") + 1]),
        apiURL = chapterURL + chapterid;
    
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
                    Debug.log("Download completed");
                    compress(socket, imgDir, chapterid, pageArray);
                }
            })
        });
    });
}

//Compress downloaded Mangoes
let compress = (socket, path, chapterid, images) => {
    let _path = __dirname + "/" + path,
        compressPath = `${__dirname}/web/images/compressed/${chapterid}`;;

    while (_path.includes("//")) {
        _path = _path.replace("//", "/");
    }

    imagemin([`${_path}/*.jpg`], compressPath, {
        plugins: [ imageminJpegRecompress( { target: 0.5 } ) ]
    }).then(files => {
        if (files.length > 0) {
            getDifference(socket, _path, compressPath, chapterid);
            sendData(socket, chapterid, images);
        }
    }).catch(eror => Debug.log(`JPEG: ${error}`));

    imagemin([`${_path}/*.png`], compressPath, {
        plugins: [ imageminPngquant( { speed: 3, quality: "85" } ) ]
    }).then(files => {
        if (files.length > 0) {
            getDifference(socket, _path, compressPath, chapterid);
            sendData(socket, chapterid, images);
        }
    }).catch(error => Debug.log(`PNG ${error}`));
        
};


//Get size difference between compressed and uncompressed
let getDifference = (socket, path, compressPath, chapterid) => {
    folderSize(path, (err, size) => {
        if (err)    { throw err; }
        let uncSize = (size/1024/1024).toFixed(2);
        folderSize(compressPath, (err, size) => {
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
