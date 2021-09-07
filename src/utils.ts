import { altWidthHeight } from 'src/util';

// @ts-ignore
import { Workspace, MarkdownView, Vault, TFile, App, BlockCache, Keymap, normalizePath } from 'obsidian';
import showdown from 'showdown';

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

	static clearSpecialCharacters = (str: string) => {
		return str.replace(/\s|[0-9_]|\W|[#$%^&*()]/g, '');
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

	static clearHashTags = (md: string): string => {
		let hashtagRegex = /^\#[^#\s]+/gm;
		let mdText = md;
		let hashtags = mdText.match(hashtagRegex);
		hashtags?.forEach((ht) => (mdText = mdText.replace(ht, `[${ht}](${ht})`)));
		return mdText;
	};

	static clearMd = (md: string): string => {
		// --> Hashtags as Link
		let mdText = TransclusionHandler.clearHashTags(md);
		// --> Convert Inline Transclusions to Link
		mdText = TransclusionHandler.clearExclamationFromTransclusion(mdText);
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
		// --> Convert Admonitions if enabled
		if (TransclusionHandler.admonitionPluginActive(app)) {
			TransclusionHandler.convertAdmonitions(html);
		}
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
						let widthHeight = altWidthHeight(altText);
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
			// --> Hashtag Class & Attributes
			if (a.innerText.startsWith('#')) {
				a.addClass('tag');
			}
		});
	};

	static convertAdmonitions = (html: HTMLElement) => {
		let admonitionCodeElements = html.querySelectorAll('code[class*="language-ad-"]');
		admonitionCodeElements?.forEach((adCodeEl) => {
			let className = adCodeEl.className;
			let titleRegex = /(?<=language-ad-).*?(?=\s)/;
			let titleMatch = className.match(titleRegex);
			let title: string = titleMatch ? titleMatch[0] : 'Note';
			adCodeEl.parentElement.replaceWith(TransclusionHandler.createAdmonitionEl(title, adCodeEl.innerHTML));
		});
	};

	static createAdmonitionEl = (title: string, content: string): HTMLElement => {
		let adEl = document.createElement('div');
		adEl.innerHTML = `
        <div class="admonition admonition-plugin" style="--admonition-color: 68, 138, 255;">
            <div class="admonition-title">
                <div class="admonition-title-content">
                    <div class="admonition-title-markdown" id="oz-admonition-title">
                        ${title}
                    </div>
                </div>
            </div>
            <div class="admonition-content-holder">
                <div class="admonition-content">
                    <p>${TransclusionHandler.convertMdToHtml(content)}</p>
                </div>
            </div>
        </div>
        `;
		return adEl;
	};

	static admonitionPluginActive = (app: App) => {
		// @ts-ignore
		return app.plugins.getPlugin('obsidian-admonition');
	};
}

export class WikiMarkdownHandler {
	// --> Converts links within given string from Wiki to MD
	static convertWikiLinksToMarkdown = (md: string): string => {
		let newMdText = md;
		let wikiRegex = /\[\[.*?\]\]/g;
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
		let mdLinkRegex = /\[(^$|.*?)\]\((.*?)\)/g;
		let matches = newMdText.match(mdLinkRegex);
		if (matches) {
			let fileRegex = /(?<=\().*(?=\))/;
			let altRegex = /(?<=\[)(^$|.*?)(?=\])/;
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
