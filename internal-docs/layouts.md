# Layouts Overview

This document provides a high-level overview of the layouts used in the project, located in the `layouts/` directory.

The project uses **Handlebars (`.hbs`)** templates for layouts. Corresponding `.dmd` files often accompany these layouts, serving as schemas or templates for generating content files with the appropriate frontmatter.

## Layout Files

Below is a list of the layouts and their primary purposes:

### Contextual Layouts

*   **`index.hbs`**: The main homepage layout. It renders the dashboard-style view with various sections (Me, Experience, Education, etc.) and handles the "kanban" board visualization.
*   **`resume.hbs`**: A specialized layout for the printable resume. It includes specific print styles and formats content (experience, education, etc.) for a professional CV output.
*   **`dm-searcher.hbs`**: hosted the "DM-Searcher" tool, providing a user interface to search and transform the site's data.
*   **`inventory.hbs`**: A non-HTML layout that outputs content as a JSON array. Used for generating data feeds or API-like responses.

### Content Type Layouts

These layouts are typically used to render specific types of content or detail pages:

*   **`article.hbs`**: Layout for articles and blog posts. Includes standard article elements like title, summary, authors, and content body.
*   **`project.hbs`**: Layout for displaying project details.
*   **`research.hbs`**: Layout for research papers or entries.
*   **`essay.hbs`** (implied from usage, though `essays.hbs` exists): Likely for individual essays or the essays section.
*   **`education.hbs`**: For education-related entries or sections.
*   **`experience.hbs`**: For professional experience entries.
*   **`quote.hbs`**: For displaying quotes.
*   **`me.hbs`**: Used for the "Me" section or personal details.
*   **`about-me.hbs`**: Layout for the specific "About Me" page.

### Utility & SEO Layouts

*   **`sitemap.hbs`**: Generates the HTML sitemap.
*   **`sitemap_xml.hbs`**: Generates the XML sitemap for search engines.
*   **`robots_txt.hbs`**: Generates the `robots.txt` file.

## Structure & Usage

*   **Partials**: Layouts extensively use partials (e.g., `{{> _page-header }}`, `{{> _common-html-header }}`) to reuse common UI components like headers, footers, and metadata blocks.
*   **Helpers**: Custom Handlebars helpers (e.g., `resumeGrep`, `fullname`, `json`) are used to process data, format strings, and handle logic within the templates.
*   **Frontmatter**: Layouts rely on data provided via frontmatter in the content files (defined in the corresponding `.dmd` schemas).

## .dmd Files (Templates)

Files with the `.dmd` extension (e.g., `article.dmd`) located in the `layouts/` directory serve as **scaffolding templates**. They contain the required frontmatter structure and section headers for their corresponding layout.

**Template Mapping:**

| Layout (`.hbs`)  | Template (`.dmd`) | Documentation                                  |
|:-----------------|:------------------|:-----------------------------------------------|
| `article.hbs`    | `article.dmd`     | [Article Docs](dmd-templates/article.md)       |
| `project.hbs`    | `project.dmd`     | [Project Docs](dmd-templates/project.md)       |
| `document.hbs`   | `document.dmd`    | [Document Docs](dmd-templates/document.md)     |
| `education.hbs`  | `education.dmd`   | [Education Docs](dmd-templates/education.md)   |
| `experience.hbs` | `experience.dmd`  | [Experience Docs](dmd-templates/experience.md) |
| `me.hbs`         | `me.dmd`          | [Me Docs](dmd-templates/me.md)                 |
| `quote.hbs`      | `quote.dmd`       | [Quote Docs](dmd-templates/quote.md)           |
| `research.hbs`   | `research.dmd`    | [Research Docs](dmd-templates/research.md)     |

Refer to the specific documentation in `internal-docs/dmd-templates/` for details on how to fill out the frontmatter and content sections for each type.
