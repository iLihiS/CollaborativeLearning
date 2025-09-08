export function createPageUrl(url: string): string {
  return '/' + url.toLowerCase().replace(/ /g, '-')
}