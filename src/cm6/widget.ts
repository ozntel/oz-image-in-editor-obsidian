import { WidgetType } from '@codemirror/view';
import OzanImagePlugin from 'src/main';
import * as ImageHandler from 'src/util/imageHandler';

export interface ImageWidgetParams {
    url: string;
    altText: string;
    filePath: string;
    plugin: OzanImagePlugin;
}

export class ImageWidget extends WidgetType {
    readonly url: string;
    readonly altText: string;
    readonly filePath: string; // For Reload Check
    readonly plugin: OzanImagePlugin;

    constructor({ url, altText, filePath, plugin }: ImageWidgetParams) {
        super();
        this.url = url;
        this.altText = altText;
        this.filePath = filePath;
        this.plugin = plugin;
    }

    eq(imageWidget: ImageWidget) {
        return imageWidget.url === this.url && imageWidget.altText === this.altText && imageWidget.filePath === this.filePath;
    }

    toDOM() {
        // Create HTML Elements
        const container = document.createElement('div');
        const image = container.appendChild(document.createElement('img'));

        // Image Source
        image.src = this.url;

        // Image Alt
        let altSizer = ImageHandler.altWidthHeight(this.altText);
        if (altSizer) {
            image.width = altSizer.width;
            if (altSizer.height) image.height = altSizer.height;
        }
        image.alt = this.altText;

        return container;
    }

    ignoreEvent(): boolean {
        return true;
    }
}
