//import { browser } from "webextension-polyfill-ts";
import * as path from "path";
import { Common } from "./common";

/************************************************************
 * 
 * Global variables
 * 
 ************************************************************/

// DeepL Translator Popup Window Id
let deeplWindowId = -1;

//Tab ID
let deeplTabId = -1;

// window作成直後かどうか
let immediatelyAfterWindowCreate = false;

/************************************************************
 * 
 * Window
 * 
 ************************************************************/
/* 
 * 
 * TODO
 * 設定画面で位置情報のリセットをできるようにする。
 * 初期サイズの設定
 * 
 */
// Window settings

//interface WindowSetting { top?: number, left?: number, width?: number, height?: number, windowId?: number };
import WindowSetting = Common.WindowSetting;


// top,left は最初初期化しない。
// width,height は値が存在すれば初期化しない
chrome.storage.sync.get(result => {
    let windowsSettings: WindowSetting = {};
    if (!("width" in result)) {
        windowsSettings.width = 750;
    }
    if (!("height" in result)) {
        windowsSettings.height = 750;
    }
    chrome.storage.sync.set(windowsSettings);

})


//　Window 作成
let createAppWindow = async (createData: chrome.windows.CreateData) => {
    await chrome.windows.create(createData).then(
        window => {
            // deeplWindowId の更新
            deeplWindowId = window.id;
            console.log(`deeplWindowId is ${deeplWindowId}`);

            // deeplWindowId set Storage
            chrome.storage.sync.set({ windowId: deeplWindowId });
        }

    ).catch(reason => console.log(reason));

    console.log("create window");
    return;
}

// 境界値が変更されたらPopupWindow位置、サイズ情報を保存する
// Windowのサイズ変更、Windowの位置変更でFire
chrome.windows.onBoundsChanged.addListener((window) => {

    // deeplWindowIdが失効していないか確認
    // 失効していればstorageを確認し存在すれば更新
    if (deeplWindowId === -1) {
        getWindowSetting().then(
            setting => {
                if ("windowId" in setting) {
                    deeplWindowId = setting.windowId
                }
            }
        )
    }

    if (window.id === deeplWindowId) {
        chrome.storage.sync.set({ top: window.top, left: window.left, height: window.height, width: window.width });
    }
})

// removeされたらdeeplWindowId, deeplTabIdを初期化する
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === deeplWindowId) {
        deeplWindowId = -1;
        deeplTabId = -1;
        console.log("Removed deepL Window")
    }
})

let getWindowSetting = () => new Promise<Common.WindowSetting>(resolve => {
    chrome.storage.sync.get((result) => {
        console.log("flag-get");
        resolve(result)
    })
});

/************************************************************
 * 
 * context
 * 
 ************************************************************/

let contextProperties: chrome.contextMenus.CreateProperties = {
    id: "deepl_extension_context",
    checked: true,
    contexts: ["selection"],
    title: "Send DeepL Translate",
    visible: true,

};

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


    // Storage deeplWindowId check
    if (deeplWindowId === -1) {
        // get WindowID in storage 
        let getStorageDeeplWindowId: WindowSetting = await (() => new Promise(resolve => {
            chrome.storage.sync.get((result) => {
                resolve(result);
            })
        }))()
        console.log(getStorageDeeplWindowId);

        if ("windowId" in getStorageDeeplWindowId) {

            await chrome.windows.get(getStorageDeeplWindowId.windowId).then(
                // Window Exist
                window => {
                    deeplWindowId = getStorageDeeplWindowId.windowId;
                }
            ).catch(err => {
                // Window No Exist
                deeplWindowId = -1;
            });

            console.log(`deeplWindowId is update! : ${deeplWindowId}`)
        }
    }


    //Popup Window Create
    if (deeplWindowId === -1) {
        console.log(`Create Window phase ... deepLWindowId : ${deeplWindowId}`)
        // Noexist 

        // get window settings
        // sync.getがPromiseじゃないのでPromiseにしている。
        let getWindowStatus: WindowSetting = await (() => new Promise(resolve => {
            chrome.storage.sync.get((result) => {
                console.log(`WindowStatus is...`);
                console.log(result);
                resolve(result);
            })
        }).catch(
            err => {
                console.log(err);
            }
        ))()
        let windowStatus: WindowSetting = getWindowStatus;

        // window Create Data
        let createData: chrome.windows.CreateData = {
            focused: true,
            type: "popup",
            top: windowStatus.top,
            left: windowStatus.left,
            height: windowStatus.height,
            width: windowStatus.width,
            url: url,
        }
        await createAppWindow(createData);
        immediatelyAfterWindowCreate = true;

    }

    let queryOptions: chrome.tabs.QueryInfo = { url: "https://www.deepl.com/translator*", windowId: deeplWindowId }
    // tab url update
    chrome.tabs.query(queryOptions).then(
        async tabs => {
            let tab = tabs.pop();

            if (immediatelyAfterWindowCreate) {
                // Window 作成直後
                // Window　作成直後は更新を行わない
                immediatelyAfterWindowCreate = false
            }
            else {
                // Window 作成直後ではない
                await chrome.tabs.update(tab.id, { url: url });
                console.log(`tab is updated`)
            };

            // deeplTabIdの更新
            deeplTabId = tab.id;
            console.log(`deeplTabId is ${deeplTabId}`);
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
    if (deeplTabId === details.tabId) {
        console.log(`onDOMContentLoaded! : tabid is ${details.tabId}`);
        // ad container no display
        chrome.scripting.executeScript({ target: { tabId: details.tabId }, function: adRemove }).then();
    }
}, { url: [{ hostSuffix: "deepl.com" }, { pathPrefix: "translator" }] });

function adRemove() {
    document.getElementById("lmt_pro_ad_container_1").style.display = "none";
    document.getElementById("lmt_pro_ad_container_2").style.display = "none";
    document.getElementById("lmt_quotes_article").style.display = "none";
}