import { WidgetType } from '@codemirror/view';
import * as ImageHandler from 'src/util/imageHandler';

export interface ImageWidgetParams {
    url: string;
    altText: string;
}

export class ImageWidget extends WidgetType {
    readonly url: string;
    readonly altText: string;

    constructor({ url, altText }: ImageWidgetParams) {
        super();
        this.url = url;
        this.altText = altText;
    }

    eq(imageWidget: ImageWidget) {
        return imageWidget.url === this.url && imageWidget.altText === this.altText;
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
