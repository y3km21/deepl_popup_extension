import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
import { browser } from "webextension-polyfill-ts";

const changeColorButton = document.createElement("button");
changeColorButton.id = "changeColor";
document.body.appendChild(changeColorButton);

browser.storage.sync.get("color").then(({ color }) => { changeColorButton.style.backgroundColor = color });

// When the button is clicked, inject setPageBackgroundColor into current page
changeColorButton.addEventListener("click", async () => {
    let [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({ target: { tabId: tab.id }, function: setPageBackgroundColor })
});


// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
    chrome.storage.sync.get("color", ({ color }) => { document.body.style.backgroundColor = color; });
}
