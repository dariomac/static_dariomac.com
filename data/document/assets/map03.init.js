var dm_map3 = dm_map3 || function () {
    var markerSet, _loadMap = function (csModel) {
        jQuery.ajax({
            type: 'GET',
            url: 'map.svg',
            cache: false,
            dataType: 'xml',
            success: function (svgXML) {
                var paper;

                var svg = svgXML.getElementsByTagName('svg')[0];
                //var width = svg.getAttribute('width').replace('px', ''), height = svg.getAttribute('height').replace('px', ''); //LWH
                var width = svg.getAttribute('viewBox').split(' ')[2], height = svg.getAttribute('viewBox').split(' ')[3];

                //'board' is the id of the SVG container (div in this case)
                paper = ScaleRaphael('board', width, height);

                $('#board').css('width', '100%');
                //paper.changeSize($('#board').width(), $('#board').width(), false, true);
                paper.changeSize($('#board').width(), $('#board').width(), false, true);

                paper.importSVG(svg, {
                    path: {
                        'stroke-width': 0.1, //LWH, changes to map.xml
                        'stroke': '#fff',
                        'fill': '#e7e7e8',
                        beforeFn: function(attrs){
                            $('#log').append('<span>Before ctry "' + this.id + '" rendered. </span><br/>');
                        },
                        afterFn: function(svgNode, attrs){
                            $('#log').append('<span>After ctry "' + svgNode.id + '" rendered. </span><br/>');
                        }
                    },
                    g: {

                    }
                });

                if (Raphael.vml){
                    paper.setViewBox(0,0,960,497,true);
                    paper.setViewBox(0,0,960,497,true);
                }
                else{
                    paper.setViewBox(0,0,1100,497,true);
                }

                paper.chrome();
                paper.safari();
                paper.renderfix();

                markerSet = paper.set();
                markerSet.push(
                        paper.importSVG($.parseXML('<path fill="#968c6d" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="m172.90625,144.62694c0.33238,-10.01408 5.67558,-16.11752 8.90414,-21.44496c1.5851,-1.96032 2.5356,-4.45419 2.5356,-7.17097c0,-6.30482 -5.11118,-11.416 -11.416,-11.416c-6.30481,0 -11.41599,5.1114 -11.41599,11.416c0,2.57113 0.85036,4.94332 2.2847,6.85168c3.20392,5.40382 8.75627,11.54967 9.09532,21.76424c-0.00288,0.32661 -0.00578,0.65234 -0.00578,0.98471c0,-0.27286 0.00467,-0.54242 0.01199,-0.80974c0.00732,0.26732 0.01221,0.53688 0.01221,0.80974c-0.0002,-0.33237 -0.00333,-0.65831 -0.00621,-0.98471l0.00002,0.00002z"/>'))
                        //paper.importSVG($.parseXML('<g><path fill="#E0301E" d="M172.906,144.627c0.333-10.014,5.676-16.118,8.904-21.445c1.585-1.96,2.536-4.455,2.536-7.171c0-6.305-5.111-11.416-11.416-11.416c-6.305,0-11.416,5.111-11.416,11.416c0,2.571,0.85,4.943,2.285,6.852c3.204,5.404,8.756,11.549,9.095,21.764c-0.003,0.327-0.006,0.652-0.006,0.985c0-0.273,0.005-0.542,0.012-0.81c0.007,0.268,0.012,0.537,0.012,0.81C172.912,145.279,172.909,144.953,172.906,144.627L172.906,144.627z"/><path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M172.906,144.627c0.333-10.014,5.676-16.118,8.904-21.445c1.585-1.96,2.536-4.455,2.536-7.171c0-6.305-5.111-11.416-11.416-11.416c-6.305,0-11.416,5.111-11.416,11.416c0,2.571,0.85,4.943,2.285,6.852c3.204,5.404,8.756,11.549,9.095,21.764c-0.003,0.327-0.006,0.652-0.006,0.985c0-0.273,0.005-0.542,0.012-0.81c0.007,0.268,0.012,0.537,0.012,0.81C172.912,145.279,172.909,144.953,172.906,144.627L172.906,144.627z"/></g>'))
                    );
                markerSet.hide();

                $.each(csModel.cities, function (idx, ctry) {
                    var brightness = ctry.ranking/(185+60);

                    $('[id=' + ctry.id + ']', $('#board')).each(function(j, ctryPart){
                        var svgCity = paper.getById(ctryPart.id);
                        if (svgCity == null) return;

                        svgCity.attr({'fill' : Highcharts.Color('#ff4500').brighten(brightness).get()});

                        if (!dm_map3.csModel.isTouch) { //LWH
                            paper.bindEvents(svgCity, 'mouseover', function (el) {
                                if (dm_map3.csModel.isCtrySelected(ctry.id)) return;

                                this.attr('cursor', 'pointer');
                                this.attr({ 'stroke': '#fff', 'stroke-width': '1.5' });
                            });

                            paper.bindEvents(svgCity, 'mouseout', function (el) {
                                if (dm_map3.csModel.isCtrySelected(ctry.id)) return;

                                this.attr({ 'stroke': '#fff', 'stroke-width': '0.1' });
                            });
                        }

                        paper.bindEvents(svgCity, 'click', function (el) {
                            var ctryId = this.id.split('_')[0];
                            if (dm_map3.csModel.isCtrySelected(ctryId) || !dm_map3.csModel.setCityState(ctryId, true)) {
                                return;
                            }

                            dm_map3.paper.getById(ctryId).attr('cursor', 'default');

                            if (dm_map3.csModel.isTouch) { //LWH
                                dm_map3.csModel.hoveredCity(dm_map3.csModel.getCityById(ctryId));
                            }
                            var bbox = this.getBBox(true);
                            if (ctryId == 'us')
                                _cloneCityMarkTo(this.id, bbox.x+(bbox.width/2) + 70, bbox.y+(bbox.height/2)-(markerSet.getBBox().height/2)+70);
                            else
                                _cloneCityMarkTo(this.id, bbox.x+(bbox.width/2), bbox.y+(bbox.height/2)-(markerSet.getBBox().height/2));

                            _setCtrySelectorState(ctryId, true);
                        });
                    });
                });

                dm_map3.paper = paper;

                _loadQStringState();
            }
        });
    },

    _cloneCityMarkTo = function (newMarkId, x, y) {
        var newMarker = dm_map3.paper.moveScaledTo(markerSet.clone(), x, y, 1);
        newMarker.id = newMarkId; //temporally set the same id of the city to the marker.

        dm_map3.markerSetCollection[newMarker.id] = newMarker;

        dm_map3.paper.bindEvents(newMarker, 'click', function (el) {
            dm_map3.csModel.setCityState(newMarker.id, false);
            newMarker.remove();
            dm_map3.markerSetCollection[newMarker.id] = null;
            _setCtrySelectorState(newMarker.id, false);
        });

        if (!dm_map3.csModel.isTouch) {
            dm_map3.paper.bindEvents(newMarker, 'mouseover', function(el){
                this.attr({ 'stroke': '#fff', 'stroke-width': '1.5' });
            });
            dm_map3.paper.bindEvents(newMarker, 'mouseout', function (el) {
                this.attr({ 'stroke': '#fff', 'stroke-width': '0.1' });
            });
        }

        if (!dm_map3.csModel.isTouch) {
            dm_map3.paper.bindEvents(newMarker, 'mouseover,touchstart', function (el) { //LWH
                this.attr('cursor', 'pointer');
                dm_map3.csModel.hoveredCity(dm_map3.csModel.getCityById(newMarkId));
            });

            dm_map3.paper.bindEvents(newMarker, 'mouseout', function (el) { //LWH
                dm_map3.csModel.hoveredCity({});
            });
        }
    },

    _setCtrySelectorState = function(ctryId, state){
        var option = $('option[value=' + ctryId + ']');
        if (state)
            option.attr('selected', 'selected');
        else
            option.removeAttr('selected');

        $('.chzn-select').trigger("liszt:updated");

        var selectedItems = $('.chzn-select').find("option:selected");

        if (selectedItems.length == 0)
            $('#sel_ind').addClass('mapbtngo_disabled').removeClass('mapbtngo');
        else
            $('#sel_ind').addClass('mapbtngo').removeClass('mapbtngo_disabled');
    },

    _koBindings = function () {
        dm_map3.csModel = new dm_map3.model.CitySectorModel();
        ko.applyBindings(dm_map3.csModel, $('#maincontainer')[0]);

        ko.bindingHandlers.fadeVisible = {
            init: function (element, valueAccessor) {
                // Initially set the element to be instantly visible/hidden depending on the value
                var value = valueAccessor();
                $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
            },
            update: function (element, valueAccessor) {
                // Whenever the value subsequently changes, slowly fade the element in or out
                var value = valueAccessor();
                ko.utils.unwrapObservable(value.onOff) ? $(element).fadeIn(value.duration) : $(element).hide();
            }
        };

        ko.bindingHandlers.numericText = {
            update: function (element, valueAccessor, allBindingsAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                var positions = ko.utils.unwrapObservable(allBindingsAccessor().positions) || ko.bindingHandlers.numericText.defaultPositions;
                var formattedValue = parseFloat(value).toFixed(positions);
                var finalFormatted = ko.bindingHandlers.numericText.withCommas(formattedValue);

                ko.bindingHandlers.text.update(element, function () {
                    return finalFormatted;
                });
            },

            defaultPositions: 0,

            withCommas: function (original) {
                original += '';
                x = original.split('.');
                x1 = x[0];
                x2 = x.length > 1 ? '.' + x[1] : '';
                var rgx = /(\d+)(\d{3})/;
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + ',' + '$2');
                }
                return x1 + x2;
            }
        }
    },

    _loadQStringState = function () {
        var qs = dm_map3.helpers.parseParams(document.location.href);

        if (qs['c'] && qs['i']) {
            var cities = qs['c'].split('-'),
                industries = qs['i'].split('-');

            $.each(cities, function (i, cityId) {
                var city = dm_map3.csModel.getCityById(cityId);
                if (city == null) return;

                city.isSelected(true);

                var svgCity = dm_map3.paper.getById(cityId);
                _cloneCityMarkTo(cityId, svgCity.attrs['cx'], svgCity.attrs['cy']);
            });

            $.each(industries, function (i, industryId) {
                var industry = dm_map3.csModel.getIndustryById(industryId);
                if (industry == null) return;

                industry.isSelected(true);
            });

            dm_map3.csModel.openPopup();
            dm_map3.csModel.toggleChart();
        }
    }

    return {
        paper: {},
        markerSetCollection: [],
        csModel: {},

        init: function () {
            _koBindings();
            $('.chzn-select').chosen({max_selected_options :5}).change(function(){
                    var selectedItems = $(this).find("option:selected");
                    if (selectedItems.length > 1)
                        $('.chzn-select').trigger("liszt:updated");

                    dm_map3.csModel.clearSelectedCities();

                    $.each(selectedItems, function(i,v){
                        var ctryId = $(v).val();

                        dm_map3.csModel.setCityState(ctryId, true);

                        var bbox = dm_map3.paper.getLikeId(ctryId).getBBox();
                        if (ctryId == 'us')
                            _cloneCityMarkTo(ctryId, bbox.x+(bbox.width/2) + 70, bbox.y+(bbox.height/2)-(markerSet.getBBox().height/2)+70);
                        else
                            _cloneCityMarkTo(ctryId, bbox.x+(bbox.width/2), bbox.y+(bbox.height/2)-(markerSet.getBBox().height/2));
                    });
                });
            _loadMap(this.csModel);
        },
        data: {},
        model: {},
        helpers: {}
    }
} ();

