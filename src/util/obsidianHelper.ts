// @ts-ignore
import { Workspace, MarkdownView, Vault, TFile, App, Keymap } from 'obsidian';

// Getting Active Markdown File
export const getActiveNoteFile = (workspace: Workspace) => {
    return workspace.getActiveFile();
};

// Get Active Editor
export const getCmEditor = (workspace: Workspace): CodeMirror.Editor => {
    return workspace.getActiveViewOfType(MarkdownView)?.sourceMode?.cmEditor;
};

// Get Full Path of the image
export const getPathOfImage = (vault: Vault, image: TFile) => {
    return vault.getResourcePath(image) + '?' + image.stat.mtime;
};

export const getFileCmBelongsTo = (cm: CodeMirror.Editor, workspace: Workspace) => {
    let leafs = workspace.getLeavesOfType('markdown');
    for (let i = 0; i < leafs.length; i++) {
        // @ts-ignore
        if (leafs[i].view instanceof MarkdownView && leafs[i].view.sourceMode?.cmEditor == cm) {
            // @ts-ignore
            return leafs[i].view.file;
        }
    }
    return null;
};

export const openInternalLink = (event: MouseEvent, link: string, app: App) => {
    app.workspace.openLinkText(link, '/', Keymap.isModifier(event, 'Mod') || 1 === event.button);
};

export const clearSpecialCharacters = (str: string) => {
    return str.replace(/\s|[0-9_]|\W|[#$%^&*()]/g, '');
};

export const pluginIsLoaded = (app: App, pluginId: string) => {
    // @ts-ignore
    return app.plugins.getPlugin(pluginId);
};
