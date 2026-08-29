// Ambient type declarations for the @vendetta/* plugin API (provided by the
// host loader at runtime, resolved here only so `tsc` can type-check the bundle
// standalone). These are intentionally loose — match your loader's real types.

// Classic JSX runtime — the bundle emits `React.createElement`, and react is
// provided globally by the host loader; only the type is needed by tsc. This
// file is a global script (no top-level import/export), so a top-level
// `declare var` is a global declaration.
declare var React: any;

declare module "@vendetta/metro" {
  export function findByProps(...props: string[]): any;
  export function findByStoreName(name: string): any;
  export function findByName(name: string): any;
}

declare module "@vendetta/metro/common" {
  export const constants: any;
}

declare module "@vendetta/patcher" {
  export function before(name: string, module: any, callback: (args: any[]) => void): () => void;
  export function instead(
    name: string,
    module: any,
    callback: (args: any[], original: (...args: any[]) => any) => any,
  ): () => void;
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

declare module "@vendetta/ui/alerts" {
  export function showConfirmationAlert(options: any): void;
}
