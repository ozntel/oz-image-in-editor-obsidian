import { RangeSetBuilder } from '@codemirror/rangeset';
import { EditorState, Extension, StateField, Text, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { ImageWidget, ImageWidgetParams, PDFWidget, PDFWidgetParams, CustomHTMLWidget, CustomHTMLWidgetParams } from 'src/cm6/widget';
import { detectLink } from 'src/cm6/linkDetector';
import OzanImagePlugin from 'src/main';
import { getPathOfImage } from 'src/util/obsidianHelper';
import { editorViewField, TFile } from 'obsidian';
import { syntaxTree } from '@codemirror/language';
import { tokenClassNodeProp } from '@codemirror/stream-parser';

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

    const getLinesToCheckForRender = (state: EditorState, newDoc: Text): number[] => {
        const lines: number[] = [];

        if (newDoc.length > 0) {
            syntaxTree(state).iterate({
                from: 1,
                to: newDoc.length,
                enter: (type, from, to) => {
                    const typeProps = type.prop(tokenClassNodeProp);
                    if (typeProps) {
                        const props = new Set(typeProps.split(' '));
                        const isUrl = props.has('url');
                        const isInternalLink = props.has('hmd-internal-link');
                        const isHtmlElement = props.has('hmd-html-begin') || props.has('hmd-html-end');
                        const lineNumber = newDoc.lineAt(from).number;
                        if ((isUrl || isInternalLink || isHtmlElement) && !lines.contains(lineNumber)) {
                            lines.push(lineNumber);
                        }
                    }
                },
            });
        }

        return lines;
    };

    const decorate = (params: { state: EditorState; newDoc: Text }) => {
        const { newDoc, state } = params;

        let rangeBuilder = new RangeSetBuilder<Decoration>();

        // --> Get Source File
        const mdView = state.field(editorViewField);
        const sourceFile: TFile = mdView.file;

        // --> Check Lines Having Links or HTML Elements
        let lineNrs = getLinesToCheckForRender(state, newDoc);

        // --> Loop Through Lines Found
        if (lineNrs.length > 0) {
            for (const lineNr of lineNrs) {
                const line = newDoc.line(lineNr);

                // --> Look at Link Result
                const linkResult = detectLink({ lineText: line.text, plugin: plugin, sourceFile: sourceFile });

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
                    let imagePath = getPathOfImage(plugin.app.vault, linkResult.file);
                    rangeBuilder.add(line.to, line.to, ImageDecoration({ url: imagePath, altText: linkResult.altText, filePath: linkResult.file.path }));
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

    const livePreviewActive = (): boolean => {
        return (plugin.app.vault as any).config?.livePreview;
    };

    const imagesField = StateField.define<DecorationSet>({
        create: (state: EditorState) => {
            if (!livePreviewActive()) {
                return decorate({ state: state, newDoc: state.doc });
            } else {
                return Decoration.none;
            }
        },

        update: (effects: DecorationSet, transaction: Transaction) => {
            if (transaction.docChanged && !livePreviewActive()) {
                return decorate({ state: transaction.state, newDoc: transaction.newDoc });
            }
            return effects.map(transaction.changes);
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField];
};
