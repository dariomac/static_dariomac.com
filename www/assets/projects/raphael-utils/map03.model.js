dm_map3.model.CitySectorModel = function(){
	var self = this;

	self.cities = ko.observableArray([]);
	self.variables = ko.observableArray([]);

	self.isVariableSelVisible = ko.observable(false);
	self.isChartVisible = ko.observable(false);

	self.hoveredCity = ko.observable({});
	self.renderedCharts = new Array(3);
	self.errMessage = ko.observable(null);

	self.isMobile = typeof jsdevice === 'undefined' ? false : jsdevice == 'mobile'; //LWH
	self.isTouch = 'ontouchstart' in document.documentElement;

	self.selectedVariables = function() {
		return $.grep(self.variables(), function(variable, idx){
			return variable.isSelected();
		});
	};

	self.selectedCities = function() { //LWH
		return $.grep(self.cities, function(city, idx){
			return city.isSelected;
		});
	}

	self.isCtrySelected = function(ctryId){
		return $.grep(self.selectedCities(), function(v,i){ return v.id==ctryId; }).length > 0;
	}

	self.isMainGoVisible = ko.computed(function(){
		return (!self.isVariableSelVisible() && !self.isChartVisible() /*&& self.selectedCities().length > 0*/);
	}, this);

	self.isSecondGoVisible = ko.computed(function(){
		return (self.isVariableSelVisible() && !self.isChartVisible() && self.selectedVariables().length > 0);
	}, this);

	self.setCityState = function(cityId, selected){
		if (selected && self.selectedCities().length>=5){
			self.displayMessage('You can select up to 5 countries');
			return false;
		}

		var city = self.getCityById(cityId);
		if(city == null) return false;

		//city.isSelected(selected);
		city.isSelected = selected;

		return true;
	}

	self.clearSelectedCities = function(){
		for(var ctryIdx in  dm_map3.markerSetCollection){
			var ctryMarker =  dm_map3.markerSetCollection[ctryIdx];
			if(ctryMarker==null) continue;

			self.setCityState(ctryMarker.id, false);
			dm_map3.markerSetCollection[ctryIdx] = null;
			ctryMarker.remove();
		}
	}

	self.setVariableState = function(variable){
		if (self.selectedVariables().length > 0)
			self.selectedVariables()[0].isSelected(false);

		variable.isSelected(true);
	}

	self.getCityById = function(cityId){
		for(var cityIdx=0; cityIdx<self.cities.length; cityIdx++){
			if (self.cities[cityIdx].id == cityId.split('_')[0]){
				return self.cities[cityIdx];
			}
		}
		return null;
	}

	self.getIndustryById = function(industryId){
		for(var indIdx=0; indIdx<self.variables().length; indIdx++){
			if (self.variables()[indIdx].id == industryId){
				return self.variables()[indIdx];
			}
		}
		return null;
	}

	self.openPopup = function(){
		if (self.selectedCities().length == 0){ //no city selected
			self.displayMessage('Please select at least one country to continue.');
			return;
		}

		if (!self.isMainGoVisible()) //popup is already opened
			return;

		self.isVariableSelVisible(true);
	}

	self.closePopup = function(){
		self.isChartVisible(false);
		self.isVariableSelVisible(false);
	}

	self.toggleChart = function(){
		if (self.selectedVariables().length == 0){
			self.displayMessage('Please select at least one indicator to continue.');
			return;
		}
		self.isVariableSelVisible(!self.isChartVisible());
		self.isChartVisible(!self.isChartVisible());

		if(self.isChartVisible()){
			new dm_map3.model.Chart().showChart();
		}
		else{
			self.clearSelectedCities();
			$('.chzn-select').find("option:selected").removeAttr("selected");
			$('.chzn-select').trigger("liszt:updated");
		}
	}

	self.displayMessage = function(msg){
		self.errMessage(msg);
		setTimeout(function(){
			self.errMessage(null);
		}, 1500);
	}


	self.cities = dm_map3.data.cities;

	$.each(dm_map3.data.variables, function(idx, jsonVariable){
		self.variables.push(new dm_map3.model.Variable(jsonVariable));
	});
}

/*dm_map3.model.City = function(jsonCity){
	var self = this;

	self.id = jsonCity.id;
	self.name = jsonCity.name;
	self.ranking = jsonCity.ranking;
	self.isSelected = ko.observable(false);
	self.series = jsonCity.series;

	self.getName = function(){
		return self.name;
	}
}*/

