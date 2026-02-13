# Documentation for `builder.mjs`

The `builder.mjs` script is the core build tool for the static site generator used in this project. It orchestrates the process of converting `.dmd` (custom Markdown-based format) files into static HTML pages, handling backlinks (Zettelkasten style), and managing assets.

## Overview

The build process runs in two main passes:
1.  **Backlink Generation**: Scans all content to build a graph of internal links.
2.  **Static Site Generation**: Converts content to HTML, injecting backlinks and applying layouts.

## Usage

```bash
node builder.mjs [inputPath] [outputPath] [layoutPath] [--clear-all | -c] [--verbose | -v]
```

### Arguments

*   `inputPath`: Path to the directory containing source content (e.g., `./content/`).
*   `outputPath`: Path where the generated site will be output (e.g., `./public/`).
*   `layoutPath`: Path to the directory containing Handlebars layouts (e.g., `./layouts/`).

### Options

*   `--clear-all`, `-c`: Clears the output directory before building.
*   `--verbose`, `-v`: Enables verbose logging (currently limited usage).

## Components

### 1. `builder.mjs` (Entry Point)
*   **Role**: Orchestrator.
*   **Functionality**:
    *   Parses command-line arguments using `command-line-args`.
    *   Defines paths for input, output, layouts, and assets.
    *   Executes the build pipeline:
        1.  Calls `lib/2zettelkasten.mjs` to generate backlinks.
        2.  Calls `lib/2static.mjs` to generate the static site.

### 2. `lib/2zettelkasten.mjs`
*   **Role**: Backlink Indexer.
*   **Functionality**:
    *   Recursively scans the `inputPath` for `.dmd` files.
    *   Parses each file using `utils.generateDmdObject` to find internal links.
    *   Builds a `backlinks` object mapping `target_slug -> source_page[]`.
    *   **Filtering**: Only links starting with `/` (that are not assets) or containing `dariomac.com` are considered internal links.

### 3. `lib/2static.mjs`
*   **Role**: Static Site Generator.
*   **Functionality**:
    *   **Initialization**: Registers Handlebars partials from `../common`.
    *   **Assets**: Copies assets from `./assets` and `inputPath/**/assets` to `outputPath/assets`.
    *   **Conversion**: Recursively processes `.dmd` files.
    *   **Rendering**:
        *   Uses `lib/utils.mjs` to parse `.dmd` files.
        *   Injects `backlinks` into the page object.
        *   Applies the Handlebars layout specified in the frontmatter.
        *   Compiles content using Handlebars (allowing dynamic content).
        *   Writes the final HTML to `outputPath`.
    *   **Collections**: Handles pages with `mode: collection` (e.g., Kanban boards). These are aggregated and processed at the end, sorting items into "lanes" based on frontmatter.

### 4. `lib/utils.mjs`
*   **Role**: Shared Utilities & Parsing.
*   **Functionality**:
    *   **`generateDmdObject`**: Parses the custom `.dmd` file format around a "Frontmatter + Sections" structure.
        *   **Sections**: Defined by `[name:type]` headers (e.g., `[content:md]`, `[meta:json]`).
        *   **Types**: `md` (Markdown), `json`, `string`.
    *   **Markdown Rendering**: Uses `commonmark` with a custom renderer.
        *   Adds anchors to headers.
        *   Process images to support WebP/Picture tags.
        *   collects links for the backlink graph.
    *   **Handlebars Helpers**: Custom helpers for logic, formatting, and specific site features (e.g., `date`: `compare`, `highlight`).

## File Format (.dmd)

The source content uses a custom format consisting of:
1.  **JSON Frontmatter**: Metadata like title, date, layout, tags.
2.  **Sections**: Content blocks defined by `[section_name:type]`.

Example:
```
{
  "title": "My Page",
  "layout": "post",
  "date": "2023-10-27"
}
---
[content:md]
# Hello World
This is a markdown section.
```

## Related Tools

### `notes-builder.mjs`
A separate script used to import content from an Obsidian Vault. It converts Markdown notes into the `.dmd` format expected by `builder.mjs`, handling tasks like:
*   Converting Obsidian wiki-links (`[[Note]]`) to standard Markdown links.
*   Converting images to WebP format.
*   Structuring the `.dmd` file with appropriate metadata and sections.
