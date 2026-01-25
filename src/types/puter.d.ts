export {};

declare global {
  interface Window {
    puter: {
      ai: {
        txt2img: (
          prompt: string,
          options?: {
            model?: string;
            quality?: string;
          }
        ) => Promise<HTMLImageElement>;
      };
    };
  }
}
