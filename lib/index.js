let { abort, repr } = require("faucet-pipeline-core/lib/util");
let path = require("path");
let { Bundle, Config } = require("beatdown");
let { Plugin } = require("beatdown/lib/config/plugin");
let rollupSucrase = require("@rollup/plugin-sucrase");
let { terser: rollupTerser } = require("rollup-plugin-terser");
let rollupCleanup = require("rollup-plugin-cleanup");
let rollupReplace = require("@rollup/plugin-replace");

module.exports = {
	key: "essugar",
	bucket: "scripts",
	plugin: faucetESSugar
};

function faucetESSugar(config, assetManager, { compact, sourcemaps } = {}) {
	let bundlers =
		config.map(bundleConfig =>
			makeBundler(bundleConfig, assetManager, { compact, sourcemaps })
		);

	return filepaths =>
		Promise.all(bundlers.map(bundler => bundler(filepaths)));
}

function makeBundler(bundleConfig, assetManager, { compact, sourcemaps } = {}) {
	// NB: bundle-specific configuration can override global options
	let config = Object.assign({ sourcemaps, compact }, bundleConfig);
	if(!compact) {
		config.compact = false;
	}
	// dissect configuration for constructor
	let [entryPoint, target] = extract(config, "source", "target");
	if(!entryPoint || !target) {
		let setting = entryPoint ? "target" : "source";
		abort(`ERROR: missing ${repr(setting, false)} configuration in ` +
            "JavaScript bundle");
	}

	let { resolvePath } = assetManager;
	entryPoint = resolvePath(entryPoint);
	target = resolvePath(target, { enforceRelative: true });

	if(!config.extensions) { config.extensions = []; }

	let transforms = [];
	let jsxPragma;
	let jsxFragmentPragma;
	if(config.typescript) {
		transforms.push("typescript");
		config.extensions.push(".ts", ".tsx");
	}
	if(config.jsx) {
		transforms.push("jsx");
		config.extensions.push(".jsx");
		if(config.jsx.pragma) { jsxPragma = config.jsx.pragma; }
		if(config.jsx.fragment) { jsxFragmentPragma = config.jsx.fragment; }
	}

	let nodeEnv = config.env || "development";

	let fingerprint = config.fingerprint;

	let exclude = config.exclude || [];

	let beatdownSucrase = new Plugin("sucrase", rollupSucrase, {
		exclude: exclude.map(pkg => {
			// distinguish paths from package identifiers - as per Node's
			// resolution algorithm <https://nodejs.org/api/modules.html>, a
			// string is a path if it begins with `/`, `./` or `../`
			// XXX: implicit reference directory for `node_modules`
			return /^\.{0,2}\//.test(pkg) ? pkg : `node_modules/${pkg}/**`;
		}),
		transforms: transforms,
		jsxPragma,
		jsxFragmentPragma,
		production: true // TODO does faucet have a production mode?
	});

	let beatdownCompact;
	if(config.compact) {
		let [plugin, options] = determineCompacting(config.compact);
		beatdownCompact = new Plugin("compact", plugin, options);
	}

	config = new Config(entryPoint, {
		format: "iife",
		...config,
		resolve: true,
		commonjs: true
	});
	config.addPlugin(beatdownSucrase);

	if(beatdownCompact) { config.addPlugin(beatdownCompact); }

	let beatdownReplace = new Plugin("replace", rollupReplace, {
		"process.env.NODE_ENV": JSON.stringify(nodeEnv),
		__DEV__: JSON.stringify(nodeEnv !== "production")
	});
	config.addPlugin(beatdownReplace);

	let bundle = new Bundle(config);

	let writer = makeWriter({ target, fingerprint }, assetManager);
	return async filepaths => {
		let doCompile;
		if(!filepaths) { // initial compilation
			doCompile = true;
		} else {
			doCompile = filepaths.some(fp => fp in bundle._modules);
		}

		if(!doCompile) { return false; }

		return writer(await bundle.compile(entryPoint));
	};
}

function makeWriter({ target, fingerprint }, assetManager) {
	return code => {
		if(code.length > 100000) { // ~100 kB -- XXX: arbitrary -- TODO: configurable
			console.error("⚠️ this bundle looks to be fairly big, you might " +
                "want to double-check whether that's intended and " +
                "consider performance implications for your users:\n  " +
                path.relative(assetManager.referenceDir, target));
		}

		let options = {};
		if(fingerprint !== undefined) {
			options.fingerprint = fingerprint;
		}
		return assetManager.writeFile(target, code, options);
	};
}

function determineCompacting(type = true) {
	switch(type) {
	case true: // default
	case "compact":
		return [rollupCleanup, {}];
	case "minify":
		var options = { compress: false, mangle: false }; // eslint-disable-line no-var
		break;
	case "mangle":
		options = { compress: false, mangle: true };
		break;
	default:
		abort(`unknown compacting option ${type}`);
	}

	return [rollupTerser, options];
}

// removes properties from object, returning their respective values
function extract(obj, ...props) {
	return props.map(prop => {
		let value = obj[prop];
		delete obj[prop];
		return value;
	});
}
