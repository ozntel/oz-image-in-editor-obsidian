import { Plugin, TFile, loadMermaid, loadMathJax } from 'obsidian';
import { OzanImagePluginSettingsTab } from './settings';
import { OzanImagePluginSettings, DEFAULT_SETTINGS } from './settings';
import * as ObsidianHelpers from 'src/util/obsidianHelper';
import * as ImageHandler from 'src/util/imageHandler';
import { buildExtension } from 'src/cm6';

export default class OzanImagePlugin extends Plugin {
    settings: OzanImagePluginSettings;

    async onload() {
        console.log('Image in Editor Plugin is loaded');

        this.addSettingTab(new OzanImagePluginSettingsTab(this.app, this));

        await this.loadSettings();

        try {
            loadMathJax();
            loadMermaid();
        } catch (err) {
            console.log(err);
        }

        // --> New Editor (CM6)
        if (this.settings.cm6RenderAll) {
            const extension = buildExtension({ plugin: this });
            this.registerEditorExtension(extension);
        }

        // --> Custom Event Listeners
        document.on('click', `.oz-obsidian-inner-link`, this.onClickTransclusionLink);
        document.on('contextmenu', `div.oz-image-widget-cm6 img[data-path]`, this.onImageMenu, false);
        if (this.settings.previewOnHoverInternalLink) {
            document.on('mouseover', '.oz-obsidian-inner-link', this.filePreviewOnHover);
        }
    }

    onunload() {
        // --> Unload Event Listeners
        document.off('contextmenu', `div.oz-image-widget-cm6 img[data-path]`, this.onImageMenu, false);
        document.off('click', `.oz-obsidian-inner-link`, this.onClickTransclusionLink);
        document.off('mouseover', '.oz-obsidian-inner-link', this.filePreviewOnHover);
        console.log('Image in Editor Plugin is unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Context Menu for Rendered Images
    onImageMenu = (event: MouseEvent, target: HTMLElement) => {
        const file = this.app.vault.getAbstractFileByPath(target.dataset.path);
        if (!(file instanceof TFile)) return;
        event.preventDefault();
        event.stopPropagation();
        ImageHandler.addContextMenu(event, this, file);
        return false;
    };

    onClickTransclusionLink = (event: MouseEvent, target: HTMLElement) => {
        event.preventDefault();
        event.stopPropagation();
        ObsidianHelpers.openInternalLink(event, target.getAttr('href'), this.app);
    };

    filePreviewOnHover = (event: MouseEvent, target: HTMLElement) => {
        this.app.workspace.trigger('link-hover', {}, event.target, target.getAttr('href'), target.getAttr('href'));
    };
}
