import { normalizePath, TFile } from 'obsidian';
import OzanImagePlugin from '../main';
import * as PDFHandler from 'src/util/pdfHandler';
import * as ExcalidrawHandler from 'src/util/excalidrawHandler';
import * as ObsidianHelper from 'src/util/obsidianHelper';
import * as WidgetHandler from 'src/cm5/widgetHandler';
import * as LinkHandler from 'src/util/linkHandler';
import * as ImageHandler from 'src/util/imageHandler';
import * as IframeHandler from 'src/util/iframeHandler';
import * as TransclusionHandler from 'src/util/transclusionHandler';
import * as RichLinkHandler from '../util/richLink';
import Prism from 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers.min';
import 'prismjs/components/prism-python.min';
import 'prismjs/components/prism-typescript.min';
import 'prismjs/components/prism-jsx.min';
import 'prismjs/components/prism-tsx.min';
import 'prismjs/components/prism-bash.min';
import 'prismjs/components/prism-visual-basic.min';
import 'prismjs/components/prism-json.min';
import { PollUntil } from 'poll-until-promise';
import { getFileCmBelongsTo } from 'src/cm5/cm5Helper';

// Check Single Line
export const checkLine: any = async (cm: CodeMirror.Editor, lineNumber: number, targetFile: TFile, plugin: OzanImagePlugin, changedFilePath?: string) => {
    // Get the Line edited
    const line = cm.lineInfo(lineNumber);
    if (line === null) return;

    // Check if the line is an internet link
    const linkInLine = LinkHandler.getLinkInline(line.text);
    const imgInLine = ImageHandler.getImageInLine(line.text);

    // Clear the widget if link was removed
    var lineImageWidget = WidgetHandler.getWidgets(line, 'oz-image-widget');
    if (lineImageWidget && !(imgInLine.result || linkInLine.result)) lineImageWidget[0]?.clear();

    // --> Source Path for finding best File Match for Links
    var sourcePath = '';
    if (targetFile != null) {
        sourcePath = targetFile.path;
    } else {
        let activeNoteFile = ObsidianHelper.getActiveNoteFile(plugin.app.workspace);
        sourcePath = activeNoteFile ? activeNoteFile.path : '';
    }

    /* ------------------ IMAGE RENDER ------------------ */

    // If any of regex matches, it will add image widget
    if (plugin.settings.renderImages && (linkInLine.result || imgInLine.result)) {
        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';

        let resp = ImageHandler.getImageFileNameAndAltText(
            linkInLine.result ? linkInLine.linkType : imgInLine.linkType,
            linkInLine.result ? linkInLine.result : imgInLine.result
        );
        filename = resp.fileName;
        alt = resp.altText;

        // Create Image
        const img = document.createElement('img');

        // Prepare the src for the Image
        if (linkInLine.result) {
            // Local File URL Correction (Outside of Vault)
            if (filename.startsWith('file:///')) filename = filename.replace('file:///', 'app://local/');
            img.src = decodeURI(filename);
        } else {
            // Get Image File
            var imageFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if (!imageFile) return;

            // Additional Check for Changed Files - helps updating only for changed image
            if (changedFilePath && imageFile && changedFilePath !== imageFile.path) return;

            img.src = ObsidianHelper.getPathOfImage(plugin.app.vault, imageFile);
            img.setAttr('data-path', imageFile.path);
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
        cm.addLineWidget(lineNumber, img, { className: 'oz-image-widget', showIfHidden: false });

        return;
    }

    /* ------------------ EXCALIDRAW RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderExcalidraw) {
        if (ExcalidrawHandler.lineMightHaveExcalidraw(line.text)) {
            let lineFile = ExcalidrawHandler.getFile(line.text, sourcePath, plugin);

            if (lineFile && ExcalidrawHandler.excalidrawPluginIsLoaded(plugin.app) && ExcalidrawHandler.isAnExcalidrawFile(lineFile)) {
                // The file is an excalidraw drawing
                if (plugin.imagePromiseList.contains(lineFile.path)) return;
                plugin.addToImagePromiseList(lineFile.path);
                let excalidrawImage = await ExcalidrawHandler.createPNGFromExcalidrawFile(lineFile);

                // Check if Object or Alt Changed
                if (line.handle.widgets) {
                    var currentImageNode = line.handle.widgets[0].node;
                    var blobLink = currentImageNode.currentSrc;
                    var existingBlop = await ImageHandler.getBlobObject(blobLink);

                    if (existingBlop.size === excalidrawImage.size && currentImageNode.alt === alt) {
                        // Drawing hasn't changed
                        plugin.removeFromImagePromiseList(lineFile.path);
                        return;
                    }
                }

                // Create an image element
                let img = document.createElement('img');

                // Image Properties
                img.src = URL.createObjectURL(excalidrawImage);
                let altText = ExcalidrawHandler.getAltText(line.text);
                var altSizer = ImageHandler.altWidthHeight(altText);
                if (altSizer) {
                    img.width = altSizer.width;
                    if (altSizer.height) img.height = altSizer.height;
                }
                img.alt = altText;
                img.setAttr('data-path', excalidrawImage.path);

                // Add Image widget under the Image Markdown
                cm.addLineWidget(lineNumber, img, { className: 'oz-image-widget', showIfHidden: false });
                plugin.removeFromImagePromiseList(lineFile.path);
                return;
            }
        }
    }

    /* ------------------ IFRAME RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderIframe) {
        // Check if the line is a Iframe
        const iframeInLine = IframeHandler.getIframeInLine(line.text);

        // If Regex Matches
        if (iframeInLine.result) {
            // Clear the Line Widgets
            WidgetHandler.clearLineWidgets(line);

            // Create Iframe Node
            var iframeNode = IframeHandler.createIframeNode(iframeInLine.result);

            // Add Widget in Line
            cm.addLineWidget(lineNumber, iframeNode, { className: 'oz-image-widget', showIfHidden: false });

            // End Rendering of the line
            return;
        }
    }

    /* ------------------ PDF RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderPDF) {
        // Check if the line is a  PDF
        const pdfInLine = PDFHandler.getPdfInLine(line.text);

        // If PDF Regex Matches
        if (pdfInLine.result) {
            // Clear the Line Widgets
            WidgetHandler.clearLineWidgets(line);

            // Get Source Path
            if (targetFile != null) sourcePath = targetFile.path;

            // Get PDF File
            var pdfName = PDFHandler.getPdfName(pdfInLine.linkType, pdfInLine.result);

            // Create URL for Link and Local PDF
            var pdfPath = '';

            if (LinkHandler.pathIsALink(pdfName)) {
                pdfPath = pdfName;
            } else {
                // Get the PDF File Object
                var pdfFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(pdfName), sourcePath);
                // Create Object URL
                var buffer = await plugin.app.vault.adapter.readBinary(normalizePath(pdfFile.path));
                var arr = new Uint8Array(buffer);
                var blob = new Blob([arr], { type: 'application/pdf' });
                pdfPath = URL.createObjectURL(blob);
                // Add Page Number
                var pdfPageNr = PDFHandler.getPdfPageNumber(pdfInLine.result);
                if (pdfPageNr) pdfPath = pdfPath + pdfPageNr;
            }

            // Create the Widget
            var pdfWidget = document.createElement('embed');
            pdfWidget.src = pdfPath;
            pdfWidget.type = 'application/pdf';
            pdfWidget.width = '100%';
            pdfWidget.height = '800px';

            // Add Widget in Line
            cm.addLineWidget(lineNumber, pdfWidget, { className: 'oz-image-widget', showIfHidden: false });

            // End Rendering of the line
            return;
        }
    }

    /* ------------------ TRANSCLUSION RENDER  ------------------ */

    if (plugin.settings && plugin.settings.renderTransclusion) {
        let lineIsTransclusion = TransclusionHandler.lineIsTransclusion(line.text);
        // Clear if there is a widget but reference is removed
        var lineTransclusionWidgets = WidgetHandler.getWidgets(line, 'oz-transclusion-widget');
        if (lineTransclusionWidgets && !lineIsTransclusion) {
            WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
        }

        if (lineIsTransclusion) {
            // Get the referenced file and return if doesn't exist
            let file = TransclusionHandler.getFile(line.text, plugin.app, sourcePath);
            if (!file) {
                if (lineTransclusionWidgets) WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
            }

            if (file && file.path.endsWith('.md')) {
                // If a file changed, do not render the line again
                if (changedFilePath !== undefined) return;

                // Get the file and text cache
                let cache = plugin.app.metadataCache.getCache(file.path);
                let cachedReadOfTarget = await plugin.app.vault.cachedRead(file);
                WidgetHandler.clearLineWidgets(line);

                // --> Handle #^ Block Id
                if (TransclusionHandler.lineIsWithBlockId(line.text)) {
                    const blockId = TransclusionHandler.getBlockId(line.text);
                    // --> Wait for Block Id Creation by Obsidian
                    let pollUntil = new PollUntil();
                    pollUntil
                        .stopAfter(5 * 1000)
                        .tryEvery(1000)
                        .execute(() => {
                            return new Promise((resolve, reject) => {
                                cache = plugin.app.metadataCache.getCache(file.path);
                                if (cache.blocks && cache.blocks[blockId]) {
                                    const block = cache.blocks[blockId];
                                    if (block) {
                                        let htmlElement = TransclusionHandler.renderBlockCache(block, cachedReadOfTarget);
                                        TransclusionHandler.clearHTML(htmlElement, plugin);
                                        if (lineTransclusionWidgets) WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
                                        cm.addLineWidget(lineNumber, htmlElement, {
                                            className: 'oz-transclusion-widget oz-block-id-transclusion',
                                            showIfHidden: false,
                                        });
                                        Prism.highlightAll();
                                    }
                                    return resolve(true);
                                }
                                reject(false);
                            });
                        })
                        .then((value: any) => {})
                        .catch((err: any) => {});
                }

                // --> Render # Header Block
                else if (TransclusionHandler.lineIsWithHeading(line.text)) {
                    const header = TransclusionHandler.getHeader(line.text);
                    const blockHeading = cache.headings?.find(
                        (h) => ObsidianHelper.clearSpecialCharacters(h.heading) === ObsidianHelper.clearSpecialCharacters(header)
                    );
                    if (blockHeading) {
                        // --> Start Num
                        let startNum = blockHeading.position.start.offset;
                        // --> End Num
                        const blockHeadingIndex = cache.headings.indexOf(blockHeading);
                        let endNum = cachedReadOfTarget.length;
                        for (let h of cache.headings.slice(blockHeadingIndex + 1)) {
                            if (h.level <= blockHeading.level) {
                                endNum = h.position.start.offset;
                                break;
                            }
                        }
                        // --> Get HTML Render and add as Widget
                        let htmlElement = TransclusionHandler.renderHeader(startNum, endNum, cachedReadOfTarget);
                        TransclusionHandler.clearHTML(htmlElement, plugin);
                        if (lineTransclusionWidgets) WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
                        cm.addLineWidget(lineNumber, htmlElement, {
                            className: 'oz-transclusion-widget oz-heading-transclusion',
                            showIfHidden: false,
                        });
                        Prism.highlightAll();
                    }
                }

                // --> Render Whole File Transclusion
                else if (TransclusionHandler.lineIsFileTransclusion(line.text)) {
                    if (cachedReadOfTarget !== '') {
                        let fileEl = document.createElement('div');
                        fileEl.innerHTML = TransclusionHandler.convertMdToHtml(cachedReadOfTarget);
                        TransclusionHandler.clearHTML(fileEl, plugin);
                        if (lineTransclusionWidgets) WidgetHandler.clearWidgetsWithClass(['oz-transclusion-widget'], line);
                        cm.addLineWidget(lineNumber, fileEl, {
                            className: 'oz-transclusion-widget oz-file-transclusion',
                            showIfHidden: false,
                        });
                        Prism.highlightAll();
                    }
                }

                return;
            }
        }
    }

    /* ------------------ RICH LINK RENDER  ------------------ */

    if (plugin.settings.renderRichLink) {
        let links = RichLinkHandler.getLinksInLine(line.text);
        let richlinkWidgets = WidgetHandler.getWidgets(line, 'oz-richlink-widget');

        // Clear widgets if references are removed
        if (richlinkWidgets && links.length === 0) {
            WidgetHandler.clearWidgetsWithClass(['oz-richlink-widget'], line);
        }

        if (links.length > 0) {
            WidgetHandler.clearWidgetsWithClass(['oz-richlink-widget'], line);
            let htmlEl = await RichLinkHandler.createRichLinkElement(links[0].link);
            if (htmlEl) {
                cm.addLineWidget(lineNumber, htmlEl, { className: 'oz-richlink-widget' });
                return;
            }
        }
    }

    /* ------------------ RENDER END  ------------------ */
};

// Check All Lines Function
export const checkLines: any = (cm: CodeMirror.Editor, from: number, to: number, plugin: OzanImagePlugin, changedFilePath?: string) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, plugin.app.workspace);
    for (let i = from; i <= to; i++) {
        checkLine(cm, i, file, plugin, changedFilePath);
    }
};
