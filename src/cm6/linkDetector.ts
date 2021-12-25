import { TFile } from 'obsidian';
import OzanImagePlugin from 'src/main';
import * as ExcalidrawHandler from 'src/util/excalidrawHandler';

type LinkType = 'vault-image' | 'external-image' | 'excalidraw' | 'file-transclusion' | 'header-transclusion' | 'blockid-transclusion';

interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    altText: string;
    blockRef: string;
    file?: TFile;
}

export const detectLink = (lineText: string, plugin: OzanImagePlugin): LinkMatch | null => {
    // --> A. External Image Links
    const httpLinkRegex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
    const imageHttpMarkdownRegex = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;

    const imageHttpMarkdownResult = lineText.match(imageHttpMarkdownRegex);
    if (imageHttpMarkdownResult) {
        const fileNameRegex = /(?<=\().*(?=\))/;
        const fileMatch = imageHttpMarkdownResult[0].match(fileNameRegex);
        if (fileMatch && fileMatch[0].match(httpLinkRegex)) {
            const altRegex = /(?<=\[)(^$|.*)(?=\])/;
            const altMatch = imageHttpMarkdownResult[0].match(altRegex);
            return {
                type: 'external-image',
                match: imageHttpMarkdownResult[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    // --> B. Internal Image Links
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
                type: 'vault-image',
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
                type: 'vault-image',
                match: internalImageMdMatch[0],
                linkText: fileMatch[0],
                altText: altMatch ? altMatch[0] : '',
                blockRef: '',
            };
        }
    }

    // --> C. Transclusion and Excalidraw
    const mdRegex = /!\[(^$|.*?)\]\(.*?\)/;
    const wikiRegex = /!\[\[.*?\]\]/;

    const mdTransclusionMatch = lineText.match(mdRegex);
    const wikiTransclusionMatch = lineText.match(wikiRegex);

    if (mdTransclusionMatch || wikiTransclusionMatch) {
        const mdFileNameRegex = /(?<=\]\().*?(?=\))/;
        const wikiFileNameRegex = /(?<=\[\[).*?((?=\|))|(?<=\[\[).*?(?=\]\])/;

        // 1. Check Excalidraw
        let fileNameMatch = lineText.match(mdTransclusionMatch ? mdFileNameRegex : wikiFileNameRegex);
        if (fileNameMatch) {
            let file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileNameMatch[0]), ''); // @todo - Get Source file path from editor
            if (file && ExcalidrawHandler.excalidrawPluginIsLoaded(plugin.app) && ExcalidrawHandler.isAnExcalidrawFile(file)) {
                const mdAltRegex = /(?<=\[)(^$|.*)(?=\])/;
                const wikiAltRegex = /(?<=\|).*(?=]])/;
                const altRegex = mdTransclusionMatch ? mdAltRegex : wikiAltRegex;
                const altMatch = lineText.match(altRegex);

                return {
                    type: 'excalidraw',
                    match: mdTransclusionMatch ? mdTransclusionMatch[0] : wikiTransclusionMatch[0],
                    linkText: file.path,
                    altText: altMatch ? altMatch[0] : '',
                    blockRef: '',
                    file: file,
                };
            }
        }

        // 2. Transclusion
        if (wikiTransclusionMatch) {
            const transclusionIdAndHeaderFileNameRegex = /(?<=!\[\[)(.*)(?=#)/;

            // --> #^ Block Id Transclusion
            const transclusionBlockIdRegex = /!\[\[(.*)#\^(.*)\]\]/;
            const transclusionBlockIdMatch = lineText.match(transclusionBlockIdRegex);
            if (transclusionBlockIdMatch) {
                const fileNameMatch = transclusionBlockIdMatch[0].match(transclusionIdAndHeaderFileNameRegex);
                const file = plugin.app.metadataCache.getFirstLinkpathDest(fileNameMatch[0], ''); // @todo
                if (file) {
                    const transclusionBlockIdRegex = /(?<=#\^).*(?=]])/;
                    return {
                        type: 'blockid-transclusion',
                        match: wikiTransclusionMatch[0],
                        linkText: file.path,
                        altText: '',
                        blockRef: lineText.match(transclusionBlockIdRegex)[0],
                        file: file,
                    };
                }
            }

            // --> # Header Block Transclusion
            const transclusionHeaderRegex = /!\[\[(.*)#((?!\^).*)\]\]/;
            const transclusionHeaderMatch = lineText.match(transclusionHeaderRegex);
            if (transclusionHeaderMatch) {
                const fileNameMatch = transclusionHeaderMatch[0].match(transclusionIdAndHeaderFileNameRegex);
                const file = plugin.app.metadataCache.getFirstLinkpathDest(fileNameMatch[0], '');
                if (file) {
                    const transclusionHeaderTextRegex = /(?<=#).*(?=]])/;
                    return {
                        type: 'header-transclusion',
                        match: wikiTransclusionMatch[0],
                        linkText: file.path,
                        altText: '',
                        blockRef: lineText.match(transclusionHeaderTextRegex)[0],
                        file: file,
                    };
                }
            }

            // --> Whole File Transclusion
            const fileTransclusionFileNameRegex = /(?<=\[\[).*?(?=\]\])/;
            const fileNameMatch = lineText.match(fileTransclusionFileNameRegex);
            const file = plugin.app.metadataCache.getFirstLinkpathDest(fileNameMatch[0], ''); // @todo
            if (file) {
                return {
                    type: 'file-transclusion',
                    match: wikiTransclusionMatch[0],
                    linkText: file.path,
                    altText: '',
                    blockRef: '',
                    file: file,
                };
            }
        }
    }

    // --> END: If there is no Match
    return null;
};
