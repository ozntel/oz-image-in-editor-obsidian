// Regex for [[ ]] format
const pdf_regex_1 = /!\[\[.*(pdf)(.*)?\]\]/;
const pdf_name_regex_1 = /(?<=\[\[).*.pdf/;

// Regex for ![ ]( ) format
const pdf_regex_2 = /!\[(^$|.*)\]\(.*(pdf)(.*)?\)/;
const pdf_name_regex_2 = /(?<=\().*.pdf/;

// Check line if it is a PDF
export const getPdfInLine = (line: string) => {
    const match_1 = line.match(pdf_regex_1);
    const match_2 = line.match(pdf_regex_2);
    if (match_1) {
        return { result: match_1, linkType: 1 };
    } else if (match_2) {
        return { result: match_2, linkType: 2 };
    }
    return { result: false, linkType: 0 };
};

export const getPdfName = (linkType: number, match: any): string => {
    let pdf_name_regex;
    if (linkType == 1) pdf_name_regex = pdf_name_regex_1;
    if (linkType == 2) pdf_name_regex = pdf_name_regex_2;
    var file_name_match = match[0].match(pdf_name_regex);
    return file_name_match[0];
};

export const getPdfPageNumber = (match: any): string | boolean => {
    const reg = new RegExp('#page=[0-9]+');
    const page_match = match[0].match(reg);
    if (page_match) return page_match[0];
    return false;
};
