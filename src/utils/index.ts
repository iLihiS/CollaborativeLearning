


export function createPageUrl(url: string) {
    return '/' + url.toLowerCase().replace(/ /g, '-');
}