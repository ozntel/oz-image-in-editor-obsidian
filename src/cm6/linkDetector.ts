type LinkType = 'vault-image-wiki' | 'vault-image-md' | 'external-wikilink' | 'external-mdlink';

interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    altText: string;
    blockRef: string;
}

export const detectLink = (lineText: string): LinkMatch | null => {
    // A --> External Image Links
    const httpLinkRegex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
    const imageHttpWikiRegex = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
    const imageHttpMarkdownRegex = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;

    const imageHttpWikiResult = lineText.match(imageHttpWikiRegex);
    if (imageHttpWikiResult) {
        const fileNameRegex = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
        const fileMatch = imageHttpWikiResult[0].match(fileNameRegex);
        if (fileMatch && fileMatch[0].match(httpLinkRegex)) {
            const altRegex = /(?<=\|).*(?=]])/;
            const altMatch = imageHttpWikiResult[0].match(altRegex);
            return {
                type: 'external-wikilink',
                match: imageHttpWikiResult[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    const imageHttpMarkdownResult = lineText.match(imageHttpMarkdownRegex);
    if (imageHttpMarkdownResult) {
        const fileNameRegex = /(?<=\().*(?=\))/;
        const fileMatch = imageHttpMarkdownResult[0].match(fileNameRegex);
        if (fileMatch && fileMatch[0].match(httpLinkRegex)) {
            const altRegex = /(?<=\[)(^$|.*)(?=\])/;
            const altMatch = imageHttpMarkdownResult[0].match(altRegex);
            return {
                type: 'external-mdlink',
                match: imageHttpMarkdownResult[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    // B --> Internal Image Links
    // 1. [[ ]] format
    const internalImageWikiRegex = /!\[\[.*?(jpe?g|png|gif|svg|bmp).*?\]\]/;
    const internalImageWikiMatch = lineText.match(internalImageWikiRegex);

    if (internalImageWikiMatch) {
        const fileNameRegex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        const fileMatch = internalImageWikiMatch[0].match(fileNameRegex);
        if (fileMatch) {
            const altRegex = /(?<=\|).*(?=]])/;
            const altMatch = internalImageWikiMatch[0].match(altRegex);
            return {
                type: 'vault-image-wiki',
                match: internalImageWikiMatch[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    // 2. ![ ]( ) format
    const internalImageMdRegex = /!\[(^$|.*?)\]\(.*?(jpe?g|png|gif|svg|bmp)\)/;
    const internalImageMdMatch = lineText.match(internalImageMdRegex);

    if (internalImageMdMatch) {
        const fileNameRegex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        const fileMatch = internalImageMdMatch[0].match(fileNameRegex);
        if (fileMatch) {
            const altRegex = /(?<=\[)(^$|.*)(?=\])/;
            const altMatch = internalImageMdMatch[0].match(altRegex);
            return {
                type: 'vault-image-md',
                match: internalImageMdMatch[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    // --> If there is no Match
    return null;
};
