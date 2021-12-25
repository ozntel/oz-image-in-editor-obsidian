import { Workspace, MarkdownView } from 'obsidian';

export const getFileCmBelongsTo = (cm: CodeMirror.Editor, workspace: Workspace) => {
    let leafs = workspace.getLeavesOfType('markdown');
    for (let i = 0; i < leafs.length; i++) {
        // @ts-ignore
        if (leafs[i].view instanceof MarkdownView && leafs[i].view.sourceMode?.cmEditor == cm) {
            // @ts-ignore
            return leafs[i].view.file;
        }
    }
    return null;
};

// Get Active Editor
export const getCmEditor = (workspace: Workspace): CodeMirror.Editor => {
    // @ts-ignore
    return workspace.getActiveViewOfType(MarkdownView)?.sourceMode?.cmEditor;
};
