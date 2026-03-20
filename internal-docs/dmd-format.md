# DMD File Format Documentation

The `.dmd` (Dariomac Markdown) format is a custom text format used by the static site generator of this project. It divides a file into two main parts: the Frontmatter and the Content Sections, separated by `---`.

## Structure Overview

A `.dmd` file typically looks like this:

```
{
  "title": "Document Title",
  "date": "YYYY-MM-DD",
  "layout": "article",
  "card": { ... }
}
---
[section_name:type]
Content goes here based on the type...
```

### 1. JSON Frontmatter
The file begins with a JSON object that defines the page metadata. Common fields found in these files include:
- `title`: Title of the page or article.
- `date`: Publication date.
- `layout`: Name of the Handlebars layout to use from `/layouts` (e.g., `article`, `project`, `experience`).
- `card`: Extra metadata often used for aggregated views, Kanban lanes, or lists. Includes fields like `color`, `laneid`, `columnid`, and `type`.
- `resume`: Information specifically for resume generation (like `tags`).
- `jsonld`: Used to inject JSON-LD metadata for SEO.
- `canonical`: Specifies the canonical URL of the content if it was originally published elsewhere.

### 2. The Separator (`---`)
The frontmatter must be separated from the rest of the document with a line containing exactly three hyphens: `---`.

### 3. Content Sections
After the separator, the document is broken into different semantic sections identified by headers in the format `[section_name:type]`. 

#### Supported Types
- `string`: Represents plain text (e.g., `[summary:string]`, `[authors:string]`).
- `md`: Represents Markdown content that will be parsed by `commonmark` (e.g., `[abstract:md]`, `[content:md]`, `[more_info:md]`).
- `json`: Represents valid JSON data (like arrays or objects) to provide structured information.

#### Common JSON Sections

**Attachments `[attachments:json]`**
Provides a list of files attached to the document.
```json
[attachments:json]
[{
  "filename": "document.pdf",
  "description": "Description of the file"
}]
```

**Related Images `[related_images:json]`**
Provides a list of images that are related to the entry.
```json
[related_images:json]
[{
  "filename": "image.png"
}]
```

**Related Topics `[related_topics:json]`**
Defines related links or suggested content.
```json
[related_topics:json]
[{
  "title": "Link text",
  "click_bait": "Clickbait title",
  "linkto": "Href of the link"
}]
```

## Additional Features and Snippets
As documented in the `.vscode/dmd_snippets.code-snippets` file, you can also use specific inline Markdown tricks to extend standard features:
- **Centering Images:** Add `#center` to an image URL. E.g., `![Alt Text](/assets/image.jpg#center)`
- **Internal Raw Data:** Internal tracking fields that aren't rendered. E.g., `[internal:raw]` sections.
- **Lanes and Setup Values:** Snippets indicate values commonly used in the frontmatter's `laneid` or `columnid` to group files (`Essay`, `Project`, `Experience`, `Research`).
- **Colors:** A set of predefined Markdown compatible colors are provided such as `#FF6E19` (color-dm), `#AD4647` (color-ort-light), and `#003366` (color-howdy).
