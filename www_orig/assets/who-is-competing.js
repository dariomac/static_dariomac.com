// JavaScript Document

		var paper;
		var hSpotTexts = {
			'c01': 'Sammy Smith\nLessie Britton\nDomenic Mcfarling',
			'c02': 'Raisa Battle\nMaud Willems\nTesha Garrick',
			'c03': 'Eryn Nelsen\nJacelyn Lapointe\nKelvin Spurgin',
			'c04': 'Rosalva Weide\nRonna Hafley\nStar Trapp',
			'c05': 'Felicitas Rayburn\nCaryl Shih\nBernardine Martines',
			'c06': 'Joleen Mclaughin\nBettina Ramsey\nTeena Salvo',
			'c07': 'Kanisha Bobadilla\nGayle Tenney\nBrigid Basch',
			'c08': 'Jonelle Mansfield\nJodi Bustillos\nSharron Ricotta',
			'c09': 'Kera Mincks\nWanita Vaca\nDerrick Forness',
			'c10': 'Christel Slick\nMarybeth Bourbeau\nInocencia Mikesell',
			'c11': 'Kenia Polito\nThaddeus Caison\nEarle Kram',
			'c12': 'Carlena Haye\nJoie Ulrich\nJayme Adcock',
			'c13': 'Trista Semple\nAlane Prince\nZack Luckett',
			'c14': 'Crystal Eppler\nFrancoise Hepler\nDebera Mcknight',
			'c15': 'Magda Wooton\nAlphonse Ordonez\nSerena Koeppel',
			'c16': 'Camila Germano\nWonda Grego\nGerman Willmon',
			'c17': 'Oralee Dorner\nLee Reaper\nSimone Forand',
			'c18': 'Lennie Doiron\nAdeline Trepanier\nJanuary Poore',
			'c19': 'Dolores Malec\nGiuseppe Brunetti\nBooker Holub',
			'c20': 'Tawny Fleurant\nCatherin Stagg\nJerrica Gracia',
			'c21': 'Georgiann Segars\nDorthey Montanez\nLuella Aikens',
			'c22': 'Gertie Escovedo\nZena Teal\nConrad Flack',
			'c23': 'Birdie Siggers\nHouston Mccaffrey\nJonie Cayetano',
			'c24': 'Arleen Scheel\nMorton Nanney',
			'c25': 'Rhiannon Sattler\nPerry Hinerman',
			'c26': 'Ronnie Beno\nJere Loftis',
			'c27': 'Luz Snavely\nSheree Agarwal',
			'c28': 'Seema Skolnick\nRoman Rippey',
			'c29': 'Donovan Woody\nSteve Leishman',
			'c30': 'Anastacia Plaisance\nJenelle Lower',
			'c31': 'Juliet Brekke',
			'c32': 'Elana Woodside',
			'c33': 'Kelley Pesce',
			'c34': 'Aurelio Peake',
			'c35': 'Shirlee Greenwood',
			'c36': 'Edyth Fenstermaker',
			'c37': 'Zane Gilbreath',
			'c38': 'Lore Sauls',
			'c39': 'Tanner Otey',
			'c40': 'Ashlie Greeno',
			'c41': 'Eleni Siple',
			'c42': 'Darrin Tollefson',
			'c43': 'Gudrun Junker',
			'c44': 'Cheyenne Pardini',
			'c45': 'Janie Mattson',
			'c46': 'Drema Allington',
			'c47': 'Noe Pernell'
		};

		var rpHover;
		var hoverSet;
		var heightHack = 9000;
		var coloredDot;

		$(function() {
			jQuery.ajax({
				type: "GET",
				url: "who-is-competing.svg",
				dataType: "xml",
				error: function (xhr, ajaxOptions, thrownError) {
					alert('Ajax error getting svg file.');
				},
				success: function(svgXML) {
					var root = svgXML.getElementsByTagName('svg')[0].getAttribute('viewBox').split(' ');
					var width = root[2], height = root[3];

					paper = ScaleRaphael('board', width, height);
					$('#board').css('width', '100%');
					paper.changeSize($('#board').width(), $('#board').width(), false, true);

					var svg = svgXML.getElementsByTagName('svg')[0];
					paper.importSVG(svg, {
						polygon: {
							'stroke-width': 1,
							'fill': '#719b82',
							afterFn: /* or beforeFn: */ function(svgNode){

	                        }
						},
						path: {
							'stroke-width': 1,
							'fill': '#719b82'
						},
						circle: {
							'stroke-width': 0,
							'events': {
								'mousemove,touchstart': function(el){
									//for the two circles in the legend area
									if (this.id.indexOf('c') != 0) return;

									if (coloredDot != null){
										if (hoverSet != null)
											hoverSet.remove();
									}

									coloredDot = this;
									if (hoverSet != null)
										hoverSet.remove();

									hoverSet = paper.set();
									hoverSet.push(
										paper.circle(parseFloat(coloredDot.attr('cx')), parseFloat(coloredDot.attr('cy')), 7).attr({
											'stroke-width': 4,
											'stroke': '#fff',
											'fill': '#eb8c00'
										}),
										paper.circle(parseFloat(coloredDot.attr('cx')), parseFloat(coloredDot.attr('cy')), 3).attr({
											'stroke-width': 0,
											'fill': '#fff'
										})
									);
									hoverSet.attr('cursor', 'pointer');
									$.each(hoverSet.items, function(i,v){
										v.id = 'hover_' + coloredDot.id;
									});

									hoverSet.click(function(el){
										var newText = hSpotTexts[this.id.replace('hover_', '')];
										paper.getById('insert_place').attr('text', newText);
									});
								}
							}
						},
						text:{
							'text-anchor': 'start'
						}
					});

					paper.getById('insert_place').attr('text', '')
					paper.getById('bg-center').mouseover(function(el){
						if (hoverSet != null)
							hoverSet.remove();
					});

					function resizePaper(){
						var win = $(this);
						paper.changeSize($('#board').width(), $('#board').width(), false, true);
					}
					$(window).resize(resizePaper);

					paper.chrome();
					paper.safari();
					paper.renderfix();

					if (Raphael.type == "VML") {
						paper.getById('xtax').attr({
							x: 14,
							y: -3
						});

						paper.getById('xact').attr({
							x: 0,
							y: -3
						});
					}

					paper.getById('c32').hide();
				}
			});
		});
