"use strict";

let path = require("path");

module.exports = {
	essugar: [{
		source: "./index.js",
		target: "./dist/bundle.js"
	}],
	plugins: [path.resolve(__dirname, "../../..")]
};
