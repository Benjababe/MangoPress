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
      s = require("socket.io");

let server = app.listen(8080);
let io = s(server);

const rootHTML = {
    root: __dirname + "/web/html/"
}

app.use(express.static("web"));

app.get("/", (req, res) => {
    res.sendFile("index.html", rootHTML);
});

Debug.log("Listening on port 8080")

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
