import { RangeSetBuilder } from '@codemirror/rangeset';
import { EditorState, Extension, StateField, Text, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { ImageDecoration, PDFDecoration, CustomHTMLDecoration } from 'src/cm6/widget';
import { detectLink } from 'src/cm6/linkDetector';
import OzanImagePlugin from 'src/main';
import * as ObsidianHelpers from 'src/util/obsidianHelper';
import { editorViewField, TFile } from 'obsidian';
import * as CM6Helpers from 'src/cm6/cm6Helper';

export const images = (params: { plugin: OzanImagePlugin }): Extension => {
    const { plugin } = params;

    const decorate = (params: { state: EditorState; newDoc: Text }) => {
        const { newDoc, state } = params;

        let rangeBuilder = new RangeSetBuilder<Decoration>();

        // --> Get Source File
        const mdView = state.field(editorViewField);
        const sourceFile: TFile = mdView.file;

        // --> Check Lines Having Links or HTML Elements
        let lineNrs = CM6Helpers.getLinesToCheckForRender(state, newDoc);

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
                    let imagePath = ObsidianHelpers.getPathOfImage(plugin.app.vault, linkResult.file);
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

    const imagesField = StateField.define<DecorationSet>({
        create: (state: EditorState) => {
            if (!ObsidianHelpers.livePreviewActive(plugin.app)) {
                return decorate({ state, newDoc: state.doc });
            } else {
                return Decoration.none;
            }
        },

        update: (effects: DecorationSet, transaction: Transaction) => {
            if (transaction.docChanged && !ObsidianHelpers.livePreviewActive(plugin.app)) {
                return decorate({ state: transaction.state, newDoc: transaction.newDoc });
            }
            return effects.map(transaction.changes);
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField];
};
