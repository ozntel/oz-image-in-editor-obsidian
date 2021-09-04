// @ts-ignore
import { Workspace, MarkdownView, Vault, TFile, Menu, App, BlockCache, Keymap, normalizePath } from 'obsidian';
import showdown from 'showdown';
import OzanImagePlugin from './main';

export class WidgetHandler {
	// Remove Widgets in CodeMirror Editor
	static clearWidgets = (cm: CodeMirror.Editor) => {
		var lastLine = cm.lastLine();
		for (let i = 0; i <= lastLine; i++) {
			const line = cm.lineInfo(i);
			WidgetHandler.clearLineWidgets(line);
		}
	};

	// Clear Single Line Widget
	static clearLineWidgets = (line: any) => {
		let classes = ['oz-image-widget', 'oz-transclusion-widget'];
		WidgetHandler.clearWidgetsWithClass(classes, line);
	};

	// Clear Transclusion Widgets
	static clearTransclusionWidgets = (line: any) => {
		WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
	};

	static clearWidgetsWithClass = (classList: string[], line: any) => {
		if (line.widgets) {
			for (const wid of line.widgets) {
				if (classList.contains(wid.className)) wid.clear();
			}
		}
	};

	// Returns widgets with classname or false if there is not any
	static getWidgets = (line: any, className: string) => {
		return line.widgets ? line.widgets.filter((wid: { className: string }) => wid.className === className) : false;
	};
}

export class LinkHandler {
	static link_regex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
	static image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
	static image_http_regex_4 = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;

	// Check if String is a link
	static path_is_a_link = (path: string): boolean => {
		let match = path.match(LinkHandler.link_regex);
		return match ? true : false;
	};

	// Check line if it is a link
	static get_link_in_line = (line: string) => {
		const match_3 = line.match(LinkHandler.image_http_regex_3);
		const match_4 = line.match(LinkHandler.image_http_regex_4);
		if (match_3) {
			return { result: match_3, linkType: 3 };
		} else if (match_4) {
			return { result: match_4, linkType: 4 };
		}
		return { result: false, linkType: 0 };
	};
}

