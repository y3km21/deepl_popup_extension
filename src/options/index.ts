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



let getWindowSetting = () => new Promise<Common.WindowSetting>(resolve => {
    chrome.storage.sync.get((result) => {
        console.log("flag-get");
        resolve(result)
    })
});

const clearWindowSetting = () => new Promise<void>(resolve => chrome.storage.sync.clear(
    () => {
        console.log("flag-clear");
        resolve()
    }
));

const setWindowSetting = (windowSetting: Common.WindowSetting) => new Promise<void>(resolve => chrome.storage.sync.set(windowSetting, () => {
    console.log("flag-set");

    resolve()
}));

app.ports.getWindowSetting.subscribe((_) => {
    getWindowSetting().then(
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

app.ports.getWindowSettingForCurrent.subscribe((_) => {
    getWindowSetting().then(
        windowSettings => {
            // Window Setting Send
            console.log(windowSettings);

            app.ports.gotWindowSettingForCurrent.send(windowSettings);
        }
    ).catch(err => {
        console.log(err);
        // Error Send
        app.ports.gotWindowSettingForCurrent.send(err);
    })
})


app.ports.setWindowSetting.subscribe((setting) => {
    getWindowSetting().then(tmpWindowSetting => {
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

        // clearする
        return clearWindowSetting().then(
            () => {
                console.log(tmpWindowSetting);
                // storageを更新する
                return setWindowSetting(tmpWindowSetting)
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
