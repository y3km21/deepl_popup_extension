/**
 * Backgroud
 *
 * Chrome Extension Service Worker
 *
 */

import * as _ from "lodash";
import * as path from "path";
import { Common } from "../ts/common";

/**
 * Window
 *
 */

/**
 * Common Window Setting import
 *
 */
import WindowSetting = Common.WindowSetting;

/**
 * Window Setting Initialize
 *
 * ローカルストレージ内に保存されているwindowの設定情報を取得し、
 * 存在しない項目は初期化し、ストレージにセットする。
 *
 */
try {
  chrome.storage.local.get((storageSetting) => {
    let addSetting: WindowSetting = {};
    if (!("width" in storageSetting)) {
      //widthが存在しない場合、初期化する
      addSetting.width = 750;
    }

    if (!("height" in storageSetting)) {
      //widthが存在しない場合、初期化する
      addSetting.height = 750;
    }

    if (!("windowId" in storageSetting)) {
      // windowIDが存在しない場合、初期化する
      addSetting.windowId = -1;
    }

    if (!("from" in storageSetting)) {
      // fromが存在しない場合、初期化する
      addSetting.from = "en";
    }

    if (!("into" in storageSetting)) {
      // intoが存在しない場合、初期化する
      addSetting.into = "ja";
    }

    if (!("focus" in storageSetting)) {
      addSetting.focus = true;
    }

    addSetting.settingExist = true;

    // StorageにSetthigを追加する。
    try {
      chrome.storage.local.set(addSetting);
    } catch (e) {
      console.log(e);
    }
  });
} catch (e) {
  console.log(e);
}

/**
 * Create App Window
 *
 * @param createData - Window Create Data
 * {@link https://developer.chrome.com/docs/extensions/reference/windows/ | chrome.windows - Chrome Developers}.
 * @returns WindowID - Created Window ID
 *
 * Window CreateData から Windowを作成する。
 * 作成完了後、StorageのWindowIDを更新し、
 * WindowIDのPromiseを返す。
 *
 */
let createAppWindow = async (createData: chrome.windows.CreateData) => {
  return await chrome.windows.create(createData).then((window) => {
    console.log("Create AppWindow");
    // StorageのWindowIDを更新する。
    return Common.setWindowId(window.id);
  });
};

// async を別途　Commonに関数でまとめて　removeListener を呼べるようにする
/**
 * Window OnBoundsChanged Event
 *
 * 任意のWindowのサイズ、位置が変更されたときにFire
 *
 * Windowが
 *  Storageに保存されたWindowIdと一致する
 *  または
 *  PopupかつDeeplTranslatorを表示したもの
 * だった場合、
 * Storageに更新された位置、サイズ、WindowIDを保存する。
 *
 */
chrome.windows.onBoundsChanged.addListener(async (window) => {
  // popup, app 以外のwindowTypeの場合は無視
  if (window.type !== "popup" && window.type !== "app") {
    return;
  }

  // Storageに保存されたWindowSettingを取得。
  let storageSetting = await Common.getWindowSetting("onBoundsChanged");
  let storageWindowID = storageSetting.windowId;

  //　strageSettingが初期化されていることを確認する。
  if (!(storageSetting.settingExist == null)) {
    console.log("/----Windows OnBoudsChanged----/");

    // ActiveなwindowのIDとStrageWindowIDが同じ
    if (window.id === storageWindowID) {
      console.log(`   Storage Window ID is Valid : ${storageWindowID}`);
      // 変更されたwindow情報をstorageにset
      chrome.storage.local.set(
        {
          top: window.top,
          left: window.left,
          height: window.height,
          width: window.width,
        },
        () => {}
      );
    }
    //　ActiveなwindowのIDとStrageWindowIDが異なる。
    else {
      console.log(`   Storage Window ID is Invalid : ${storageWindowID}`);

      chrome.tabs
        //　Activeなwindow内でdeeplを開いているタブを取得する。
        .query({
          url: "https://www.deepl.com/translator*",
          windowId: window.id,
        })
        .then(async (tabs) => {
          // 取得されたtabsにDeepLが存在しない。
          if (tabs.length === 0) {
            console.log("   The tab that opens DeepL does not exist");
            return;
          }
          //  取得されたtabsにDeepLが存在する。
          else {
            try {
              // 変更されたwindow情報をstorageにset
              chrome.storage.local.set(
                {
                  top: window.top,
                  left: window.left,
                  height: window.height,
                  width: window.width,
                  windowId: window.id,
                },
                () => {
                  console.log(`   Update Storage Window ID : ${window.id}`);
                }
              );
            } catch (e) {
              console.log(e);
            }
          }
        })
        .catch((err) => console.log(err));
    }
  }
});

/**
 * Window onRemoved Event
 *
 * 任意のwindowがcloseされたときにFire
 *
 */
chrome.windows.onRemoved.addListener(async (windowId) => {
  if (windowId === (await Common.getWindowSetting()).windowId) {
    console.log("Removed deepL Window");
  }
});

/**
 * Context
 *
 */

/**
 * Context Properties
 *
 * Context Menu用の Properties
 * 
 * {@link https://developer.chrome.com/docs/extensions/reference/contextMenus/ | chrome.contextMenus
 }
 *
 */
let contextProperties: chrome.contextMenus.CreateProperties = {
  id: "deepl_extension_context",
  checked: true,
  contexts: ["selection"],
  title: "Send DeepL Translate",
  visible: true,
};

/**
 * Create Context Menu
 *
 */
