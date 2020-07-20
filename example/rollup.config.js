import sucrase from "@rollup/plugin-sucrase";
import resolve from "@rollup/plugin-node-resolve";

export default {
	input: "src/index.js",
	output: {
		file: "dist/bundle.js",
		format: "iife",
		globals: {
			react: "React",
			"react-dom": "ReactDOM"
		}
	},
	plugins: [
		resolve({
			extensions: [".jsx", ".ts", ".tsx", ".js"]
		}),
		sucrase({
			exclude: ["node_modules/**"],
			transforms: ["jsx", "typescript"]
		})
	],
	external: ["react", "react-dom"]
};
