export namespace Common {
    export interface WindowSetting { top?: number, left?: number, width?: number, height?: number, windowId?: number };



    // SetWindoID Promise
    export const setWindowId = (windowId: number) => new Promise<number>((resolve, reject) => {
        try {
            chrome.storage.local.set({ windowId: windowId }, () => {
                console.log(`Set WindowID : ${windowId}`);
                resolve(windowId);
            })
        }
        catch (runtimeLastError) {
            reject(runtimeLastError)
        }
    });


    // Get WindowSetting
    export const getWindowSetting = () => new Promise<Common.WindowSetting>((resolve, reject) => {
        try {
            chrome.storage.local.get((result) => {
                console.log("Get Storage WindowSetting :");
                console.log(result);
                resolve(result)
            })
        } catch (e) {
            reject(e)
        }
    });

    // Clear WindowSetting
    export const clearWindowSetting = () => new Promise<void>((resolve, reject) => {
        try {
            chrome.storage.local.clear(() => {
                console.log("Clear Local Storage")
                resolve()
            })
        } catch (e) {
            reject(e)
        }
    });

    // Set WindowSetting
    export const setWindowSetting = (windowSetting: Common.WindowSetting) => new Promise<void>((resolve, reject) => {
        try {
            chrome.storage.local.set(windowSetting, () => {
                console.log("Set Window Setting")
                resolve()
            })
        } catch (e) {
            reject(e)
        }
    })


    // Get PopupWindowID
    const popUpWindowIDsQueryOptions: chrome.tabs.QueryInfo = { url: "https://www.deepl.com/translator*", windowType: "popup" }
    export const getPopupWindowIDs = async () => {
        return await chrome.tabs.query(popUpWindowIDsQueryOptions).then(
            tabs => {
                return tabs.map(tab => tab.windowId);
            }
        )
    }


    //　Window Update
    export const windowUpdate = async (windowSetting: WindowSetting) => {
        let updateInfo: chrome.windows.UpdateInfo = {}
        updateInfo.top = windowSetting.top;
        updateInfo.left = windowSetting.left;
        updateInfo.width = windowSetting.width;
        updateInfo.height = windowSetting.height;

        return chrome.windows.update(windowSetting.windowId, updateInfo);
    }
}