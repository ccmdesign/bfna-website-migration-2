/**
 * Markdown negotiation for the static site.
 *
 * Registered only in `netlify.toml` (`[[edge_functions]]`). Do not also export
 * a `config` object — Netlify would register the function twice.
 *
 * Signature is Netlify's: `(request, context) => Response`. Pass-through uses
 * `context.next()`. The markdown twin is loaded by `negotiate`, which fetches
 * the `.md` file without forwarding `Accept: text/markdown`.
 */
import { negotiate } from '../../src/utils/markdown-negotiation'

interface EdgeContext {
  next: () => Promise<Response>
}

export default async (request: Request, context: EdgeContext): Promise<Response> => {
  return negotiate(request, {
    next: () => context.next(),
    fetch: (input, init) => fetch(input, init)
  })
}
