module.exports = {
    essugar: [{
        source: "./src/index.js",
        target: "./dist/bundle.js",
        format: "iife",
        jsx: true,
        typescript: true,
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        }
    }],

    plugins: [require("../lib")]
}
