import * as _ from "lodash";
import "./../style/reset.scss";
import "./../style/main.scss";
import { Elm } from "./src/Main.elm";
import { Common } from "../ts/common"



var app = Elm.Main.init({
  flags: { initialValue: {} }
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log("/----Storage onChanged")
  console.log(changes);
  Common.getWindowSetting("onChanged").then(windowSetting => {

    //　StorageがClearされた直後はElmに送信しない
    if (!(windowSetting.settingExist === undefined)) {
      app.ports.gotLanguage.send(windowSetting);
    }
  }
  ).catch(
    err => console.log(err)
  ).finally(() => {
    console.log("     Storage onChanged End----/")
  });
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