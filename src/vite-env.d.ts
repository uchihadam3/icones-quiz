/// <reference types="vite/client" />

declare module 'virtual:character-images' {
  /** id → URL publicada (hash do conteúdo no build). Só contém ids com imagem pronta. */
  const urls: Record<string, string>;
  export default urls;
}

interface ImportMetaEnv {
  /** Commit do build (definido em vite.config.ts). */
  readonly VITE_APP_VERSION?: string;
}
