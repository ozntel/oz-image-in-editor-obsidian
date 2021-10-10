import { App, TFile } from 'obsidian';
import OzanImagePlugin from 'src/main';
import { pluginIsLoaded } from './obsidianHelper';

const mdRegex = /!\[(^$|.*?)\]\(.*?\)/;
const mdFileNameRegex = /(?<=\]\().*?(?=\))/;
const mdAltRegex = /(?<=\[)(^$|.*)(?=\])/;
const wikiRegex = /!\[\[.*?\]\]/;
const wikiFileNameRegex = /(?<=\[\[).*?((?=\|))|(?<=\[\[).*?(?=\]\])/;
const wikiAltRegex = /(?<=\|).*(?=]])/;

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

export const lineMightHaveExcalidraw = (line: string) => {
    return mdRegex.test(line) || wikiRegex.test(line);
};

export const getFile = (line: string, sourcePath: string, plugin: OzanImagePlugin) => {
    let match = line.match(mdRegex.test(line) ? mdFileNameRegex : wikiFileNameRegex);
    if (match) {
        let fileName = match[0];
        let file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileName), sourcePath);
        return file;
    }
    return null;
};

export const getAltText = (line: string) => {
    let altMatch = line.match(mdRegex.test(line) ? mdAltRegex : wikiAltRegex);
    return altMatch ? altMatch[0] : '';
};
