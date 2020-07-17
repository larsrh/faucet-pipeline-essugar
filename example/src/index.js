import * as React from "react";
import * as ReactDOM from "react-dom";
import {greeting} from "./lib";
import {HelloWorld} from "./component";

console.log(greeting);

ReactDOM.render(
    React.createElement(HelloWorld),
    document.getElementById("test")
);