import { App } from 'obsidian';
import { convertMdToHtml } from './transclusionHandler';

export const convertAdmonitions = (html: HTMLElement) => {
	let admonitionCodeElements = html.querySelectorAll('code[class*="language-ad-"]');
	admonitionCodeElements?.forEach((adCodeEl) => {
		let className = adCodeEl.className;
		let titleRegex = /(?<=language-ad-).*?(?=\s)/;
		let titleMatch = className.match(titleRegex);
		let title: string = titleMatch ? titleMatch[0] : 'Note';
		adCodeEl.parentElement.replaceWith(createAdmonitionEl(title, adCodeEl.innerHTML));
	});
};

const createAdmonitionEl = (title: string, content: string): HTMLElement => {
	let adEl = document.createElement('div');
	let colors = admonitionColorMap[title] ? admonitionColorMap[title] : '68, 138, 255';
	adEl.innerHTML = `
    <div class="admonition admonition-plugin" style="--admonition-color: ${colors};">
        <div class="admonition-title">
            <div class="admonition-title-content">
                <div class="admonition-title-markdown" id="oz-admonition-title">
                    ${title}
                </div>
            </div>
        </div>
        <div class="admonition-content-holder">
            <div class="admonition-content">
                <p>${convertMdToHtml(content)}</p>
            </div>
        </div>
    </div>
    `;
	return adEl;
};

export const admonitionPluginActive = (app: App) => {
	// @ts-ignore
	return app.plugins.getPlugin('obsidian-admonition');
};

const admonitionColorMap: { [key: string]: string } = {
	abstract: '0, 176, 255',
	attention: '255, 145, 0',
	bug: '245, 0, 87',
	caution: '255, 145, 0',
	check: '0, 200, 83',
	cite: '158, 158, 158',
	danger: '255, 23, 68',
	done: '0, 200, 83',
	error: '255, 23, 68',
	example: '124, 77, 255',
	fail: '255, 82, 82',
	failure: '255, 82, 82',
	faq: '100, 221, 23',
	help: '100, 221, 23',
	hint: '0, 191, 165',
	important: '0, 191, 165',
	info: '0, 184, 212',
	missing: '255, 82, 82',
	note: '68, 138, 255',
	question: '100, 221, 23',
	quote: '158, 158, 158',
	seealso: '68, 138, 255',
	success: '0, 200, 83',
	summary: '0, 176, 255',
	tip: '0, 191, 165',
	todo: '0, 184, 212',
};
