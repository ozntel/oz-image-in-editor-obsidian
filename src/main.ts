import { Plugin, TFile, loadMermaid, loadMathJax } from 'obsidian';
import { OzanImagePluginSettingsTab } from './settings';
import { OzanImagePluginSettings, DEFAULT_SETTINGS } from './settings';
import * as ObsidianHelpers from 'src/util/obsidianHelper';
import * as ImageHandler from 'src/util/imageHandler';
import { buildExtension } from 'src/cm6';
import { Extension } from '@codemirror/state';

export default class OzanImagePlugin extends Plugin {
    settings: OzanImagePluginSettings;
    editorExtensions: Extension[] = [];

    async onload() {
        console.log('Image in Editor Plugin is loaded');

        this.addSettingTab(new OzanImagePluginSettingsTab(this.app, this));

        await this.loadSettings();

        this.addCommand({
            id: 'toggle-render-all',
            name: 'Toggle Render All (Requires reload of vault)',
            callback: () => {
                this.settings.cm6RenderAll = !this.settings.cm6RenderAll;
                this.saveSettings();
            },
        });

        this.addCommand({
            id: 'toggle-render-images',
            name: 'Toggle Render Images',
            callback: () => {
                this.settings.renderImages = !this.settings.renderImages;
                this.saveSettings();
            },
        });

        this.addCommand({
            id: 'toggle-render-pdfs',
            name: 'Toggle Render PDF',
            callback: () => {
                this.settings.renderPDF = !this.settings.renderPDF;
                this.saveSettings();
            },
        });

        this.addCommand({
            id: 'toggle-render-transclusion',
            name: 'Toggle Render Transclusions',
            callback: () => {
                this.settings.renderTransclusion = !this.settings.renderTransclusion;
                this.saveSettings();
            },
        });

        this.addCommand({
            id: 'toggle-render-iframe',
            name: 'Toggle Render Iframes',
            callback: () => {
                this.settings.renderIframe = !this.settings.renderIframe;
                this.saveSettings();
            },
        });

        this.addCommand({
            id: 'toggle-render-excalidraw',
            name: 'Toggle Render Excalidraws',
            callback: () => {
                this.settings.renderExcalidraw = !this.settings.renderExcalidraw;
                this.saveSettings();
            },
        });

        try {
            loadMathJax();
            loadMermaid();
        } catch (err) {
            console.log(err);
        }

        // --> New Editor (CM6)
        this.registerEditorExtension(this.editorExtensions);
        if (this.settings.cm6RenderAll) this.loadCM6Extension();

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

    loadCM6Extension = () => {
        const extension = buildExtension({ plugin: this });
        this.editorExtensions.push(extension);
        this.app.workspace.updateOptions();
    };

    unloadCM6Extension = () => {
        this.editorExtensions.length = 0;
        this.app.workspace.updateOptions();
    };

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
