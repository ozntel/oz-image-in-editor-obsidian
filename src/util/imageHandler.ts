import { Menu, TFile } from 'obsidian';
import OzanImagePlugin from 'src/main';

// General Image Regex
const image_regex = /.*.(jpe?g|png|gif|svg|bmp)/;

// Regex for [[ ]] format
const image_line_regex_1 = /!\[\[.*?(jpe?g|png|gif|svg|bmp).*?\]\]/;
const file_name_regex_1 = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;

// Regex for ![ ]( ) format
const image_line_regex_2 = /!\[(^$|.*?)\]\(.*?(jpe?g|png|gif|svg|bmp)\)/;
const file_name_regex_2 = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;

// Regex for Links
const file_name_regex_3 = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
const file_name_regex_4 = /(?<=\().*(?=\))/;

// Check line if it is image
export const getImageInLine = (line: string) => {
    const match_1 = line.match(image_line_regex_1);
    const match_2 = line.match(image_line_regex_2);
    if (match_1) {
        return { result: match_1, linkType: 1 };
    } else if (match_2) {
        return { result: match_2, linkType: 2 };
    }
    return { result: false, linkType: 0 };
};

// Image Name and Alt Text
export const getImageFileNameAndAltText = (linkType: number, match: any) => {
    /* 
        linkType 1: ![[myimage.jpg|#x-small]], linkType 3: ![[https://image|#x-small]], 
        linkType 2: ![#x-small](myimage.jpg),  linkType 4: ![#x-small](https://image) 
        returns { fileName: '', altText: '' }   
    */
    var file_name_regex;
    var alt_regex;
    if (linkType == 1 || linkType == 3) {
        if (linkType == 1) file_name_regex = file_name_regex_1;
        if (linkType == 3) file_name_regex = file_name_regex_3;
        alt_regex = /(?<=\|).*(?=]])/;
    } else if (linkType == 2 || linkType == 4) {
        if (linkType == 2) file_name_regex = file_name_regex_2;
        if (linkType == 4) file_name_regex = file_name_regex_4;
        alt_regex = /(?<=\[)(^$|.*)(?=\])/;
    }

    var file_match = match[0].match(file_name_regex);
    var alt_match = match[0].match(alt_regex);

    return {
        fileName: file_match ? file_match[0] : '',
        altText: alt_match ? alt_match[0] : '',
    };
};

// Checking the Alt 100x100 (WIDTHxHEIGHT) format
export const altWidthHeight = (altText: string) => {
    // Exclude Alt Text containing Letters other than 'x'
    let excludeRegex = /[^(x|0-9)]/;
    if (altText.match(excludeRegex)) return false;
    // Create Width & Height
    const widthHeightRegex = /[0-9]+x[0-9]+/;
    const widthRegex = /[0-9]+/;
    var match = altText.match(widthHeightRegex);
    if (match) {
        var index = match[0].indexOf('x');
        return {
            width: parseInt(match[0].substr(0, index)),
            height: parseInt(match[0].substr(index + 1)),
        };
    } else {
        var widthMatch = altText.match(widthRegex);
        if (widthMatch) return { width: parseInt(widthMatch[0]) };
    }
    return false;
};

// Check if path is an image
export const pathIsAnImage = (path: string) => {
    var match = path.match(image_regex);
    if (match) return true;
    return false;
};

// Return Blob Object from Url
export const getBlobObject = async (blobLink: string) => {
    return fetch(blobLink).then((res) => res.blob());
};

// Add a context menu for image widget
export const addContextMenu = (event: MouseEvent, plugin: OzanImagePlugin, imageFile: TFile) => {
    const fileMenu = new Menu(plugin.app);
    fileMenu.addItem((menuItem) => {
        menuItem.setTitle('Copy Image to Clipboard');
        menuItem.setIcon('image-file');
        menuItem.onClick(async (e) => {
            var buffer = await plugin.app.vault.adapter.readBinary(imageFile.path);
            var arr = new Uint8Array(buffer);
            var blob = new Blob([arr], { type: 'image/png' });
            // @ts-ignore
            const item = new ClipboardItem({ 'image/png': blob });
            // @ts-ignore
            window.navigator['clipboard'].write([item]);
        });
    });
    plugin.app.workspace.trigger('file-menu', fileMenu, imageFile, 'file-explorer');
    fileMenu.showAtPosition({ x: event.pageX, y: event.pageY });
    return false;
};
