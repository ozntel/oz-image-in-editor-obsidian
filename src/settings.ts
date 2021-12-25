import { PluginSettingTab, Setting, App } from 'obsidian';
import OzanImagePlugin from './main';

export interface OzanImagePluginSettings {
    renderAll: boolean;
    renderImages: boolean;
    renderPDF: boolean;
    renderIframe: boolean;
    renderExcalidraw: boolean;
    renderRichLink: boolean;
    renderTransclusion: boolean;
    renderAdmonition: boolean;
    renderMermaid: boolean;
    renderMathJax: boolean;
    previewOnHoverInternalLink: boolean;
    refreshImagesAfterChange: boolean;
    WYSIWYG: boolean;
    // CM6 Settings
    cm6RenderAll: boolean;
}

export const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    renderAll: true,
    renderImages: true,
    renderPDF: false,
    renderIframe: false,
    renderExcalidraw: false,
    renderRichLink: false,
    renderTransclusion: false,
    renderAdmonition: false,
    renderMermaid: false,
    renderMathJax: false,
    previewOnHoverInternalLink: false,
    refreshImagesAfterChange: false,
    WYSIWYG: false,
    // CM6 Settings
    cm6RenderAll: false,
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

        const coffeeDiv = containerEl.createDiv('coffee');
        coffeeDiv.addClass('oz-coffee-div');
        const coffeeLink = coffeeDiv.createEl('a', { href: 'https://ko-fi.com/L3L356V6Q' });
        const coffeeImg = coffeeLink.createEl('img', {
            attr: {
                src: 'https://cdn.ko-fi.com/cdn/kofi2.png?v=3',
            },
        });
        coffeeImg.height = 45;

        let newEditorHeader = containerEl.createEl('h2', { text: 'New Editor Settings' });
        newEditorHeader.addClass('image-in-editor-editor-header');
        let cm6Header = containerEl.createEl('h2', { text: '(CodeMirror 6)' });
        cm6Header.addClass('image-in-editor-cm-header');
        containerEl.createEl('p', {
            text: `Information: If you are using New Editor with Live Preview editing mode, this plugin will duplicate the images you already have in your editor. 
            However, it will be useful if you want to use the Source Mode of the new Editor. For the moment, only Image render is available`,
        });

        new Setting(containerEl)
            .setName('Render in New Editor')
            .setDesc('Turn off this option if you want to stop rendering images in the new editor view. Disabling requires vault reload.')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.cm6RenderAll).onChange((value) => {
                    this.plugin.settings.cm6RenderAll = value;
                    this.plugin.saveSettings();
                });
            });

        let oldEditorHeader = containerEl.createEl('h2', { text: 'Legacy Editor Settings' });
        oldEditorHeader.addClass('image-in-editor-editor-header');
        let cm5Header = containerEl.createEl('h2', { text: '(CodeMirror 5)' });
        cm5Header.addClass('image-in-editor-cm-header');

        new Setting(containerEl)
            .setName('Render Toggle')
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

        containerEl.createEl('h4', { text: 'Render Options' });

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
            .setName('Rich Link Widget for External Links')
            .setDesc('Turn on this option if you want rich link widget to be visible within a line, where you have an external link')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.renderRichLink).onChange((value) => {
                    this.plugin.settings.renderRichLink = value;
                    this.plugin.saveSettings();
                })
            );

        this.containerEl.createEl('h4', { text: 'Transclusion Settings (Experimental)' });

        const transclusionConditionalClass = 'oz-image-editor-transclusion-additional-settings';

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
                    if (value) {
                        this.hide();
                        this.display();
                    } else {
                        let els = document.querySelectorAll(`.${transclusionConditionalClass}`);
                        for (let i = 0; i < els.length; i++) {
                            els[i].remove();
                        }
                    }
                })
            );

        if (this.plugin.settings.renderTransclusion) {
            this.containerEl.createEl('h4', { text: 'Transclusion Customization', cls: transclusionConditionalClass });

            let transclusionAdmonition = new Setting(containerEl)
                .setName('Render Admonition in Translucions')
                .setDesc('You need to have Admonition plugin activated to be able to use this function. No icon available.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.renderAdmonition).onChange((value) => {
                        this.plugin.settings.renderAdmonition = value;
                        this.plugin.saveSettings();
                    })
                );

            transclusionAdmonition.settingEl.addClass(transclusionConditionalClass);

            let transclusionMermaid = new Setting(containerEl)
                .setName('Render Mermaids in Translusions')
                .setDesc('Turn on if you want mermaids to be rendered in translucions.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.renderMermaid).onChange((value) => {
                        this.plugin.settings.renderMermaid = value;
                        this.plugin.saveSettings();
                    })
                );

            transclusionMermaid.settingEl.addClass(transclusionConditionalClass);

            let transclusionMathJax = new Setting(containerEl)
                .setName('Render MathJax in Translucions')
                .setDesc('Turn on if you want mathjaxs to be rendered in translucions.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.renderMathJax).onChange((value) => {
                        this.plugin.settings.renderMathJax = value;
                        this.plugin.saveSettings();
                    })
                );

            transclusionMathJax.settingEl.addClass(transclusionConditionalClass);

            let transclusionHoverLink = new Setting(containerEl)
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

            transclusionHoverLink.settingEl.addClass(transclusionConditionalClass);
        }

        this.containerEl.createEl('h4', { text: 'Alternative Settings' });

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
    }
}
