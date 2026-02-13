# 2static Project Guide for Agents

This document serves as a comprehensive guide for AI agents and developers working on the `2static` project, a custom static site generator (SSG) for `dariomac.com`.

## 1. Project Overview

-   **Type**: Custom Static Site Generator (SSG)
-   **Core Technologies**: Node.js, Handlebars (`.hbs`), CommonMark
-   **Goal**: Converts custom `.dmd` (Dariomac Markdown) files into static HTML.
-   **Key Features**:
    -   **Zettelkasten Backlinks**: Automatically generates a graph of internal links.
    -   **Double-pass Build**: First pass for backlinks, second for HTML generation.
    -   **Custom Format**: `.dmd` files mix JSON frontmatter with content sections.

## 2. Key Commands (from `package.json`)

| Command               | Description                                                                         |
|:----------------------|:------------------------------------------------------------------------------------|
| `npm run build`       | **Production Build**: Cleans `.DS_Store` and runs `builder.mjs` with `--clear-all`. |
| `npm run dev`         | **Development Server**: Starts server on port 7007 (`PORT=7007 node server.mjs`).   |
| `npm start`           | **Production Server**: Starts server (`node server.mjs`).                           |
| `npm run build-notes` | Imports and builds notes from an external Obsidian vault.                           |
| `npm run build-all`   | Runs `build-notes` followed by `build`.                                             |
| `npm run watch`       | Watches for changes in `.dmd`, `.hbs`, `.js`, `.css` and restarts server.           |

## 3. Project Structure

-   **`root/`**: Root configuration files.
-   **`data/`**: **Source Content**. Contains the `.dmd` files that define the website pages.
-   **`layouts/`**: **Templates**. Handlebars (`.hbs`) layout files used to render pages.
-   **`www/`**: **Output**. The generated static website resides here.
-   **`assets/`**: Static assets (images, styles). Copied to `www/assets` during build.
-   **`internal-docs/`**: Project documentation. **READ THESE FIRST**:
    -   [Builder Documentation](internal-docs/builder.md): Details on `builder.mjs` and the build process.
    -   [Layouts Documentation](internal-docs/layouts.md): Overview of available layouts and their purposes.
-   **`lib/`**: Core logic scripts (`2static.mjs`, `2zettelkasten.mjs`, `utils.mjs`).

## 4. Core Concepts

### The `.dmd` File Format
Files in `data/` use a custom format with two main parts separated by `---`:
1.  **JSON Frontmatter**: Metadata (title, layout, date, tags).
2.  **Sections**: Content blocks defined by headers like `[content:md]` or `[meta:json]`.

**Example:**
```text
{
  "title": "My Page",
  "layout": "post"
}
---
[content:md]
# Hello World
This is the content.
```

### The Build Process (`builder.mjs`)
1.  **Scans** `data/` for `.dmd` files.
2.  **Pass 1**: Indexes all files to build a global backlink graph.
3.  **Pass 2**: Generates HTML for each file, injecting backlink data and applying the specified Handlebars layout.

### Layouts
-   Located in `layouts/`.
-   Use standard Handlebars syntax.
-   Common layouts: `index.hbs` (home), `article.hbs` (posts), `project.hbs` (projects).
-   Layouts often have corresponding `.dmd` files in `layouts/` acting as schemas (e.g., `layouts/article.dmd`).

## 5. Development Workflow
1.  **Edit Content**: Modify `.dmd` files in `data/`.
2.  **Edit Layouts**: Modify `.hbs` files in `layouts/`.
3.  **Preview**: Run `npm run dev` and view at `http://localhost:7007`.
4.  **Rebuild**: Structure changes often require a full `npm run build` or restart of the watcher.

## 6. Creating New Content

To create a new page, you generally start by copying a **template** from the `layouts/` directory.

1.  **Choose a Layout**: Identify the content type (e.g., `article`, `project`).
2.  **Copy Template**: Copy the corresponding `.dmd` file from `layouts/` (e.g., `layouts/article.dmd`) to the `data/` directory.
3.  **Rename**: Rename the file to your desired slug (e.g., `data/my-new-post.dmd`).
4.  **Fill Placeholders**:
    -   Templates contain placeholders like `<title>`, `<creation_date>`.
    -   Replace these with actual values.
    -   Consult the [DMD Templates Documentation](internal-docs/dmd-templates/) for detailed field descriptions.
