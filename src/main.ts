import { Plugin } from 'obsidian';
import { clearWidgets, getFileCmBelongsTo } from './utils';
import { check_line, check_lines } from './check-line';

export default class OzanImagePlugin extends Plugin{

    onload(){
        console.log('Image in Editor Plugin is loaded');
        // Register event for each change
        this.registerCodeMirror( (cm: CodeMirror.Editor) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        })
    }

    onunload(){
        this.app.workspace.iterateCodeMirrors( (cm) => {
            cm.off("change", this.codemirrorLineChanges);
            clearWidgets(cm);
        });
        console.log('Image in Editor Plugin is unloaded');
    }

    // Line Edit Changes
    codemirrorLineChanges = (cm: any, change: any) => {
        check_lines(cm, change.from.line, change.from.line + change.text.length - 1, this.app);
    }

    // Only Triggered during initial Load
    handleInitialLoad = (cm: CodeMirror.Editor) => {
        var lastLine = cm.lastLine();
        var file = getFileCmBelongsTo(cm, this.app.workspace);
        for(let i=0; i < lastLine; i++){
            check_line(cm, i, file, this.app);
        }
    }
    
}