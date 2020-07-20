"use strict";

let path = require("path");

module.exports = {
	essugar: [{
		source: "./src/index.js",
		target: "./dist/bundle.js",
		compact: "mangle"
	}],
	plugins: [path.resolve(__dirname, "../../..")]
};
