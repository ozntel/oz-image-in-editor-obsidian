import { App, normalizePath, TFile } from 'obsidian';
import {
    getFileNameAndAltText, get_link_in_line, get_image_in_line,
    getActiveNoteFile, getPathOfImage, getFileCmBelongsTo,
    clearLineWidgets, get_pdf_in_line, get_pdf_name, path_is_a_link,
    altWidthHeight
} from './utils';

// Check Single Line
export const check_line: any = async (cm: CodeMirror.Editor, line_number: number, targetFile: TFile, app: App, settings: any) => {

    // Get the Line edited
    const line = cm.lineInfo(line_number);
    if (line === null) return;

    // Check if the line is an internet link
    const link_in_line = get_link_in_line(line.text);
    const img_in_line = get_image_in_line(line.text);

    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid: { className: string; }) => wid.className === 'oz-image-widget') : false;
    if (line_image_widget && !(img_in_line.result || link_in_line.result)) line_image_widget[0].clear();

    var sourcePath = '';

    // Render PDF if it is turned on
    if (settings && settings.renderPDF) {

        // Check if the line is a  PDF 
        const pdf_in_line = get_pdf_in_line(line.text);

        // If PDF Regex Matches
        if (pdf_in_line.result) {

            // Clear the Line Widgets
            clearLineWidgets(line);

            // Get Source Path
            if (targetFile != null) sourcePath = targetFile.path;

            // Get PDF File
            var pdf_name = get_pdf_name(pdf_in_line.linkType, pdf_in_line.result);

            // Create URL for Link and Local PDF 
            var pdf_path = '';

            if (path_is_a_link(pdf_name)) {
                pdf_path = pdf_name
            } else {
                // Get the PDF File Object
                var pdfFile = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(pdf_name), sourcePath);
                // Create Object URL
                var buffer = await app.vault.adapter.readBinary(normalizePath(pdfFile.path));
                var arr = new Uint8Array(buffer);
                var blob = new Blob([arr], { type: 'application/pdf' });
                pdf_path = URL.createObjectURL(blob);
            }

            // Create the Widget
            var pdf_widget = document.createElement('embed');
            pdf_widget.src = pdf_path
            pdf_widget.type = 'application/pdf'
            pdf_widget.width = '500'
            pdf_widget.height = '650'

            // Add Widget in Line
            cm.addLineWidget(line_number, pdf_widget, { className: 'oz-image-widget' })

            // End Rendering of the line
            return
        }
    }

    // If any of regex matches, it will add image widget
    if (link_in_line.result || img_in_line.result) {

        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';

        if (link_in_line.result) {
            // linkType 3 and 4
            filename = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).fileName
            alt = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).altText
        } else if (img_in_line.result) {
            filename = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).fileName;
            alt = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).altText
        }

        // Create Image
        const img = document.createElement('img');

        var image = null;

        // Prepare the src for the Image
        if (link_in_line.result) {
            img.src = filename;
        } else {
            // Source Path
            if (targetFile != null) {
                sourcePath = targetFile.path;
            } else {
                let activeNoteFile = getActiveNoteFile(app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }

            if (filename.endsWith('excalidraw')) {
                // The file is an excalidraw drawing
                // @ts-ignore
                if (app.plugins.getPlugin('obsidian-excalidraw-plugin')) {
                    var excalidrawFile = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
                    if (excalidrawFile == null) return;
                    var mtimeAlt = excalidrawFile.stat.mtime + '-' + alt;
                    var loadedDrawing = document.querySelector(`[mtimeAlt='${mtimeAlt}']`);
                    if (loadedDrawing == null) {
                        // @ts-ignore
                        ExcalidrawAutomate.reset();
                        // @ts-ignore
                        image = await ExcalidrawAutomate.createPNG(excalidrawFile.path);
                        img.src = URL.createObjectURL(image);
                        img.setAttr("mtimeAlt", mtimeAlt);
                    } else {
                        return
                    }
                }
            } else {
                // The file is an image
                image = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
                if (image != null) img.src = getPathOfImage(app.vault, image)
            }
        }

        // Clear the image widgets if exists
        clearLineWidgets(line);

        // Image Properties
        var altSizer = altWidthHeight(alt);
        console.log(altSizer);
        if (altSizer) {
            img.width = altSizer.width;
            if (altSizer.height) img.height = altSizer.height;
        }

        img.alt = alt;

        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, { className: 'oz-image-widget' });
    }
}

// Check All Lines Function
export const check_lines: any = (cm: CodeMirror.Editor, from: number, to: number, app: App, settings: any) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, app.workspace);
    for (let i = from; i <= to; i++) {
        check_line(cm, i, file, app, settings);
    }
}