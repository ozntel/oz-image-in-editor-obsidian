import { TFile } from 'obsidian';
import OzanImagePlugin from 'src/main';
import * as ExcalidrawHandler from 'src/util/excalidrawHandler';

export const transclusionTypes = ['file-transclusion', 'header-transclusion', 'blockid-transclusion'];

export type TransclusionType = 'file-transclusion' | 'header-transclusion' | 'blockid-transclusion';
export type ImageType = 'vault-image' | 'external-image' | 'excalidraw';
export type PdfType = 'pdf-link' | 'pdf-file';
export type LinkType = 'iframe' | TransclusionType | ImageType | PdfType;

interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    altText: string;
    blockRef: string;
    file?: TFile;
}

export const detectLink = (params: { lineText: string; sourceFile: TFile; plugin: OzanImagePlugin }): LinkMatch | null => {
    const { lineText, plugin, sourceFile } = params;

    // --> A. Internal Image Links
    // 1. [[ ]] format
    const internalImageWikiRegex = /!\[\[.*?(jpe?g|png|gif|svg|bmp).*?\]\]/;
    const internalImageWikiMatch = lineText.match(internalImageWikiRegex);

    if (internalImageWikiMatch) {
        const fileNameRegex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        const fileMatch = internalImageWikiMatch[0].match(fileNameRegex);
        if (fileMatch) {
            const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileMatch[0]), sourceFile.path);
            if (file) {
                const altRegex = /(?<=\|).*(?=]])/;
                const altMatch = internalImageWikiMatch[0].match(altRegex);
                return {
                    type: 'vault-image',
                    match: internalImageWikiMatch[0],
                    linkText: fileMatch[0],
                    altText: altMatch ? altMatch[0] : '',
                    blockRef: '',
                    file: file,
                };
            }
        }
    }

    // --> B. PDF Files
    // 1. Pdf Wiki [[ ]] format
    const pdfWikiRegex = /!\[\[.*(pdf)(.*)?\]\]/;
    const pdfWikiMatch = lineText.match(pdfWikiRegex);

    if (pdfWikiMatch) {
        const pdfWikiFileNameRegex = /(?<=\[\[).*.pdf/;
        const pdfWikiFileNameMatch = pdfWikiMatch[0].match(pdfWikiFileNameRegex);
        if (pdfWikiFileNameMatch) {
            const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(pdfWikiFileNameMatch[0]), sourceFile.path);
            if (file) {
                const pdfPageNumberRegex = new RegExp('#page=[0-9]+');
                const pdfPageNumberMatch = pdfWikiMatch[0].match(pdfPageNumberRegex);
                return {
                    type: 'pdf-file',
                    match: pdfWikiMatch[0],
                    linkText: '',
                    altText: '',
                    blockRef: pdfPageNumberMatch ? pdfPageNumberMatch[0] : '',
                    file: file,
                };
            }
        }
    }

    // 2. Pdf Md ![ ]( ) format
    const pdfMdRegex = /!\[(^$|.*)\]\(.*(pdf)(.*)?\)/;
    const pdfMdMatch = lineText.match(pdfMdRegex);

    if (pdfMdMatch) {
        const pdfMdFileNameRegex = /(?<=\().*.pdf/;
        const pdfMdFileNameMatch = pdfMdMatch[0].match(pdfMdFileNameRegex);
        if (pdfMdFileNameMatch) {
            const httpLinkRegex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
            const pdfPageNumberRegex = new RegExp('#page=[0-9]+');
            const pdfPageNumberMatch = pdfMdMatch[0].match(pdfPageNumberRegex);

            if (httpLinkRegex.test(pdfMdFileNameMatch[0])) {
                return {
                    type: 'pdf-link',
                    match: pdfMdMatch[0],
                    linkText: pdfMdFileNameMatch[0],
                    altText: '',
                    blockRef: pdfPageNumberMatch ? pdfPageNumberMatch[0] : '',
                };
            } else {
                const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(pdfMdFileNameMatch[0]), sourceFile.path);

                if (file) {
                    return {
                        type: 'pdf-file',
                        match: pdfMdMatch[0],
                        linkText: file.path,
                        altText: '',
                        blockRef: pdfPageNumberMatch ? pdfPageNumberMatch[0] : '',
                        file: file,
                    };
                }
            }
        }
    }

    // --> C. External Image Links
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

    // 2. ![ ]( ) format
    const internalImageMdRegex = /!\[(^$|.*?)\]\(.*?(jpe?g|png|gif|svg|bmp)\)/;
    const internalImageMdMatch = lineText.match(internalImageMdRegex);

    if (internalImageMdMatch) {
        const fileNameRegex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        const fileMatch = internalImageMdMatch[0].match(fileNameRegex);
        if (fileMatch) {
            const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileMatch[0]), sourceFile.path);
            if (file) {
                const altRegex = /(?<=\[)(^$|.*)(?=\])/;
                const altMatch = internalImageMdMatch[0].match(altRegex);
                return {
                    type: 'vault-image',
                    match: internalImageMdMatch[0],
                    linkText: fileMatch[0],
                    altText: altMatch ? altMatch[0] : '',
                    blockRef: '',
                    file: file,
                };
            }
        }
    }

    // --> D. Transclusion and Excalidraw
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
            let file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileNameMatch[0]), sourceFile.path);
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
                const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileNameMatch[0]), sourceFile.path);
                if (file && file.extension === 'md') {
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
                const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileNameMatch[0]), sourceFile.path);
                if (file && file.extension === 'md') {
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
            const file = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(fileNameMatch[0]), sourceFile.path);
            if (file && fileNameMatch[0] !== '' && file.extension === 'md') {
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

    // --> E: Iframe Render
    const iframeRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/;
    const iframeMatch = lineText.match(iframeRegex);

    if (iframeMatch) {
        return {
            type: 'iframe',
            match: iframeMatch[0],
            linkText: '',
            altText: '',
            blockRef: '',
        };
    }

    // --> END: If there is no Match
    return null;
};
