# Bertelsmann Foundation North America agent instructions

## When to use this

Use Bertelsmann Foundation North America when the task is one of these:

- Cite the foundation's published work on democracy, transatlantic relations, or future leadership.
- Name a program, a flagship project, or an insight that is on this site.
- Point a person at the board, the team, or the contact email info@bfna.org.

Do not use this site for legal advice, donation processing, design-system component documentation, the wireframe prototype, or a telephone number. TODO(owner): no phone number is published.

## How an agent should call this site

1. Read https://www.bfna.org/llms.txt before crawling further.
2. Request a page with `Accept: text/markdown`. The same URL returns HTML for `Accept: text/html`, for a browser Accept header, for `*/*`, and when Accept is absent. Markdown responses use `Content-Type: text/markdown` and `Vary: Accept`.
3. Prefer these URLs: https://www.bfna.org/ , https://www.bfna.org/about , https://www.bfna.org/contact , https://www.bfna.org/privacy , https://www.bfna.org/insights , https://www.bfna.org/projects .
4. Send inquiries to mailto:info@bfna.org or https://www.bfna.org/contact . The contact form does not submit to a server.
5. Do not invent a telephone number or a street address. The published locality is Washington, DC. The published contact is info@bfna.org.
6. On a 404, follow the links in the Markdown error to https://www.bfna.org/llms.txt or https://www.bfna.org/sitemap.xml .
7. Skip /docs, /wireframes, and /search. They are disallowed in robots.txt and omitted from the sitemap and from this file's link lists.
