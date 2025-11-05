export function createPageUrl(pageName: string) {
  // Split page name and query parameters
  const [page, queryString] = pageName.split('?');

  // Replace spaces with dashes, but preserve the original case
  const formattedPage = page.replace(/ /g, '-');

  // Reconstruct URL with original query parameters
  return queryString ? `/${formattedPage}?${queryString}` : `/${formattedPage}`;
}
