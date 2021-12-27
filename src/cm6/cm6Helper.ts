import { syntaxTree } from '@codemirror/language';
import { EditorState, Text } from '@codemirror/state';
import { tokenClassNodeProp } from '@codemirror/stream-parser';

export const getLinesToCheckForRender = (state: EditorState, newDoc: Text): number[] => {
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
