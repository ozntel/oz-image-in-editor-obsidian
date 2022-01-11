import { StateEffect, StateEffectType, StateField } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';

// --> State Field, which is responsible for updating the decorations in the View
function defineStatefulDecoration(): { update: StateEffectType<DecorationSet>; field: StateField<DecorationSet> } {
    const update = StateEffect.define<DecorationSet>();

    const field = StateField.define<DecorationSet>({
        create(): DecorationSet {
            return Decoration.none;
        },

        update(deco, tr): DecorationSet {
            return tr.effects.reduce((deco, effect) => (effect.is(update) ? effect.value : deco), deco);
        },

        provide: (field) => EditorView.decorations.from(field),
    });

    return { update, field };
}

export const statefulDecorations = defineStatefulDecoration();
