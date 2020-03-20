
if (location.protocol != "https:")
    location.href = "https:" + window.location.href.substring(window.location.protocol.length);

window.onload = () => {

    //TODO Only for http, https not implemented yet
    //const port = 443;
    //const socket = io.connect(`${location.hostname}:${port}`),
    const port = 80;
    const socket = io.connect(location.hostname),
          defaultImgPath = "../images/compressed/";

    const elid = (id) => {
        return document.getElementById(id);
    }

    const sel = Array.from(document.getElementsByClassName("page-select")),
          lEnd = Array.from(document.getElementsByClassName("l-end")),
          rEnd = Array.from(document.getElementsByClassName("r-end"));

    let preload = elid("chkPreload"),
        chapterid = "",
        //images is the array of image filenames
        images = null,
        //page will be used globally for page navigation
        page = 0,
        jpegQual = 40,
        pngQual = 5;

    socket.on("connect", (data) => {
        console.log("Connected to socket.io");
		if (window.location.search.indexOf("?id=") == 0) {
			socket.emit("url", "https://mangadex.org/chapter/" + window.location.search.replace("?id=", ""));
		}
    });

    socket.on("received", () => txtStatus.textContent = "Received by server, waiting for download and conversion...");

    socket.on("savedsize", (savedSize) => {
        elid("savedSize").textContent = Number(elid("savedSize").textContent) + Number(savedSize.split("_")[0]);
        elid("totalSize").textContent = Number(elid("totalSize").textContent) + Number(savedSize.split("_")[1]);
        elid("percentageSize").textContent = ((Number(elid("savedSize").textContent) /
                                             Number(elid("totalSize").textContent)) * 100).toFixed(1);
    });

    socket.on("error", (data) => alert(data));

    socket.on("mango", (data) => {
        console.dir(data);
        txtStatus.textContent = "";
        data = JSON.parse(data);
        chapterid = data["chapterid"],
        images = data["images"],
        page = 1;
        images.unshift("filler");
        elid("imgMango").src = `${defaultImgPath}/${chapterid}/${images[page]}`;

        populateOptions(images.length);

        lEnd.forEach((el) => el.onclick = () => movePage(0, jump = 1));
        rEnd.forEach((el) => el.onclick = () => movePage(0, jump = images.length));

        elid("clickPrev").onclick = (x) => movePage(-1);
        elid("clickNext").onclick = (x) => movePage(1);

        sel.forEach((el) => {
            el.onchange = (e) => {
                let val = Number(e.target.value);
                movePage(0, jump = val);
            }
        });
    });

    document.onkeydown = (e) => movePage((e.key == "ArrowLeft") ? -1 : (e.key == "ArrowRight") ? 1 : 0)

    elid("settingsOverlay").onclick = (e) => {
        if (e.target.id == "settingsOverlay")
            e.target.style.display = "none";
    };

    elid("settings").style.height = elid("txtURL").clientHeight;
    elid("settings").onclick = (e) => {
        elid("settingsOverlay").style.display = "block";
    }

    elid("txtURL").onkeypress = (e) => {
        if (e.key === "Enter")
            elid("btnURL").click();
    }

    elid("btnClear").onclick = () => {
        elid("txtURL").value = "";
    }

    elid("btnURL").onclick = () => {
        socket.emit("url", JSON.stringify({
            url: txtURL.value,
            jpegQual: jpegQual,
            pngQual: pngQual
        }));
    }

    elid("imgMango").onload = (e) => {
        let imgMango = e.target;
        let prev = `0, 0, ${(imgMango).width * 0.3}, ${imgMango.height}`,
            next = `${imgMango.width * 0.3}, 0, ${imgMango.width}, ${imgMango.height}`;
        elid("clickPrev").coords = prev;
        elid("clickNext").coords = next;
        imgMango.scrollIntoView();
    }

    function updateImage(page) {
        let imgMango = elid("imgMango");
        imgMango.src = `${defaultImgPath}/${chapterid}/${images[page]}`
        sel.forEach((el) => el.value = page)
        if (preload.checked) {
            if (page < images.length - 1)
                elid("preload1").src = `${defaultImgPath}/${chapterid}/${images[page+1]}`;
            if (page < images.length - 2)
                elid("preload2").src = `${defaultImgPath}/${chapterid}/${images[page+2]}`;
        }
    }

    //step = how much to jump
    function movePage(step, jump = -1) {
        let max = images.length - 1, min = 1;
        if (jump > 0)
            page = jump;
        else
            page += step;
        if (page < min)     page = 1;
        if (page >= max)    page = max;
        updateImage(page);
    }

   let populateOptions = (pages) => {
       for (let i = 1; i <= pages; i++) {
           let opt1 = document.createElement("option"),
               opt2 = document.createElement("option");
           opt1.text = opt2.text = "Page " + i;
           opt1.value = opt2.value = i;

           sel[0].add(opt1);
           sel[1].add(opt2);
       }
       sel[0].value = sel[1].value = 1;
   }

};
