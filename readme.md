Custom static site generator implemented in **NodeJS+Handlebars** (see _the whole story_ [here](https://dariomac.com/finish-this-website) and _more details_ [here](https://dariomac.com/static-website-generator)). It takes content from a custom ‘**YAML** front matter’ files that include different sections with markdown content. Later, the front matter part is used to build the navigation and categorization of the website while the **markdown** is translated to HTML. Finally everything is saves as static HTML files to provide high performance server-side transference and client-side rendering.

## Build and Development Commands

### Production Build
To build the static HTML files for the dariomac.com website:
```bash
npm run build
```

**How the build script works:**
The `build` script executes `node builder.mjs data/ www/ layouts/ --clear-all` after cleaning up `.DS_Store` files. 
The build process runs in two main passes:
1. **Backlink Generation (Pass 1):** Scans all custom `.dmd` (Dariomac Markdown) files in the `data/` directory to build a global graph of internal links (Zettelkasten style).
2. **Static HTML Generation (Pass 2):** Converts the content to HTML, injecting internal backlinks and applying the specified Handlebars templates from the `layouts/` directory. Static assets are also copied to the final `www/` output directory.

*For more detailed information on the builder's architecture and the `.dmd` file format, see [internal-docs/builder.md](internal-docs/builder.md).*

### Start Server
To start the production server:
```bash
npm run start
```

### Development Server
To start the development server with live preview (port 7007):
```bash
npm run dev
```

Below there are some notes that I did (in the long history of my website), some of them are being included in the 'dmd_snippets.code-snippets' file to make things a bit easier.

List of console colors:
https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

online editor to convert html to commonmark markdown:
https://domchristie.github.io/to-markdown/

online slug generator:
https://blog.tersmitten.nl/slugify/

## Internal snippets

This is a list of snippets intended to be used inside the dmd's files.

### Center images with commonmark and css class
```![Legendario Rum's bottle](/assets/legendario-rum.jpg#center)```

### Add extra data that won't be visible on the built site.
[internal:raw]
Original pptx: 8_hours_as_vairix_developer.pptx 
