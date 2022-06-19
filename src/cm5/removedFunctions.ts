// ts-nocheck

import { WYSIWYG_Style } from 'src/cm5/constants';
import OzanImagePlugin from 'src/main';
import * as WidgetHandler from 'src/cm5/widgetHandler';
import { checkLine, checkLines } from 'src/cm5/checkLine';
import { getFileCmBelongsTo } from 'src/cm5/cm5Helper';
import { isAnExcalidrawFile, excalidrawPluginIsLoaded } from 'src/util/excalidrawHandler';
import { TAbstractFile, TFile } from 'obsidian';
import * as ImageHandler from 'src/util/imageHandler';
import CodeMirror from 'codemirror';

// --> Removed Plugin Constants
let loadedStyles: Array<HTMLStyleElement>;
let imagePromiseList: Array<string> = [];

const load_WYSIWYG_Styles = (plugin: any) => {
    plugin.loadedStyles = Array<HTMLStyleElement>(0);
    var style = document.createElement('style');
    style.innerHTML = WYSIWYG_Style;
    document.head.appendChild(style);
    plugin.loadedStyles.push(style);
};

const unload_WYSIWYG_Styles = (plugin: any) => {
    if (!plugin.loadedStyles || typeof plugin.loadedStyles[Symbol.iterator] !== 'function') return;
    for (let style of plugin.loadedStyles) {
        document.head.removeChild(style);
    }
    plugin.loadedStyles = Array<HTMLStyleElement>(0);
};

const handleWYSIWYG = (plugin: OzanImagePlugin, newWYSIWYG: boolean) => {
    if (newWYSIWYG) {
        load_WYSIWYG_Styles(plugin);
    } else {
        unload_WYSIWYG_Styles(plugin);
    }
};

const handleToggleRenderAll = (plugin: any, newRenderAll: boolean) => {
    if (newRenderAll) {
        plugin.registerCodeMirror((cm: CodeMirror.Editor) => {
            cm.on('change', plugin.codemirrorLineChanges);
            plugin.handleInitialLoad(cm);
        });
        if (plugin.settings.refreshImagesAfterChange) plugin.app.vault.on('modify', plugin.handleFileModify);
    } else {
        plugin.app.workspace.iterateCodeMirrors((cm: CodeMirror.Editor) => {
            cm.off('change', plugin.codemirrorLineChanges);
            WidgetHandler.clearAllWidgets(cm);
        });
        plugin.app.vault.off('modify', plugin.handleFileModify);
    }
};

// Handle Transclusion Setting Off
const handleTransclusionSetting = (plugin: OzanImagePlugin, newSetting: boolean) => {
    plugin.app.workspace.iterateCodeMirrors((cm) => {
        if (!newSetting) {
            for (let i = 0; i <= cm.lastLine(); i++) {
                let line = cm.lineInfo(i);
                WidgetHandler.clearTransclusionWidgets(line);
            }
        } else {
            checkLines(cm, 0, cm.lastLine(), this);
        }
    });
};

// Line Edit Changes
const codemirrorLineChanges = (cm: any, change: any) => {
    checkLines(cm, change.from.line, change.from.line + change.text.length - 1, this);
};

// Only Triggered during initial Load
const handleInitialLoad = (plugin: OzanImagePlugin, cm: CodeMirror.Editor) => {
    var lastLine = cm.lastLine();
    var file = getFileCmBelongsTo(cm, plugin.app.workspace);
    for (let i = 0; i < lastLine + 1; i++) {
        checkLine(cm, i, file, this);
    }
};

// Handle Toggle for Refresh Images Settings
const handleRefreshImages = (plugin: any, newRefreshImages: boolean) => {
    if (newRefreshImages) {
        plugin.app.vault.on('modify', plugin.handleFileModify);
    } else {
        plugin.app.vault.off('modify', plugin.handleFileModify);
    }
};

// Handle File Changes to Refhres Images
const handleFileModify = (plugin: OzanImagePlugin, file: TAbstractFile) => {
    if (!(file instanceof TFile)) return;
    if (ImageHandler.pathIsAnImage(file.path) || (excalidrawPluginIsLoaded(plugin.app) && isAnExcalidrawFile(file))) {
        plugin.app.workspace.iterateCodeMirrors((cm) => {
            var lastLine = cm.lastLine();
            checkLines(cm, 0, lastLine, this, file.path);
        });
    }
};

const addToImagePromiseList = (plugin: any, path: string) => {
    if (!plugin.imagePromiseList.contains(path)) {
        plugin.imagePromiseList.push(path);
    }
};

const removeFromImagePromiseList = (plugin: any, path: string) => {
    if (plugin.imagePromiseList.contains(path)) {
        plugin.imagePromiseList = plugin.imagePromiseList.filter((crPath: any) => crPath !== path);
    }
};

export { addToImagePromiseList, removeFromImagePromiseList, imagePromiseList };
