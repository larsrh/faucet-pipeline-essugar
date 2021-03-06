"use strict";

let path = require("path");

module.exports = {
	essugar: [{
		source: "./src/index.jsx",
		target: "./dist/bundle.js",
		jsx: {
			pragma: "createElement",
			fragment: "Fragment"
		}
	}],
	plugins: [path.resolve(__dirname, "../../..")]
};