try {
  chrome.contextMenus.create(contextProperties);
} catch (err) {
  console.log(err);
}

/**
 * ContextMenus onClicked Event
 *
 * コンテキストメニューをクリックしたとき、選択していたテキストから、URLを作成し、
 * DeepLを開いているdeepLWindowの存在確認、作成、タブURLの更新を行う。
 *
 */
chrome.contextMenus.onClicked.addListener(async (info) => {
  // get window setting
  let storageSetting: WindowSetting = await Common.getWindowSetting();

  // 選択した文字列をパーセントエンコード
  let selectedText: string = encodeURIComponent(info.selectionText);
  /**
   * 文字列の置換
   *
   * DeepLtranslatorは
   *  %2F(/), %7C(|)
   *  を %5C:(\) でエスケープする必要がある。
   *
   */
  selectedText = _.replace(selectedText, new RegExp("%2F|%7C", "g"), "%5C$&");
  console.log(`encodeSelectedText : ${selectedText}`);

  // Create URL
  let url = new URL("https://www.deepl.com");
  url.pathname = "/translator";
  url.hash = path.join(storageSetting.from, storageSetting.into, selectedText);

  // openAppWindowID
  let openAppWindowID = -1;

  /**
   * 有効なAppWindowが存在するか確認する。
   *
   */
  const appWindowExists = await Common.getDeepLWindowIDs()
    .then(async (deepLWindowIds) => {
      // deepLWindowが存在しない
      if (deepLWindowIds.length === 0) {
        console.log("Popup Window is No Exists");
        return false;
      }

      // storageに保存されているWindowID
      let storageWindowID: number = storageSetting.windowId;

      /**
       * deepLWindowsIdsに有効なappWindowIdが存在するかどうか
       */
      let appWindowExists = false;
      for (let idx = 0; idx < deepLWindowIds.length; ++idx) {
        if (deepLWindowIds[idx] === storageWindowID) {
          openAppWindowID = storageWindowID;
          appWindowExists = true;
        } else if (idx === deepLWindowIds.length - 1 && !appWindowExists) {
          // 最終要素までstorageWindowIDと同じwindowがなければ
          // 新たにwindowIdを設定する。
          await Common.setWindowId(deepLWindowIds[idx])
            .then((setWindowId) => {
              openAppWindowID = setWindowId;
              appWindowExists = true;
            })
            .catch((e) => {
              console.log(e);
            });
        } else {
          // 無効なDeepLWindowはすべて閉じる。
          await chrome.windows
            .remove(deepLWindowIds[idx])
            .catch((err) => console.log(err));
        }
      }

      return appWindowExists;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });

  console.log(`WindowExists : ${appWindowExists}`);

  /**
   * Popup Window Create
   *
   * windowが存在しない場合、新たに作成する。
   * 存在する場合、tabをアップデートする。
   * focusフラグがセットされていればfocusされる。
   *
   */
  if (appWindowExists) {
    //　windowが存在する

    // focus
    if (storageSetting.focus) {
      chrome.windows
        .update(openAppWindowID, { focused: true })
        .catch((err) => console.error(err));
    }
    // Tab URL Update
    /**
     * queryOptions
     *
     * 指定したWindowIDのDeepLを開いているtabを参照する
     */
    let queryOptions: chrome.tabs.QueryInfo = {
      url: "https://www.deepl.com/translator*",
      windowId: openAppWindowID,
    };

    /**
     * 既存のWindowのurlを更新する。
     */
    chrome.tabs
      .query(queryOptions)
      .then(async (tabs) => {
        if (tabs.length === 0) {
          // ここが呼ばれることはない。
          console.log(`tabs.length is ${tabs.length} !! Why?!`);
          return;
        }

        //　tabを取得
        let tab = tabs.shift(); //tabsは空になっている　はず

        // tabの更新を行う
        await chrome.tabs
          .update(tab.id, { url: url.href })
          .catch((err) => console.log(err));

        console.log(`tab is updated : ${url.href}`);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    // Window No Exists
    console.log(`Create New App Window`);

    // window Create
    let createData: chrome.windows.CreateData = {
      focused: true,
      type: "popup",
      top: storageSetting.top,
      left: storageSetting.left,
      height: storageSetting.height,
      width: storageSetting.width,
      url: url.href,
    };

    // AppWindowを新たに作成。
    openAppWindowID = await createAppWindow(createData);
  }
});

/************************************************************
 *
 * Ad No Display
 *
 ************************************************************/
chrome.webNavigation.onDOMContentLoaded.addListener(
  (details) => {
    chrome.tabs
      .get(details.tabId)
      .then((tab) => {
        return chrome.windows.get(tab.windowId);
      })
      .then((window) => {
        if (window.type === "popup" || window.type === "app") {
          console.log(`onDOMContentLoaded! : tabid is ${details.tabId}`);
          // ad container no display
          chrome.scripting
            .executeScript({
              target: { tabId: details.tabId },
              function: adRemove,
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => console.log(err));
  },
  { url: [{ hostSuffix: "deepl.com" }, { pathPrefix: "translator" }] }
);

function adRemove() {
  document.getElementById("lmt_pro_ad_container").style.display = "none";
  document.getElementById("dl_quotes_container").style.display = "none";
  document.getElementById("iosAppAdPortal").style.display = "none";

  // Footer Remove
  Array.prototype.forEach.call(
    document.getElementsByTagName("footer"),
    (elem: HTMLElement) => {
      elem.style.display = "none";
    }
  );
}
