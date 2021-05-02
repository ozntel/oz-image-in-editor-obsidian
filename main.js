/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

// Remove Widgets in CodeMirror Editor
const clearWidges = (cm) => {
    var lastLine = cm.lastLine();
    for (let i = 0; i <= lastLine; i++) {
        // Get the current Line
        const line = cm.lineInfo(i);
        // Clear the image widgets if exists
        if (line.widgets) {
            for (const wid of line.widgets) {
                if (wid.className === 'oz-image-widget') {
                    wid.clear();
                }
            }
        }
    }
};
// Http, Https Link Check
const filename_is_a_link = (filename) => {
    const url_regex = /^[a-z][a-z0-9+\-.]+:/i;
    return filename.match(url_regex) != null;
};
// Image Name and Alt Text
const getFileNameAndAltText = (linkType, match) => {
    /*
       linkType 1: [[myimage.jpg|#x-small]]
       linkType2: ![#x-small](myimage.jpg)
       returns { fileName: '', altText: '' }
    */
    var file_name_regex;
    var alt_regex;
    if (linkType == 1) {
        file_name_regex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        alt_regex = /(?<=\|).*(?=]])/;
    }
    else if (linkType == 2) {
        file_name_regex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        alt_regex = /(?<=\[)(^$|.*)(?=\])/;
    }
    var file_match = match[0].match(file_name_regex);
    var alt_match = match[0].match(alt_regex);
    return { fileName: file_match ? file_match[0] : '',
        altText: alt_match ? alt_match[0] : '' };
};
// Getting Active Markdown File
const getActiveNoteFile = (workspace) => {
    return workspace.getActiveFile();
};
const getPathOfVault = (vault) => {
    var path = vault.adapter.basePath;
    if (path.startsWith('/'))
        return 'app://local' + path;
    return 'app://local/' + path;
};
// Temporary Solution until getResourcePath improved 
const getPathOfImage = (vault, image) => {
    // vault.getResourcePath(image) 
    return getPathOfVault(vault) + '/' + image.path;
};
const getFileCmBelongsTo = (cm, workspace) => {
    var _a;
    let leafs = workspace.getLeavesOfType("markdown");
    for (let i = 0; i < leafs.length; i++) {
        if (leafs[i].view instanceof obsidian.MarkdownView && ((_a = leafs[i].view.sourceMode) === null || _a === void 0 ? void 0 : _a.cmEditor) == cm) {
            return leafs[i].view.file;
        }
    }
    return null;
};

class OzanImagePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        // Line Edit Changes
        this.codemirrorLineChanges = (cm, change) => {
            this.check_lines(cm, change.from.line, change.from.line + change.text.length - 1);
        };
        // Only Triggered during initial Load
        this.handleInitialLoad = (cm) => {
            var lastLine = cm.lastLine();
            var file = getFileCmBelongsTo(cm, this.app.workspace);
            for (let i = 0; i < lastLine; i++) {
                this.check_line(cm, i, file);
            }
        };
        // Check Single Line
        this.check_line = (cm, line_number, targetFile) => {
            // Regex for [[ ]] format
            const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg|bmp).*\]\]/;
            // Regex for ![ ]( ) format
            const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg|bmp)\)/;
            // Get the Line edited
            const line = cm.lineInfo(line_number);
            if (line === null)
                return;
            // Current Line Comparison with Regex
            const match_1 = line.text.match(image_line_regex_1);
            const match_2 = line.text.match(image_line_regex_2);
            // Clear the widget if link was removed
            var line_image_widget = line.widgets ? line.widgets.filter((wid) => wid.className === 'oz-image-widget') : false;
            if (line_image_widget && (!match_1 || !match_2))
                line_image_widget[0].clear();
            // If any of regex matches, it will add image widget
            if (match_1 || match_2) {
                // Clear the image widgets if exists
                if (line.widgets) {
                    for (const wid of line.widgets) {
                        if (wid.className === 'oz-image-widget') {
                            wid.clear();
                        }
                    }
                }
                // Get the file name and alt text depending on format
                var filename = '';
                var alt = '';
                if (match_1) {
                    // Regex for [[myimage.jpg|#x-small]] format
                    filename = getFileNameAndAltText(1, match_1).fileName;
                    alt = getFileNameAndAltText(1, match_1).altText;
                }
                else if (match_2) {
                    // Regex for ![#x-small](myimage.jpg) format
                    filename = getFileNameAndAltText(2, match_2).fileName;
                    alt = getFileNameAndAltText(2, match_2).altText;
                }
                // Create Image
                const img = document.createElement('img');
                // Prepare the src for the Image
                if (filename_is_a_link(filename)) {
                    img.src = filename;
                }
                else {
                    // Source Path
                    var sourcePath = '';
                    if (targetFile != null) {
                        sourcePath = targetFile.path;
                    }
                    else {
                        let activeNoteFile = getActiveNoteFile(this.app.workspace);
                        sourcePath = activeNoteFile ? activeNoteFile.path : '';
                    }
                    var image = this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
                    if (image != null)
                        img.src = getPathOfImage(this.app.vault, image);
                }
                // Image Properties
                img.alt = alt;
                // Add Image widget under the Image Markdown
                cm.addLineWidget(line_number, img, { className: 'oz-image-widget' });
            }
        };
        // Check All Lines Function
        this.check_lines = (cm, from, to) => {
            // Last Used Line Number in Code Mirror
            var file = getFileCmBelongsTo(cm, this.app.workspace);
            for (let i = from; i <= to; i++) {
                this.check_line(cm, i, file);
            }
        };
    }
    onload() {
        // Register event for each change
        this.registerCodeMirror((cm) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        });
    }
    onunload() {
        this.app.workspace.iterateCodeMirrors((cm) => {
            cm.off("change", this.codemirrorLineChanges);
            clearWidges(cm);
        });
        new obsidian.Notice('Image in Editor Plugin is unloaded');
    }
}

