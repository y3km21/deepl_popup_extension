//import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
import { Elm } from "./src/Main.elm";
import { reject, result } from "lodash";
import { Common } from "../ts/common"

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
    Common.getWindowSetting("Elm getWindowsSetting").then(
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
    console.log("/----Storage onChanged")
    console.log(changes);
    Common.getWindowSetting("onChanged").then(windowSetting => {

        //　StorageがClearされた直後はElmに送信しない
        if (!(windowSetting.settingExist === undefined)) {
            app.ports.gotWindowSettingForCurrent.send(windowSetting);
            app.ports.gotLanguage.send(windowSetting);
            app.ports.gotFocus.send(windowSetting);

        }
    }
    ).catch(
        err => console.log(err)
    ).finally(() => {
        console.log("     Storage onChanged End----/")
    });
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
        // -- ここで　chrome.windows.onBoundsChanged.removeListner
        // background と optionsで指してるwindowsが違うんだが？
        //console.log(chrome.windows.onBoundsChanged.hasListeners());//false  <-!!?
        //chrome.windows.onBoundsChanged.removeListener(Common.onBoundsChangeFunc);
        //console.log(chrome.windows.onBoundsChanged.hasListeners());//false
        //諦めてstorageにフラグを建てることにしました。
        Common.windowUpdate(tmpWindowSetting)
            .then((window) => {
                //chrome.windows.onBoundsChanged.addListener(Common.onBoundsChangeFunc);

            }).catch(err => console.log(err));
        // -- .then　chrome.windows.onBoundsChanged.addListener

        // clearする
        return Common.clearWindowSetting().then(
            async () => {
                console.log(`update Storage : `)
                console.log(tmpWindowSetting)
                // storageを更新する
                return Common.setWindowSetting(tmpWindowSetting, "afterclear")
            }
        ).catch(err => reject(err));

    }).then(
        () => {
            console.log("return elm")
            // elmへ結果をリターン
            app.ports.gotResultSetWindowSetting.send({ status: "Success" });
        }
    ).catch(err => {
        console.log(err);
        // elmへ結果をリターン
        app.ports.gotResultSetWindowSetting.send({ status: "Failure" });

    })


})

// Set Language
app.ports.setLang.subscribe((setting) =>
    Common.setWindowSetting(setting).then(
        () => {
            return Common.getWindowSetting()
        }
    ).then(
        (windowSetting) => {
            app.ports.gotLanguage.send(windowSetting)
        }
    ).catch(
        err => console.log(err)
    )
)

// Get Language
app.ports.getLanguage.subscribe(() =>
    Common.getWindowSetting().then(
        (windowSetting) => {
            app.ports.gotLanguage.send(windowSetting)
        }
    ).catch(
        err => console.log(err)
    )
)

// Set Focus
app.ports.setFocus.subscribe((setting) =>
    Common.setWindowSetting(setting).then(
        () => {
            return Common.getWindowSetting()
        }
    ).then((windowSetting) => {
        app.ports.gotFocus.send(windowSetting)
    }
    ).catch(
        err => console.log(err)
    )
)

// Get Focus
app.ports.getFocus.subscribe(() =>
    Common.getWindowSetting().then(
        (windowSetting) => {
            app.ports.gotFocus.send(windowSetting)
        }
    ).catch(err => console.log(err)
    )
)
