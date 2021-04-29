import { Plugin, Notice, TFile } from 'obsidian';
import { clearWidges, filename_is_a_link, getFileNameAndAltText,
        getActiveNoteFile, getPathOfImage, getFileCmBelongsTo } from './utils';

export default class OzanImagePlugin extends Plugin{

    onload(){
        // Register event for each change
        this.registerCodeMirror( (cm: CodeMirror.Editor) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        })
    }

    onunload(){
        this.app.workspace.iterateCodeMirrors( (cm) => {
            cm.on("change", this.codemirrorLineChanges);
            clearWidges(cm);
        });
        new Notice('Image in Editor Plugin is unloaded');
    }

    // Line Edit Changes
    codemirrorLineChanges = (cm: any, change: any) => {
        this.check_lines(cm, change.from.line, change.from.line + change.text.length - 1);
    }

    // Only Triggered during initial Load
    handleInitialLoad = (cm: CodeMirror.Editor) => {
        var lastLine = cm.lastLine();
        var file = getFileCmBelongsTo(cm, this.app.workspace);
        for(let i=0; i < lastLine; i++){
            this.check_line(cm, i, file);
        }
    }

    // Check Single Line
    check_line: any = (cm: CodeMirror.Editor, line_number: number, targetFile:TFile) => {

        // Regex for [[ ]] format
        const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg).*\]\]/
        // Regex for ![ ]( ) format
        const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg)\)/
        // Get the Line edited
        const line = cm.lineInfo(line_number);
        
        if(line === null) return;

        // Current Line Comparison with Regex
        const match_1 = line.text.match(image_line_regex_1);
        const match_2 = line.text.match(image_line_regex_2);

        // Clear the widget if link was removed
        var line_image_widget = line.widgets ? line.widgets.filter((wid: { className: string; }) => wid.className === 'oz-image-widget') : false;
        if(line_image_widget && (!match_1 || !match_2)) line_image_widget[0].clear();

        // If any of regex matches, it will add image widget
        if(match_1 || match_2){
             
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
            
            if(match_1){
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
            if(filename_is_a_link(filename)){
                img.src = filename;
            } else {
                // Source Path
                var sourcePath = '';
                if(targetFile != null){
                    sourcePath = targetFile.path;
                }else{
                    let activeNoteFile = getActiveNoteFile(this.app.workspace);
                    sourcePath = activeNoteFile ? activeNoteFile.path : '';
                }
                var image = this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
                if(image != null) img.src = getPathOfImage(this.app.vault, image)
            }

            // Image Properties
            img.alt = alt;
            
            // Add Image widget under the Image Markdown
            cm.addLineWidget(line_number, img, {className: 'oz-image-widget'});            
        }
    }

    // Check All Lines Function
    check_lines: any = (cm: CodeMirror.Editor, from: number, to: number) => {
        // Last Used Line Number in Code Mirror
        var file = getFileCmBelongsTo(cm, this.app.workspace);
        for(let i=from; i <= to; i++){
            this.check_line(cm, i, file);
        }
    }
}