export class PDFHandler {
	// Regex for [[ ]] format
	static pdf_regex_1 = /!\[\[.*(pdf)(.*)?\]\]/;
	static pdf_name_regex_1 = /(?<=\[\[).*.pdf/;

	// Regex for ![ ]( ) format
	static pdf_regex_2 = /!\[(^$|.*)\]\(.*(pdf)(.*)?\)/;
	static pdf_name_regex_2 = /(?<=\().*.pdf/;

	// Check line if it is a PDF
	static get_pdf_in_line = (line: string) => {
		const match_1 = line.match(PDFHandler.pdf_regex_1);
		const match_2 = line.match(PDFHandler.pdf_regex_2);
		if (match_1) {
			return { result: match_1, linkType: 1 };
		} else if (match_2) {
			return { result: match_2, linkType: 2 };
		}
		return { result: false, linkType: 0 };
	};

	static get_pdf_name = (linkType: number, match: any): string => {
		let pdf_name_regex;
		if (linkType == 1) pdf_name_regex = PDFHandler.pdf_name_regex_1;
		if (linkType == 2) pdf_name_regex = PDFHandler.pdf_name_regex_2;
		var file_name_match = match[0].match(pdf_name_regex);
		return file_name_match[0];
	};

	static get_pdf_page_number = (match: any): string | boolean => {
		const reg = new RegExp('#page=[0-9]+');
		const page_match = match[0].match(reg);
		if (page_match) return page_match[0];
		return false;
	};
}

export class ImageHandler {
	// General Image Regex
	static image_regex = /.*.(jpe?g|png|gif|svg|bmp|excalidraw|md)/;

	// Regex for [[ ]] format
	static image_line_regex_1 = /!\[\[.*?(jpe?g|png|gif|svg|bmp|excalidraw|md).*?\]\]/;
	static file_name_regex_1 = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp|excalidraw|md)/;

	// Regex for ![ ]( ) format
	static image_line_regex_2 = /!\[(^$|.*?)\]\(.*?(jpe?g|png|gif|svg|bmp|excalidraw|md)\)/;
	static file_name_regex_2 = /(?<=\().*(jpe?g|png|gif|svg|bmp|excalidraw|md)/;

	// Regex for Links
	static file_name_regex_3 = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
	static file_name_regex_4 = /(?<=\().*(?=\))/;

	// Check line if it is image
	static get_image_in_line = (line: string) => {
		const match_1 = line.match(ImageHandler.image_line_regex_1);
		const match_2 = line.match(ImageHandler.image_line_regex_2);
		if (match_1) {
			return { result: match_1, linkType: 1 };
		} else if (match_2) {
			return { result: match_2, linkType: 2 };
		}
		return { result: false, linkType: 0 };
	};

	// Image Name and Alt Text
	static getFileNameAndAltText = (linkType: number, match: any) => {
		/* 
            linkType 1: ![[myimage.jpg|#x-small]], linkType 3: ![[https://image|#x-small]], 
            linkType 2: ![#x-small](myimage.jpg),  linkType 4: ![#x-small](https://image) 
            returns { fileName: '', altText: '' }   
        */
		var file_name_regex;
		var alt_regex;
		if (linkType == 1 || linkType == 3) {
			if (linkType == 1) file_name_regex = ImageHandler.file_name_regex_1;
			if (linkType == 3) file_name_regex = ImageHandler.file_name_regex_3;
			alt_regex = /(?<=\|).*(?=]])/;
		} else if (linkType == 2 || linkType == 4) {
			if (linkType == 2) file_name_regex = ImageHandler.file_name_regex_2;
			if (linkType == 4) file_name_regex = ImageHandler.file_name_regex_4;
			alt_regex = /(?<=\[)(^$|.*)(?=\])/;
		}

		var file_match = match[0].match(file_name_regex);
		var alt_match = match[0].match(alt_regex);

		return {
			fileName: file_match ? file_match[0] : '',
			altText: alt_match ? alt_match[0] : '',
		};
	};

	// Checking the Alt 100x100 (WIDTHxHEIGHT) format
	static altWidthHeight = (altText: string) => {
		// Exclude Alt Text containing Letters other than 'x'
		let excludeRegex = /[^(x|0-9)]/;
		if (altText.match(excludeRegex)) return false;
		// Create Width & Height
		const widthHeightRegex = /[0-9]+x[0-9]+/;
		const widthRegex = /[0-9]+/;
		var match = altText.match(widthHeightRegex);
		if (match) {
			var index = match[0].indexOf('x');
			return {
				width: parseInt(match[0].substr(0, index)),
				height: parseInt(match[0].substr(index + 1)),
			};
		} else {
			var widthMatch = altText.match(widthRegex);
			if (widthMatch) return { width: parseInt(widthMatch[0]) };
		}
		return false;
	};

	// Check if path is an image
	static is_an_image = (path: string) => {
		var match = path.match(ImageHandler.image_regex);
		if (match) return true;
		return false;
	};

	// Return Blob Object from Url
	static getBlobObject = async (blobLink: string) => {
		return fetch(blobLink).then((res) => res.blob());
	};

	// Add a context menu for image widget
	static addContextMenu = (event: MouseEvent, plugin: OzanImagePlugin, imageFile: TFile) => {
		const fileMenu = new Menu(plugin.app);
		fileMenu.addItem((menuItem) => {
			menuItem.setTitle('Copy Image to Clipboard');
			menuItem.setIcon('image-file');
			menuItem.onClick(async (e) => {
				var buffer = await plugin.app.vault.adapter.readBinary(imageFile.path);
				var arr = new Uint8Array(buffer);
				var blob = new Blob([arr], { type: 'image/png' });
				// @ts-ignore
				const item = new ClipboardItem({ 'image/png': blob });
				// @ts-ignore
				window.navigator['clipboard'].write([item]);
			});
		});
		plugin.app.workspace.trigger('file-menu', fileMenu, imageFile, 'file-explorer');
		fileMenu.showAtPosition({ x: event.pageX, y: event.pageY });
		return false;
	};
}

export class ExcalidrawHandler {
	static pluginActive = (app: App) => {
		// @ts-ignore
		return app.plugins.getPlugin('obsidian-excalidraw-plugin');
	};

