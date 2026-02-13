# Document Template

## Overview
The `document` template is used for general documents or essays, often with more structure than a simple article.

## Frontmatter

The following fields in the frontmatter require manual input:

*   `title`: `<title>` - The title of the document.
*   `date`: `<creation_date>` - The creation date.
*   `card.columnid`: `<column>` - The column ID for the board view.
*   `card.content`: `<short_description>` - A short description for the card.
*   `card.datebox`: `<pub_date>` - The publication date displayed on the card.
*   `card.position`: `<position>` - The position of the card.

## Body Content

The following sections after `---` require manual input:

*   `[summary:string]`: A brief summary.
*   `[pub_date:string]`: The publication date.
*   `[short_description:string]`: A short description.
*   `[body:md]`: The main body of the document (Markdown allowed).
*   `[acknowledgments:md]`: Acknowledgments section (Markdown allowed).
*   `[further_reading:md]`: Further reading or references (Markdown allowed).
*   `[significant_revisions:md]`: Log of significant revisions (Markdown allowed).
