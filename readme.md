List of console colors:
https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

editor online para pasar html a commonmark markdown:
https://domchristie.github.io/to-markdown/

diff --brief -r www www_orig

the-online-slug-generator
https://blog.tersmitten.nl/slugify/

Columns
-----

requested_1, progress_2, done_3



Lanes
-----

Article, Education, Me, Experience, Quote, Essay



Colors
------

colors['ort_light'] = '#AD4647';
colors['ort']       = '#8C0202';
colors['soft']      = '#77D477';
colors['dm']        = '#FF6E19';
colors['vairix']    = '#00A651';


Center images with commonmark and css class
-------------------------------------------
![Legendario Rum's bottle](/assets/legendario-rum.jpg#center)


Image gallery
-------------

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



Attachments
-----------

[attachments:json]
  [{
    "filename": "blablabla.pdf",
    "description": "This is the description of the filename."
  },{
    "filename": "blablabla2.pdf",
    "description": "This is the description of the filename2."
  }]


[internal:raw]
Original pptx: 8_hours_as_vairix_developer.pptx  



EntryDetail Template
--------------------

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Darío Macchi | {{title}}</title>

    <!--#include virtual="../common/_common_html_header.html" -->

    <script type="text/javascript" src="/assets/vendor/jquery.fancybox/jquery.fancybox.pack.js"></script>
    <script type="text/javascript" src="/assets/js/kanbancv.js"></script>

    <script type="text/javascript">
      $(function() {
        //board_dimensions.init(); //draw_kanban_board(boardArray, false, tasksArray, false);
        afterContentDraw();

        $(".fancybox").fancybox({
          openEffect  : 'none',
          closeEffect : 'none'
        });
      });
    </script>

  </head>
  <body itemscope itemtype="http://schema.org/WebPage">
    <div class="wrapper">
      <div class="header">
        <div class="center"></div>
      </div>
      <div class="board_view">
        <!--#include virtual="../common/_page_header.html" -->
        <div id="board_container">
          <div class="content entry">
            <%= yield %>
          </div>
        </div>
      </div>
    </div>
    <!--#include virtual="../common/_page_footer.html" -->

  </body>
</html>

