import { RangeSetBuilder } from '@codemirror/rangeset';
import { EditorState, Extension, StateField, Text, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { ImageWidget, ImageWidgetParams, PDFWidget, PDFWidgetParams, CustomHTMLWidget, CustomHTMLWidgetParams } from 'src/cm6/widget';
import { detectLink } from 'src/cm6/linkDetector';
import OzanImagePlugin from 'src/main';
import { getPathOfImage } from 'src/util/obsidianHelper';

export const images = (params: { plugin: OzanImagePlugin }): Extension => {
    const { plugin } = params;

    const ImageDecoration = (imageWidgetParams: ImageWidgetParams) =>
        Decoration.replace({
            widget: new ImageWidget(imageWidgetParams),
            inclusive: false,
        });

    const PDFDecoration = (pdfWidgetParams: PDFWidgetParams) =>
        Decoration.replace({
            widget: new PDFWidget(pdfWidgetParams),
            inclusive: false,
        });

    const CustomHTMLDecoration = (customHtmlWidgetParams: CustomHTMLWidgetParams) =>
        Decoration.replace({
            widget: new CustomHTMLWidget(customHtmlWidgetParams),
            inclusive: false,
        });

    const decorate = (params: { state: EditorState; newDoc: Text }) => {
        const { newDoc } = params;

        let rangeBuilder = new RangeSetBuilder<Decoration>();

        // Check lenght of new document if bigger than 0 since 'newDoc.lines' always returns 1 or more and it will cause a search for not existing line
        if (newDoc.length > 0) {
            for (let i = 1; i < newDoc.lines + 1; i++) {
                const line = newDoc.line(i);
                const linkResult = detectLink({ lineText: line.text, plugin: plugin });

                // --> External Link Render
                if (linkResult && linkResult.type === 'external-image') {
                    rangeBuilder.add(
                        line.to,
                        line.to,
                        ImageDecoration({ url: linkResult.linkText, altText: linkResult.altText, filePath: linkResult.linkText })
                    );
                }

                // --> Vault Image Render
                else if (linkResult && linkResult.type === 'vault-image') {
                    let file = plugin.app.metadataCache.getFirstLinkpathDest(linkResult.linkText, ''); // @todo - Is there a way to get back to the source file from EditorView?
                    if (file) {
                        let imagePath = getPathOfImage(plugin.app.vault, file);
                        rangeBuilder.add(line.to, line.to, ImageDecoration({ url: imagePath, altText: linkResult.altText, filePath: file.path }));
                    }
                }

                // --> External PDF Link Render
                else if (linkResult && linkResult.type === 'pdf-link') {
                    rangeBuilder.add(
                        line.to,
                        line.to,
                        PDFDecoration({ url: linkResult.linkText + linkResult.blockRef, filePath: linkResult.linkText + linkResult.blockRef })
                    );
                }

                // --> Iframe Render
                else if (linkResult && linkResult.type === 'iframe') {
                    rangeBuilder.add(line.to, line.to, CustomHTMLDecoration({ htmlText: linkResult.match }));
                }
            }
        }

        return rangeBuilder.finish();
    };

    const imagesField = StateField.define<DecorationSet>({
        create: (state: EditorState) => {
            return decorate({ state: state, newDoc: state.doc });
        },

        update: (effects: DecorationSet, transaction: Transaction) => {
            if (transaction.docChanged) return decorate({ state: transaction.state, newDoc: transaction.newDoc });
            return effects.map(transaction.changes);
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField];
};
