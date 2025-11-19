import { FhevmWindowType } from "./fhevmTypes";

const SDK_CDN_URL = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";
const SDK_LOCAL_URL = "/relayer-sdk-js.umd.cjs";

export function isFhevmWindowType(w: any, trace?: (...args: any[]) => void): w is FhevmWindowType {
  const ok = typeof w === "object" && !!w && "relayerSDK" in w && typeof (w as any).relayerSDK?.initSDK === "function";
  if (!ok && trace) trace("[RelayerSDKLoader] window does not have relayerSDK");
  return ok;
}

type TraceType = (...args: any[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;
  constructor({ trace }: { trace?: TraceType } = {}) {
    this._trace = trace;
  }
  public isLoaded() {
    if (typeof window === "undefined") return false;
    return isFhevmWindowType(window, this._trace);
  }
  public load(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("RelayerSDKLoader: can only be used in the browser."));
    }
    if ("relayerSDK" in window) {
      if (!isFhevmWindowType(window, this._trace)) {
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }
    const tryLoad = (url: string) =>
      new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
          if (!isFhevmWindowType(window, this._trace)) {
            reject(new Error("RelayerSDKLoader: window object does not contain a valid relayerSDK object."));
          }
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          if (!isFhevmWindowType(window, this._trace)) {
            reject(new Error(`RelayerSDKLoader: SDK loaded but window.relayerSDK invalid.`));
          }
          resolve();
        };
        script.onerror = () => reject(new Error(`RelayerSDKLoader: Failed to load Relayer SDK from ${url}`));
        document.head.appendChild(script);
      });
    return tryLoad(SDK_CDN_URL).catch((e) => {
      this._trace?.("[RelayerSDKLoader] CDN failed, trying local fallback:", e);
      return tryLoad(SDK_LOCAL_URL);
    });
  }
}


