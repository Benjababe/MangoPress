const MangaPressURL = "https://benja.press";

const prop = {
	"id": "mangoHelper",
	"title": "Open in MangoPress",
	"contexts": ["link", "image"]
};

chrome.contextMenus.create(prop);

chrome.contextMenus.onClicked.addListener((e) => {
	if (e.menuItemId == prop.id) {
		console.dir(e);
		let url = (e.linkUrl == null) ? e.pageUrl : e.linkUrl ,
			regex = new RegExp("https:\/\/mangadex.org/chapter/[0-9]{0,10}[/]{0,1}[0-9]{0,10}");
		if (regex.test(url)) {
			let path = url.replace("https://mangadex.org/chapter/", "").replace("/", "_");
			chrome.tabs.create({
				"url": MangaPressURL + "?id=" + path,
				"active": true
			});
		};
	}
});
