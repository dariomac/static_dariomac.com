# Article Template

## Overview
The `article` template is used for creating new articles.

## Frontmatter

The following fields in the frontmatter require manual input:

*   `title`: `<title>` - The title of the article.
*   `date`: `<creation_date>` - The date of creation.
*   `card.columnid`: `<column>` - The column ID for the board view.
*   `card.position`: `<position>` - The position of the card in the column.
*   `card.title`: `<article_authors>` - The authors of the article (displayed on the card).

## Body Content

The following sections after `---` require manual input:

*   `[summary:string]`: A brief summary of the article.
*   `[authors:string]`: The authors of the article.
*   `[publication_metadata:string]`: Metadata regarding the publication.
*   `[abstract:md]`: The abstract of the article (Markdown allowed).
*   `[more_info:md]`: Additional information or the main content (Markdown allowed).
