import { TFile } from 'obsidian';

export interface MSGHandlerPlugin {
    renderMSG: (params: { msgFile: TFile; targetEl: HTMLElement }) => Promise<void>;
    cleanLoadedBlobs: (params: { all: boolean; forMsgFile?: TFile }) => void;
}
