export namespace Common {
  // Storageが空かどうかは width,height,windowId,from,intoが常に存在するので
  // それらで見てもよかったが　わかりやすさのため存在フラグsettingExistを用意した。
  export interface WindowSetting {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    windowId?: number;
    settingExist?: boolean; // Storageがクリアされていれば undefined
    from?: string;
    into?: string;
    focus?: boolean;
  }

  // SetWindoID Promise
  export const setWindowId = (windowId: number) =>
    new Promise<number>((resolve, reject) => {
      try {
        chrome.storage.local.set({ windowId: windowId }, () => {
          console.log(`Set WindowID : ${windowId}`);
          resolve(windowId);
        });
      } catch (runtimeLastError) {
        reject(runtimeLastError);
      }
    });

  // Get WindowSetting
  export const getWindowSetting = (marker?: string) =>
    new Promise<Common.WindowSetting>((resolve, reject) => {
      try {
        chrome.storage.local.get((result) => {
          console.log(`/----Get Storage WindowSetting : ${marker}`);
          console.log(result);
          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });

  // Clear WindowSetting
  export const clearWindowSetting = () =>
    new Promise<void>((resolve, reject) => {
      console.log("/----Clear Local Storage");
      try {
        chrome.storage.local.clear(() => {
          console.log("     Clear Local Storage Done ----/");
          resolve();
        });
      } catch (e) {
        console.log("     Clear Local Storage Error ----/");
        reject(e);
      }
    });

  // Set WindowSetting
  export const setWindowSetting = (
    windowSetting: Common.WindowSetting,
    marker?: string
  ) =>
    new Promise<void>((resolve, reject) => {
      console.log(`/----Set Window Setting : ${marker}`);
      try {
        chrome.storage.local.set(windowSetting, () => {
          console.log("     Set Window Setting Done ----/");
          resolve();
        });
      } catch (e) {
        console.log("     Set Window Setting Error ----/");
        reject(e);
      }
    });

  /**
   * getDeepLWindowIds
   *
   * deeplを開いているtabが存在する
   * popup, appのwindowTypeの
   * windowのIdの配列を返す。
   */
  export const getDeepLWindowIDs = async () => {
    const popupTypeQuery: chrome.tabs.QueryInfo = {
      url: "https://www.deepl.com/translator*",
      windowType: "popup",
    };

    const appTypeQuery: chrome.tabs.QueryInfo = {
      url: "https://www.deepl.com/translator*",
      windowType: "app",
    };

    let deepLWindowIDs = await Promise.all([
      chrome.tabs.query(popupTypeQuery),
      chrome.tabs.query(appTypeQuery),
    ]).then((values) => {
      let tabs: chrome.tabs.Tab[] = [];
      tabs = tabs.concat(...values);
      let ids = tabs.map((tab) => tab.windowId);
      return ids;
    });

    return deepLWindowIDs;
  };

  //　Window Update
  export const windowUpdate = async (windowSetting: WindowSetting) => {
    let updateInfo: chrome.windows.UpdateInfo = {};
    updateInfo.top = windowSetting.top;
    updateInfo.left = windowSetting.left;
    updateInfo.width = windowSetting.width;
    updateInfo.height = windowSetting.height;

    return chrome.windows.update(windowSetting.windowId, updateInfo);
  };
}
