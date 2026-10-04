/** Shared not-found sentence for the HTML shell and the markdown error body. */
export const NOT_FOUND_SENTENCE = 'That page does not exist, or its address has changed.'

const MARKER = 'id="bf-not-found"'

/**
 * `nuxt generate` writes `404.html` as an empty client shell. The fallback
 * sits in `<noscript>` *before* `#__nuxt`.
 *
 * It has to stay out of `#__nuxt`. Filling that div leaves a second `<h1>`
 * after hydration and stops `bfEmptyState` mounting, which is the gh#224
 * failure. Browsers that run JavaScript do not put `<noscript>` children in
 * the DOM, so the client-rendered error page is unchanged. A client that
 * does not run JavaScript still has the sentence and the links in the file.
 */
export function injectNotFoundHtml(html: string): string {
  if (html.includes(MARKER)) return html
  const block = '<noscript><main id="bf-not-found"><h1>Page not found</h1>'
    + `<p>${NOT_FOUND_SENTENCE}</p>`
    + '<p><a href="/">Back to home</a></p>'
    + '<p><a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></p>'
    + '</main></noscript>'
  const root = html.indexOf('<div id="__nuxt"')
  if (root !== -1) return html.slice(0, root) + block + html.slice(root)
  const body = html.indexOf('<body>')
  if (body !== -1) return html.slice(0, body + '<body>'.length) + block + html.slice(body + '<body>'.length)
  return html + block
}
