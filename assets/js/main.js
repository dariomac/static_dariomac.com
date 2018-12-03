// open/close lateral filter
$('.dm-filter-trigger').on('click', function (){
  triggerFilter(true);
});
$('.dm-filter .dm-close').on('click', function (){
  triggerFilter(false);
});

function triggerFilter ($bool) {
  var elementsToTrigger = $([$('.dm-filter-trigger'), $('.dm-filter'), $('.dm-tab-filter'), $('.dm-board')]);

  elementsToTrigger.each(function (){
    $(this).toggleClass('filter-is-visible', $bool);
  });
}

// mobile version - detect click event on filters tab
var filter_tab_placeholder = $('.dm-tab-filter .placeholder a'),
  filter_tab_placeholder_default_value = 'Select',
  filter_tab_placeholder_text = filter_tab_placeholder.text();

$('.dm-tab-filter li').on('click', function(event){
  var eTarget = $(event.target);

  // detect which tab filter item was selected
  var selected_filter = eTarget.data('type');

  // check if user has clicked the placeholder item
  if( eTarget.is(filter_tab_placeholder) ) {
    (filter_tab_placeholder_default_value == filter_tab_placeholder.text()) ? filter_tab_placeholder.text(filter_tab_placeholder_text) : filter_tab_placeholder.text(filter_tab_placeholder_default_value) ;
    $('.dm-tab-filter').toggleClass('is-open');

  // check if user has clicked a filter already selected
  }
  else if( filter_tab_placeholder.data('type') == selected_filter ) {
    filter_tab_placeholder.text(eTarget.text());
    $('.dm-tab-filter').removeClass('is-open');

  }
  else {
    // close the dropdown and change placeholder text/data-type value
    $('.dm-tab-filter').removeClass('is-open');
    filter_tab_placeholder.text(eTarget.text()).data('type', selected_filter);
    filter_tab_placeholder_text = eTarget.text();

    //add class selected to the selected filter item
    $('.dm-tab-filter .selected').removeClass('selected');
    eTarget.addClass('selected');

    var filterValue = eTarget.attr('data-filter');
    [].forEach.call(isotopables, (iso) => {
      iso.arrange({ filter: filterValue});
    });
  }
});

// close filter dropdown inside lateral .dm-filter
$('.dm-filter-block h4').on('click', function(){
  $(this).toggleClass('closed').siblings('.dm-filter-content').slideToggle(300);
})

// fix lateral filter and gallery on scrolling
$(window).on('scroll', function(){
  (!window.requestAnimationFrame) ? fixGallery() : window.requestAnimationFrame(fixGallery);
});

function fixGallery() {
  var offsetTop = $('.dm-main-content').offset().top,
    scrollTop = $(window).scrollTop();
  ( scrollTop >= offsetTop ) ? $('.dm-main-content').addClass('is-fixed') : $('.dm-main-content').removeClass('is-fixed');
}

$(function(){
  window.isotopables = [];

  [].forEach.call(document.querySelectorAll('.iso'), (elem)=>{
    isotopables.push(new Isotope( elem, {
      itemSelector: '.task',
      masonry: {
        columnWidth: 170,
        gutter: 5
      },
      getSortData: {
        position: function ( elem ) {
          return (parseInt($(elem).attr('data-order')) || 0);
        }
      },
      sortBy: 'position',
      sortAscending : false
    }));
  });

  afterContentDraw();

  $('.footer').show();

  if (location.href.indexOf('file://') ===0) {
    $.each(tasksArray, function(i, v){
      v.linkto = v.linkto.substr(1, v.linkto.length) + '.html';
    });
  }
});
