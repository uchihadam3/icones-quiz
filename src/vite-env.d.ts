/// <reference types="vite/client" />

declare module 'virtual:character-images' {
  /** id → URL publicada (hash do conteúdo no build). Só contém ids com imagem pronta. */
  const urls: Record<string, string>;
  export default urls;
}
