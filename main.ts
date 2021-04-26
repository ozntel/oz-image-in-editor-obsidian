import { Plugin, Notice, debounce } from 'obsidian';

export default class OzanImagePlugin extends Plugin{

    async onload(){
        // Register Code Mirror
        this.registerCodeMirror( (cm: CodeMirror.Editor) => {

            // Check Lines during initial Load
            this.check_lines(cm);
            
            // Check Lines after each change
            cm.on("change", () => debounce(this.check_lines(cm), 1000, false));

        })
    }

    onunload(){
        new Notice('Ozan\'s Image in Editor Plugin  is unloaded');
    }

    check_lines: any = (cm: CodeMirror.Editor) => {
        // Attachment Path
        let files = this.app.vault.getFiles();

        // Regex for [[ ]] format
        const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif)\]\]/
    
        // Regex for ![ ]( ) format
        const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif)\)/
    
        // Last Used Line Number in Code Mirror
        var lastLine = cm.lastLine();

        for(let i=0; i <= lastLine; i++){

            // Get the current Line
            const line = cm.lineInfo(i);

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
                    // Regex for [[ ]] format
                    var lastChar = match_1[0].length - 2;
                    filename = match_1[0].substring(3, lastChar);
                    var first_char = this.getFirstIndexOfImageFileName(filename);
                    filename = filename.substring(first_char);
                    alt = 'image';
                } else if(match_2){
                    // Regex for ![ ]( ) format
                    var file_name_regex = /(?<=\().*(jpe?g|png|gif)/;
                    var alt_regex = /(?<=\[)(^$|.*)(?=\])/
                    filename = match_2[0].match(file_name_regex)[0];
                    var first_char = this.getFirstIndexOfImageFileName(filename);
                    filename = filename.substring(first_char);
                    alt = match_2[0].match(alt_regex)[0];
                }

                // Create Image
                const img = document.createElement('img');

                // Prepare the src for the Image
                if(this.filename_is_a_link(filename)){
                    img.src = filename;
                } else {
                    let images = files.filter( file => file.path.contains(decodeURIComponent(filename)));
                    if(images) img.src = this.app.vault.getResourcePath(images[0]);
                }

                 // Image Properties
                 img.alt = alt;
                 img.style.maxWidth = '100%';
                 img.style.height = 'auto';
                 
                 // Add Image widget under the Image Markdown
                 cm.addLineWidget(i, img, {className: 'oz-image-widget'});
            }
        }        
    }

    // Http, Https Link Check
    filename_is_a_link = (filename: string) => filename.startsWith('http');

    // Index of first char of original image name 
    getFirstIndexOfImageFileName = (filename: string) => {
        if(this.filename_is_a_link(filename)){
            return 0;
        }
        if(filename.includes('\\')){
            return filename.lastIndexOf('\\') + 1;
        }
        if(filename.includes('/')){
            return filename.lastIndexOf('/') + 1;
        }
        return 0;
    }
}