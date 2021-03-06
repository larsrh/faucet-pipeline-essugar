"use strict";

let path = require("path");

module.exports = {
	essugar: [{
		source: "./index.js",
		target: "./dist/bundle.js"
	}],
	manifest: {
		target: "./dist/manifest.json",
		value: filepath => `/assets/${filepath}`
	},
	plugins: [path.resolve(__dirname, "../../..")]
};
