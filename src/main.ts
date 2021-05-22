import { Plugin } from 'obsidian';
import { clearWidgets, getFileCmBelongsTo } from './utils';
import { check_line, check_lines } from './check-line';
import { OzanImagePluginSettingsTab } from './settings';

interface OzanImagePluginSettings {
    renderImages: boolean,
    renderPDF: boolean
}

const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    renderImages: true,
    renderPDF: false
}

export default class OzanImagePlugin extends Plugin {

    settings: OzanImagePluginSettings;

    async onload() {
        console.log('Image in Editor Plugin is loaded');
        this.addSettingTab(new OzanImagePluginSettingsTab(this.app, this));
        await this.loadSettings();
        // Register event for each change
        this.registerCodeMirror((cm: CodeMirror.Editor) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        })
    }

    onunload() {
        this.app.workspace.iterateCodeMirrors((cm) => {
            cm.off("change", this.codemirrorLineChanges);
            clearWidgets(cm);
        });
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
        var file = getFileCmBelongsTo(cm, this.app.workspace);
        for (let i = 0; i < lastLine; i++) {
            check_line(cm, i, file, this.app, this.settings);
        }
    }
}