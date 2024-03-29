/* global describe, it, beforeEach, afterEach */
"use strict";

let { MockAssetManager, makeBundle, FIXTURES_DIR } = require("./util");
let faucetJS = require("../../lib").plugin;
let path = require("path");
let assert = require("assert");

let DEFAULT_OPTIONS = {};

describe("bundling", _ => {
	let { exit } = process;
	beforeEach(() => {
		process.exit = code => {
			throw new Error(`exit ${code}`);
		};
	});
	afterEach(() => {
		process.exit = exit;
	});

	it("should verify configuration", () => {
		let config = [{}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		let fn = () => faucetJS(config, assetManager, DEFAULT_OPTIONS)();
		assert.throws(fn, /exit 1/); // aborts with "missing `source` configuration"
		config[0].source = "./src/index.js";
		assert.throws(fn, /exit 1/); // aborts with "missing `target` configuration"
	});

	it("should combine ES6 modules into a bundle", () => {
		let config = [{
			source: "./src/index.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`
var util = "UTIL";

console.log(\`[…] $\{util}\`); // eslint-disable-line no-console
					`.trim())
				}]);
			});
	});

	it("should support custom file extensions", () => {
		let config = [{
			source: "./src/index.coffee",
			target: "./dist/bundle.js",
			extensions: [".coffee"]
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`
var helper = { foo: "lorem", bar: "ipsum" };

console.log(\`[…] $\{helper}\`); // eslint-disable-line no-console
					`.trim())
				}]);
			});
	});

	it("should support customizing bundle's API", () => {
		let config = [{
			source: "./src/lib.js",
			target: "./dist/bundle.js",
			exports: "MYLIB"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: "var MYLIB = " + makeBundle(`
var util = "UTIL";

var lib = msg => {
	console.log(\`[…] $\{util} $\{msg}\`); // eslint-disable-line no-console
};

return lib;
					`.trim())
				}]);
			});
	});

	it("should support customizing bundle format", () => {
		let config = [{
			source: "./src/lib.js",
			target: "./dist/bundle.js",
			format: "amd"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: `
define((function () { 'use strict';

var util = "UTIL";

var lib = msg => {
	console.log(\`[…] $\{util} $\{msg}\`); // eslint-disable-line no-console
};

return lib;

}));
					`.trim() + "\n"
				}]);
			});
	});

	it("should support importing third-party packages", () => {
		let config = [{
			source: "./src/alt.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`
var MYLIB = "MY-LIB";

console.log(\`[…] $\{MYLIB}\`); // eslint-disable-line no-console
					`.trim())
				}]);
			});
	});

	it("should support excluding module/package references", () => {
		let config = [{
			source: "./src/alt.js",
			target: "./dist/bundle.js",
			externals: { "my-lib": "MYLIB" }
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, DEFAULT_OPTIONS)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: `
(function (MYLIB) {
'use strict';

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var MYLIB__default = /*#__PURE__*/_interopDefaultLegacy(MYLIB);

console.log(\`[…] \${MYLIB__default["default"]}\`); // eslint-disable-line no-console

})(MYLIB);
					`.trim() + "\n"
				}]);
			});
	});

	it("should optionally compact bundle", () => {
		let config = [{
			source: "./src/multiline.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		let options = { compact: true };
		return faucetJS(config, assetManager, options)().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`let txt = \`foo

bar\`;
console.log(\`[…] $\{txt}\`);
					`.trim(), { compact: true })
				}]);

				assetManager = new MockAssetManager(FIXTURES_DIR);
				return faucetJS(config, assetManager, options)();
			}).
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`
let txt = \`foo\n\nbar\`;
console.log(\`[…] $\{txt}\`);
					`.trim(), { compact: true })
				}]);

				config[0].compact = false; // overrides global option
				assetManager = new MockAssetManager(FIXTURES_DIR);
				return faucetJS(config, assetManager, options)();
			}).
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`let txt = \`foo

bar\`;

console.log(\`[…] $\{txt}\`); // eslint-disable-line no-console
					`.trim())
				}]);
			});
	});

	it("should replace NODE_ENV", () => {
		let config = [{
			source: "./src/processenv.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, {})().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`/* eslint-disable */
let env1 = "development";
let env2 = true;

console.log(env1);
console.log(env2);
					`.trim())
				}]);
			});
	});

	it("should replace NODE_ENV (production)", () => {
		let config = [{
			source: "./src/processenv.js",
			target: "./dist/bundle.js",
			env: "production"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);

		return faucetJS(config, assetManager, {})().
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`/* eslint-disable */
let env1 = "production";
let env2 = false;

console.log(env1);
console.log(env2);
					`.trim())
				}]);
			});
	});

	it("should balk at non-relative paths for target", () => {
		let assetManager = new MockAssetManager(FIXTURES_DIR);
		let entryPoint = "src/index.js";
		let target = "dist/bundle.js";
		let compile = (source, target) => faucetJS([{ source, target }],
				assetManager, DEFAULT_OPTIONS)();

		let fn = _ => compile(`./${entryPoint}`, target);
		assert.throws(fn, /exit 1/); // aborts with "path must be relative"

		// non-relative path is acceptable for entry point, but a suitable
		// package path does not exist
		fn = _ => compile("dummy/src/does_not_exist.js", `./${target}`);
		assert.throws(fn, /exit 1/); // aborts with "could not resolve"

		return compile(`./${entryPoint}`, `./${target}`);
	});

	it("should support Node resolution algorithm for entry point", () => {
		let entryPoint = "dummy/src/index.js";
		let target = "./dist/bundle.js";
		let assetManager = new MockAssetManager(FIXTURES_DIR);
		let compile = (source, target) => faucetJS([{ source, target }],
				assetManager, DEFAULT_OPTIONS)();

		return compile(entryPoint, target).
			then(_ => {
				assetManager.assertWrites([{
					filepath: path.resolve(FIXTURES_DIR, "./dist/bundle.js"),
					content: makeBundle(`
var util = "DUMMY-UTIL";

console.log(\`[DUMMY] $\{util}\`); // eslint-disable-line no-console
					`.trim())
				}]);

				let fn = _ => compile("dummy/src/does_not_exist.js", target);
				assert.throws(fn, /exit 1/); // aborts with "could not resolve"

				fn = _ => compile(entryPoint, "dist/bundle.js");
				assert.throws(fn, /exit 1/); // aborts with "path must be relative"
			});
	});

	it("should build when the provided path is part of the bundle", () => {
		let config = [{
			source: "./src/index.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);
		let buildJS = faucetJS(config, assetManager, DEFAULT_OPTIONS);
		let relevantModule = path.join(FIXTURES_DIR, "src/util.js");

		return buildJS().
			then(_ => buildJS([relevantModule])).
			then(_ => {
				assetManager.assertWriteCount(2);
			});
	});

	it("should not build when the provided path is not part of the bundle", () => {
		let config = [{
			source: "./src/index.js",
			target: "./dist/bundle.js"
		}];
		let assetManager = new MockAssetManager(FIXTURES_DIR);
		let buildJS = faucetJS(config, assetManager, DEFAULT_OPTIONS);
		let unusedModule = path.join(FIXTURES_DIR, "src/alt.js");

		return buildJS().
			then(_ => buildJS([unusedModule])).
			then(_ => {
				assetManager.assertWriteCount(1);
			});
	});
});
