"use strict";

let path = require("path");

module.exports = {
	essugar: [{
		source: "./src/foo.js",
		target: "./dist/foo.js"
	}, {
		source: "./src/bar.js",
		target: "./dist/bar.js"
	}],
	manifest: {
		target: "./dist/manifest.json",
		value: bundlePath => assetURI(bundlePath)
	},
	plugins: [path.resolve(__dirname, "../../..")]
};

function assetURI(filepath) {
	let filename = path.basename(filepath);
	return `/assets/${filename}`;
}
