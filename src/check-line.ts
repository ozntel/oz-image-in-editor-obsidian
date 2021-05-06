import { App, TFile } from 'obsidian';
import { getFileNameAndAltText, get_link_in_line,
        getActiveNoteFile, getPathOfImage, getFileCmBelongsTo } from './utils';

// Check Single Line
export const check_line: any = (cm: CodeMirror.Editor, line_number: number, targetFile:TFile, app: App) => {

    // Regex for [[ ]] format
    const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg|bmp).*\]\]/
    // Regex for ![ ]( ) format
    const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg|bmp)\)/
    // Get the Line edited
    const line = cm.lineInfo(line_number);
    
    if(line === null) return;

    // Check if the line is an internet link
    const link_in_line = get_link_in_line(line.text);

    // Current Line Comparison with Regex
    const match_1 = line.text.match(image_line_regex_1);
    const match_2 = line.text.match(image_line_regex_2);

    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid: { className: string; }) => wid.className === 'oz-image-widget') : false;
    if(line_image_widget && (!match_1 || !match_2)) line_image_widget[0].clear();

    // If any of regex matches, it will add image widget
    if(link_in_line.result || match_1 || match_2){
            
        // Clear the image widgets if exists
        if (line.widgets){
            for(const wid of line.widgets){
                if (wid.className === 'oz-image-widget'){
                    wid.clear()
                }
            }
        }

        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';
        
        if(link_in_line.result){
            // linkType 3 and 4
            filename = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).fileName
            alt = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).altText
        } else if(match_1){
            // Regex for [[myimage.jpg|#x-small]] format
            filename = getFileNameAndAltText(1, match_1).fileName
            alt = getFileNameAndAltText(1, match_1).altText
        } else if(match_2){
            // Regex for ![#x-small](myimage.jpg) format
            filename = getFileNameAndAltText(2, match_2).fileName
            alt = getFileNameAndAltText(2, match_2).altText
        }
        
        // Create Image
        const img = document.createElement('img');

        // Prepare the src for the Image
        if(link_in_line.result){
            img.src = filename;
        } else {
            // Source Path
            var sourcePath = '';
            if(targetFile != null){
                sourcePath = targetFile.path;
            }else{
                let activeNoteFile = getActiveNoteFile(app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }
            var image = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if(image != null) img.src = getPathOfImage(app.vault, image)
        }
        // Image Properties
        img.alt = alt;
        
        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, {className: 'oz-image-widget'});            
    }
}

// Check All Lines Function
export const check_lines: any = (cm: CodeMirror.Editor, from: number, to: number, app: App) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, app.workspace);
    for(let i=from; i <= to; i++){
        check_line(cm, i, file, app);
    }
}