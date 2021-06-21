import { Common } from "../../background/common"

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