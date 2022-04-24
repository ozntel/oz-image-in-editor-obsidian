import { App, TFile, BlockCache } from 'obsidian';
import OzanImagePlugin from 'src/main';
import showdown from 'showdown';
import { getPathOfImage } from 'src/util/obsidianHelper';
import { altWidthHeight } from 'src/util/imageHandler';
import { stripIndents } from 'common-tags';
import frontmatter from 'front-matter';

// --> Converts links within given string from Wiki to MD
const convertWikiLinksToMarkdown = (md: string): string => {
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
                let mdLink = createMarkdownLink(fileMatch[0], altMatch ? altMatch[0] : '');
                newMdText = newMdText.replace(wiki, mdLink);
            }
        }
    }
    return newMdText;
};

const createMarkdownLink = (link: string, alt: string) => {
    return `[${alt}](${encodeURI(link)})`;
};

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
// --> Whole File Transclusion
const fileTransclusionRegex = /!\[\[.*?\]\]/;
const fileTransclusionFileNameRegex = /(?<=\[\[).*?(?=\]\])/;

export const lineIsWithBlockId = (line: string) => {
    return line.match(transclusionWithBlockIdRegex);
};

export const lineIsWithHeading = (line: string) => {
    return line.match(transclusionBlockRegex);
};

export const lineIsFileTransclusion = (line: string) => {
    return fileTransclusionRegex.test(line);
};

export const lineIsTransclusion = (line: string) => {
    return lineIsWithBlockId(line) || lineIsWithHeading(line) || lineIsFileTransclusion(line);
};

export const getFile = (line: string, app: App, sourcePath: string): TFile | null => {
    let match: RegExpMatchArray;
    if (lineIsWithBlockId(line) || lineIsWithHeading(line)) {
        match = line.match(transclusionFileNameRegex);
    } else if (lineIsFileTransclusion(line)) {
        match = line.match(fileTransclusionFileNameRegex);
        if (match[0] === '') return null;
    }
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
    let hashtagRegex = /(?<=\s)#[^\s#]+|^#[^\s#]+/gm; // Make sure that first tag without space is also detected
    let hashtags = md.match(hashtagRegex);
    if (!hashtags) return md;
    let mdText = md;
    for (let ht of hashtags) {
        // --> // Doesn't start with > (prevent double span) (Re-clear issue solution)
        let htRegex = new RegExp('(?<!\\>)' + escapeRegExp(ht), 'gm');
        mdText = mdText.replace(htRegex, `<span class="hashtag">${ht}</span>`);
    }
    return mdText;
};

