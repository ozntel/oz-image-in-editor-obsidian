import { App, TFile } from 'obsidian';
import {
    getFileNameAndAltText, get_link_in_line, get_image_in_line,
    getActiveNoteFile, getPathOfImage, getFileCmBelongsTo,
    clearLineWidgets
} from './utils';

// Check Single Line
export const check_line: any = (cm: CodeMirror.Editor, line_number: number, targetFile: TFile, app: App) => {

    // Get the Line edited
    const line = cm.lineInfo(line_number);
    if (line === null) return;

    // Check if the line is an internet link
    const link_in_line = get_link_in_line(line.text);
    const img_in_line = get_image_in_line(line.text);

    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid: { className: string; }) => wid.className === 'oz-image-widget') : false;
    if (line_image_widget && !(img_in_line.result || link_in_line.result)) line_image_widget[0].clear();

    // If any of regex matches, it will add image widget
    if (link_in_line.result || img_in_line.result) {

        // Clear the image widgets if exists
        clearLineWidgets(line);

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

        // Prepare the src for the Image
        if (link_in_line.result) {
            img.src = filename;
        } else {
            // Source Path
            var sourcePath = '';
            if (targetFile != null) {
                sourcePath = targetFile.path;
            } else {
                let activeNoteFile = getActiveNoteFile(app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }
            var image = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if (image != null) img.src = getPathOfImage(app.vault, image)
        }
        // Image Properties
        img.alt = alt;

        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, { className: 'oz-image-widget' });
    }
}

// Check All Lines Function
export const check_lines: any = (cm: CodeMirror.Editor, from: number, to: number, app: App) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, app.workspace);
    for (let i = from; i <= to; i++) {
        check_line(cm, i, file, app);
    }
}