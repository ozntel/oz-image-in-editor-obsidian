import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { ObsidianHelpers, WidgetHandler, ImageHandler } from './utils';
import { check_line, check_lines } from './check-line';
import { OzanImagePluginSettingsTab } from './settings';

interface OzanImagePluginSettings {
    renderAll: boolean,
    renderPDF: boolean,
    refreshImagesAfterChange: boolean,
}

const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    renderAll: true,
    renderPDF: false,
    refreshImagesAfterChange: false
}

export default class OzanImagePlugin extends Plugin {

    settings: OzanImagePluginSettings;

    async onload() {
        console.log('Image in Editor Plugin is loaded');
        this.addSettingTab(new OzanImagePluginSettingsTab(this.app, this));
        await this.loadSettings();
        // Register event for each change
        this.addCommand({
            id: 'toggle-render-all',
            name: 'Toggle Render All',
            callback: () => {
                this.handleToggleRenderAll(!this.settings.renderAll);
                this.settings.renderAll = !this.settings.renderAll;
                this.saveSettings();
            }
        })
        if (!this.settings.renderAll) return;
        this.registerCodeMirror((cm: CodeMirror.Editor) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        })
        if (!this.settings.refreshImagesAfterChange) return;
        this.app.vault.on('modify', this.handleFileModify);
    }

    onunload() {
        this.app.workspace.iterateCodeMirrors((cm) => {
            cm.off("change", this.codemirrorLineChanges);
            WidgetHandler.clearWidgets(cm);
        });
        this.app.vault.off('modify', this.handleFileModify);
        console.log('Image in Editor Plugin is unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Line Edit Changes
    codemirrorLineChanges = (cm: any, change: any) => {
        check_lines(cm, change.from.line, change.from.line + change.text.length - 1, this.app, this.settings);
    }

    // Only Triggered during initial Load
    handleInitialLoad = (cm: CodeMirror.Editor) => {
        var lastLine = cm.lastLine();
        var file = ObsidianHelpers.getFileCmBelongsTo(cm, this.app.workspace);
        for (let i = 0; i < lastLine + 1; i++) {
            check_line(cm, i, file, this.app, this.settings);
        }
    }

    // Handle Toggle for renderAll
    handleToggleRenderAll = (newRenderAll: boolean) => {
        if (newRenderAll) {
            this.registerCodeMirror((cm: CodeMirror.Editor) => {
                cm.on("change", this.codemirrorLineChanges);
                this.handleInitialLoad(cm);
            })
            if (this.settings.refreshImagesAfterChange) this.app.vault.on('modify', this.handleFileModify);
        } else {
            this.app.workspace.iterateCodeMirrors((cm) => {
                cm.off("change", this.codemirrorLineChanges);
                WidgetHandler.clearWidgets(cm);
            });
            this.app.vault.off('modify', this.handleFileModify);
        }
    }

    // Handle Toggle for Refresh Images
    handleRefreshImages = (newRefreshImages: boolean) => {
        if (newRefreshImages) {
            this.app.vault.on('modify', this.handleFileModify);
        } else {
            this.app.vault.off('modify', this.handleFileModify)
        }
    }

    // Handle File Upload
    handleFileModify = (file: TAbstractFile) => {
        if (!(file instanceof TFile)) return;
        if (!ImageHandler.is_an_image(file.path)) return;
        this.app.workspace.iterateCodeMirrors(cm => {
            var lastLine = cm.lastLine();
            check_lines(cm, 0, lastLine, this.app, this.settings, file.path);
        })
    }
}