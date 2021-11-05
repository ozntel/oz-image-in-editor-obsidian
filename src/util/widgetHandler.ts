// Clear Single Line Widget
export const clearLineWidgets = (line: any) => {
    let classes = ['oz-image-widget', 'oz-transclusion-widget', 'oz-richlink-widget'];
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

export const clearWidgetsWithClass = (classList: string[], line: any) => {
    if (line.widgets) {
        widgetLoop: for (const wid of line.widgets) {
            let classNames = wid.className;
            if (classNames !== '') {
                let classArr: string[] = classNames.split(' ');
                for (let c of classList) {
                    if (classArr.contains(c)) {
                        wid.clear();
                        continue widgetLoop;
                    }
                }
            }
            if (classList.contains(wid.className)) wid.clear();
        }
    }
};

// Returns widgets with classname or false if there is not any
export const getWidgets = (line: any, className: string) => {
    if (line.widgets) {
        let lineWidgets = [];
        for (let widget of line.widgets) {
            let classNames = widget.className;
            if (classNames !== '') {
                let classArr = classNames.split(' ');
                if (classArr.contains(className)) {
                    lineWidgets.push(widget);
                }
            }
        }
        return lineWidgets.length > 0 ? lineWidgets : false;
    }
    return false;
};
