import { PluginSettingTab, Setting, App, Platform } from 'obsidian';
import OzanImagePlugin from './main';

export interface OzanImagePluginSettings {
    renderAll: boolean;
    cm6RenderAll: boolean;
    renderImages: boolean;
    renderPDF: boolean;
    renderIframe: boolean;
    renderExcalidraw: boolean;
    renderRichLink: boolean;
    renderTransclusion: boolean;
    previewOnHoverInternalLink: boolean;
    refreshImagesAfterChange: boolean;
    WYSIWYG: boolean;
}

export const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    renderAll: true,
    cm6RenderAll: false,
    renderImages: true,
    renderPDF: true,
    renderIframe: false,
    renderExcalidraw: false,
    renderRichLink: false,
    renderTransclusion: false,
    previewOnHoverInternalLink: false,
    refreshImagesAfterChange: false,
    WYSIWYG: false,
};

export class OzanImagePluginSettingsTab extends PluginSettingTab {
    plugin: OzanImagePlugin;

    constructor(app: App, plugin: OzanImagePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        let mainHeader = containerEl.createEl('h1', { text: 'Image in Editor Settings' });
        mainHeader.addClass('image-in-editor-settings-main-header');

        /* -------------- COFFEE LINK  -------------- */

        const coffeeDiv = containerEl.createDiv('coffee');
        coffeeDiv.addClass('oz-coffee-div');
        const coffeeLink = coffeeDiv.createEl('a', { href: 'https://ko-fi.com/L3L356V6Q' });
        const coffeeImg = coffeeLink.createEl('img', {
            attr: {
                src: 'https://cdn.ko-fi.com/cdn/kofi2.png?v=3',
            },
        });
        coffeeImg.height = 45;

        /* -------------- NEW EDITOR SETTINGS  -------------- */

        let newEditorHeader = containerEl.createEl('h2', { text: 'New Editor Settings' });
        newEditorHeader.addClass('image-in-editor-editor-header');
        let cm6Header = containerEl.createEl('h2', { text: '(CodeMirror 6)' });
        cm6Header.addClass('image-in-editor-cm-header');
        let newEditorDescription = containerEl.createEl('div');
        newEditorDescription.innerHTML = `
        <p>
            The plugin will add image preview within the "Source Mode" of New Editor.
            In case you have Live Preview enabled, the plugin will automatically detect this and won't render additionally to avoid duplication.
        </p>
        `;
        new Setting(containerEl)
            .setName('Render in New Editor')
            .setDesc('Turn off this option if you want to stop rendering images in the new editor view. Disabling requires vault reload.')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.cm6RenderAll).onChange((value) => {
                    this.plugin.settings.cm6RenderAll = value;
                    this.plugin.saveSettings();
                });
            });

        /* -------------- SHARED SETTINGS  -------------- */

        let sharedSettingsHeader = containerEl.createEl('h2', { text: 'Shared Settings' });
        sharedSettingsHeader.addClass('image-in-editor-editor-header');
        let sharedSettingsSubHeader = containerEl.createEl('h2', { text: '(CodeMirror 5 and 6)' });
        sharedSettingsSubHeader.addClass('image-in-editor-cm-header');
        let sharedSettingsDescription = containerEl.createEl('div');
        sharedSettingsDescription.innerHTML = `
        <p> The settings below are used both by New Editor and Legacy Editor. Changes will be reflected in both of them. </p>
        `;

        new Setting(containerEl)
            .setName('Render Images in Editor')
            .setDesc('Turn on this option if you want Image files (jpeg, jpg, png, gif, svg, bmp) to be rendered in Editor')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderImages).onChange((value) => {
                    this.plugin.settings.renderImages = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Render Transclusion in Editor')
            .setDesc(
                'Turn on this option if you want transclusions to be rendered in Editor. Once this is enabled, you will have custom options for transclusions below.'
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderTransclusion).onChange((value) => {
                    this.plugin.settings.renderTransclusion = value;
                    this.plugin.handleTransclusionSetting(value);
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Render PDFs in Editor')
            .setDesc('Turn on this option if you want also PDF files to be rendered in Editor')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderPDF).onChange((value) => {
                    this.plugin.settings.renderPDF = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Render Iframes in Editor')
            .setDesc('Turn on this option if you want iframes to be rendered in Editor')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderIframe).onChange((value) => {
                    this.plugin.settings.renderIframe = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Render Excalidraw in Editor')
            .setDesc('Turn on this option if you want drawings to be rendered in Editor')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderExcalidraw).onChange((value) => {
                    this.plugin.settings.renderExcalidraw = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Preview on Hover for File Links')
            .setDesc('Turn on if you want to trigger preview when you hover on internal links within the rendered transclusion')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.previewOnHoverInternalLink).onChange((value) => {
                    this.plugin.settings.previewOnHoverInternalLink = value;
                    this.plugin.saveSettings();
                    if (value) {
                        document.on('mouseover', '.oz-obsidian-inner-link', this.plugin.filePreviewOnHover);
                    } else {
                        document.off('mouseover', '.oz-obsidian-inner-link', this.plugin.filePreviewOnHover);
                    }
                })
            );

        /* -------------- LEGACY EDITOR SETTINGS  -------------- */

        let oldEditorHeader = containerEl.createEl('h2', { text: 'Legacy Editor Settings' });
        oldEditorHeader.addClass('image-in-editor-editor-header');
        let cm5Header = containerEl.createEl('h2', { text: '(CodeMirror 5)' });
        cm5Header.addClass('image-in-editor-cm-header');
        containerEl.createEl('p', { text: 'The settings provided below are specific only to the Legacy Editor' });

        if (!Platform.isMobile) {
            new Setting(containerEl)
                .setName('Render in Legacy Editor')
                .setDesc(
                    "Turn off this option if you want to stop rendering images, PDF and drawings. If you turn off, the other settings won't have an effect"
                )
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.renderAll).onChange((value) => {
                        this.plugin.handleToggleRenderAll(value);
                        this.plugin.settings.renderAll = value;
                        this.plugin.saveSettings();
                    })
                );

            new Setting(containerEl)
                .setName('Rich Link Widget for External Links')
                .setDesc('Turn on this option if you want rich link widget to be visible within a line, where you have an external link')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.renderRichLink).onChange((value) => {
                        this.plugin.settings.renderRichLink = value;
                        this.plugin.saveSettings();
                    })
                );

            new Setting(containerEl)
                .setName('Refresh Images after Changes')
                .setDesc('Turn on this option if you want images to refreshed once you edit the original file')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.refreshImagesAfterChange).onChange((value) => {
                        this.plugin.handleRefreshImages(value);
                        this.plugin.settings.refreshImagesAfterChange = value;
                        this.plugin.saveSettings();
                    })
                );

            new Setting(containerEl)
                .setName('WYSIWYG Like Experience')
                .setDesc('Turn on this option if you want WYSIWYG style to be loaded for editor view')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.WYSIWYG).onChange((value) => {
                        this.plugin.settings.WYSIWYG = value;
                        this.plugin.handleWYSIWYG(value);
                        this.plugin.saveSettings();
                    })
                );
        } else {
            this.containerEl.createEl('p', { text: 'Legacy Editor is not available in Mobile Application. ' });
        }
    }
}
