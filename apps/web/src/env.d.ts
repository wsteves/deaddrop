interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_WS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