dm_map3.helpers.parseParams = function(s) {
    var params = new Array();
    var v = 1;
    q = s.indexOf('?');
    if (q != -1) {
        t = s.slice(q+1);
        t = t.replace(/%26/gi,"&");
        z = t.split('&');
        for (i=0;i<z.length;i++) {
            if (z[i] != "") {
                v = z[i].split('=');
                params[v[0]] = v[1];
            }
        }
    }
    return params;
}

dm_map3.helpers.getQueryString = function() { //LWH
    var qstr = '';

    var citiesStr = '';
    var indsStr = '';

    for (var cityIdx in dm_map3.csModel.selectedCities())
    {
        var city = dm_map3.csModel.selectedCities()[cityIdx];
        if (citiesStr.length > 0)
            citiesStr += "-";
        citiesStr += city.id;
    }

    for (var varIdx in dm_map3.csModel.selectedVariables())
    {
        var variable = dm_map3.csModel.selectedVariables()[varIdx];
        if (indsStr.length > 0)
            indsStr += "-";
        indsStr += variable.id;
    }
    qstr = 'c=' + citiesStr + '%26i=' + indsStr;
    return qstr;
}

dm_map3.helpers.setShareUrls = function() { }


//Usage: var p = parseParams(document.location.href);
//       var parameter = p['paramName'];


$(function() {
    dm_map3.init();
});
