import { PluginSettingTab, Setting, App } from 'obsidian';
import OzanImagePlugin from './main';

export interface OzanImagePluginSettings {
    renderAll: boolean,
    renderPDF: boolean,
    renderIframe: boolean,
    refreshImagesAfterChange: boolean,
    WYSIWYG: boolean,
}

export const DEFAULT_SETTINGS: OzanImagePluginSettings = {
    renderAll: true,
    renderPDF: false,
    renderIframe: false,
    refreshImagesAfterChange: false,
    WYSIWYG: false
}

export class OzanImagePluginSettingsTab extends PluginSettingTab {
    plugin: OzanImagePlugin;

    constructor(app: App, plugin: OzanImagePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Image in Editor Settings' });

        containerEl.createEl('h2', { text: 'Render Options' });

        new Setting(containerEl)
            .setName('Render Toggle')
            .setDesc('Turn off this option if you want to stop rendering images, PDF and drawings. If you turn off, the other settings won\'t have an effect')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.renderAll)
                .onChange((value) => {
                    this.plugin.handleToggleRenderAll(value);
                    this.plugin.settings.renderAll = value;
                    this.plugin.saveSettings();
                })
            )

        new Setting(containerEl)
            .setName('Render PDFs in Editor')
            .setDesc('Turn on this option if you want also PDF files to be rendered in Editor')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.renderPDF)
                .onChange((value) => {
                    this.plugin.settings.renderPDF = value;
                    this.plugin.saveSettings();
                })
            )

        new Setting(containerEl)
            .setName('Render Iframes in Editor')
            .setDesc('Turn on this option if you want iframes to be rendered in Editor')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.renderIframe)
                .onChange((value) => {
                    this.plugin.settings.renderIframe = value;
                    this.plugin.saveSettings();
                })
            )

        this.containerEl.createEl('h2', { text: 'Alternative Settings' });

        new Setting(containerEl)
            .setName('Refresh Images after Changes')
            .setDesc('Turn on this option if you want images to refreshed once you edit the original file')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.refreshImagesAfterChange)
                .onChange((value) => {
                    this.plugin.handleRefreshImages(value);
                    this.plugin.settings.refreshImagesAfterChange = value;
                    this.plugin.saveSettings();
                })
            )

        new Setting(containerEl)
            .setName('WYSIWYG Like Experience')
            .setDesc('Turn on this option if you want WYSIWYG style to be loaded for editor view')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.WYSIWYG)
                .onChange((value) => {
                    this.plugin.settings.WYSIWYG = value;
                    this.plugin.handleWYSIWYG(value);
                    this.plugin.saveSettings();
                })
            )
    }

}