	static isDrawing = (imageFile: TFile) => {
		return (
			imageFile.extension === 'excalidraw' ||
			// @ts-ignore
			(ExcalidrawAutomate.isExcalidrawFile && ExcalidrawAutomate.isExcalidrawFile(imageFile))
		);
	};

	static createPNG = async (imageFile: TFile) => {
		// @ts-ignore
		ExcalidrawAutomate.reset();
		// @ts-ignore
		var image = await ExcalidrawAutomate.createPNG(imageFile.path);
		return image;
	};
}

export class IframeHandler {
	static iframeRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/;

	static get_iframe_in_line = (line: string) => {
		const match = line.match(IframeHandler.iframeRegex);
		if (match) return { result: match, linkType: 'iframe' };
		return { result: false, linkType: 0 };
	};

	static create_iframe_node = (match: any): HTMLElement => {
		var iframeNode = document.createElement('div');
		iframeNode.innerHTML = match[0].trim();
		return iframeNode;
	};
}

export class ObsidianHelpers {
	// Getting Active Markdown File
	static getActiveNoteFile = (workspace: Workspace) => {
		return workspace.getActiveFile();
	};

	// Get Active Editor
	static getCmEditor = (workspace: Workspace): CodeMirror.Editor => {
		return workspace.getActiveViewOfType(MarkdownView)?.sourceMode?.cmEditor;
	};

	// Get Full Path of the image
	static getPathOfImage = (vault: Vault, image: TFile) => {
		return vault.getResourcePath(image) + '?' + image.stat.mtime;
	};

	static getFileCmBelongsTo = (cm: CodeMirror.Editor, workspace: Workspace) => {
		let leafs = workspace.getLeavesOfType('markdown');
		for (let i = 0; i < leafs.length; i++) {
			// @ts-ignore
			if (leafs[i].view instanceof MarkdownView && leafs[i].view.sourceMode?.cmEditor == cm) {
				// @ts-ignore
				return leafs[i].view.file;
			}
		}
		return null;
	};

