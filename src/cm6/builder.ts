import { images } from 'src/cm6/extension';
import OzanImagePlugin from 'src/main';

export const buildExtension = (props: { plugin: OzanImagePlugin }) => {
    const { plugin } = props;
    return images({ plugin });
};
