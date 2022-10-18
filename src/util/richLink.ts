import { request } from 'obsidian';
import validator from 'validator';

type SiteMetaData = {
    title: string;
    description: string;
    canonical: string;
    iconLink: string;
};

type ErrorResponse = {
    error: {
        source: string;
        code: string;
        message: string;
    };
};

type SuccessResponse = {
    meta: {
        title: string;
        description: string;
        canonical: string;
    };
    links: { href: string; type: string }[];
};

const markdownLinkRegex = /\!\[(^$|.*?)\]\((.*?)\)/;
const linkRegex = /\]\(.*(?=\))/;

interface LinkInLine {
    link: string;
}

export const getLinksInLine = (line: string): LinkInLine[] => {
    let linksInLine: LinkInLine[] = [];
    let matches = line.match(new RegExp(markdownLinkRegex.source, 'g'));
    if (matches) {
        for (let match of matches) {
            let link = match.match(linkRegex);
            if (link && validator.isURL(link[0].replace('](', ''))) {
                linksInLine.push({
                    link: link[0].replace('](', ''),
                });
            }
        }
    }
    return linksInLine;
};

export const createRichLinkElement = async (url: string): Promise<HTMLElement | null> => {
    let siteMetaData = await getSiteMetaData(url);
    if (siteMetaData === 'error') return null;

    let richEl = document.createElement('div');

    // Credit: https://github.com/dhamaniasad/obsidian-rich-links
    richEl.innerHTML = `
        <div class="oz-rich-link-card-container">
            <a class="oz-rich-link-card" href="${url}" target="_blank">
                <div class="oz-rich-link-image-container">
                    <div class="oz-rich-link-image" style="background-image: url(${siteMetaData.iconLink})">
                    </div>
                </div>
                <div class="oz-rich-link-card-text">
                    <h1 class="oz-rich-link-card-title">${siteMetaData.title}</h1>
                    <p class="oz-rich-link-card-description">
                        ${siteMetaData.description}
                    </p>
                    <p class="oz-rich-link-href">${url}</p>
                </div>
            </a>
        </div>
    `;

    return richEl;
};

const getSiteMetaData = async (url: string): Promise<SiteMetaData | 'error'> => {
    let r = await request({ url: `http://iframely.server.crestify.com/iframely?url=${url}`, method: 'GET' });
    let resp: ErrorResponse | SuccessResponse = JSON.parse(r);
    if ('error' in resp) return 'error';
    return {
        title: resp.meta.title,
        description: resp.meta.description || '',
        canonical: resp.meta.canonical,
        iconLink: resp.links[0]?.href || '',
    };
};
