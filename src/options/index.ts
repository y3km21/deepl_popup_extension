import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
const hoge = require("./../ts/description");


const buttonDiv = document.createElement("div");
buttonDiv.id = "buttonDiv";

const descriptionDiv = document.createElement("div");
const description = document.createElement("p");
description.textContent = "Choose a different background color!"
descriptionDiv.appendChild(description);

document.body.appendChild(buttonDiv);
document.body.appendChild(descriptionDiv);


//
let selectedClassName = "current";
const presetButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];

function handleButtonClick(event: MouseEvent) {

    const { target } = event;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    let current = target.parentElement.querySelector(`.${selectedClassName}`);
    if (current && current !== event.target) {
        current.classList.remove(selectedClassName);
    }

    let color = target.dataset.color;
    target.classList.add(selectedClassName);
    chrome.storage.sync.set({ color });
}


function constructOptions(buttonColors: string[]) {

    chrome.storage.sync.get("color", (data) => {
        let currentColor = data.color;

        for (let buttonColor of buttonColors) {
            let button = document.createElement("button");
            button.dataset.color = buttonColor;
            button.style.backgroundColor = buttonColor;

            if (buttonColor === currentColor) {
                button.classList.add(selectedClassName);
            }

            button.addEventListener("click", handleButtonClick);
            buttonDiv.appendChild(button);
        }
    })
}

constructOptions(presetButtonColors);
