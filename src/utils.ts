import { Workspace, MarkdownView, Vault, TFile } from 'obsidian';

// Remove Widgets in CodeMirror Editor
export const clearWidgets = (cm: CodeMirror.Editor) => {
    var lastLine = cm.lastLine();
    for(let i=0; i <= lastLine; i++){
        const line = cm.lineInfo(i);
        clearLineWidgets(line);
    }
}

// Clear Single Line Widget
export const clearLineWidgets = (line: any) => {
    if(line.widgets){
        for(const wid of line.widgets){
            if (wid.className === 'oz-image-widget'){
                wid.clear()
            }
        }
    }
}

// Check line if it is a link
export const get_link_in_line = (line: string) => {
    const image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/
    const image_http_regex_4 = /!\[(^$|.*)\]\([a-z][a-z0-9+\-.]+:\/.*\)/
    const match_3 = line.match(image_http_regex_3);
    const match_4 = line.match(image_http_regex_4);
    if(match_3){
        return { result: match_3, linkType: 3 };
    } else if(match_4){
        return { result: match_4, linkType: 4 };
    }
    return { result: false, linkType: 0 };
}

// Check line if it is image
export const get_image_in_line = (line: string) => {
    // Regex for [[ ]] format
    const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg|bmp).*\]\]/
    // Regex for ![ ]( ) format
    const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg|bmp)\)/
    const match_1 = line.match(image_line_regex_1);
    const match_2 = line.match(image_line_regex_2);
    if(match_1){
        return { result: match_1, linkType: 1}
    }else if(match_2){
        return { result: match_2, linkType: 2}
    }
    return { result: false, linkType: 0}
}

 // Image Name and Alt Text
export const getFileNameAndAltText = (linkType: number, match: any) => {
    /* 
       linkType 1: ![[myimage.jpg|#x-small]], linkType 2: ![#x-small](myimage.jpg) 
       linkType 3: ![[https://image|#x-small]], linkType 4: ![#x-small](https://image) 
       returns { fileName: '', altText: '' }   
    */
    var file_name_regex;
    var alt_regex;

    if(linkType == 1 || linkType == 3){
        if(linkType == 1) file_name_regex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        if(linkType == 3) file_name_regex = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
        alt_regex = /(?<=\|).*(?=]])/;
    } else if(linkType == 2 || linkType == 4){
        if(linkType == 2) file_name_regex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        if(linkType == 4) file_name_regex = /(?<=\().*(?=\))/;
        alt_regex = /(?<=\[)(^$|.*)(?=\])/;
    }

    var file_match = match[0].match(file_name_regex);
    var alt_match = match[0].match(alt_regex);

    return { fileName: file_match ? file_match[0] : '', 
            altText: alt_match ? alt_match[0] : '' }
}    

// Getting Active Markdown File
export const getActiveNoteFile = (workspace: Workspace) => {
    return workspace.getActiveFile();
}

// Get Active Editor
export const getCmEditor = (workspace: Workspace): CodeMirror.Editor => {
    return workspace.getActiveViewOfType(MarkdownView)?.sourceMode?.cmEditor
}

const getPathOfVault = (vault: Vault): string => {
    var path = vault.adapter.basePath;
    if(path.startsWith('/')) return 'app://local' + path
    return 'app://local/' + path
}

// Temporary Solution until getResourcePath improved 
export const getPathOfImage = (vault: Vault, image: TFile) => {
    // vault.getResourcePath(image) 
    return getPathOfVault(vault) + '/' + image.path + '?' + image.stat.mtime
}

export const getFileCmBelongsTo = (cm: CodeMirror.Editor, workspace: Workspace) => {
    let leafs = workspace.getLeavesOfType("markdown");
    for(let i=0; i < leafs.length; i++){
        if(leafs[i].view instanceof MarkdownView && leafs[i].view.sourceMode?.cmEditor == cm){
            return leafs[i].view.file
        }
    }
    return null;
} 