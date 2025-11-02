export function createPageUrl(pageName: string) {
  // Split page name and query parameters
  const [page, queryString] = pageName.split('?');

  // Lowercase only the page name, preserve query parameters as-is
  const lowercasedPage = page.toLowerCase().replace(/ /g, '-');

  // Reconstruct URL with original query parameters
  return queryString ? `/${lowercasedPage}?${queryString}` : `/${lowercasedPage}`;
}
