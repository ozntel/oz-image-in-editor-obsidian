import { Workspace, MarkdownView, Vault, TFile } from 'obsidian';

export class WidgetHandler {

    // Remove Widgets in CodeMirror Editor
    static clearWidgets = (cm: CodeMirror.Editor) => {
        var lastLine = cm.lastLine();
        for (let i = 0; i <= lastLine; i++) {
            const line = cm.lineInfo(i);
            WidgetHandler.clearLineWidgets(line);
        }
    }

    // Clear Single Line Widget
    static clearLineWidgets = (line: any) => {
        if (line.widgets) {
            for (const wid of line.widgets) {
                if (wid.className === 'oz-image-widget') {
                    wid.clear()
                }
            }
        }
    }

}

export class LinkHandler {

    static link_regex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
    static image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
    static image_http_regex_4 = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;

    // Check if String is a link
    static path_is_a_link = (path: string): boolean => {
        let match = path.match(LinkHandler.link_regex);
        return match ? true : false
    }

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
    }

}

export class PDFHandler {

    // Regex for [[ ]] format
    static pdf_regex_1 = /!\[\[.*(pdf)\]\]/
    static pdf_name_regex_1 = /(?<=\[\[).*.pdf/

    // Regex for ![ ]( ) format
    static pdf_regex_2 = /!\[(^$|.*)\]\(.*(pdf)\)/
    static pdf_name_regex_2 = /(?<=\().*.pdf/;

    // Check line if it is a PDF
    static get_pdf_in_line = (line: string) => {
        const match_1 = line.match(PDFHandler.pdf_regex_1);
        const match_2 = line.match(PDFHandler.pdf_regex_2);
        if (match_1) {
            return { result: match_1, linkType: 1 }
        } else if (match_2) {
            return { result: match_2, linkType: 2 }
        }
        return { result: false, linkType: 0 }
    }

    static get_pdf_name = (linkType: number, match: any): string => {
        let pdf_name_regex;
        if (linkType == 1) pdf_name_regex = PDFHandler.pdf_name_regex_1;
        if (linkType == 2) pdf_name_regex = PDFHandler.pdf_name_regex_2;
        var file_name_match = match[0].match(pdf_name_regex);
        return file_name_match[0]
    }

}

export class ImageHandler {

    // Regex for [[ ]] format
    static image_line_regex_1 = /!\[\[.*?(jpe?g|png|gif|svg|bmp|excalidraw).*?\]\]/;
    static file_name_regex_1 = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp|excalidraw)/;

    // Regex for ![ ]( ) format
    static image_line_regex_2 = /!\[(^$|.*?)\]\(.*?(jpe?g|png|gif|svg|bmp|excalidraw)\)/;
    static file_name_regex_2 = /(?<=\().*(jpe?g|png|gif|svg|bmp|excalidraw)/;

    // Regex for Links
    static file_name_regex_3 = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
    static file_name_regex_4 = /(?<=\().*(?=\))/;

    // Check line if it is image
    static get_image_in_line = (line: string) => {
        const match_1 = line.match(ImageHandler.image_line_regex_1);
        const match_2 = line.match(ImageHandler.image_line_regex_2);
        if (match_1) {
            return { result: match_1, linkType: 1 }
        } else if (match_2) {
            return { result: match_2, linkType: 2 }
        }
        return { result: false, linkType: 0 }
    }

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
            altText: alt_match ? alt_match[0] : ''
        }
    }

    // Checking the Alt 100x100 (WIDTHxHEIGHT) format
    static altWidthHeight = (altText: string) => {
        const widthHeightRegex = /[0-9]+x[0-9]+/
        const widthRegex = /[0-9]+/
        var match = altText.match(widthHeightRegex);
        if (match) {
            var index = match[0].indexOf('x');
            return {
                width: parseInt(match[0].substr(0, index)),
                height: parseInt(match[0].substr(index + 1))
            }
        } else {
            var widthMatch = altText.match(widthRegex);
            if (widthMatch) return { width: parseInt(widthMatch[0]) }
        }
        return false
    }

}

export class ObsidianHelpers {

    // Getting Active Markdown File
    static getActiveNoteFile = (workspace: Workspace) => {
        return workspace.getActiveFile();
    }

    // Get Active Editor
    static getCmEditor = (workspace: Workspace): CodeMirror.Editor => {
        return workspace.getActiveViewOfType(MarkdownView)?.sourceMode?.cmEditor
    }

    // Get Full Path of the image
    static getPathOfImage = (vault: Vault, image: TFile) => {
        return vault.getResourcePath(image) + '?' + image.stat.mtime
    }

    static getFileCmBelongsTo = (cm: CodeMirror.Editor, workspace: Workspace) => {
        let leafs = workspace.getLeavesOfType("markdown");
        for (let i = 0; i < leafs.length; i++) {
            // @ts-ignore
            if (leafs[i].view instanceof MarkdownView && leafs[i].view.sourceMode?.cmEditor == cm) {
                // @ts-ignore
                return leafs[i].view.file
            }
        }
        return null;
    }

}