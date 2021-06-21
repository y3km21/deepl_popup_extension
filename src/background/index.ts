import { reject } from "lodash";
import * as path from "path";
import { Common } from "./common";


/************************************************************
 * 
 * Window
 * 
 ************************************************************/
/* 
 * 
 * TODO
 * 
 * 
 * 
 */
// Window settings

//interface WindowSetting { top?: number, left?: number, width?: number, height?: number, windowId?: number };
import WindowSetting = Common.WindowSetting;

// Initialize
// 初っ端なんで非同期で大丈夫っしょ
try {
    chrome.storage.local.get(result => {
        let windowsSettings: WindowSetting = {};
        if (!("width" in result)) { //widthが存在しない場合、初期化する
            windowsSettings.width = 750;
        }
        if (!("height" in result)) { //widthが存在しない場合、初期化する
            windowsSettings.height = 750;
        }
        if (!("windowId" in result)) { // windowIDが存在しない場合、初期化する
            windowsSettings.windowId = -1;
        }

        // Set
        try {
            chrome.storage.local.set(windowsSettings);
        } catch (e) {
            console.log(e);
        }
    })
} catch (e) {
    console.log(e);
}

// Window 作成　Function
let createAppWindow = async (createData: chrome.windows.CreateData) => {
    return await chrome.windows.create(createData).then(
        window => {
            console.log("create window");
            // StorageのWindowIDを更新する。
            return Common.setWindowId(window.id)
        }

    )
}