	static openInternalLink = (event: MouseEvent, link: string, app: App) => {
		app.workspace.openLinkText(link, '/', Keymap.isModifier(event, 'Mod') || 1 === event.button);
	};
}

// --> Line Id Regex ![[hello#^f76b62]]
const transclusionWithBlockIdRegex = /!\[\[(.*)#\^(.*)\]\]/;
// --> Block Regex ![[hello#header1]]
const transclusionBlockRegex = /!\[\[(.*)#((?!\^).*)\]\]/;
// --> Get Block Id from Transclusion
const transclusionBlockIdRegex = /(?<=#\^).*(?=]])/;
// --> Get Header from Transclusion
const transclusionHeaderText = /(?<=#).*(?=]])/;
// --> Get File Name from Transclusion
const transclusionFileNameRegex = /(?<=!\[\[)(.*)(?=#)/;

export class TransclusionHandler {
	static lineIsWithBlockId = (line: string) => {
		return line.match(transclusionWithBlockIdRegex);
	};

	static lineIsWithHeading = (line: string) => {
		return line.match(transclusionBlockRegex);
	};

	static lineIsTransclusion = (line: string) => {
		return TransclusionHandler.lineIsWithBlockId(line) || TransclusionHandler.lineIsWithHeading(line);
	};

	static getFile = (line: string, app: App, sourcePath: string): TFile | null => {
		const match = line.match(transclusionFileNameRegex);
		if (!match) return null;
		return app.metadataCache.getFirstLinkpathDest(match[0], sourcePath);
	};

	static getBlockId = (line: string) => {
		return line.match(transclusionBlockIdRegex)[0];
	};

	static getHeader = (line: string) => {
		return line.match(transclusionHeaderText)[0];
	};

	static clearExclamationFromTransclusion = (md: string): string => {
		// To Allow Showdown to recognize as Link rather than img
		let mdText = md;
		let transclusions = md.match(
			new RegExp(`(${transclusionWithBlockIdRegex.source})|(${transclusionBlockRegex.source})`, 'g')
		);
		transclusions?.forEach((tr) => (mdText = mdText.replace(tr, tr.substring(1))));
		return mdText;
	};

	static clearMd = (md: string): string => {
		// --> Convert Inline Transclusions to Link
		let mdText = TransclusionHandler.clearExclamationFromTransclusion(md);
		// --> Convert Wikis to Markdown for later HTML render
		mdText = WikiMarkdownHandler.convertWikiLinksToMarkdown(mdText);
		return mdText;
	};

	static convertMdToHtml = (md: string) => {
		let mdText = TransclusionHandler.clearMd(md);
		let converter = new showdown.Converter({
			tables: true,
			simpleLineBreaks: true,
			strikethrough: true,
			tasklists: true,
			smartIndentationFix: true,
		});
		return converter.makeHtml(mdText);
	};

	static renderHeader = (startNum: number, endNum: number, cachedReadOfTarget: string) => {
		let html = document.createElement('div');
		let mdToRender = cachedReadOfTarget.substr(startNum, endNum - startNum);
		html.innerHTML = TransclusionHandler.convertMdToHtml(mdToRender);
		return html;
	};

	static renderBlockCache = (blockCache: BlockCache, cachedReadOfTarget: string): HTMLElement => {
		let html = document.createElement('div');
		let blockStart = blockCache.position.start.offset;
		let blockEnd = blockCache.position.end.offset;
		let mdToRender = cachedReadOfTarget.substr(blockStart, blockEnd - blockStart);
		// Clear Block Reference from Render
		let indexOfBlockId = mdToRender.indexOf(`^${blockCache.id}`);
		if (indexOfBlockId !== -1) {
			mdToRender =
				mdToRender.slice(0, indexOfBlockId) + mdToRender.slice(indexOfBlockId + blockCache.id.length + 1);
		}
		// Convert to Html
		html.innerHTML = TransclusionHandler.convertMdToHtml(mdToRender);
		return html;
	};

	static clearHTML = (html: HTMLElement, app: App) => {
		// --> Convert Code Blocks for Transclusion
		TransclusionHandler.clearCodeBlocksInHtml(html);
		// --> Convert Image Links to Usable in Obsidian
		TransclusionHandler.clearImagesInHtml(html, app);
		// --> Convert Links to make Usable in Obsidian
		TransclusionHandler.clearAnchorsInHtml(html, app);
	};

	static clearCodeBlocksInHtml = (html: HTMLElement) => {
		// Add Line Number for Code Blocks
		let codeBlocks = html.querySelectorAll('pre > code');
		codeBlocks.forEach((cb) => {
			cb.addClass('line-numbers');
		});
	};

	static clearImagesInHtml = (html: HTMLElement, app: App) => {
		let images = html.querySelectorAll('img');
		images.forEach((img) => {
			let imgSource = img.getAttr('src');
			if (imgSource) {
				let imgFile = app.metadataCache.getFirstLinkpathDest(decodeURI(img.getAttr('src')), '');
				if (imgFile) {
					let realSource = ObsidianHelpers.getPathOfImage(app.vault, imgFile);
					img.setAttr('src', realSource);
					// --> Check also Alt for Width
					let altText = img.getAttr('alt');
					if (altText) {
						let widthHeight = ImageHandler.altWidthHeight(altText);
						if (widthHeight) {
							img.width = widthHeight.width;
							if (widthHeight.height) img.height = widthHeight.height;
						}
					}
				}
			}
		});
	};

	static clearAnchorsInHtml = (html: HTMLElement, app: App) => {
		let anchors = html.querySelectorAll('a');
		anchors.forEach((a) => {
			let href = a.getAttr('href');
			// --> If no Alt Text, Add href as Link Text
			if (a.innerText === '') a.innerText = decodeURI(href);
			// --> If link is a translucion, change the href to file name
			if (href.match(new RegExp('.*#.*'))) href = href.match(new RegExp('.*(?=#)'))[0];
			// --> If link is a file, add class (which has event listener in main)
			// and decode href for obsidian
			let file = app.metadataCache.getFirstLinkpathDest(decodeURI(href), '');
			if (file) {
				a.setAttr('href', decodeURI(href));
				a.addClass('oz-obsidian-inner-link');
			}
		});
	};
}

export class WikiMarkdownHandler {
	// --> Converts links within given string from Wiki to MD
	static convertWikiLinksToMarkdown = (md: string): string => {
		let newMdText = md;
		let wikiRegex = /\[\[.*\]\]/g;
		let matches = newMdText.match(wikiRegex);
		if (matches) {
			let fileRegex = /(?<=\[\[).*?(?=(\]|\|))/;
			let altRegex = /(?<=\|).*(?=]])/;
			for (let wiki of matches) {
				let fileMatch = wiki.match(fileRegex);
				if (fileMatch) {
					let altMatch = wiki.match(altRegex);
					let mdLink = `[${altMatch ? altMatch[0] : ''}](${encodeURI(fileMatch[0])})`;
					newMdText = newMdText.replace(wiki, mdLink);
				}
			}
		}
		return newMdText;
	};

	// --> Converts links within given string from MD to Wiki
	static convertMarkdownLinksToWikiLinks = (md: string): string => {
		let newMdText = md;
		let mdLinkRegex = /\[(^$|.*?)\]\((.*)\)/g;
		let matches = newMdText.match(mdLinkRegex);
		if (matches) {
			let fileRegex = /(?<=\().*(?=\))/;
			let altRegex = /(?<=\[)(^$|.*)(?=\])/;
			for (let mdLink of matches) {
				let fileMatch = mdLink.match(fileRegex);
				if (fileMatch) {
					let altMatch = mdLink.match(altRegex);
					let wikiLink = `[[${decodeURI(fileMatch[0])}${
						altMatch && altMatch[0] !== '' ? '|' + altMatch[0] : ''
					}]]`;
					newMdText = newMdText.replace(mdLink, wikiLink);
				}
			}
		}
		return newMdText;
	};

	// --> Converts single file to provided final format and save back in the file
	static convertLinksAndSaveInSingleFile = async (mdFile: TFile, app: App, finalFormat: 'markdown' | 'wiki') => {
		let normalizedPath = normalizePath(mdFile.path);
		let fileText = await app.vault.adapter.read(normalizedPath);
		let newFileText =
			finalFormat === 'markdown'
				? WikiMarkdownHandler.convertWikiLinksToMarkdown(fileText)
				: WikiMarkdownHandler.convertMarkdownLinksToWikiLinks(fileText);
		await app.vault.adapter.write(normalizedPath, newFileText);
	};

	// --> Command Function: Converts All Links and Saves in Current Active File
	static convertLinksInActiveFile = async (app: App, finalFormat: 'markdown' | 'wiki') => {
		let mdFile: TFile = app.workspace.getActiveFile();
		await WikiMarkdownHandler.convertLinksAndSaveInSingleFile(mdFile, app, finalFormat);
	};

	// --> Command Function: Converts All Links in All Files in Vault and Save in Corresponding Files
	static convertLinksInVault = (app: App, finalFormat: 'markdown' | 'wiki') => {
		let mdFiles: TFile[] = app.vault.getMarkdownFiles();
		mdFiles.forEach(async (mdFile) => {
			await WikiMarkdownHandler.convertLinksAndSaveInSingleFile(mdFile, app, finalFormat);
		});
	};
}
