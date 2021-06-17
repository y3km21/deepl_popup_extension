//import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
import { Elm } from "./src/Main.elm";

let main = document.createElement("div");
main.id = "main";
document.body.appendChild(main);

Elm.Main.init({
    flags: { initialValue: "none" }
}
);


