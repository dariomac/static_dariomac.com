# Documentation for `notes-builder.mjs`

The `notes-builder.mjs` script is used to import content from an external Obsidian Vault and transform it into `.dmd` (Dariomac Markdown) files understandable by the primary static site generator (`builder.mjs`). 

## Usage

```bash
node notes-builder.mjs [inputPath] [outputPath]
```

- `inputPath`: The path to the Obsidian Vault.
- `outputPath`: The directory where the generated `.dmd` files and extracted assets should be placed (outputs to `[outputPath]notes/` directory). 

## Dependencies

The script relies on several external packages defined in `package.json`:
- `obsidian-vault-parser`: Parses the Obsidian vault files and frontmatter.
- `fs-extra`: Extended file system operations.
- `url-slug`: Used for generating URL-friendly slugs for filenames.
- `command-line-args`: Used for parsing arguments.
- `webp-converter`: Used via the `cwebp` command to convert images into `.webp` versions to heavily optimize them.
- `fs` and `path`: Built-in Node modules.

## How it works

### 1. File Selection and Filtering
When reading the vault, the script filters the notes based on strict rules:
- Reads the note's frontmatter configuration.
- Includes files ONLY if their `tags` array contains the tag `dm.com`.
- Excludes files that are inside a `/Templates/` directory.

### 2. File Generation and Frontmatter Transformation
For each eligible note, it creates a new `.dmd` file whose name is based on the kebab-case version of the note's title. It builds the JSON context for the DMD `[frontmatter]`. It maps fields and specifies default parameters:
- General fields: `date`, `updated_date`, `layout` ("document"), `title`, `canonical`.
- `card` block (metadata used by lanes / lists): Configures the lane IDs ("Essay"), column IDs, position (date based), and tags.
- Note: if the Lane is "Essay" and the column is either "requested_1" or "progress_2", it adds `"noIndex": true` to the DMD parameters, preventing search engine indexing.

### 3. Content Transformation
The raw Markdown content format extracted from Obsidian is heavily transformed and mapped to the `.dmd` layout block format:
- `[summary:string]`: Filled with the note's `card.content`.
- `[pub_date:string]`
- `[short_description:string]`
- `[body:md]`: The parsed note body itself.
- `[acknowledgments:md]`, `[further_reading:md]`
- `[significant_revisions:md]`: Timestamp logic specifying the publication date.

#### Link Conversion
Inside the `[body:md]`, `notes-builder.mjs` converts Obsidian's wiki-links notation (e.g., `[[Note Title|Alias]]`) into standard Markdown links (`[Alias](/path-to-alias)`). If a note doesn't physically exist in the parse graph, it just outputs the raw text to prevent broken links.

#### Image Processing 
When discovering an Obsidian embedded image (`![[Image Name.jpg]]`), it maps it back to its original location inside the Obsidian Vault under `Organization/Attachments/`.
- It copies the image into the `assets/` folder in the generated `outputPath`.
- It dynamically uses the `webp-converter` to generate an optimized `.webp` file running `-q 80`.
- It rewrites the embed in the Markdown file, changing it to standard Markdown layout notation and injecting the `#center` trick (`![Image Name.jpg](/assets/Image Name.jpg#center)`).
