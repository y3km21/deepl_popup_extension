import { Common } from "../../ts/common"

export namespace Elm {
    namespace Main {
        interface App {
            ports: Ports;
        }

        interface Args {
            node?: HTMLElement;
            flags: Flags;
        }

        interface Flags {
            initialValue: any;
        }

        interface Ports {
            getWindowSetting: Subscribe<any>;
            gotWindowSetting: Send<any>;
            setWindowSetting: Subscribe<Common.WindowSetting>;
            gotResultSetWindowSetting: Send<any>;
            gotWindowSettingForCurrent: Send<any>;
            setLang: Subscribe<Common.WindowSetting>;
            getLanguage: Subscribe<any>;
            gotLanguage: Send<any>;
            setFocus: Subscribe<Common.WindowSetting>;
            getFocus: Subscribe<any>;
            gotFocus: Send<any>;
        }

        interface Subscribe<T> {
            subscribe(callback: (value: T) => any): void;
        }

        interface Send<T> {
            send(value: T): void;
        }

        function init(args: Args): App;
    }
}
