import { App, TFile, BlockCache } from 'obsidian';
import OzanImagePlugin from 'src/main';
import showdown from 'showdown';
import { getPathOfImage, pluginIsLoaded } from 'src/util/obsidianHelper';
import { altWidthHeight } from 'src/util/imageHandler';
import { convertWikiLinksToMarkdown } from 'src/util/wikiMarkdownHandler';
import mermaidAPI from 'mermaid';
import mermaid from 'mermaid';

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

export const lineIsWithBlockId = (line: string) => {
    return line.match(transclusionWithBlockIdRegex);
};

export const lineIsWithHeading = (line: string) => {
    return line.match(transclusionBlockRegex);
};

export const lineIsTransclusion = (line: string) => {
    return lineIsWithBlockId(line) || lineIsWithHeading(line);
};

export const getFile = (line: string, app: App, sourcePath: string): TFile | null => {
    const match = line.match(transclusionFileNameRegex);
    if (!match) return null;
    return app.metadataCache.getFirstLinkpathDest(match[0], sourcePath);
};

export const getBlockId = (line: string) => {
    return line.match(transclusionBlockIdRegex)[0];
};

export const getHeader = (line: string) => {
    return line.match(transclusionHeaderText)[0];
};

const clearExclamationFromTransclusion = (md: string): string => {
    // To Allow Showdown to recognize as Link rather than img
    let mdText = md;
    let transclusions = md.match(new RegExp(`(${transclusionWithBlockIdRegex.source})|(${transclusionBlockRegex.source})`, 'g'));
    transclusions?.forEach((tr) => (mdText = mdText.replace(tr, tr.substring(1))));
    return mdText;
};

const clearHashTags = (md: string): string => {
    let hashtagRegex = /^\#[^#\s]+/gm;
    let mdText = md;
    let hashtags = mdText.match(hashtagRegex);
    hashtags?.forEach((ht) => (mdText = mdText.replace(ht, `[${ht}](${ht})`)));
    return mdText;
};

const clearMd = (md: string): string => {
    // --> Hashtags as Link
    let mdText = clearHashTags(md);
    // --> Convert Inline Transclusions to Link
    mdText = clearExclamationFromTransclusion(mdText);
    // --> Convert Wikis to Markdown for later HTML render
    mdText = convertWikiLinksToMarkdown(mdText);
    return mdText;
};

export const convertMdToHtml = (md: string) => {
    let mdText = clearMd(md);
    let converter = new showdown.Converter({
        tables: true,
        simpleLineBreaks: true,
        strikethrough: true,
        tasklists: true,
        smartIndentationFix: true,
    });
    return converter.makeHtml(mdText);
};

export const renderHeader = (startNum: number, endNum: number, cachedReadOfTarget: string) => {
    let html = document.createElement('div');
    let mdToRender = cachedReadOfTarget.substr(startNum, endNum - startNum);
    html.innerHTML = convertMdToHtml(mdToRender);
    return html;
};

export const renderBlockCache = (blockCache: BlockCache, cachedReadOfTarget: string): HTMLElement => {
    let html = document.createElement('div');
    let blockStart = blockCache.position.start.offset;
    let blockEnd = blockCache.position.end.offset;
    let mdToRender = cachedReadOfTarget.substr(blockStart, blockEnd - blockStart);
    // Clear Block Reference from Render
    let indexOfBlockId = mdToRender.indexOf(`^${blockCache.id}`);
    if (indexOfBlockId !== -1) {
        mdToRender = mdToRender.slice(0, indexOfBlockId) + mdToRender.slice(indexOfBlockId + blockCache.id.length + 1);
    }
    // Convert to Html
    html.innerHTML = convertMdToHtml(mdToRender);
    return html;
};

export const clearHTML = (html: HTMLElement, plugin: OzanImagePlugin) => {
    // --> Convert Code Blocks for Transclusion
    clearCodeBlocksInHtml(html);
    // --> Convert Image Links to Usable in Obsidian
    clearImagesInHtml(html, plugin.app);
    // --> Convert Links to make Usable in Obsidian
    clearAnchorsInHtml(html, plugin.app);
    // --> Convert Mermaids
    if (plugin.settings.renderMermaid) {
        convertMermaids(html);
    }
    // --> Convert Admonitions if enabled
    if (plugin.settings.renderAdmonition && pluginIsLoaded(plugin.app, 'obsidian-admonition')) {
        convertAdmonitions(html);
    }
};

const clearCodeBlocksInHtml = (html: HTMLElement) => {
    // Add Line Number for Code Blocks
    let codeBlocks = html.querySelectorAll('pre > code');
    codeBlocks.forEach((cb) => {
        cb.addClass('line-numbers');
    });
};

const clearImagesInHtml = (html: HTMLElement, app: App) => {
    let images = html.querySelectorAll('img');
    images.forEach((img) => {
        let imgSource = img.getAttr('src');
        if (imgSource) {
            let imgFile = app.metadataCache.getFirstLinkpathDest(decodeURI(img.getAttr('src')), '');
            if (imgFile) {
                let realSource = getPathOfImage(app.vault, imgFile);
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

const clearAnchorsInHtml = (html: HTMLElement, app: App) => {
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

/* ------------------ Admonition Handlers  ------------------ */

const convertAdmonitions = (html: HTMLElement) => {
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

/* ------------------ Mermaid Handlers  ------------------ */

const convertMermaids = (html: HTMLElement) => {
    let mermaidCodeElements = html.querySelectorAll('code[class*="language-mermaid"]');

    // --> If there is no mermaid, do not initialize the mermaid
    if (mermaidCodeElements.length === 0) return;

    // @ts-ignore
    mermaid.initialize(mermaidConfig);

    mermaidCodeElements?.forEach((mermaidCodeEl) => {
        // Create Mermaid Div
        let mermaidDiv = document.createElement('div');
        let id = Math.floor(Math.random() * 999999);
        mermaidDiv.id = `mermaid-${id}`;
        mermaidDiv.innerHTML = mermaidCodeEl.innerHTML;
        // --> If error happens with syntax, add an error text
        try {
            // @ts-ignore - Replace Mermaid with SVG
            window.mermaid.mermaidAPI.render(`mermaid-${id}`, decodeHTML(mermaidCodeEl.innerHTML), (svg) => {
                mermaidDiv.innerHTML = svg;
            });
            mermaidCodeEl.parentElement.replaceWith(mermaidDiv);
        } catch (error) {
            let errorP = document.createElement('p');
            errorP.addClass('mermaid-error-information');
            errorP.innerText = 'Syntax Error in Mermaid graph';
            mermaidCodeEl.parentElement.prepend(errorP);
        }
    });
};

const htmlEntities: any = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'",
};

export const decodeHTML = (str: string) => {
    return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
        var match;
        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if ((match = entityCode.match(/^#x([\da-fA-F]+)$/))) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if ((match = entityCode.match(/^#(\d+)$/))) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
};

export const mermaidLoaded = () => {
    // @ts-ignore
    return window.mermaid;
};

const mermaidConfig = {
    startOnLoad: true,
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'cardinal',
    },
    securityLevel: 'loose',
    theme: 'forest',
    logLevel: 5,
};
