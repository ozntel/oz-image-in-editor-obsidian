const link_regex = /(http[s]?:\/\/)([^\/\s]+\/)(.*)/;
const image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
const image_http_regex_4 = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;

// Check if String is a link
export const pathIsALink = (path: string): boolean => {
    let match = path.match(link_regex);
    return match ? true : false;
};

// Check line if it is a link
export const getLinkInline = (line: string) => {
    const match_3 = line.match(image_http_regex_3);
    const match_4 = line.match(image_http_regex_4);
    if (match_3) {
        return { result: match_3, linkType: 3 };
    } else if (match_4) {
        return { result: match_4, linkType: 4 };
    }
    return { result: false, linkType: 0 };
};
