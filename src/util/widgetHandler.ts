// Clear Single Line Widget
export const clearLineWidgets = (line: any) => {
    let classes = ['oz-image-widget', 'oz-transclusion-widget'];
    clearWidgetsWithClass(classes, line);
};

// Remove Widgets in CodeMirror Editor
export const clearAllWidgets = (cm: CodeMirror.Editor) => {
    var lastLine = cm.lastLine();
    for (let i = 0; i <= lastLine; i++) {
        const line = cm.lineInfo(i);
        clearLineWidgets(line);
    }
};

// Clear Transclusion Widgets
export const clearTransclusionWidgets = (line: any) => {
    clearWidgetsWithClass(['oz-transclusion-widget'], line);
};

const clearWidgetsWithClass = (classList: string[], line: any) => {
    if (line.widgets) {
        for (const wid of line.widgets) {
            if (classList.contains(wid.className)) wid.clear();
        }
    }
};

// Returns widgets with classname or false if there is not any
export const getWidgets = (line: any, className: string) => {
    return line.widgets ? line.widgets.filter((wid: { className: string }) => wid.className === className) : false;
};
