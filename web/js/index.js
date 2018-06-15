window.onload = () => {
    
    const socket = io.connect(`${location.hostname}:8080`),
          defaultImgPath = "../images/compressed/";
    
    const elid = (id) => {
        return document.getElementById(id);
    }
    
    socket.on("connect", (data) => {
        console.log("Connected to socket.io");
    });
    
    socket.on("received", () => {
        txtStatus.textContent = "Received, waiting for download"
    });
    
    socket.on("savedsize", (savedSize) => {
        console.log("received: " + savedSize);
        elid("savedSize").textContent = Number(elid("savedSize").textContent) + Number(savedSize);
    });
    
    socket.on("mango", (data) => {
        txtStatus.textContent = "";
        data = JSON.parse(data);
        let chapterid = data["chapterid"],
            images = data["images"];
        imgMango.src = `${defaultImgPath}/${chapterid}/${images[0]}`;
        
        let i = 0;
        
        let pageMove = (num) => {
            i += num;
            if (i >= images.length)
                i--;
            else if (i < 0)
                i = 0;
            else {
                imgMango.src = `${defaultImgPath}/${chapterid}/${images[i]}`;
                imgMango.scrollIntoView();
            }
        }
        
        clickPrev.onclick = (x) => pageMove(-1);
        clickNext.onclick = (x) => pageMove(1);
        
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
    }    
};



