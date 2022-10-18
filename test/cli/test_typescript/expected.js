(function () {
'use strict';

var LogLevel; (function (LogLevel) { const Debug = 0; LogLevel[LogLevel["Debug"] = Debug] = "Debug"; const Info = Debug + 1; LogLevel[LogLevel["Info"] = Info] = "Info"; const Critical = Info + 1; LogLevel[LogLevel["Critical"] = Critical] = "Critical"; })(LogLevel || (LogLevel = {}));

function log(level, msg) {
	if(level === LogLevel.Critical) {
		console.error(msg);
	} else {
		console.log(msg);
	}
}

let generateArticle = (params) => {
	let { title, authors } = params;
	if(typeof title !== "string") {
		log(LogLevel.Debug, "auto-generating title");
		title = `${title.main}: ${title.sub}`;
	}
	return title + "\n" + authors.join(", ");
};

generateArticle({
	title: {
		main: "Hello World",
		sub: "sup"
	},
	authors: ["foo", "bar"]
});

})();
