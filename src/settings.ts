import { PluginSettingTab, Setting, App } from 'obsidian';
import OzanImagePlugin from './main';

export interface OzanImagePluginSettings {
    cm6RenderAll: boolean;
    renderImages: boolean;
    renderPDF: boolean;
    renderIframe: boolean;
    renderExcalidraw: boolean;
    renderMsgFile: boolean;
    renderRichLink: boolean;
    renderTransclusion: boolean;
    previewOnHoverInternalLink: boolean;
    refreshImagesAfterChange: boolean;
    WYSIWYG: boolean;
}

export const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    cm6RenderAll: true,
    renderImages: true,
    renderPDF: true,
    renderIframe: false,
    renderExcalidraw: false,
    renderMsgFile: false,
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

        const tipDiv = containerEl.createDiv('tip');
        tipDiv.addClass('oz-tip-div');
        const tipLink = tipDiv.createEl('a', { href: 'https://revolut.me/ozante' });
        const tipImg = tipLink.createEl('img', {
            attr: {
                src: 'https://raw.githubusercontent.com/ozntel/file-tree-alternative/main/images/tip%20the%20artist_v2.png',
            },
        });
        tipImg.height = 55;

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

        let newEditorDescription = containerEl.createEl('div');
        newEditorDescription.innerHTML = `
        <p>
            The plugin will add image preview within the "Source Mode" of New Editor.
            In case you have Live Preview enabled, the plugin will automatically detect this and won't render additionally to avoid duplication.
        </p>
        `;
        new Setting(containerEl)
            .setName('Render All')
            .setDesc('Turn off this option if you want to stop rendering images in the editor source mode. Disabling requires vault reload.')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.cm6RenderAll).onChange((value) => {
                    this.plugin.settings.cm6RenderAll = value;
                    this.plugin.saveSettings();
                });
            });

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
            .setDesc(
                `
                Turn on this option if you want drawings to be rendered in Editor.
                You need to have "Excalidraw" plugin installed so that this
                option works.
                `
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderExcalidraw).onChange((value) => {
                    this.plugin.settings.renderExcalidraw = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Render Outlook MSG Files in Editor')
            .setDesc(
                `
                Turn on this option if you want outlook MSG Files to be rendered in Editor. 
                You need to have "MSG Handler" plugin installed so that
                this option works
                `
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderMsgFile).onChange((value) => {
                    this.plugin.settings.renderMsgFile = value;
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
    }
}
