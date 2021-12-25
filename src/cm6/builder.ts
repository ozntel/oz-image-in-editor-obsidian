import { images } from 'src/cm6/extension';
import OzanImagePlugin from 'src/main';

export const buildExtension = (params: { plugin: OzanImagePlugin }) => {
    const { plugin } = params;
    return [images({ plugin })];
};
