import { statefulDecorations } from 'src/cm6/stateField';
import { getViewPlugin } from 'src/cm6/viewPlugin';
import OzanImagePlugin from 'src/main';

// --> Export Build Extension
export const buildExtension = (params: { plugin: OzanImagePlugin }) => {
    const { plugin } = params;
    const viewPlugin = getViewPlugin({ plugin });
    return [viewPlugin, statefulDecorations.field];
};
