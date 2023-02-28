import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import OzanImagePlugin from 'src/main';
import { StatefulDecorationSet } from 'src/cm6/decorations';
import { livePreviewActive, pluginIsLoaded } from 'src/util/obsidianHelper';
import { MSGHandlerPlugin } from 'src/types';

// --> View Plugin
export const getViewPlugin = (params: { plugin: OzanImagePlugin }): Extension => {
    const { plugin } = params;

    const imageViewPlugin = ViewPlugin.fromClass(
        class {
            decoManager: StatefulDecorationSet;

            constructor(view: EditorView) {
                this.decoManager = new StatefulDecorationSet(view);
                if (!livePreviewActive(plugin.app)) {
                    const state = view.state;
                    this.decoManager.updateAsyncDecorations({ view, state, newDoc: state.doc, plugin });
                }
            }

            update(update: ViewUpdate) {
                if ((update.docChanged || update.viewportChanged) && !livePreviewActive(plugin.app)) {
                    const state = update.view.state;
                    this.decoManager.updateAsyncDecorations({ view: update.view, plugin, newDoc: state.doc });
                }
            }

            destroy() {
                // Clean MSG Handler Blobs in case they exist for rendered MSG
                if (plugin.renderedMsgFiles.length > 0) {
                    // Check if plugin is loaded
                    let msgHandlerPlugin: MSGHandlerPlugin | null = pluginIsLoaded(plugin.app, 'msg-handler');
                    if (msgHandlerPlugin) {
                        // loop loaded msg files and remove related blobs
                        for (let renderedMsgFile of plugin.renderedMsgFiles) {
                            // use CleanLoadedBlobs provided by msgHandlerPlugin
                            msgHandlerPlugin.cleanLoadedBlobs({ all: false, forMsgFile: renderedMsgFile });
                        }
                    }
                    plugin.renderedMsgFiles = [];
                }
            }
        }
    );

    return imageViewPlugin;
};
