import { EditorState, Extension, StateEffect, StateField, Text, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import OzanImagePlugin from 'src/main';
import * as ObsidianHelpers from 'src/util/obsidianHelper';
import { editorEditorField } from 'obsidian';
import * as CM6Helpers from 'src/cm6/cm6Helper';
import { getDecorationsForLines } from 'src/cm6/decorations';

const images = (params: { plugin: OzanImagePlugin }): Extension => {
    const { plugin } = params;

    // --> State Effects for Plugin
    interface OperationStarted {
        view?: EditorView;
        state?: EditorState;
        newDoc: Text;
    }

    const operationStarted = StateEffect.define<OperationStarted>();
    const operationEnded = StateEffect.define<DecorationSet>();

    // --> Manual StateEffect Handler
    const runOperation = EditorState.transactionExtender.of((transaction: Transaction) => {
        const editorView = transaction.startState.field(editorEditorField);

        transaction.effects
            //  Filter Only the Transaction with Manual Operation Started Effect
            .filter((effect) => effect.is(operationStarted))
            //  Get Decorations for the Editor and Return to Operation End Effect
            .map(async (effect) => {
                let view = effect.value.view;
                let newDoc = effect.value.newDoc;
                let state = effect.value.state;
                // --> During initial load view has a problem with bringing the state
                // updates should use state from view due to async functions
                let lineNrs = CM6Helpers.getLinesToCheckForRender(state ? state : view.state, newDoc);
                if (lineNrs.length > 0) {
                    const decorationSet = await getDecorationsForLines({ view, newDoc, lineNrs, plugin });
                    editorView.dispatch({ effects: [operationEnded.of(decorationSet)] });
                }
            });

        return null;
    });

    const imagesField = StateField.define<DecorationSet>({
        create: (state: EditorState) => {
            if (!ObsidianHelpers.livePreviewActive(plugin.app)) {
                const view = state.field(editorEditorField);
                view.dispatch({ effects: [operationStarted.of({ view, state, newDoc: state.doc })] });
            }
            return Decoration.none;
        },

        update: (decorations: DecorationSet, transaction: Transaction) => {
            if (!ObsidianHelpers.livePreviewActive(plugin.app)) {
                let isNewTransaction = true;

                // --> Loop Effects
                for (const effect of transaction.effects) {
                    if (effect.is(operationStarted)) {
                        isNewTransaction = false;
                    } else if (effect.is(operationEnded)) {
                        isNewTransaction = false;
                        decorations = effect.value.map(transaction.changes);
                    }
                }

                // --> If it is a new transaction, trigger decoration update
                if (isNewTransaction && transaction.docChanged) {
                    const view = transaction.state.field(editorEditorField);
                    const newDoc = transaction.newDoc;
                    view.dispatch({ effects: [operationStarted.of({ view, newDoc })] });
                }
            }

            return decorations;
        },

        provide: (field: any) => EditorView.decorations.from(field),
    });

    return [imagesField, runOperation];
};

// --> Export Build Extension
export const buildExtension = (params: { plugin: OzanImagePlugin }) => {
    const { plugin } = params;
    return [images({ plugin })];
};
