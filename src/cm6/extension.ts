import { editorEditorField } from 'obsidian';
import { Range, RangeSet, RangeSetBuilder } from '@codemirror/rangeset';
import { EditorState, Extension, StateField, Text, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { ImageWidget, ImageWidgetParams } from 'src/cm6/widget';
import { detectLink } from 'src/cm6/linkDetector';
import OzanImagePlugin from 'src/main';
import { getPathOfImage } from 'src/util/obsidianHelper';

export const images = (props: { plugin: OzanImagePlugin }): Extension => {
    const { plugin } = props;

    const imageDecoration = (imageWidgetParams: ImageWidgetParams) =>
        Decoration.widget({
            widget: new ImageWidget(imageWidgetParams),
            side: 0,
            block: true,
        });

    const decorate = (state: EditorState, newDoc: Text) => {
        let rangeBuilder = new RangeSetBuilder<Decoration>();

        // Check lenght of new document if bigger than 0 since 'newDoc.lines' always returns 1 or more and it will cause a search for not existing line
        if (newDoc.length > 0) {
            for (let i = 1; i < newDoc.lines + 1; i++) {
                const line = newDoc.line(i);
                const linkResult = detectLink(line.text);

                let url: string = null;
                let altText: string = null;

                if (linkResult && ['external-mdlink', 'external-wikilink'].contains(linkResult.type)) {
                    url = linkResult.linkText;
                    altText = linkResult.altText;
                } else if (linkResult && ['vault-image-md', 'vault-image-wiki'].contains(linkResult.type)) {
                    let file = plugin.app.metadataCache.getFirstLinkpathDest(linkResult.linkText, ''); // Q: Is there a way to get back to the source file from EditorView?
                    if (file) {
                        let imagePath = getPathOfImage(plugin.app.vault, file);
                        url = imagePath;
                        altText = linkResult.altText;
                    }
                }

                if (url !== null && altText !== null) {
                    let imageWidget = imageDecoration({ url, altText });
                    rangeBuilder.add(line.from, line.from, imageWidget);
                }
            }
        }

        return rangeBuilder.finish();
    };

    const imagesField = StateField.define<DecorationSet>({
        create(state: EditorState) {
            return decorate(state, state.doc);
        },

        update(effects: DecorationSet, transaction: Transaction) {
            transaction.newDoc;
            if (transaction.docChanged) return decorate(transaction.state, transaction.newDoc);
            return effects.map(transaction.changes);
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField];
};
