# faucet-pipeline-essugar

![Node.js CI](https://github.com/larsrh/faucet-pipeline-essugar/workflows/Node.js%20CI/badge.svg)
![Experimental](https://img.shields.io/badge/lifecycle-experimental-orange.svg)

JavaScript + TypeScript asset pipeline based on sucrase

## Usage

Drop-in replacement for [faucet-pipeline-js](https://github.com/faucet-pipeline/faucet-pipeline-js).
This is **highly experimental**, use **at your own peril!** (You have been warned.)

Example configuration:

```js
module.exports = {
  essugar: [{
    source: "./src/index.tsx",
    target: "./dist/bundle.js",
    typescript: true,
    jsx: true,
    externals: {
      "react": "React",
      "react-dom": "ReactDOM"
    }
  }],

  static: [{
    source: "./src/index.html",
    target: "./dist/index.html",
  }, {
    source: "react/umd/react.development.js",
    target: "./dist/react.js",
  }, {
    source: "react-dom/umd/react-dom.development.js",
    target: "./dist/react-dom.js",
  }],

  manifest: {
    webRoot: "./dist",
  },

  watchDirs: [
    "./src"
  ],

  plugins: [require("faucet-pipeline-essugar")]
}
```

## Implementation

Heavily copied from [faucet-pipeline-js](https://github.com/faucet-pipeline/faucet-pipeline-js).
Supports similar options (`typescript` and `jsx`).
Uses Sucrase under the hood; that is, TypeScript is not type-checked.
Use `tsc` for type-checking.
