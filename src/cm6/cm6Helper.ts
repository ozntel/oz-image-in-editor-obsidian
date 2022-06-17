import { syntaxTree, tokenClassNodeProp } from '@codemirror/language';
import { EditorState, Text } from '@codemirror/state';

// --> Temporary Solution
export const getLinesToCheckForRender = (state: EditorState, newDoc: Text): number[] => {
    let lines: number[] = [];
    if (newDoc.length > 0) {
        lines = Array.from({ length: newDoc.lines }, (_, i) => i + 1);
    }
    return lines;
};

// --> It only iterates through visible lines, if line with image is out of scope, it won't bring the number
const getLinesToCheckForRenderAlt = (state: EditorState, newDoc: Text): number[] => {
    const lines: number[] = [];

    if (newDoc.length > 0) {
        syntaxTree(state).iterate({
            from: 1,
            to: newDoc.length,
            enter: (obj: { type: any; from: any; to: any }) => {
                let { type, from, to } = obj;
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
