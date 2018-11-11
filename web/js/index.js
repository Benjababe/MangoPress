window.onload = () => {
    if (location.protocol != "https:")
        location.href = "https:" + window.location.href.substring(window.location.protocol.length);

    //TODO Only for http, https not implemented yet
    const port = 443;

    const socket = io.connect(`${location.hostname}:443`),
          defaultImgPath = "../images/compressed/";
    
    const elid = (id) => {
        return document.getElementById(id);
    }
    
    const sel = document.getElementsByClassName("page-select");
    
    
    socket.on("connect", (data) => {
        console.log("Connected to socket.io");
		if (window.location.search.indexOf("?id=") == 0) {
			socket.emit("url", "https://mangadex.org/chapter/" + window.location.search.replace("?id=", ""));
		}
    });
    
    socket.on("received", () => {
        txtStatus.textContent = "Received, waiting for download"
    });
    
    socket.on("savedsize", (savedSize) => {
        elid("savedSize").textContent = Number(elid("savedSize").textContent) + Number(savedSize.split("_")[0]);
        elid("totalSize").textContent = Number(elid("totalSize").textContent) + Number(savedSize.split("_")[1]);
        elid("percentageSize").textContent = ((Number(elid("savedSize").textContent) /
                                             Number(elid("totalSize").textContent)) * 100).toFixed(1);
    });
    
    socket.on("mango", (data) => {
        txtStatus.textContent = "";
        data = JSON.parse(data);
        let chapterid = data["chapterid"],
            images = data["images"];
        imgMango.src = `${defaultImgPath}/${chapterid}/${images[0]}`;
        
//        populateOptions(images.length);
        
        let i = 0;
        let pageMove = (num) => {
            i = (num == "prev") ? --i : (num == "next") ? ++i : num;
            if (i >= images.length)
                i--;
            else if (i < 0)
                i = 0;
            else {
                imgMango.src = `${defaultImgPath}/${chapterid}/${images[i]}`;
            }
        }
        
        clickPrev.onclick = (x) => pageMove("prev");
        clickNext.onclick = (x) => pageMove("next");
        
//        for (let k = 0; k < sel.length; k++) {
//            sel[k].onchange = (e) => {
//                let val = sel[k].options[sel[k].selectedIndex].value;
//                pageMove(val - 1);
//            }
//        } 
        
    });
    
    txtURL.onkeypress = (e) => {
        if (e.key === "Enter")
            btnURL.click();
    }
    
    btnClear.onclick = () => {
        txtURL.value = "";
    }
    
    btnURL.onclick = () => {
        socket.emit("url", txtURL.value);
    }
    
    imgMango.onload = () => {
        let prev = `0, 0, ${(imgMango).width * 0.3}, ${imgMango.height}`,
            next = `${imgMango.width * 0.3}, 0, ${imgMango.width}, ${imgMango.height}`;
        clickPrev.coords = prev;
        clickNext.coords = next;
        
        imgMango.scrollIntoView();
    }   
    
//    let populateOptions = (pages) => {
//        for (let i = 1; i <= pages; i++) {
//            let opt1 = document.createElement("option"),
//                opt2 = document.createElement("option"); 
//            
//            opt1.text = opt2.text = i;
//            opt1.value = opt2.value = i;
//            
//            sel[0].add(opt1);
//            sel[1].add(opt2);
//        }
//    }
    
};



