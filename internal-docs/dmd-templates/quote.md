# Quote Template

## Overview
The `quote` template is used for displaying quotes from various sources.

## Frontmatter

The following fields in the frontmatter require manual input:

*   `title`: `<title>` - The title (often the author's name).
*   `date`: `<creation_date>` - The creation date.
*   `card.columnid`: `<column>` - The column ID for the board view.
*   `card.extlink`: `<external_link>` - External link to the source of the quote.
*   `card.position`: `<position>` - The position of the card.
*   `card.title`: `<author>` - The author of the quote.

## Body Content

The following sections after `---` require manual input:

*   `[summary:string]`: A brief summary or the quote itself.
*   `[authors:string]`: The authors of the quote.
*   `[publication_metadata:string]`: Metadata regarding the publication/source.
*   `[context:md]`: The context or full text of the quote (Markdown allowed).
