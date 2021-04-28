import { Plugin, Notice, MarkdownView, TFile } from 'obsidian';

export default class OzanImagePlugin extends Plugin{

    onload(){
        // Each file open will fire
        this.registerEvent(
            this.app.workspace.on("file-open", this.handleFile)
        )

        // Register event for each change
        this.registerCodeMirror( (cm: CodeMirror.Editor) => {
            cm.on("changes", this.codemirrorLineChanges);
        })

        // Check the active CodeMirror during load
        this.app.workspace.iterateCodeMirrors( (cm) => {
            this.check_lines(cm);
        })
    }

    codemirrorLineChanges = (cm: any, changes: any) => {
        changes.some( (change: any) => {
            this.check_line(cm, change.to.line);
        })
    }

    codemirrorScreenChange = (cm: CodeMirror.Editor) => {
        return this.check_lines(cm);
    }

    onunload(){
        this.app.workspace.iterateCodeMirrors( (cm) => {
            this.app.workspace.off("file-open", this.handleFile);
            cm.off("changes", this.codemirrorLineChanges);
            this.clearWidges(cm);
        });
        new Notice('Image in Editor Plugin is unloaded');
    }

    // Check Single Line
    check_line: any = (cm: CodeMirror.Editor, line_number: number) => {

        // Regex for [[ ]] format
        const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif).*\]\]/
            
        // Regex for ![ ]( ) format
        const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif)\)/

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
                filename = this.getFileNameAndAltText(1, match_1).fileName
                alt = this.getFileNameAndAltText(1, match_1).altText
            } else if(match_2){
                // Regex for ![#x-small](myimage.jpg) format
                filename = this.getFileNameAndAltText(2, match_2).fileName
                alt = this.getFileNameAndAltText(2, match_2).altText
            }
            
            // Create Image
            const img = document.createElement('img');

            // Prepare the src for the Image
            if(this.filename_is_a_link(filename)){
                img.src = filename;
            } else {
                // TODO: this.getActiveNoteFile() to be replaced: if 2-3 notes are open during load, only the active one loads images
                var image = this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), this.getActiveNoteFile().path);
                if(image != null) img.src =  this.app.vault.getResourcePath(image); 
                // NOTE: doesn't blink with : 'app://local/Users/ozan/Desktop/Debug/' + image.path
            }

            // Image Properties
            img.alt = alt;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            
            // Add Image widget under the Image Markdown
            cm.addLineWidget(line_number, img, {className: 'oz-image-widget'});            
        }
    }

    // Check All Lines Function
    check_lines: any = (cm: CodeMirror.Editor) => {
        // Last Used Line Number in Code Mirror
        var lastLine = cm.lastLine();
        for(let i=0; i <= lastLine; i++){
            this.check_line(cm, i);
        }        
    }

    // Http, Https Link Check
    filename_is_a_link = (filename: string) => filename.startsWith('http');

    // Getting Active Markdown File
    getActiveNoteFile() {
        return (this.app.workspace.activeLeaf.view as MarkdownView).file;
    }

    // Image Name and Alt Text
    getFileNameAndAltText(linkType: number, match: any){
        /* linkType 1: [[myimage.jpg|#x-small]]
           linkType2: ![#x-small](myimage.jpg) 
        returns { fileName: '', altText: '' }   */
        var file_name_regex;
        var alt_regex;

        if(linkType == 1){
            file_name_regex = /(?<=\[\[).*(jpe?g|png|gif)/;
            alt_regex = /(?<=\|).*(?=]])/;
        } else if(linkType == 2){
            file_name_regex = /(?<=\().*(jpe?g|png|gif)/;
            alt_regex = /(?<=\[)(^$|.*)(?=\])/;
        }

        var file_match = match[0].match(file_name_regex);
        var alt_match = match[0].match(alt_regex);

        return { fileName: file_match ? file_match[0] : '', 
                altText: alt_match ? alt_match[0] : '' }

    }

    // Remove Widgets in CodeMirror Editor
    clearWidges = (cm: CodeMirror.Editor) => {
        var lastLine = cm.lastLine();
        for(let i=0; i <= lastLine; i++){
            // Get the current Line
            const line = cm.lineInfo(i);
            // Clear the image widgets if exists
            if (line.widgets){
                for(const wid of line.widgets){
                    if (wid.className === 'oz-image-widget'){
                        wid.clear()
                    }
                }
            }
            
        }
    }

    // Get Active Editor
    getEditor = () => {
        return this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
    }

    // Handle file after file-open event
    handleFile = (file: TFile): void => {
        // If the file fired is a markdown file
        if(file.extension === 'md'){
            // Get the open CodeMirror to check the lines
            this.app.workspace.iterateCodeMirrors( (cm) => {
                // TODO: There is no Public API to read cm from Editor
                var editor = this.getEditor();
                if(editor.cm == cm){
                    this.check_lines(cm);
                }
            })
        }  
    }
}