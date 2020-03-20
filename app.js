class Debug {
    static log(str) {
        console.log(`[${(new Date).toLocaleTimeString("en-US")}]  ${str} `);    //Logs with timestamp (US format for AM/PM)
    }
};

//Private libraries
const imgHandler = require("./imgHandler");

//Web libraries
const express = require("express"),
      app = express(),
      s = require("socket.io"),
      http = require("http"),
      https = require("https"),
      fs = require("fs");

const pKey = fs.readFileSync("/etc/letsencrypt/live/benja.press/privkey.pem", "utf8"),
      cert = fs.readFileSync("/etc/letsencrypt/live/benja.press/cert.pem", "utf8"),
      ca = fs.readFileSync("/etc/letsencrypt/live/benja.press/chain.pem", "utf8"),

      credentials = {
          key: pKey,
          cert: cert,
          ca: ca
      };

const httpPort = 80,
      httpsPort = 443

let httpServer = http.createServer(app),
    httpsServer = https.createServer(credentials, app);

httpServer.listen(httpPort);
httpsServer.listen(httpsPort);

let io = s(httpsServer);

const rootHTML = {
    root: __dirname + "/web/html/"
}

//Create image folders
if (!fs.existsSync("./web/images/") || 
    !fs.existsSync("./web/images/compressed") || !fs.existsSync("./web/images/uncompressed")) {
    fs.mkdirSync("./web/images/compressed/")
    fs.mkdirSync("./web/images/uncompressed/")
}

app.use(express.static("web"));

app.use(express.static(__dirname, {dotfiles:"allow"}));

app.get("/", (req, res) => {
    res.sendFile("index.html", rootHTML);
});

app.get("/*", (req, res, next) => {
    if (req.headers.host.match(/^www/) !== null)
        res.redirect(req.headers.host.replace(/^www\./,"") + req.url);
    else
        next();
});

Debug.log(`Listening on port ${httpPort} and ${httpsPort}`);

io.on("connection", (socket) => {
    imgHandler.delete();

    socket.on("url", (info) => {
        info = JSON.parse(info)
        Debug.log(`URL received: ${info.url}`);
        socket.emit("received", "");
        imgHandler.download(socket, info);
    });

    socket.on("disconnect", (reason) => {
        Debug.log(`Disconnected: ${reason}`);
        imgHandler.delete(true);
    })

});
