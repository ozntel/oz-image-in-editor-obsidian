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

    const getDecorationsForLines = (params: { lineNrs: number[]; state: EditorState; newDoc: Text }) => {
        const { newDoc, state, lineNrs } = params;

        let rangeBuilder = new RangeSetBuilder<Decoration>();

        // --> Get Source File
        const mdView = state.field(editorViewField);
        const sourceFile: TFile = mdView.file;

        // --> Loop Through Lines Found
        if (lineNrs.length > 0) {
            for (const lineNr of lineNrs) {
                const line = newDoc.line(lineNr);
                let newDeco: Decoration = null;

                // --> Look at Link Result
                const linkResult = detectLink({ lineText: line.text, plugin: plugin, sourceFile: sourceFile });

                // --> External Link Render
                if (linkResult && linkResult.type === 'external-image') {
                    newDeco = ImageDecoration({ url: linkResult.linkText, altText: linkResult.altText, filePath: linkResult.linkText });
                }

                // --> Vault Image Render
                else if (linkResult && linkResult.type === 'vault-image') {
                    let imagePath = ObsidianHelpers.getPathOfImage(plugin.app.vault, linkResult.file);
                    newDeco = ImageDecoration({ url: imagePath, altText: linkResult.altText, filePath: linkResult.file.path });
                }

                // --> External PDF Link Render
                else if (linkResult && linkResult.type === 'pdf-link') {
                    newDeco = PDFDecoration({ url: linkResult.linkText + linkResult.blockRef, filePath: linkResult.linkText + linkResult.blockRef });
                }

                // --> Iframe Render
                else if (linkResult && linkResult.type === 'iframe') {
                    newDeco = CustomHTMLDecoration({ htmlText: linkResult.match });
                }

                if (newDeco !== null) rangeBuilder.add(line.to, line.to, newDeco);
            }
        }

        return rangeBuilder.finish();
    };

    const imagesField = StateField.define<DecorationSet>({
        create: (state: EditorState) => {
            if (!ObsidianHelpers.livePreviewActive(plugin.app)) {
                let lineNrs = CM6Helpers.getLinesToCheckForRender(state, state.doc);
                return getDecorationsForLines({ lineNrs, state, newDoc: state.doc });
            } else {
                return Decoration.none;
            }
        },

        update: (effects: DecorationSet, transaction: Transaction) => {
            if (transaction.docChanged && !ObsidianHelpers.livePreviewActive(plugin.app)) {
                const state = transaction.state;
                const newDoc = transaction.newDoc;
                let lineNrs = CM6Helpers.getLinesToCheckForRender(state, newDoc);
                return getDecorationsForLines({ lineNrs, state, newDoc });
            }
            return effects.map(transaction.changes);
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField];
};
