import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { ObsidianHelpers, WidgetHandler, ImageHandler, WikiMarkdownHandler } from './utils';
import { check_line, check_lines } from './check-line';
import { OzanImagePluginSettingsTab } from './settings';
import { WYSIWYG_Style } from './constants';
import { OzanImagePluginSettings, DEFAULT_SETTINGS } from './settings';

export default class OzanImagePlugin extends Plugin {
	settings: OzanImagePluginSettings;
	loadedStyles: Array<HTMLStyleElement>;
	imagePromiseList: Array<string> = [];

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
			},
		});

		this.addCommand({
			id: 'toggle-WYSIWYG',
			name: 'Toggle WYSIWYG',
			callback: () => {
				this.handleWYSIWYG(!this.settings.WYSIWYG);
				this.settings.WYSIWYG = !this.settings.WYSIWYG;
				this.saveSettings();
			},
		});

		this.addCommand({
			id: 'toggle-render-pdf',
			name: 'Toggle Render PDF',
			callback: () => {
				this.settings.renderPDF = !this.settings.renderPDF;
				this.app.workspace.iterateCodeMirrors((cm) => {
					this.handleInitialLoad(cm);
				});
				this.saveSettings();
			},
		});

		this.addCommand({
			id: 'toggle-render-iframe',
			name: 'Toggle Render Iframe',
			callback: () => {
				this.settings.renderIframe = !this.settings.renderIframe;
				this.app.workspace.iterateCodeMirrors((cm) => {
					this.handleInitialLoad(cm);
				});
				this.saveSettings();
			},
		});

		this.addCommand({
			id: 'toggle-refresh-images-after-changes',
			name: 'Toggle Refresh Images After Changes',
			callback: () => {
				this.handleRefreshImages(!this.settings.refreshImagesAfterChange);
				this.settings.refreshImagesAfterChange = !this.settings.refreshImagesAfterChange;
				this.saveSettings();
			},
		});

		this.addCommand({
			id: 'convert-wikis-to-md-in-vault',
			name: 'Convert all WikiLinks to Markdown Links in Vault (Experiment)',
			callback: () => {
				WikiMarkdownHandler.convertLinks(this.app, 'markdown');
			},
		});

		this.addCommand({
			id: 'convert-mdlinks-to-wiki-in-vault',
			name: 'Convert all Markdown Links to WikiLinks in Vault (Experiment)',
			callback: () => {
				WikiMarkdownHandler.convertLinks(this.app, 'wiki');
			},
		});

		document.on(
			'contextmenu',
			`div.CodeMirror-linewidget.oz-image-widget > img[data-path]`,
			this.onImageMenu,
			false
		);

		document.on('click', `.oz-obsidian-inner-link`, this.onClickTransclusionLink);

		if (this.settings.WYSIWYG) this.load_WYSIWYG_Styles();
		if (!this.settings.renderAll) return;
		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			cm.on('change', this.codemirrorLineChanges);
			this.handleInitialLoad(cm);
		});
		if (!this.settings.refreshImagesAfterChange) return;
		this.app.vault.on('modify', this.handleFileModify);
	}

	onunload() {
		this.app.workspace.iterateCodeMirrors((cm) => {
			cm.off('change', this.codemirrorLineChanges);
			WidgetHandler.clearWidgets(cm);
		});
		this.app.vault.off('modify', this.handleFileModify);
		document.off(
			'contextmenu',
			`div.CodeMirror-linewidget.oz-image-widget > img[data-path]`,
			this.onImageMenu,
			false
		);
		document.off('click', `.oz-obsidian-inner-link`, this.onClickTransclusionLink);
		this.unload_WYSIWYG_Styles();
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

	// Line Edit Changes
	codemirrorLineChanges = (cm: any, change: any) => {
		check_lines(cm, change.from.line, change.from.line + change.text.length - 1, this);
	};

	// Only Triggered during initial Load
	handleInitialLoad = (cm: CodeMirror.Editor) => {
		var lastLine = cm.lastLine();
		var file = ObsidianHelpers.getFileCmBelongsTo(cm, this.app.workspace);
		for (let i = 0; i < lastLine + 1; i++) {
			check_line(cm, i, file, this);
		}
	};

	// Handle Toggle for renderAll
	handleToggleRenderAll = (newRenderAll: boolean) => {
		if (newRenderAll) {
			this.registerCodeMirror((cm: CodeMirror.Editor) => {
				cm.on('change', this.codemirrorLineChanges);
				this.handleInitialLoad(cm);
			});
			if (this.settings.refreshImagesAfterChange) this.app.vault.on('modify', this.handleFileModify);
		} else {
			this.app.workspace.iterateCodeMirrors((cm) => {
				cm.off('change', this.codemirrorLineChanges);
				WidgetHandler.clearWidgets(cm);
			});
			this.app.vault.off('modify', this.handleFileModify);
		}
	};

	// Handle Transclusion Setting Off
	handleTransclusionSetting = (newSetting: boolean) => {
		this.app.workspace.iterateCodeMirrors((cm) => {
			if (!newSetting) {
				for (let i = 0; i <= cm.lastLine(); i++) {
					let line = cm.lineInfo(i);
					WidgetHandler.clearTransclusionWidgets(line);
				}
			} else {
				check_lines(cm, 0, cm.lastLine(), this);
			}
		});
	};

	// Handle Toggle for Refresh Images Settings
	handleRefreshImages = (newRefreshImages: boolean) => {
		if (newRefreshImages) {
			this.app.vault.on('modify', this.handleFileModify);
		} else {
			this.app.vault.off('modify', this.handleFileModify);
		}
	};

	// Handle File Changes to Refhres Images
	handleFileModify = (file: TAbstractFile) => {
		if (!(file instanceof TFile)) return;
		if (!ImageHandler.is_an_image(file.path)) return;
		this.app.workspace.iterateCodeMirrors((cm) => {
			var lastLine = cm.lastLine();
			check_lines(cm, 0, lastLine, this, file.path);
		});
	};

	// Handle WYSIWYG Toggle
	handleWYSIWYG = (newWYSIWYG: boolean) => {
		if (newWYSIWYG) {
			this.load_WYSIWYG_Styles();
		} else {
			this.unload_WYSIWYG_Styles();
		}
	};

	load_WYSIWYG_Styles = () => {
		this.loadedStyles = Array<HTMLStyleElement>(0);
		var style = document.createElement('style');
		style.innerHTML = WYSIWYG_Style;
		document.head.appendChild(style);
		this.loadedStyles.push(style);
	};

	unload_WYSIWYG_Styles = () => {
		if (!this.loadedStyles || typeof this.loadedStyles[Symbol.iterator] !== 'function') return;
		for (let style of this.loadedStyles) {
			document.head.removeChild(style);
		}
		this.loadedStyles = Array<HTMLStyleElement>(0);
	};

	addToImagePromiseList = (path: string) => {
		if (!this.imagePromiseList.contains(path)) {
			this.imagePromiseList.push(path);
		}
	};

	removeFromImagePromiseList = (path: string) => {
		if (this.imagePromiseList.contains(path)) {
			this.imagePromiseList = this.imagePromiseList.filter((crPath) => crPath !== path);
		}
	};
}
