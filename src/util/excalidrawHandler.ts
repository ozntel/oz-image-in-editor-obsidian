import { App, TFile } from 'obsidian';
import { pluginIsLoaded } from './obsidianHelper';

export const excalidrawPluginIsLoaded = (app: App) => {
    return pluginIsLoaded(app, 'obsidian-excalidraw-plugin');
};

export const isAnExcalidrawFile = (imageFile: TFile) => {
    return (
        imageFile.extension === 'excalidraw' ||
        // @ts-ignore
        (ExcalidrawAutomate.isExcalidrawFile && ExcalidrawAutomate.isExcalidrawFile(imageFile))
    );
};

export const createPNGFromExcalidrawFile = async (imageFile: TFile) => {
    // @ts-ignore
    ExcalidrawAutomate.reset();
    // @ts-ignore
    var image = await ExcalidrawAutomate.createPNG(imageFile.path);
    return image;
};
