
export interface GeneratedImage {
  url: string;
  base64: string;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  IMAGE_DISPLAYED = 'IMAGE_DISPLAYED',
  COMIC_DISPLAYED = 'COMIC_DISPLAYED',
  ERROR = 'ERROR',
}
