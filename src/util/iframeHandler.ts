const iframeRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/;

export const getIframeInLine = (line: string) => {
    const match = line.match(iframeRegex);
    if (match) return { result: match, linkType: 'iframe' };
    return { result: false, linkType: 0 };
};

export const createIframeNode = (match: any): HTMLElement => {
    var iframeNode = document.createElement('div');
    iframeNode.innerHTML = match[0].trim();
    return iframeNode;
};
