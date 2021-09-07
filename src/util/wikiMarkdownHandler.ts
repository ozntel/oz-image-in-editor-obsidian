import { App, TFile, normalizePath } from 'obsidian';

// --> Converts links within given string from Wiki to MD
export const convertWikiLinksToMarkdown = (md: string): string => {
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
const convertMarkdownLinksToWikiLinks = (md: string): string => {
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
const convertLinksAndSaveInSingleFile = async (mdFile: TFile, app: App, finalFormat: 'markdown' | 'wiki') => {
	let normalizedPath = normalizePath(mdFile.path);
	let fileText = await app.vault.adapter.read(normalizedPath);
	let newFileText =
		finalFormat === 'markdown' ? convertWikiLinksToMarkdown(fileText) : convertMarkdownLinksToWikiLinks(fileText);
	await app.vault.adapter.write(normalizedPath, newFileText);
};

// --> Command Function: Converts All Links and Saves in Current Active File
export const convertLinksInActiveFile = async (app: App, finalFormat: 'markdown' | 'wiki') => {
	let mdFile: TFile = app.workspace.getActiveFile();
	await convertLinksAndSaveInSingleFile(mdFile, app, finalFormat);
};

// --> Command Function: Converts All Links in All Files in Vault and Save in Corresponding Files
export const convertLinksInVault = (app: App, finalFormat: 'markdown' | 'wiki') => {
	let mdFiles: TFile[] = app.vault.getMarkdownFiles();
	mdFiles.forEach(async (mdFile) => {
		await convertLinksAndSaveInSingleFile(mdFile, app, finalFormat);
	});
};
