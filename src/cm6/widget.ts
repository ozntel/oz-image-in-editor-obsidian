import { Decoration, WidgetType } from '@codemirror/view';
import * as ImageHandler from 'src/util/imageHandler';

/* ------------------ EXPORTED DECORATIONS ------------------ */

export const ImageDecoration = (imageWidgetParams: ImageWidgetParams) =>
    Decoration.replace({
        widget: new ImageWidget(imageWidgetParams),
        inclusive: false,
    });

export const PDFDecoration = (pdfWidgetParams: PDFWidgetParams) =>
    Decoration.replace({
        widget: new PDFWidget(pdfWidgetParams),
        inclusive: false,
    });

export const CustomHTMLDecoration = (customHtmlWidgetParams: CustomHTMLWidgetParams) =>
    Decoration.replace({
        widget: new CustomHTMLWidget(customHtmlWidgetParams),
        inclusive: false,
    });

/* ------------------ IMAGE WIDGET ------------------ */

interface ImageWidgetParams {
    url: string;
    altText: string;
    filePath: string;
}

class ImageWidget extends WidgetType {
    readonly url: string;
    readonly altText: string;
    readonly filePath: string; // For Reload Check

    constructor({ url, altText, filePath }: ImageWidgetParams) {
        super();
        this.url = url;
        this.altText = altText;
        this.filePath = filePath;
    }

    eq(imageWidget: ImageWidget) {
        return imageWidget.url === this.url && imageWidget.altText === this.altText && imageWidget.filePath === this.filePath;
    }

    toDOM() {
        const container = document.createElement('div');
        container.addClass('oz-image-widget-cm6');
        const image = container.createEl('img');
        image.src = this.url;
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

/* ------------------ PDF WIDGET ------------------ */

interface PDFWidgetParams {
    url: string;
    filePath: string;
}

class PDFWidget extends WidgetType {
    readonly url: string;
    readonly filePath: string; // For Reload Check

    constructor({ url, filePath }: PDFWidgetParams) {
        super();
        this.url = url;
        this.filePath = filePath;
    }

    toDOM() {
        const container = document.createElement('div');
        container.addClass('oz-pdf-widget-cm6');
        let pdfEmbed = container.createEl('embed');
        pdfEmbed.src = this.url;
        pdfEmbed.type = 'application/pdf';
        pdfEmbed.width = '100%';
        pdfEmbed.height = '800px';

        return container;
    }

    eq(pdfWidget: PDFWidget) {
        return pdfWidget.url === this.url && pdfWidget.filePath === this.filePath;
    }

    ignoreEvent(): boolean {
        return true;
    }
}

/* ------------------ Custom HTML WIDGET ------------------ */

interface CustomHTMLWidgetParams {
    htmlText: string;
}

class CustomHTMLWidget extends WidgetType {
    readonly htmlText: string;

    constructor({ htmlText }: CustomHTMLWidgetParams) {
        super();
        this.htmlText = htmlText;
    }

    toDOM() {
        let divNode = document.createElement('div');
        divNode.addClass('oz-custom-html-widget-cm6');
        divNode.innerHTML = this.htmlText.trim();
        return divNode;
    }

    eq(customHtmlWidget: CustomHTMLWidget) {
        return customHtmlWidget.htmlText === this.htmlText;
    }

    ignoreEvent() {
        return true;
    }
}
