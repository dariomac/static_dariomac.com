# Education Template

## Overview
The `education` template is used for documenting educational entries (degrees, courses, etc.).

## Frontmatter

The following fields in the frontmatter require manual input:

*   `title`: `<title>` - The title of the education entry (e.g., Degree Name).
*   `date`: `<creation_date>` - The creation date.
*   `card.columnid`: `<column>` - The column ID for the board view.
*   `card.datebox`: `<Jun_2,_2014_-_Jun_3,_2014>` - The duration of the education program.
*   `card.extlink`: `<place_url>` - External link to the institution's website.
*   `card.position`: `<position>` - The position of the card.
*   `card.title`: `<place_or_company>` - The name of the institution.

## Body Content

The following sections after `---` require manual input:

*   `[summary:string]`: A brief summary.
*   `[duration:string]`: The duration string.
*   `[dictated_by:string]`: The entity or person who dictated the course (if applicable).
*   `[place_url:string]`: URL of the institution.
*   `[place:string]`: Name of the place/institution.
*   `[content:md]`: Detailed content about the education (Markdown allowed).
*   `[lessons:md]`: Key lessons learned (Markdown allowed).
