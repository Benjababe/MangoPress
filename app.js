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

const port = 80;

let httpServer = http.createServer(app),
    httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);

let io = s(httpsServer);

const rootHTML = {
    root: __dirname + "/web/html/"
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

Debug.log(`Listening on port ${port}`);

io.on("connection", (socket) => {
    imgHandler.delete();

    socket.on("url", (url) => {
        Debug.log(`URL received: ${url}`);
        socket.emit("received", "");
        imgHandler.download(socket, url);
    });

    socket.on("disconnect", (reason) => {
        Debug.log(`Disconnected: ${reason}`);
        imgHandler.delete(true);
    })

});
