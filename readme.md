Custom static site generator implemented in **NodeJS+Handlebars** (see _the whole story_ [here](https://dariomac.com/finish-this-website) and _more details_ [here](https://dariomac.com/static-website-generator)). It takes content from a custom ‘**YAML** front matter’ files that include different sections with markdown content. Later, the front matter part is used to build the navigation and categorization of the website while the **markdown** is translated to HTML. Finally everything is saves as static HTML files to provide high performance server-side transference and client-side rendering.

To build static html files for dariomac.com website
```
yarn build
```

To start the server
```
yarn start
```

Below there are some notes that I did (in the long history of my website), some of them are being included in the 'dmd_snippets.code-snippets' file to make things a bit easier.

List of console colors:
https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

editor online para pasar html a commonmark markdown:
https://domchristie.github.io/to-markdown/

the-online-slug-generator:
https://blog.tersmitten.nl/slugify/

Columns
-----
_Added to already in dmd_snippets.code-snippets file_

requested_1, progress_2, done_3


Lanes
-----
_Added to already in dmd_snippets.code-snippets file_

Article, Education, Me, Experience, Quote, Essay


Colors
------
_Added to already in dmd_snippets.code-snippets file_

```
colors['ort_light'] = '#AD4647';
colors['ort']       = '#8C0202';
colors['soft']      = '#77D477';
colors['dm']        = '#FF6E19';
colors['vairix']    = '#00A651';
```

Center images with commonmark and css class
-------------------------------------------
```![Legendario Rum's bottle](/assets/legendario-rum.jpg#center)```


Image gallery
-------------
_Added to already in dmd_snippets.code-snippets file_
```
[related_images:json]
  [{
    "filename": "exp_wbc_class.jpg"
  },{
    "filename": "exp_wbc_course0.jpg"
  },{
    "filename": "exp_wbc_course1.jpg"
  },{
    "filename": "exp_wbc_course2.jpg"
  },{
    "filename": "exp_wbc_course3.jpg"
  },{
    "filename": "exp_wbc_course4.jpg"
  },{
    "filename": "exp_wbc_course5.jpg"
  },{
    "filename": "exp_wbc_course6.jpg"
  },{
    "filename": "exp_wbc_course7.jpg"
  },{
    "filename": "exp_wbc_course8.jpg"
  }]
```


Attachments
-----------
_Added to already in dmd_snippets.code-snippets file_
```
[attachments:json]
  [{
    "filename": "blablabla.pdf",
    "description": "This is the description of the filename."
  },{
    "filename": "blablabla2.pdf",
    "description": "This is the description of the filename2."
  }]
```

[internal:raw]
Original pptx: 8_hours_as_vairix_developer.pptx 

