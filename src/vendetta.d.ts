// Ambient type declarations for the @vendetta/* plugin API (provided by the
// host loader at runtime, resolved here only so `tsc` can type-check the bundle
// standalone). These are intentionally loose — match your loader's real types.
declare module "@vendetta" {
  export const logger: any;
  export const version: string;
  export const isDev: boolean;
}

// Minimal shim for the automatic JSX runtime — react itself is provided by the
// host loader, only the types for the runtime import are needed by tsc.
declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export const Fragment: any;
}

declare module "@vendetta/metro" {
  export function findByProps(...props: string[]): any;
  export function findByStoreName(name: string): any;
  export function findByName(name: string): any;
  export function findByDisplayName(name: string): any;
}

declare module "@vendetta/patcher" {
  export function before(name: string, module: any, callback: (args: any[]) => void): () => void;
  export function instead(
    name: string,
    module: any,
    callback: (args: any[], original: (...args: any[]) => any) => any,
  ): () => void;
  export function after(name: string, module: any, callback: (args: any[], res: any) => any): () => void;
}

declare module "@vendetta/plugin" {
  export const storage: any;
}

declare module "@vendetta/storage" {
  export function useProxy(target: any): void;
}

declare module "@vendetta/ui/components" {
  export const General: any;
  export const Forms: any;
}

declare module "@vendetta/ui/toasts" {
  export function showToast(content: string): void;
}