dm_map3.model.Variable = function(jsonVariable){
	var self = this;

	self.id = jsonVariable.id;
	self.name = jsonVariable.name;
	self.isSelected = ko.observable(false);
}

dm_map3.model.Chart = function () {
    var self = this;

    self.showChart = function () {
        $.each(dm_map3.csModel.renderedCharts, function (idx, chart) {
            if (chart && chart.destroy) {
                chart.destroy();
                chart = null;
            }
        });

        var varIdx = dm_map3.csModel.selectedVariables()[0].id.split('_')[1];

        $.each(dm_map3.data.seriesNames[varIdx], function(serieNameIdx, serieName){
        	var data = [];
			$.each(dm_map3.csModel.selectedCities(), function(ctryIdx, ctry){
				if (serieNameIdx == 0 ) chartOpts.xAxis.categories.push(ctry.name);
				var value = ctry.series[varIdx].data[serieNameIdx];
				data.push(value);
			});
			chartOpts.series.push({name: serieName, data: data});
		});

        chartOpts.chart.renderTo = 'cc1';
        chartOpts.yAxis.labels.enabled = true;

        chartOpts.chart.spacingLeft = 10;
        dm_map3.roundTo = varIdx == 0 ? 1 : 0
        dm_map3.csModel.renderedCharts[0] = new Highcharts.Chart(chartOpts);

        dm_map3.helpers.setShareUrls();
    }

    var chartOpts = {
        chart: {
        renderTo: '',
        defaultSeriesType: 'bar',
        width: 500,
        height: 400,
        spacingBottom: 35,
        marginTop: null,
        marginLeft: null
        },
		colors: ['#dc6900', '#e0301e','#a32020'],
        title: {
           text:  dm_map3.csModel.selectedVariables()[0].name,
        align: 'left',
		style: {
			width: '500px'
		}
        },
        subtitle: {
            text: '',
            align: 'left'
        },
        credits: {
            enabled: true,
        text: '\u003cb\u003eSource:\u003c/b\u003e <a href="http://www.dariomac.com">Darío Macchi</a>.',
        href: '',
        position: {
            align: 'left',
            x: 10,
            verticalAlign: 'bottom',
            y: -20
        }
        },
        xAxis: {
            title: {
                text: ''
            },
        categories: [ ],
        labels : { enabled: true }
        },
        yAxis: {
            min: null,
                    max: null,
                    title: {
                        text: ''
                    },
                    labels: {
                        formatter: function() { return this.value; }
                    },
                    opposite: false,
					stackLabels: {
                    	enabled: true,
                    	style: {
                        	fontWeight: 'bold',
                        	color: '#6d6e71'
                    	},
                    	formatter: function() { return Highcharts.numberFormat(this.total, dm_map3.roundTo, '.', ',');}
                	}
                },
    legend: {
        enabled: true,
			borderColor: '#fff',
            backgroundColor: '#FFFFFF',
            shadow: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
        shadow: false
        },
        tooltip:  {
            enabled: true,
            shadow: true,
 			borderWidth:0,
			borderRadius:0,
			backgroundColor:'rgba(224, 48, 30, .85)',
			style:{
				color:'#ffffff',
				fontSize:'18px'
			},
		formatter: function() { return '\u003cspan style=\"font-family:georgia,serif;\"\u003e \u003cspan style=\"font-family:georgia;font-size:20px;font-weight:bold;\"\u003e'+this.point.category+'\u003c/span\u003e\u003cbr/\u003e\u003cspan style=\"height:2px;\"\u003e \u003cspan style=\"font-family:georgia;font-size:18px;\"\u003e'+ this.series.name + ': ' + Highcharts.numberFormat(this.y, dm_map3.roundTo, '.', ',')+'\u003c/span\u003e\u003c/span\u003e';  }
    },
        plotOptions: {
             series: {
            dataLabels: {
                enabled : true,
                formatter: function() {return this.y; }
                , color: 'white'
            },
            shadow: false,
            stacking : 'normal',
            enableMouseTracking: true,
            events: {
                legendItemClick: function() {
                    return false;
                }
            }

            },
             bar: {
            pointPadding: 0,
            borderWidth: 1
     	   }
        },
        exporting: { enabled: false },
        series: []
    };
}
