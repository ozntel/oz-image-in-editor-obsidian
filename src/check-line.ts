import { normalizePath, TFile, Menu } from 'obsidian';
import OzanImagePlugin from './main';
import {
    WidgetHandler, LinkHandler, PDFHandler,
    ImageHandler, ObsidianHelpers, IframeHandler,
    ExcalidrawHandler
} from './utils';

// Check Single Line
export const check_line: any = async (cm: CodeMirror.Editor, line_number: number, targetFile: TFile, plugin: OzanImagePlugin, changedFilePath?: string) => {

    // Get the Line edited
    const line = cm.lineInfo(line_number);
    if (line === null) return;

    // Check if the line is an internet link
    const link_in_line = LinkHandler.get_link_in_line(line.text);
    const img_in_line = ImageHandler.get_image_in_line(line.text);

    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid: { className: string; }) => wid.className === 'oz-image-widget') : false;
    if (line_image_widget && !(img_in_line.result || link_in_line.result)) line_image_widget[0].clear();

    var sourcePath = '';

    /* ------------------ IFRAME RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderIframe) {

        // Check if the line is a Iframe
        const iframe_in_line = IframeHandler.get_iframe_in_line(line.text);

        // If Regex Matches
        if (iframe_in_line.result) {

            // Clear the Line Widgets
            WidgetHandler.clearLineWidgets(line);

            // Create Iframe Node
            var iframeNode = IframeHandler.create_iframe_node(iframe_in_line.result);

            // Add Widget in Line
            cm.addLineWidget(line_number, iframeNode, { className: 'oz-image-widget', showIfHidden: false })

            // End Rendering of the line
            return;
        }
    }

    /* ------------------ PDF RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderPDF) {

        // Check if the line is a  PDF 
        const pdf_in_line = PDFHandler.get_pdf_in_line(line.text);

        // If PDF Regex Matches
        if (pdf_in_line.result) {

            // Clear the Line Widgets
            WidgetHandler.clearLineWidgets(line);

            // Get Source Path
            if (targetFile != null) sourcePath = targetFile.path;

            // Get PDF File
            var pdf_name = PDFHandler.get_pdf_name(pdf_in_line.linkType, pdf_in_line.result);

            // Create URL for Link and Local PDF 
            var pdf_path = '';

            if (LinkHandler.path_is_a_link(pdf_name)) {
                pdf_path = pdf_name
            } else {
                // Get the PDF File Object
                var pdfFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(pdf_name), sourcePath);
                // Create Object URL
                var buffer = await plugin.app.vault.adapter.readBinary(normalizePath(pdfFile.path));
                var arr = new Uint8Array(buffer);
                var blob = new Blob([arr], { type: 'application/pdf' });
                pdf_path = URL.createObjectURL(blob);
                // Add Page Number
                var pdf_page_nr = PDFHandler.get_pdf_page_number(pdf_in_line.result)
                if (pdf_page_nr) pdf_path = pdf_path + pdf_page_nr
            }

            // Create the Widget
            var pdf_widget = document.createElement('embed');
            pdf_widget.src = pdf_path
            pdf_widget.type = 'application/pdf'
            pdf_widget.width = '500'
            pdf_widget.height = '650'

            // Add Widget in Line
            cm.addLineWidget(line_number, pdf_widget, { className: 'oz-image-widget', showIfHidden: false })

            // End Rendering of the line
            return
        }
    }

    /* ------------------ EXCALIDRAW & IMAGE RENDER ------------------ */

    // If any of regex matches, it will add image widget
    if (link_in_line.result || img_in_line.result) {

        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';

        if (link_in_line.result) {
            // linkType 3 and 4
            filename = ImageHandler.getFileNameAndAltText(link_in_line.linkType, link_in_line.result).fileName
            alt = ImageHandler.getFileNameAndAltText(link_in_line.linkType, link_in_line.result).altText
        } else if (img_in_line.result) {
            filename = ImageHandler.getFileNameAndAltText(img_in_line.linkType, img_in_line.result).fileName;
            alt = ImageHandler.getFileNameAndAltText(img_in_line.linkType, img_in_line.result).altText
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
                let activeNoteFile = ObsidianHelpers.getActiveNoteFile(plugin.app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }

            // Get Image File
            var imageFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if (!imageFile) return;

            // Additional Check for Changed Files - helps updating only for changed image
            if (changedFilePath && imageFile && changedFilePath !== imageFile.path) return;

            /* ------------------ EXCALIDRAW RENDER ------------------ */

            if (['md', 'excalidraw'].contains(imageFile.extension)) {

                // Do not render drawing if option turned off
                if (!plugin.settings.renderExcalidraw) return;

                // md, excalidraw file check to be rendered
                if (ExcalidrawHandler.pluginActive && ExcalidrawHandler.isDrawing(imageFile)) {

                    // The file is an excalidraw drawing
                    if (plugin.imagePromiseList.contains(imageFile.path)) return;
                    plugin.addToImagePromiseList(imageFile.path);

                    var image = await ExcalidrawHandler.createPNG(imageFile)

                    // Check if Object or Alt Changed
                    if (line.handle.widgets) {
                        var currentImageNode = line.handle.widgets[0].node;
                        var blobLink = currentImageNode.currentSrc;
                        var existingBlop = await ImageHandler.getBlobObject(blobLink);
                        if (existingBlop.size === image.size && currentImageNode.alt === alt) {
                            // Drawing hasn't changed
                            plugin.removeFromImagePromiseList(imageFile.path);
                            return;
                        }
                    }

                    // Generate New Link for new Drawing
                    img.src = URL.createObjectURL(image);
                    plugin.removeFromImagePromiseList(imageFile.path);

                } else {
                    return
                }

            }

            /* ------------------ ALL IMAGE RENDERS ------------------ */

            if (['jpeg', 'jpg', 'png', 'gif', 'svg', 'bmp'].contains(imageFile.extension)) {
                img.src = ObsidianHelpers.getPathOfImage(plugin.app.vault, imageFile);
                img.setAttr('data-path', imageFile.path);
            }

        }

        // Clear the image widgets if exists
        WidgetHandler.clearLineWidgets(line);

        // Image Properties
        var altSizer = ImageHandler.altWidthHeight(alt);
        if (altSizer) {
            img.width = altSizer.width;
            if (altSizer.height) img.height = altSizer.height;
        }

        img.alt = alt;

        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, { className: 'oz-image-widget', showIfHidden: false });
    }
}

// Check All Lines Function
export const check_lines: any = (cm: CodeMirror.Editor, from: number, to: number, plugin: OzanImagePlugin, changedFilePath?: string) => {
    // Last Used Line Number in Code Mirror
    var file = ObsidianHelpers.getFileCmBelongsTo(cm, plugin.app.workspace);
    for (let i = from; i <= to; i++) {
        check_line(cm, i, file, plugin, changedFilePath);
    }
}