const escapeRegExp = (string: string) => {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const clearMd = (md: string): string => {
    // --> Hashtags as Link
    let mdText = clearHashTags(md);
    // --> Convert Inline Transclusions to Link
    mdText = clearExclamationFromTransclusion(mdText);
    // --> Convert Wikis to Markdown for later HTML render
    mdText = convertWikiLinksToMarkdown(mdText);
    // --> Clear FrontMatter
    mdText = removeFrontMatter(mdText);
    // --> Wrap MathJax in Code Blocks
    if (mathJaxLoaded()) mdText = wrapAllMathJaxsInCodeBlock(mdText);
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

export const renderBlockCache = (blockCache: BlockCache, cachedReadOfTarget: string): HTMLDivElement => {
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
    // --> Convert Admonitions if enabled
    convertAdmonitions(html);
    // --> Convert Mermaids if Mermaid Lib is Loaded
    if (mermaidLoaded()) convertMermaids(html);
    // --> Convert Mathjax if MathJax Lib is Loaded
    if (mathJaxLoaded()) convertMathJaxElements(html);
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

const removeFrontMatter = (md: string): string => {
    try {
        let splittedMd = frontmatter(md);
        return splittedMd.body;
    } catch (err) {
        return md;
    }
};

/* ------------------ Admonition Handlers  ------------------ */

const convertAdmonitions = (html: HTMLElement) => {
    let admonitionCodeElements = html.querySelectorAll('code[class*="language-ad-"]');
    admonitionCodeElements?.forEach((adCodeEl) => {
        let className = adCodeEl.className;
        let titleRegex = /(?<=language-ad-).*?(?=\s)/;
        let titleMatch = className.match(titleRegex);
        let title: string = titleMatch ? titleMatch[0] : 'Note';
        let adElement = createAdmonitionEl(title, adCodeEl.innerHTML);
        adCodeEl.parentElement.replaceWith(adElement);
    });
};

const createAdmonitionEl = (title: string, content: string): HTMLElement => {
    let colors = admonitionColorMap[title] ? admonitionColorMap[title] : '68, 138, 255';
    let admonitionEl = document.createElement('div');

    // Admonition
    admonitionEl.addClass('oz-admonition');
    admonitionEl.style.cssText = `--oz-admonition-color: ${colors};`;

    // Title
    let admonitionTitle = admonitionEl.createEl('div');
    admonitionTitle.addClass('oz-admonition-title');
    let admonitionTitleContent = admonitionTitle.createEl('div');
    admonitionTitleContent.addClass('oz-admonition-title-content');
    let admonitionTitleContentMarkdown = admonitionTitleContent.createEl('div');
    admonitionTitleContentMarkdown.addClass('oz-admonition-title-markdown');
    admonitionTitleContentMarkdown.innerText = title;

    // Content
    let admonitionContentHolder = admonitionEl.createEl('div');
    admonitionContentHolder.addClass('oz-admonition-content-holder');
    let admonitionContent = admonitionContentHolder.createEl('div');
    admonitionContent.addClass('oz-admonition-content');
    admonitionContent.innerHTML = convertMdToHtml(content);

    return admonitionEl;
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

    (window as any).mermaid.initialize(mermaidConfig);

    mermaidCodeElements?.forEach((mermaidCodeEl) => {
        // Create Mermaid Div
        let mermaidDiv = document.createElement('div');
        let id = Math.floor(Math.random() * 999999);
        mermaidDiv.id = `mermaid-${id}`;
        mermaidDiv.innerHTML = mermaidCodeEl.innerHTML;
        // --> If error happens with syntax, add an error text
        try {
            // @ts-ignore - Replace Mermaid with SVG
            (window as any).mermaid.mermaidAPI.render(`mermaid-${id}`, decodeHTML(mermaidCodeEl.innerHTML), (svg) => {
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
    return (window as any).mermaid;
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

/* ------------------ MathJax Handlers  ------------------ */

export const wrapAllMathJaxsInCodeBlock = (md: string): string => {
    let newMd = md;

    // --> If multiple line syntax
    let multipleLineRegex = /\$\$.*?\$\$/gs;
    let multipleLineMathJaxRegex = /(?<=\$\$).*?(?=\$\$)/s;
    let multipleLines = md.match(multipleLineRegex);

    if (multipleLines && multipleLines.length > 0) {
        for (let multipleLine of multipleLines) {
            let mathJaxMatch = multipleLine.match(multipleLineMathJaxRegex);
            if (!mathJaxMatch) continue;
            newMd = newMd.replace(multipleLine, createSingleMathJaxCodeBlock(mathJaxMatch[0], 'newline'));
        }
    }

    // --> If single line syntax
    let singleLineRegex = /\$[^\s].*[^\s]\$/g;
    let singleLineMathJaxRegex = /(?<=\$).*?(?=\$)/;
    let singleLines = md.match(singleLineRegex);

    if (singleLines && singleLines.length > 0) {
        for (let line of singleLines) {
            let mathJaxMatch = line.match(singleLineMathJaxRegex);
            if (mathJaxMatch) {
                newMd = newMd.replace(line, createSingleMathJaxCodeBlock(mathJaxMatch[0], 'inline'));
            }
        }
    }

    return newMd;
};

let createSingleMathJaxCodeBlock = (mathJax: string, type: 'inline' | 'newline') => {
    return stripIndents`
        <pre class="language-mathjax">
            <code class="language-mathjax ${type === 'inline' ? 'inline' : ''}">
                ${mathJax}
            </code>
        </pre>
    `;
};

// --> It takes <code> elements with "language-mathjax" class and converts to mathjax
// If it is inline mathjax, there will be an additional class "inline" in <code> element
const convertMathJaxElements = (html: HTMLElement) => {
    let mathJaxElements = html.querySelectorAll('code.language-mathjax');
    for (let i = 0; i < mathJaxElements.length; i++) {
        let mathJaxEl = mathJaxElements[i];
        let inline: boolean = mathJaxEl.classList.contains('inline');
        if (inline) {
            let previousSibling = mathJaxEl.parentElement.previousElementSibling;
            if (previousSibling) {
                previousSibling.classList.add('inline-block');
            }
        }
        getMathJaxElement(mathJaxEl.innerHTML, inline ? 'inline' : 'newline').then((node) => {
            mathJaxEl.parentElement.replaceWith(node);
        });
    }
};

// --> Converts MathJax String to Styled HTML Element
// If inline returns <span>, if newline returns <div>
const getMathJaxElement = async (content: string, type: 'inline' | 'newline'): Promise<Element> => {
    // --> Create Wrapper - Span for Inline - Div for Newline
    let newNode: Element;
    if (type === 'inline') {
        newNode = document.createElement('span');
        newNode.classList.add('inline-mathjax-block');
    } else if (type === 'newline') {
        newNode = document.createElement('div');
        newNode.classList.add('newline-mathjax-block');
    }
    // --> Decode from HTML Entities
    let mathJaxText = decodeHTML(content);
    // --> Convert Node to HTML and append to Wrapper
    let node = await (window as any).MathJax.tex2chtmlPromise(mathJaxText, { display: type !== 'inline' });
    const adaptor = (window as any).MathJax.startup.adaptor;
    newNode.innerHTML = adaptor.outerHTML(node);
    // --> Convert to Style append to Wrapper
    let styleEl = document.createElement('style');
    styleEl.innerHTML = adaptor.textContent((window as any).MathJax.chtmlStylesheet());
    newNode.appendChild(styleEl);
    return newNode;
};

const mathJaxLoaded = () => {
    return (window as any).MathJax?.version;
};