module.exports = OzanImagePlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3JjL3V0aWxzLnRzIiwic3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya3NwYWNlLCBNYXJrZG93blZpZXcsIFZhdWx0LCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcblxuLy8gUmVtb3ZlIFdpZGdldHMgaW4gQ29kZU1pcnJvciBFZGl0b3JcbmNvbnN0IGNsZWFyV2lkZ2VzID0gKGNtOiBDb2RlTWlycm9yLkVkaXRvcikgPT4ge1xuICAgIHZhciBsYXN0TGluZSA9IGNtLmxhc3RMaW5lKCk7XG5cbiAgICBmb3IobGV0IGk9MDsgaSA8PSBsYXN0TGluZTsgaSsrKXtcbiAgICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IExpbmVcbiAgICAgICAgY29uc3QgbGluZSA9IGNtLmxpbmVJbmZvKGkpO1xuICAgICAgICAvLyBDbGVhciB0aGUgaW1hZ2Ugd2lkZ2V0cyBpZiBleGlzdHNcbiAgICAgICAgaWYgKGxpbmUud2lkZ2V0cyl7XG4gICAgICAgICAgICBmb3IoY29uc3Qgd2lkIG9mIGxpbmUud2lkZ2V0cyl7XG4gICAgICAgICAgICAgICAgaWYgKHdpZC5jbGFzc05hbWUgPT09ICdvei1pbWFnZS13aWRnZXQnKXtcbiAgICAgICAgICAgICAgICAgICAgd2lkLmNsZWFyKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEh0dHAsIEh0dHBzIExpbmsgQ2hlY2tcbmNvbnN0IGZpbGVuYW1lX2lzX2FfbGluayA9IChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdXJsX3JlZ2V4ID0gL15bYS16XVthLXowLTkrXFwtLl0rOi9pXG4gICAgcmV0dXJuIGZpbGVuYW1lLm1hdGNoKHVybF9yZWdleCkgIT0gbnVsbFxufTtcblxuIC8vIEltYWdlIE5hbWUgYW5kIEFsdCBUZXh0XG5jb25zdCBnZXRGaWxlTmFtZUFuZEFsdFRleHQgPShsaW5rVHlwZTogbnVtYmVyLCBtYXRjaDogYW55KSA9PiB7XG4gICAgLyogXG4gICAgICAgbGlua1R5cGUgMTogW1tteWltYWdlLmpwZ3wjeC1zbWFsbF1dXG4gICAgICAgbGlua1R5cGUyOiAhWyN4LXNtYWxsXShteWltYWdlLmpwZykgXG4gICAgICAgcmV0dXJucyB7IGZpbGVOYW1lOiAnJywgYWx0VGV4dDogJycgfSAgIFxuICAgICovXG5cbiAgICB2YXIgZmlsZV9uYW1lX3JlZ2V4O1xuICAgIHZhciBhbHRfcmVnZXg7XG5cbiAgICBpZihsaW5rVHlwZSA9PSAxKXtcbiAgICAgICAgZmlsZV9uYW1lX3JlZ2V4ID0gLyg/PD1cXFtcXFspLiooanBlP2d8cG5nfGdpZnxzdmd8Ym1wKS87XG4gICAgICAgIGFsdF9yZWdleCA9IC8oPzw9XFx8KS4qKD89XV0pLztcbiAgICB9IGVsc2UgaWYobGlua1R5cGUgPT0gMil7XG4gICAgICAgIGZpbGVfbmFtZV9yZWdleCA9IC8oPzw9XFwoKS4qKGpwZT9nfHBuZ3xnaWZ8c3ZnfGJtcCkvO1xuICAgICAgICBhbHRfcmVnZXggPSAvKD88PVxcWykoXiR8LiopKD89XFxdKS87XG4gICAgfVxuXG4gICAgdmFyIGZpbGVfbWF0Y2ggPSBtYXRjaFswXS5tYXRjaChmaWxlX25hbWVfcmVnZXgpO1xuICAgIHZhciBhbHRfbWF0Y2ggPSBtYXRjaFswXS5tYXRjaChhbHRfcmVnZXgpO1xuXG4gICAgcmV0dXJuIHsgZmlsZU5hbWU6IGZpbGVfbWF0Y2ggPyBmaWxlX21hdGNoWzBdIDogJycsIFxuICAgICAgICAgICAgYWx0VGV4dDogYWx0X21hdGNoID8gYWx0X21hdGNoWzBdIDogJycgfVxuXG59ICAgIFxuXG4vLyBHZXR0aW5nIEFjdGl2ZSBNYXJrZG93biBGaWxlXG5jb25zdCBnZXRBY3RpdmVOb3RlRmlsZSA9ICh3b3Jrc3BhY2U6IFdvcmtzcGFjZSkgPT4ge1xuICAgIHJldHVybiB3b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xufVxuXG4vLyBHZXQgQWN0aXZlIEVkaXRvclxuY29uc3QgZ2V0Q21FZGl0b3IgPSAod29ya3NwYWNlOiBXb3Jrc3BhY2UpOiBDb2RlTWlycm9yLkVkaXRvciA9PiB7XG4gICAgcmV0dXJuIHdvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk/LnNvdXJjZU1vZGU/LmNtRWRpdG9yXG59XG5cbmNvbnN0IGdldFBhdGhPZlZhdWx0ID0gKHZhdWx0OiBWYXVsdCk6IHN0cmluZyA9PiB7XG4gICAgdmFyIHBhdGggPSB2YXVsdC5hZGFwdGVyLmJhc2VQYXRoO1xuICAgIGlmKHBhdGguc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gJ2FwcDovL2xvY2FsJyArIHBhdGhcbiAgICByZXR1cm4gJ2FwcDovL2xvY2FsLycgKyBwYXRoXG59XG5cbi8vIFRlbXBvcmFyeSBTb2x1dGlvbiB1bnRpbCBnZXRSZXNvdXJjZVBhdGggaW1wcm92ZWQgXG5jb25zdCBnZXRQYXRoT2ZJbWFnZSA9ICh2YXVsdDogVmF1bHQsIGltYWdlOiBURmlsZSkgPT4ge1xuICAgIC8vIHZhdWx0LmdldFJlc291cmNlUGF0aChpbWFnZSkgXG4gICAgcmV0dXJuIGdldFBhdGhPZlZhdWx0KHZhdWx0KSArICcvJyArIGltYWdlLnBhdGhcbn1cblxuY29uc3QgZ2V0RmlsZUNtQmVsb25nc1RvID0gKGNtOiBDb2RlTWlycm9yLkVkaXRvciwgd29ya3NwYWNlOiBXb3Jrc3BhY2UpID0+IHtcbiAgICBsZXQgbGVhZnMgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFwibWFya2Rvd25cIik7XG4gICAgZm9yKGxldCBpPTA7IGkgPCBsZWFmcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGlmKGxlYWZzW2ldLnZpZXcgaW5zdGFuY2VvZiBNYXJrZG93blZpZXcgJiYgbGVhZnNbaV0udmlldy5zb3VyY2VNb2RlPy5jbUVkaXRvciA9PSBjbSl7XG4gICAgICAgICAgICByZXR1cm4gbGVhZnNbaV0udmlldy5maWxlXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59IFxuXG5leHBvcnQgeyBjbGVhcldpZGdlcywgZmlsZW5hbWVfaXNfYV9saW5rLCBnZXRGaWxlTmFtZUFuZEFsdFRleHQsXG4gICAgZ2V0QWN0aXZlTm90ZUZpbGUsIGdldENtRWRpdG9yLCBnZXRQYXRoT2ZJbWFnZSwgZ2V0RmlsZUNtQmVsb25nc1RvIH07IiwiaW1wb3J0IHsgUGx1Z2luLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgY2xlYXJXaWRnZXMsIGZpbGVuYW1lX2lzX2FfbGluaywgZ2V0RmlsZU5hbWVBbmRBbHRUZXh0LFxuICAgICAgICBnZXRBY3RpdmVOb3RlRmlsZSwgZ2V0UGF0aE9mSW1hZ2UsIGdldEZpbGVDbUJlbG9uZ3NUbyB9IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPemFuSW1hZ2VQbHVnaW4gZXh0ZW5kcyBQbHVnaW57XG5cbiAgICBvbmxvYWQoKXtcbiAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgZm9yIGVhY2ggY2hhbmdlXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDb2RlTWlycm9yKCAoY206IENvZGVNaXJyb3IuRWRpdG9yKSA9PiB7XG4gICAgICAgICAgICBjbS5vbihcImNoYW5nZVwiLCB0aGlzLmNvZGVtaXJyb3JMaW5lQ2hhbmdlcyk7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUluaXRpYWxMb2FkKGNtKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBvbnVubG9hZCgpe1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuaXRlcmF0ZUNvZGVNaXJyb3JzKCAoY20pID0+IHtcbiAgICAgICAgICAgIGNtLm9mZihcImNoYW5nZVwiLCB0aGlzLmNvZGVtaXJyb3JMaW5lQ2hhbmdlcyk7XG4gICAgICAgICAgICBjbGVhcldpZGdlcyhjbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXcgTm90aWNlKCdJbWFnZSBpbiBFZGl0b3IgUGx1Z2luIGlzIHVubG9hZGVkJyk7XG4gICAgfVxuXG4gICAgLy8gTGluZSBFZGl0IENoYW5nZXNcbiAgICBjb2RlbWlycm9yTGluZUNoYW5nZXMgPSAoY206IGFueSwgY2hhbmdlOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja19saW5lcyhjbSwgY2hhbmdlLmZyb20ubGluZSwgY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCAtIDEpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgVHJpZ2dlcmVkIGR1cmluZyBpbml0aWFsIExvYWRcbiAgICBoYW5kbGVJbml0aWFsTG9hZCA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IpID0+IHtcbiAgICAgICAgdmFyIGxhc3RMaW5lID0gY20ubGFzdExpbmUoKTtcbiAgICAgICAgdmFyIGZpbGUgPSBnZXRGaWxlQ21CZWxvbmdzVG8oY20sIHRoaXMuYXBwLndvcmtzcGFjZSk7XG4gICAgICAgIGZvcihsZXQgaT0wOyBpIDwgbGFzdExpbmU7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNoZWNrX2xpbmUoY20sIGksIGZpbGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgU2luZ2xlIExpbmVcbiAgICBjaGVja19saW5lOiBhbnkgPSAoY206IENvZGVNaXJyb3IuRWRpdG9yLCBsaW5lX251bWJlcjogbnVtYmVyLCB0YXJnZXRGaWxlOlRGaWxlKSA9PiB7XG5cbiAgICAgICAgLy8gUmVnZXggZm9yIFtbIF1dIGZvcm1hdFxuICAgICAgICBjb25zdCBpbWFnZV9saW5lX3JlZ2V4XzEgPSAvIVxcW1xcWy4qKGpwZT9nfHBuZ3xnaWZ8c3ZnfGJtcCkuKlxcXVxcXS9cbiAgICAgICAgLy8gUmVnZXggZm9yICFbIF0oICkgZm9ybWF0XG4gICAgICAgIGNvbnN0IGltYWdlX2xpbmVfcmVnZXhfMiA9IC8hXFxbKF4kfC4qKVxcXVxcKC4qKGpwZT9nfHBuZ3xnaWZ8c3ZnfGJtcClcXCkvXG4gICAgICAgIC8vIEdldCB0aGUgTGluZSBlZGl0ZWRcbiAgICAgICAgY29uc3QgbGluZSA9IGNtLmxpbmVJbmZvKGxpbmVfbnVtYmVyKTtcbiAgICAgICAgXG4gICAgICAgIGlmKGxpbmUgPT09IG51bGwpIHJldHVybjtcblxuICAgICAgICAvLyBDdXJyZW50IExpbmUgQ29tcGFyaXNvbiB3aXRoIFJlZ2V4XG4gICAgICAgIGNvbnN0IG1hdGNoXzEgPSBsaW5lLnRleHQubWF0Y2goaW1hZ2VfbGluZV9yZWdleF8xKTtcbiAgICAgICAgY29uc3QgbWF0Y2hfMiA9IGxpbmUudGV4dC5tYXRjaChpbWFnZV9saW5lX3JlZ2V4XzIpO1xuXG4gICAgICAgIC8vIENsZWFyIHRoZSB3aWRnZXQgaWYgbGluayB3YXMgcmVtb3ZlZFxuICAgICAgICB2YXIgbGluZV9pbWFnZV93aWRnZXQgPSBsaW5lLndpZGdldHMgPyBsaW5lLndpZGdldHMuZmlsdGVyKCh3aWQ6IHsgY2xhc3NOYW1lOiBzdHJpbmc7IH0pID0+IHdpZC5jbGFzc05hbWUgPT09ICdvei1pbWFnZS13aWRnZXQnKSA6IGZhbHNlO1xuICAgICAgICBpZihsaW5lX2ltYWdlX3dpZGdldCAmJiAoIW1hdGNoXzEgfHwgIW1hdGNoXzIpKSBsaW5lX2ltYWdlX3dpZGdldFswXS5jbGVhcigpO1xuXG4gICAgICAgIC8vIElmIGFueSBvZiByZWdleCBtYXRjaGVzLCBpdCB3aWxsIGFkZCBpbWFnZSB3aWRnZXRcbiAgICAgICAgaWYobWF0Y2hfMSB8fCBtYXRjaF8yKXtcbiAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENsZWFyIHRoZSBpbWFnZSB3aWRnZXRzIGlmIGV4aXN0c1xuICAgICAgICAgICAgaWYgKGxpbmUud2lkZ2V0cyl7XG4gICAgICAgICAgICAgICAgZm9yKGNvbnN0IHdpZCBvZiBsaW5lLndpZGdldHMpe1xuICAgICAgICAgICAgICAgICAgICBpZiAod2lkLmNsYXNzTmFtZSA9PT0gJ296LWltYWdlLXdpZGdldCcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IHRoZSBmaWxlIG5hbWUgYW5kIGFsdCB0ZXh0IGRlcGVuZGluZyBvbiBmb3JtYXRcbiAgICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICcnO1xuICAgICAgICAgICAgdmFyIGFsdCA9ICcnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZihtYXRjaF8xKXtcbiAgICAgICAgICAgICAgICAvLyBSZWdleCBmb3IgW1tteWltYWdlLmpwZ3wjeC1zbWFsbF1dIGZvcm1hdFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZ2V0RmlsZU5hbWVBbmRBbHRUZXh0KDEsIG1hdGNoXzEpLmZpbGVOYW1lXG4gICAgICAgICAgICAgICAgYWx0ID0gZ2V0RmlsZU5hbWVBbmRBbHRUZXh0KDEsIG1hdGNoXzEpLmFsdFRleHRcbiAgICAgICAgICAgIH0gZWxzZSBpZihtYXRjaF8yKXtcbiAgICAgICAgICAgICAgICAvLyBSZWdleCBmb3IgIVsjeC1zbWFsbF0obXlpbWFnZS5qcGcpIGZvcm1hdFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZ2V0RmlsZU5hbWVBbmRBbHRUZXh0KDIsIG1hdGNoXzIpLmZpbGVOYW1lXG4gICAgICAgICAgICAgICAgYWx0ID0gZ2V0RmlsZU5hbWVBbmRBbHRUZXh0KDIsIG1hdGNoXzIpLmFsdFRleHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ3JlYXRlIEltYWdlXG4gICAgICAgICAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblxuICAgICAgICAgICAgLy8gUHJlcGFyZSB0aGUgc3JjIGZvciB0aGUgSW1hZ2VcbiAgICAgICAgICAgIGlmKGZpbGVuYW1lX2lzX2FfbGluayhmaWxlbmFtZSkpe1xuICAgICAgICAgICAgICAgIGltZy5zcmMgPSBmaWxlbmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU291cmNlIFBhdGhcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlUGF0aCA9ICcnO1xuICAgICAgICAgICAgICAgIGlmKHRhcmdldEZpbGUgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGggPSB0YXJnZXRGaWxlLnBhdGg7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhY3RpdmVOb3RlRmlsZSA9IGdldEFjdGl2ZU5vdGVGaWxlKHRoaXMuYXBwLndvcmtzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGggPSBhY3RpdmVOb3RlRmlsZSA/IGFjdGl2ZU5vdGVGaWxlLnBhdGggOiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChkZWNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUpLCBzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgICAgICBpZihpbWFnZSAhPSBudWxsKSBpbWcuc3JjID0gZ2V0UGF0aE9mSW1hZ2UodGhpcy5hcHAudmF1bHQsIGltYWdlKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbWFnZSBQcm9wZXJ0aWVzXG4gICAgICAgICAgICBpbWcuYWx0ID0gYWx0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBZGQgSW1hZ2Ugd2lkZ2V0IHVuZGVyIHRoZSBJbWFnZSBNYXJrZG93blxuICAgICAgICAgICAgY20uYWRkTGluZVdpZGdldChsaW5lX251bWJlciwgaW1nLCB7Y2xhc3NOYW1lOiAnb3otaW1hZ2Utd2lkZ2V0J30pOyAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgQWxsIExpbmVzIEZ1bmN0aW9uXG4gICAgY2hlY2tfbGluZXM6IGFueSA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IsIGZyb206IG51bWJlciwgdG86IG51bWJlcikgPT4ge1xuICAgICAgICAvLyBMYXN0IFVzZWQgTGluZSBOdW1iZXIgaW4gQ29kZSBNaXJyb3JcbiAgICAgICAgdmFyIGZpbGUgPSBnZXRGaWxlQ21CZWxvbmdzVG8oY20sIHRoaXMuYXBwLndvcmtzcGFjZSk7XG4gICAgICAgIGZvcihsZXQgaT1mcm9tOyBpIDw9IHRvOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5jaGVja19saW5lKGNtLCBpLCBmaWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn0iXSwibmFtZXMiOlsiTWFya2Rvd25WaWV3IiwiUGx1Z2luIiwiTm90aWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQTtBQUNBLE1BQU0sV0FBVyxHQUFHLENBQUMsRUFBcUI7SUFDdEMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRTdCLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUM7O1FBRTVCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBRTVCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBQztZQUNiLEtBQUksTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBQztnQkFDMUIsSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLGlCQUFpQixFQUFDO29CQUNwQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUE7aUJBQ2Q7YUFDSjtTQUNKO0tBQ0o7QUFDTCxDQUFDLENBQUE7QUFFRDtBQUNBLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxRQUFnQjtJQUN4QyxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQTtJQUN6QyxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxDQUFBO0FBQzVDLENBQUMsQ0FBQztBQUVEO0FBQ0QsTUFBTSxxQkFBcUIsR0FBRSxDQUFDLFFBQWdCLEVBQUUsS0FB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