// PopupWindow位置、サイズ情報を保存する
// Windowのサイズ変更、Windowの位置変更でFire
chrome.windows.onBoundsChanged.addListener(async (window) => {
    if (window.type !== "popup") {// popupではないwindowは無視
        return;
    } else if (window.id === (await Common.getWindowSetting()).windowId) {　// 選択したwindowのIDとStrageWindowIDが同じ
        console.log("Storage Window ID is Valid")
        chrome.storage.local.set({ top: window.top, left: window.left, height: window.height, width: window.width });
    } else {
        console.log("Storage Window ID is Invalid")

        chrome.tabs.query({
            url: "https://www.deepl.com/translator*",
            windowId: window.id
        }).then(
            async tabs => {
                if (tabs.length === 0) {// 選択したタブがDeepLではない
                    console.log("Invalid Window");
                    return;
                } else {//  選択したタブがDeepL
                    try {
                        chrome.storage.local.set({
                            top: window.top,
                            left: window.left,
                            height: window.height,
                            width: window.width,
                            windowId: window.id
                        }, () => {
                            console.log(`Update Storage Window ID : ${window.id}`)
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }

            }
        ).catch(err => console.log(err));
    }
})

// remove
chrome.windows.onRemoved.addListener(async (windowId) => {
    if (windowId === (await Common.getWindowSetting()).windowId) {
        console.log("Removed deepL Window")
    }
})



/************************************************************
 * 
 * context
 * 
 ************************************************************/

//Context Create

let contextProperties: chrome.contextMenus.CreateProperties = {
    id: "deepl_extension_context",
    checked: true,
    contexts: ["selection"],
    title: "Send DeepL Translate",
    visible: true,

};

//TODO : contextの存在を確認してから作成したほうがいい
chrome.contextMenus.create(contextProperties);

chrome.contextMenus.onClicked.addListener(async (info) => {
    /* 
     * 
     * Todo
     * selectedTextのトリム、　トリム設定を設定画面からできるとよし。
     * 
     */
    let selectedText = info.selectionText;
    let url = path.join("https://www.deepl.com/translator#en/ja/", selectedText);

    // updateWIndowID
    let updateWindowID = -1;

    // PopupWindowの確認
    const windowExists = await Common.getPopupWindowIDs().then(async (windowIDs) => {
        if (windowIDs.length === 0) { // windowが存在しない
            console.log("Popup Window is No Exists")
            return false
        }

        let storageWindowID: number = (await Common.getWindowSetting()
            .catch(err => { // errorが発生した場合　WindowIdは-1をセット
                console.log(err);
                return { windowId: -1 }
            })
        ).windowId;

        //windowIDs内にStorageWindowIDが存在するか確認する
        if (windowIDs.includes(storageWindowID)) {// Exists

            // updateWindowIDを更新
            updateWindowID = storageWindowID;

            // WindowIDがStorageWIndowIDと異なればWindowをリムーブする
            windowIDs.forEach(WindowID => {
                if (WindowID !== storageWindowID) {
                    chrome.windows.remove(WindowID).catch(err => console.log(err));
                }
            });

            return true;

        } else {// No Exists
            // windowIDs[0]のWindowをセットする
            return await Common.setWindowId(windowIDs.shift())
                .then(
                    setWindowID => {
                        console.log(`Already Exist Window ID : ${setWindowID}`);
                        // updateWindowIDを更新
                        updateWindowID = setWindowID;

                        // 残りのWindowをリムーブする
                        windowIDs.forEach(windowID => {
                            chrome.windows.remove(windowID).catch(err => console.log(err));
                        })
                        return true;
                    }
                )
                .catch(
                    err => {
                        console.log(err);
                        return false
                    }
                );
        }
    }).catch(
        err => {
            console.log(err);
            return false;
        }
    );
    console.log(`WindowExists : ${windowExists}`);

    // window作成直後かどうか
    let immediatelyAfterWindowCreate = false;

    //Popup Window Create
    if (!windowExists) { // Window No Exists
        console.log(`Create Window phase ... `)

        // get window settings
        let storageWindowSetting: WindowSetting = await Common.getWindowSetting();

        // window Create 
        let createData: chrome.windows.CreateData = {
            focused: true,
            type: "popup",
            top: storageWindowSetting.top,
            left: storageWindowSetting.left,
            height: storageWindowSetting.height,
            width: storageWindowSetting.width,
            url: url,
        }
        updateWindowID = await createAppWindow(createData);

        immediatelyAfterWindowCreate = true;
    }

    // Tab URL Update
    //WindowType:popupでQuery発行すると消しきれてないWindow選択しそうなのでWindowIDでQuery発行
    let queryOptions: chrome.tabs.QueryInfo = {
        url: "https://www.deepl.com/translator*",
        windowId: updateWindowID
    };
    chrome.tabs.query(queryOptions).then(
        async tabs => {
            if (tabs.length === 0) {
                return;
            }

            let tab = tabs.shift();　//tabsは空になっている　はず

            if (immediatelyAfterWindowCreate) {
                // Window 作成直後
                // tabの更新を行わない
                immediatelyAfterWindowCreate = false
            }
            else {
                // Window 作成直後ではない
                // tabの更新を行う
                await chrome.tabs.update(tab.id, { url: url })
                    .catch(
                        err => console.log(err)
                    );

                console.log(`tab is updated`)
            };
            return;
        }
    ).catch(
        err => {
            console.log(err);
        }
    )

})

/************************************************************
 * 
 * Ad No Display
 * 
 ************************************************************/

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {

    chrome.tabs.get(details.tabId).then(
        tab => {
            return chrome.windows.get(tab.windowId)
        }
    ).then(window => {
        if (window.type === "popup") {
            console.log(`onDOMContentLoaded! : tabid is ${details.tabId}`);
            // ad container no display
            chrome.scripting.executeScript({ target: { tabId: details.tabId }, function: adRemove })
                .catch(err => console.log(err));
        }
    }).catch(err => console.log(err));

}, { url: [{ hostSuffix: "deepl.com" }, { pathPrefix: "translator" }] });

function adRemove() {
    document.getElementById("lmt_pro_ad_container_1").style.display = "none";
    document.getElementById("lmt_pro_ad_container_2").style.display = "none";
    document.getElementById("lmt_quotes_article").style.display = "none";
}


