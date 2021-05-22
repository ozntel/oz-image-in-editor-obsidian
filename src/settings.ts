import { PluginSettingTab, Setting, App } from 'obsidian';
import OzanImagePlugin from './main';

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

        new Setting(containerEl)
            .setName('Render Toggle')
            .setDesc('Turn off this option if you want to stop rendering images, PDF and drawings')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.renderAll)
                .onChange((value) => {
                    this.plugin.handleToggleRenderAll(value);
                    this.plugin.settings.renderAll = value;
                    this.plugin.saveSettings();
                })
            )

        new Setting(containerEl)
            .setName('Render PDF-s in Editor')
            .setDesc('Turn on this option if you want also PDF files to be rendered in Editor')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.renderPDF)
                .onChange((value) => {
                    this.plugin.settings.renderPDF = value;
                    this.plugin.saveSettings();
                })
            )
    }

}