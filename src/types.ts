export interface ElectronAPI {
  query: (sql: string, params: any[]) => Promise<any>;
  encrypt: (text: string) => Promise<string>;
  decrypt: (text: string) => Promise<string>;
  saveFile: (filename: string, data: string) => Promise<string>;
  deleteFile: (filename: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
