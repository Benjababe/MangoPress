const MangaPressURL = "http://ec2-52-15-61-230.us-east-2.compute.amazonaws.com:8080"

const prop = {
	"id": "mangoHelper",
	"title": "Open in MangoPress",
	"visible": true,
	"contexts": ["link", "image", "page"]
}

chrome.contextMenus.create(prop);

chrome.contextMenus.onClicked.addListener((e) => {
	if (e.menuItemId == "mangoHelper") {
		if (e.linkUrl)
			parseURL(e.linkUrl);
		else 
			parseURL(e.pageUrl);
	}
});

let parseURL = (url) => {
	let regex = new RegExp("https:\/\/mangadex.org\/chapter\/[0-9]{1,10}/{0,1}[0-9]{0,3}");
	let id = url.replace("https://mangadex.org/chapter/", "").replace("/", "_");
	if (regex.test(url))
		chrome.tabs.create( {
			"url": MangaPressURL + "?id=" + id 
		} );
}

