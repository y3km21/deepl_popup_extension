//import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
import { Elm } from "./src/Main.elm";
import { reject, result } from "lodash";
import { Common } from "../background/common"

let main = document.createElement("div");
main.id = "main";
document.body.appendChild(main);


var app = Elm.Main.init({
    flags: { initialValue: {} }
}
);


/************************************************************
 *
 * From Elm
 *
 ************************************************************/

app.ports.getWindowSetting.subscribe((_) => {
    Common.getWindowSetting().then(
        windowSettings => {
            // Window Setting Send
            console.log(windowSettings);

            app.ports.gotWindowSetting.send(windowSettings);
        }
    ).catch(err => {
        console.log(err);
        // Error Send
        app.ports.gotWindowSetting.send(err);
    }
    )

})

chrome.storage.onChanged.addListener((changes, areaName) => {
    console.log(changes);
    Common.getWindowSetting().then(val => {
        app.ports.gotWindowSettingForCurrent.send(val);
    }).catch(err => console.log(err));
})


app.ports.setWindowSetting.subscribe((setting) => {
    Common.getWindowSetting().then(tmpWindowSetting => {
        if (!("top" in setting)) {// Settingに"top"が存在しない
            delete tmpWindowSetting.top
        } else {
            tmpWindowSetting.top = setting.top
        }

        if (!("left" in setting)) {// Settingに"left"が存在しない
            delete tmpWindowSetting.left
        } else {
            tmpWindowSetting.left = setting.left
        }

        //settingに"width","height"が存在することはElm側で保証している
        tmpWindowSetting.width = setting.width
        tmpWindowSetting.height = setting.height

        // window位置を更新
        Common.windowUpdate(tmpWindowSetting);

        // clearする
        return Common.clearWindowSetting().then(
            () => {
                console.log(tmpWindowSetting);
                // storageを更新する
                return Common.setWindowSetting(tmpWindowSetting)
            }
        ).catch(err => reject(err));

    }).then(
        () => {
            // elmへ結果をリターン
            app.ports.gotResultSetWindowSetting.send({ status: "Success" });
        }
    ).catch(err => {
        console.log(err);
        // elmへ結果をリターン
        app.ports.gotResultSetWindowSetting.send({ status: "Failure" });

    })


})
