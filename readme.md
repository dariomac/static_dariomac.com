Custom static site generator implemented in **NodeJS+Handlebars** (see _the whole story_ [here](https://dariomac.com/finish-this-website) and _more details_ [here](https://dariomac.com/static-website-generator)). It takes content from a custom ‘**YAML** front matter’ files that include different sections with markdown content. Later, the front matter part is used to build the navigation and categorization of the website while the **markdown** is translated to HTML. Finally everything is saves as static HTML files to provide high performance server-side transference and client-side rendering.

To build static html files for dariomac.com website
```
nom run build
```

To start the server
```
npm run start
```

Below there are some notes that I did (in the long history of my website), some of them are being included in the 'dmd_snippets.code-snippets' file to make things a bit easier.

List of console colors:
https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

editor online para pasar html a commonmark markdown:
https://domchristie.github.io/to-markdown/

the-online-slug-generator:
https://blog.tersmitten.nl/slugify/

## Internal snippets

This is a list of snippets intended to be used inside the dmd's files.

### Center images with commonmark and css class
```![Legendario Rum's bottle](/assets/legendario-rum.jpg#center)```

### Add extra data that won't be visible on the built site.
[internal:raw]
Original pptx: 8_hours_as_vairix_developer.pptx 

# Layouts and partials

## Layouts

```html

_critical
_common-html-header
_page-header
_mobile-menu
  about-me
  article
  dm-searcher
  document
  education
  experience
  me
  project
  quote
  research
_entry-gallery
_entry-attachments
_entry-related-topics
_entry-backlinks
_orange-box
_page-footer
_code-styler
_common-html-footer

_critical
_common-html-header
_page-header
_mobile-menu
  essays
  sitemap
_entry-backlinks
_orange-box
_page-footer
_common-html-footer

_common-html-header
_page-header
  index
  _task
_orange-box
_page-footer

inventory
resume
robots_txt
sitemap_xml

UNUSED
_title.html
```
