// @ts-ignore
import { Workspace, Vault, TFile, App, Keymap, Platform } from 'obsidian';

// Getting Active Markdown File
export const getActiveNoteFile = (workspace: Workspace) => {
    return workspace.getActiveFile();
};

// Get Full Path of the image
export const getPathOfImage = (vault: Vault, image: TFile) => {
    return vault.getResourcePath(image) + '?' + image.stat.mtime;
};

export const openInternalLink = (event: MouseEvent, link: string, app: App) => {
    app.workspace.openLinkText(link, '/', Keymap.isModifier(event, 'Mod') || 1 === event.button);
};

export const clearSpecialCharacters = (str: string) => {
    return str.replace(/\s|\W|[#$%^&*()]/g, '');
};

export const pluginIsLoaded = (app: App, pluginId: string) => {
    // @ts-ignore
    return app.plugins.getPlugin(pluginId);
};

export const livePreviewActive = (app: App): boolean => {
    return (app.vault as any).config?.livePreview;
};

export const getObsidianResourcePathPrefix = () => {
    // Check https://discord.com/channels/686053708261228577/1103015564055691324/1103035015404728320
    //@ts-ignore
    return Platform?.resourcePathPrefix || 'app://local/';
};
