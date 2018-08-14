/* kanbanize.js */
/* Global fonfigurations */
var betaPopup = false;

configs = {
	globalVars : {
		isAdmin : 0,
		isPM : 0,
		enableRegister : 0,
		userId : 0,
		editColumn : 1,
		editLane : 0,
		isNewTask : false,
		isUpdateTask : false,
		isNewTemplate : false,
		isUpdateTemplate : false,
		isNewType : false,
		isUpdateType : false,
		contextUpdateSubtasks : false,
		contextUpdateComments : false,
		detailsFromAracive : false,
		taskId : 0,
		projectId : 0,
		templateId : 0,
		typeId : 0,
		boardId : 0,
		lastColumns : [],
		contextMenu : false,
		htmlFragmentCloning : '',
		taskViewsMask : 0,
		temporaryTaskViewMask : '00000000000000',
		rolesMask : 0,
		archivedTasksPerpage : 30,
		taskColours : ["#f2dfec","#ece6f2","#dfdff2","#e6ecf9","#dfecec","#e6ece6","#f2f2df","#fff9df","#fceddf","#f2dfdf","#ece6df","#ffffff",
				"#e6bfd9","#d9cce6","#bfbfe6","#ccd9f2","#bfd9d9","#ccd9cc","#e6e6bf","#fff2bf","#f8dabf","#e6bfbf","#d9ccbf","#f0f0f0",
				"#d99fc6","#c6b3d9","#9f9fd9","#b3c6ec","#9fc6c6","#b3c6b3","#d9d99f","#ffec9f","#f5c89f","#d99f9f","#c6b39f","#dedede",
				"#cc80b3","#b399cc","#8080cc","#99b3e6","#80b3b3","#99b399","#cccc80","#ffe680","#f2b580","#cc8080","#b39980","#cccccc",
				"#bf609f","#9f80bf","#6060bf","#809fdf","#609f9f","#809f80","#bfbf60","#ffdf60","#eea360","#bf6060","#9f8060","#999999",
				"#b3408c","#8c66b3","#4040b3","#668cd9","#408c8c","#668c66","#b3b340","#ffd940","#eb9040","#b34040","#8c6640","#666666",
				"#a62079","#794da6","#2020a6","#4d79d2","#207979","#4d794d","#a6a620","#ffd220","#e77e20","#a62020","#794d20","#333333",
				"#990066","#663399","#000099","#3366CC","#006666","#336633","#999900","#FFCC00","#E46B00","#990000","#663300","#000000"],
		swimlaneColorBoxOptions : {
			colors: '',
			onChangeColor: function(color) {
				var $swimlane = $(this).parents('td'),
					laneId = $swimlane.attr('id'),
					lineName = $swimlane.find('.lane_name').text();
					ajaxPath = configs.ajax_paths.editBoard,
					ajaxObj = {
						action : configs.actions.actUpdate,
						lcid : laneId.split('_').reverse()[0],
						lcolor : color,
						lcname : lineName,
						columnlimit : 0
					};

				ajax_post(ajaxPath, ajaxObj, changeSwimnaleColor);

				function changeSwimnaleColor(Obj) {
					if (Obj.response) {
						$swimlane.css('background-color', color);
					} else {
						display_custom_error(Obj.resparray.error);
					};
				};
			}
		},
		taskColorBoxOptions : {
			colors: '',
			onChangeColor: function(color) {
				var $this = $(this);
				$this.css({'background-image': 'none', 'background-color': color});
				$this.attr('class', ('colour_' + color));
			}
		},
		defaultTemplate : 0,
		defaultAssignee : 'None',
		refreshInterval : 0,
		tyniMceFinish : false,
		currentValue : '',
		isotopeables: ['#l_Education_c_done_3', '#l_Research_c_done_3', '#l_Experience_c_done_3']
	},
	ajax_paths : {
		registerFieldsValidate : baseUrl + 'ctrl_home/registration_possible_',
		projectTemplate : baseUrl +'ctrl_dashboard/draw_projects_and_boards',
		createNewProject : baseUrl +'ctrl_dashboard/create_new_project',
		projectOrder : baseUrl +'ctrl_dashboard/update_project_order',
		boardOrder : baseUrl +'ctrl_dashboard/update_board_order',
		drawBoards : baseUrl +'ctrl_dashboard/draw_boards',
		createNewBoard : baseUrl +'ctrl_dashboard/create_new_board',
		changeEmail : baseUrl +'ctrl_dashboard/change_email',
		changePassword : baseUrl +'ctrl_dashboard/change_password',
		changeUsername  : baseUrl +'ctrl_dashboard/change_username',
		changeRealName   : baseUrl +'ctrl_dashboard/change_real_name',
		changeTimeZone   : baseUrl +'ctrl_dashboard/change_time_zone',
		getBoardNotifications : baseUrl +'ctrl_dashboard/get_board_notifications',
		setBoardNotifications : baseUrl +'ctrl_dashboard/set_board_notifications',
		addMemberToRegistarion : baseUrl +'ctrl_dashboard/add_user',
		getMemberToRegistarion : baseUrl +'ctrl_dashboard/get_registered_users',
		saveRegistrationMemberChanges : baseUrl +'ctrl_dashboard/edit_registered_users',
		deleteMemberFromRegistarion : baseUrl +'ctrl_dashboard/delete_users',
		getProjects : baseUrl +'ctrl_dashboard/get_proj_and_boards',
		getMembers : baseUrl +'ctrl_dashboard/get_project_members',
		manageProjectMembers : baseUrl +'ctrl_dashboard/manage_users_pb',
		manageBoardPermissions : baseUrl +'ctrl_dashboard/manage_board_permissions',
		manageRoles : baseUrl +'ctrl_dashboard/manage_roles',
		addTemplate : baseUrl +'ctrl_dashboard/add_template',
		deleteTemplateOrType : baseUrl +'ctrl_dashboard/delete_type_or_template',
		getTemplateOrType : baseUrl +'ctrl_dashboard/get_templates_or_types',
		getTemplateDetails : baseUrl +'ctrl_dashboard/get_template_details',
		updateTemplateOrType : baseUrl +'ctrl_dashboard/update_template_or_type',
		addType : baseUrl +'ctrl_dashboard/add_type',
		editBoard : baseUrl +'ctrl_editboard/edit_board',
		task : baseUrl +'ctrl_board/task',
		taskBoardSettings : baseUrl + 'ctrl_board/options',
		deleteBoard : baseUrl +'ctrl_dashboard/delete_board',
		deleteProject : baseUrl +'ctrl_dashboard/delete_project',
		refresh : baseUrl + 'ctrl_board/check_refresh',
		sendFeedback : baseUrl + 'ctrl_dashboard/send_feedback',
		renameBoard : baseUrl + 'ctrl_dashboard/rename_board_or_project',
		api : baseUrl + 'ctrl_board/api'
	},
	tab_functions : {
		'mail_notifications' : 'get_board_notification',
		'team_permissions' : 'int_team_permissions',
		'project_permissions' : 'int_project_permissions',
		'board_permissions' : 'int_board_permissions',
		'manage_role' : 'int_manage_roles',
		'subtasks_details' : 'int_subtasks',
		'comments_details'	: 'int_comments',
		'histroy_details' : 'int_history',
		'metrics_details' : 'int_metrics',
		'task_templates' : 'int_templates',
		'task_types' : 'int_types',
		'tasks_to_archive_list' : 'int_tasks_to_archive_list',
		'permanent_archive_table' : 'int_permanent_archive_list',
		'browse_versions' : 'int_browse_versions',
		'task_view' : 'int_task_view',
		'tab_export_taks' : 'int_export_tasks',
		'board_options' : 'int_board_settings',
		'task_details' : 'int_task_details',
		'tab_api' : 'int_api_tab'
	},
	close_fightbo_callback : {
		'manage_team' : 'close_manage_team'
	},
	messages : {
		fillUsernam : 'Field Username is required',
		fillEmail : 'Field Email is required',
		fillPassword : 'Field Password is required',
		fillPasswordTwo : 'Field Password is required',
		fillFullname : 'Field Real name is required',
		delteUser : 'Are you sure you want to delete this user ?',
		delteRole : 'Are you sure you want to delete this role ?',
		delteColum : 'Are you sure you want to delete this column ?',
		delteSwimlane : 'Are you sure you want to delete this swimlane ?',
		deleteSubtask : 'Are you sure you want to delete this subtask ?',
		deleteTask : 'Are you sure you want to delete this task ?',
		deleteTemplate : 'Are you sure you want to delete this template ?',
		deleteType : 'Are you sure you want to delete this type ?',
		deleteBoard : 'Are you sure you want to delete this board ?',
		deleteProject : 'Are you sure you want to delete this project?',
		noPermissions : 'You do not have permissions for this action. Please contact to your project managemer.',
		noPermissionsAllTabs : 'You have permissions for any tasks details. Please contact to your project managemer.',
		noPermissinosNotifications : 'You are not authorized to receive notifications for this board. Contact administrator if you want to enable it.'
	},
	permissions : {
		manageProject : 4,
		renameProject : 2,
		createBoards : 1,
		manageBoardMembers : 1
	},
	taskView : {
		subtasksIcon : 1,
		subtasksRows : 129,
		priority : 2,
		sizeIcon : 4,
		sizeRow : 516,
		tagsIcon : 8,
		tagsRow : 1032,
		externalLinkIcon : 16,
		externalLinkRow : 2064,
		deadline : 32,
		leadtime : 64
	},
	actions : {
		actOnloald : 10,
		actPClick : 20,
		actBClick : 30,
		actRClick : 40,
		actDetails : 50,
		subActAssignee : 21,
		subActComplete : 30,
		subActDetails : 32,
		subActSubtasks : 33,
		subActComments : 34,
		subActHistory : 35,
		subActMetrincs : 36,
		subActTask : 1,
		subActBoard : 2,
		subActPriority : 26,
		subActTags : 23,
		subActSize : 25,
		subActDeadline : 24,
		subActBlock : 28,
		subtaskUnblock : 29,
		subColor : 22,
		actUpdate : 60,
		ACT_ADD : 1,
		ACT_DELETE: 2,
		ACT_BLOCK : 4,
		ACT_MOVE : 8,
		ACT_EDITTASK : 256,
		ACT_EDITSUBTASK : 2048,
		ACT_ARCHIVE : 64,
		SUBACT_ARCHIVE : 64,
		SUBACT_SHOWARC : 16777216,
		ACT_TASKSETTINGS : 70,
		ACT_BOARDSETTINGS : 2097152,
		SUBACT_DETAILS : 128,
		SUBACT_SUBTASKS : 512,
		SUBACT_COMMENTS : 16384,
		SUBACT_HISTORY : 131072,
		SUBACT_METRICS : 262144,
		ACT_LOGTIME : 32,
		SUBACT_NEWTASK : 1,
		SUBACT_CLONETASK : 16,
		SUBACT_NEWSUBTASK : 1024,
		SUBACT_MOVETASK : 8,
		SUBACT_MOVESUBTASK : 8192,
		SUBACT_DELTASK : 2,
		SUBACT_DELSUBTASK : 4096,
		SUBACT_DELCOMMENT : 65536,
		SUBACT_ADDCOMMENT : 32768,
		ACT_EXPORT : 1048576,
		ACT_LOADTEMPLATE : 80,
		SUBACT_EXTLINK : 27,
		ACT_ACCESSAPI : 33554432,
		SUBACT_GENERATEAPIKEY : 31,
		SUBACT_REMOVEAPIKEY : 32,
		SUBACT_GETCURRENTKEY : 33
	},
	tinymceConfigs : [{
		mode : "none",
		theme : "advanced",
		theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,fontsizeselect, forecolor,|, bullist ,numlist,|,sub,sup,|,charmap, fullscreen",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		plugins : "autolink,lists,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		width : "610",
		height: "250"
		}, {
		mode : "none",
		theme : "advanced",
		theme_advanced_buttons1 : "fullscreen",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		plugins : "fullscreen",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		width : "610",
		height: "250",
		body_class : "readonly_class",
		readonly : 1
		}, {
		mode : "none",
		theme : "advanced",
		theme_advanced_buttons1 : "fullscreen",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		plugins : "fullscreen",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		width : "930",
		height: "250",
		body_class : "readonly_class",
		readonly : 1
		}, {
		mode : "none",
		theme : "advanced",
		theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,fontsizeselect, forecolor,|, bullist ,numlist,|,sub,sup,|,charmap, fullscreen",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		plugins : "autolink,lists,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		width : "930",
		height: "250"
		}
	]
};

configs.globalVars.swimlaneColorBoxOptions.colors = configs.globalVars.taskColours;
configs.globalVars.taskColorBoxOptions.colors = configs.globalVars.taskColours;

//~ $(document).ready(function() {
	//~ drawBoardArea();
//~ });

/* JQuery plugins */
(function($) {
	/* jquery plugin for set and read cookie */
	jQuery.cookie = function (key, value, options) {
		// key and at least value given, set cookie...
		if (arguments.length > 1 && String(value) !== "[object Object]") {
			options = jQuery.extend({}, options);

			if (value === null || value === undefined) {
				options.expires = -1;
			}

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			value = String(value);

			return (document.cookie = [
				encodeURIComponent(key), '=',
				options.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
			].join(''));
		}

		// key and possibly options given, get cookie...
		options = value || {};
		var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
		return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	};
})(jQuery);

/* Prototype functons */
/* revers array */
String.prototype.reverse=function(){return this.split("").reverse().join("");};

String.prototype.replaceAt=function(index, symbol) {
	return this.substr(0, index) + symbol + this.substr(index+symbol.length);
}

function refresh_board() {
	function check_if_refresh(Obj) {
		if(Obj.response) {
			var boardArray = Obj.resparray.boardarray;
			var tasksArray = Obj.resparray.tasks;

			draw_kanban_board(boardArray, false, tasksArray, true);
		};
		setTimeout (function() { refresh_board(); }, (parseInt(configs.globalVars.refreshInterval, 10) * 1000));
	};

	ajax_post(configs.ajax_paths.refresh, {}, check_if_refresh);
};

/* custom serialize */
function custom_serialize(items, ajaxPath, callback, params) {
	var json_object = {};

	json_object.arrayIds = [];

	items.each(function() {
		json_object.arrayIds.push($(this).attr('id').split('_')[1]);
	});

	$.extend(true, json_object, params);
	ajax_post(ajaxPath, json_object, callback, json_object);
};

/* draw kanban board */
function draw_kanban_board(boardArray, editboard, tasksArray, refreshBoard) { //DM_Important
	var $boardContainer = $('#board_container'),
		$board = $('<table class="board" cellspacing="0" cellpadding="0" />'),
		$thead = $('<thead />'),
		$tbody = $('<tbody />'),
		requestedCollspan = 0,
		requestedCollapse = '',
		progressCollspan = 0,
		progressCollapse = '',
		doneCollspan = 0,
		doneCollapse = '',
		firstRowLength = boardArray['rows'][0].length;

	for (var frSection = 0; frSection < firstRowLength; frSection++) {
		frSectionLength = boardArray['rows'][0][frSection].length;
		for(var frCell = 0; frCell < frSectionLength; frCell++) {
			if(frSection == 0) {
				requestedCollspan += parseInt(boardArray['rows'][0][frSection][frCell]['colspan'], 10);
				requestedCollapse = check_column_state(boardArray['rows'][0][frSection][frCell]['path']);
			} else if(frSection == 1) {
				progressCollspan += parseInt(boardArray['rows'][0][frSection][frCell]['colspan'], 10);
				progressCollapse = check_column_state(boardArray['rows'][0][frSection][frCell]['path']);
			} else if(frSection == 2) {
				doneCollspan += parseInt(boardArray['rows'][0][frSection][frCell]['colspan'], 10);
				doneCollapse = check_column_state(boardArray['rows'][0][frSection][frCell]['path']);
			};
		};
	};

	var $firstRow = '<tr>'+
					( editboard ? '<th class="swimlane" rowspan="1" colspan="1"></th>' : '<th id="backlog" rowspan="1" colspan="1"><div><div>BACKLOG</div></div></th>')+
					'<th id="requested" colspan="'+ requestedCollspan +'" rowspan="1" class="">'+
						'<div>'+
							'<div>'+
								( editboard ? '<a class="new_main_column" href="javascript:;" title="Create new main column">New main column</a>' : '')+
								'<span>PLAN</span>'+
							'</div>'+
						'</div>'+
					'</th>'+
					'<th id="progress"  colspan="'+ progressCollspan +'" rowspan="1" class="">'+
						'<div>'+
							'<div>'+
								( editboard ? '<a class="new_main_column" href="javascript:;" title="Create new main column">New main column</a>': '')+
								'<span>IN PROGRESS</span>'+
							'</div>'+
						'</div>'+
					'</th>'+
					'<th id="done"  colspan="'+ doneCollspan +'" rowspan="1" class="">'+
						'<div>'+
							'<div>'+
								( editboard ? '<a class="new_main_column" href="javascript:;" title="Create new main column">New main column</a>': '')+
								'<span>DONE</span>'+
							'</div>'+
						'</div>'+
					'</th>'+
					( editboard ? '' : '<th id="archive" rowspan="1" colspan="1"><div><div>ARCHIVE</div></div></th>')+
				'</tr>';

	$thead.append($firstRow);

	var rowsLength = boardArray['rows'].length;

	for (var row = 0; row < rowsLength; row++) {

		var sectorsLength = boardArray['rows'][row].length;
		if (sectorsLength) {
			var $tr = $('<tr />');
			if (editboard) {
				$tr.append('<th class="swimlane"></th>');
			};

			for (var sector = 0; sector < sectorsLength; sector++) {
				var cellLength = boardArray['rows'][row][sector].length;
				if (cellLength) {
					for (var cell = 0; cell < cellLength; cell++) {

						var idPath = boardArray['rows'][row][sector][cell]['path'];
						var clName = boardArray['rows'][row][sector][cell]['lcname'];
						var columnColspan = boardArray['rows'][row][sector][cell]['colspan'];
						//var tasksNow = boardArray['rows'][row][sector][cell]['columntasksnow'];
						var columnLimit = boardArray['rows'][row][sector][cell]['columnlimit'];

						if(editboard) {
							var tasksNow = '-';
						} else {
							var tasksNow = count_tasks_incolumn(idPath);
						}

						$tr.append(draw_table_cell(idPath, clName, columnColspan, tasksNow, columnLimit, editboard));
					};
				};
			};
		};

		if (row ==0 && !editboard) {
				var allowArchive = check_role_permissions('ACT_ARCHIVE', true);
				var allowShowArchive = check_role_permissions('SUBACT_SHOWARC', true)
				$tr.prepend('<th class="backlog close" id="'+ boardArray['backlogarchive']['backlogid'] +'" rowspan="'+ rowsLength +'" colspan="1"><div class="column_name">Backlog</div></th>');
				$tr.append('<th class="archive close" id="'+ boardArray['backlogarchive']['archiveid'] +'" rowspan="'+ rowsLength +'" colspan="1">'+
							'<div id="board_archive_settings">'+
								'<a '+ (allowArchive ? '' : 'class="disabled"') +' id="show_ready_archive_tasks" href="javascript:;" title="Archive tasks"><span></span>Archive tasks</a>'+
								'<a '+ (allowShowArchive ? '' : 'class="disabled"') +' id="show_archived_tasks" href="javascript:;" title="Show archived tasks"><span></span>Show archived tasks</a>'+
							'</div>'+
							'<div class="column_name">Archive</div>'+
							'</th>');
		};

		$thead.append($tr);
	};

	$board.append($thead);

	if(refreshBoard) {
		$boardContainer.html($board);
	} else {
		$boardContainer.append($board);
	};

	/* initialization disabled move arrows */
	$('thead tr').each(function() {
		var $row = $(this);

		disableArrows($row, 'requested');
		disableArrows($row, 'progress');
		disableArrows($row, 'done');
	});

	/* initialization rowspan */
	updateRowspan();

	/* initialization disabled delete icons */
	disableDeleteIcon('requested');
	disableDeleteIcon('progress');
	disableDeleteIcon('done');

	get_last_columns($thead);
	var tbodyCellsIds = configs.globalVars.lastColumns;


	var lanesLength = boardArray['lanes'].length;
	for (var lane=0; lane < lanesLength; lane++) {

		if (editboard) {
			var $tr = $('<tr />'),
				swimlane = draw_editable_swimlane(boardArray['lanes'][lane]['lcid'], boardArray['lanes'][lane]['lcname'], boardArray['lanes'][lane]['color']);

			$tr.append(swimlane);
			var numbersOfTd = requestedCollspan + progressCollspan + doneCollspan;
			for (var td=0; td<numbersOfTd; td++) {
				var $td = $('<td />');
				$tr.append($td);
			};
		} else {
			var $tr = $('<tr />'),
				tdsLength = tbodyCellsIds.length;

			var swimlane = draw_swimlane(boardArray['lanes'][lane]['lcid'], boardArray['lanes'][lane]['lcname'], boardArray['lanes'][lane]['color'], tdsLength);


			if(lane == 0) {
				var backlogId = 'l_'+ boardArray['lanes'][lane]['lcid'] +'_c_'+ boardArray['backlogarchive']['backlogid'],
					archiveId = 'l_'+ boardArray['lanes'][lane]['lcid'] +'_c_'+ boardArray['backlogarchive']['archiveid'],
					backlog_archive_holder = $('<tr />').html('<td colspan="'+ tdsLength +'" rowspan="1" style="height: 0; border: 0 none;"></td>');

				backlog_archive_holder.prepend('<td class="backlog close" rowspan="'+ ((lanesLength * 2) + 1) +'"><ul class="tasks_list" id="'+ backlogId +'"></ul></td>');
				backlog_archive_holder.append('<td class="archive close" rowspan="'+ ((lanesLength * 2) + 1) +'"><ul class="tasks_list" id="'+ archiveId +'"></ul></td>');

				$tbody.append(backlog_archive_holder);

			};

			var $swimlane = $(swimlane)

			$tbody.append($swimlane);

			if (lanesLength == 1) {
				$swimlane.css('display', 'none');
			};

			for (var td=0; td<tdsLength; td++) {
				var $td = $('<td />'),
					tdId = 'l_'+ boardArray['lanes'][lane]['lcid'] + '_c_'+ tbodyCellsIds[td].split('/')[0],
					$ul = $('<ul class="tasks_list" />').attr('id', tdId),
					collapse = check_column_state(tbodyCellsIds[td].split('/')[0]),
					columnName = '';

				$td.html($ul);
				$tr.append($td);

				if(collapse) {
					for(var row = 0; row < rowsLength; row++) {
						var sectionsLength = boardArray['rows'][row].length;
						for(var section = 0; section < sectionsLength; section++) {
							var cellsLength = boardArray['rows'][row][section].length;
							for(var cell = 0; cell < cellsLength; cell++) {
								if(boardArray['rows'][row][section][cell]['path'] == tbodyCellsIds[td].split('/')[0]) {
									columnName = boardArray['rows'][row][section][cell]['lcname']
								};
							};
						};
					};
					var	columnName = columnName.split('').join('<br />');
						//newColumn = '<td id="hidden_'+ tbodyCellsIds[td].split('/')[0] +'" class="hiddenColumn">'+ columnName +'</td>';
					//$td.css('display', 'none').after(newColumn);
					columnName = '<span>'+ columnName +'</span>';
					$td.children('ul').hide().after(columnName).end().addClass('hiddenColumn');
				};

			};
		};
		$tbody.append($tr);
	};

	$board.append($tbody);

	if (editboard) {
		var numbersOfTd = requestedCollspan + progressCollspan + doneCollspan,
			$tr = '<tr class="add_swimlane"><td><a id="add_swimlane" href="javascript:;" title="Add New Swimlane">Add New Swimlane</a></td>';

		for (var td=0; td<numbersOfTd; td++) {
			$tr += '<td></td>';
		};

		$tr += '</tr>';

		$tbody.append($tr);
	} else {
		draw_board_tasks($tbody, tasksArray, refreshBoard);
	};

	if(editboard) {
		/* initialization swimlane arrows */
		var $rows = $('table.board tbody tr').filter(function() {
				if ($(this).find('td.swimlane').length) {
					return $(this);
				};
			});

		disableArrowLane($rows);

		/* initialization swimlane delete icon */
		disableLineDelteIcon();
	};

	/* show board */
	/* $('table.board').css('visibility', 'visible');

	setListHeight(); */

	if(!editboard) {
		setTimeout (function() { refresh_board(); }, (parseInt(configs.globalVars.refreshInterval, 10) * 1000) );

		int_fixed_header();
	};
};

/* create array with column on last level */
function get_last_columns($thead, exception) {
	var tbodyCellsIds = [],
		elementPosition = 0;

	configs.globalVars.lastColumns = [];

	$('tr:eq(1)', $thead).find('th:not(.swimlane, .backlog, .archive)').each(function() {
		var $this = $(this)
			rowspan = $this.attr('rowspan'),
			cellId = $this.attr('id'),
			cellName = $this.find('.column_name').text();

		if(exception == cellId) {
			return;
		};

		if (rowspan == 1) {
			getLastChild(2, cellId, cellName);
		} else {
			//tbodyCellsIds.push(cellId);
			configs.globalVars.lastColumns.push(cellId +'/'+ cellName);
		};
	});

	function getLastChild(rowIndex, cellId, cellName) {
		var $row = $('tr:eq('+ rowIndex +')', $thead);

		if(exception == cellId) {
			return;
		};

		if (!$row.length) {
			//tbodyCellsIds.push(cellId);
			configs.globalVars.lastColumns.push(cellId +'/'+ cellName);
			return;
		};

		$row.find('th[id^='+ cellId +']').each(function() {
			var $this = $(this),
				rowspan = $this.attr('rowspan'),
				cellId = $this.attr('id'),
				cellName = $this.find('.column_name').text();

			if(exception == cellId) {
				return;
			};

			if (parseInt(rowspan, 10) == 1) {
				var newRowIndex = parseInt(rowIndex, 10) + 1;

				getLastChild(newRowIndex, cellId, cellName);
			} else {
				//tbodyCellsIds.push(cellId);
				configs.globalVars.lastColumns.push(cellId +'/'+ cellName);
			};
		});
	};
};

/* create board column */
function draw_table_cell(idPath, clName, columnColspan, tasksNow, columnLimit, editboard) { //DM_Important
	var over = compare_tasksNow_limit(tasksNow, columnLimit);
	var edit_icon = '<div class="icons">'+
						'<a class="add_subcolumn" href="javascript:;" title="Add new subcolumn">Add new subcolumn</a>'+
						'<a class="move_left" href="javascript:;" title="Move to left">Move to left</a>'+
						'<a class="move_right" href="javascript:;" title="Move to right">Move to right</a>'+
						'<a class="edit_column" href="javascript:;" title="Edit column">Edit column</a>'+
						'<a class="delete_column" href="javascript:;" title="Delete column">Delete column</a>'+
					'</div>';

	var confirm_icon = '<div class="confirm_icons">'+
							'<a class="save_changes" href="javascript:;" title="Save changes">Save changes</a>'+
							'<a class="cancel_changes" href="javascript:;" title="cancel changes">Cancel changes</a>'+
						'</div>';

	if (editboard) {
		var column_name_limit = '<div class="column_name"><strong>'+ clName +'</strong></div>'+
							'<div class="column_limit">'+
								'Limit <span>'+ tasksNow +'</span> / <strong>'+ columnLimit +'</strong>'+
							'</div>';
	} else {
		var collapse = check_column_state(idPath);

		var column_name_limit = '<div class="column_name inline"><span>&nbsp;</span><strong>'+ clName +'</strong></div>'+
								'<div class="column_limit inline"> (<span>'+ tasksNow +'</span> / <strong>'+ columnLimit +'</strong>)</div>';
	}

	var html = '<th class="'+ over +'" id="'+ idPath +'" colspan="'+ columnColspan +'" rowspan="1">'+
				column_name_limit +
				(editboard ? edit_icon + confirm_icon : '') +
			'</th>';

	return html;
};


function draw_swimlane(laneId, laneName, laneColor, cellSize) {
	var html = '<tr id="l_'+ laneId +'"><td class="swimlane_inner" colspan="'+ cellSize +'" style="background-color:'+ laneColor +'"><div class="swimlane_splitter"></div><strong style="background-color:'+ laneColor +';">'+ laneName +'</strong></td></tr>';
	return html;
};

/* draw task tags depending task view */
function draw_tasks_tags(viewMask, tags) {
	if((viewMask & configs.taskView.tagsRow) == configs.taskView.tagsRow) {
		return {
			iconTags : false,
			htmlTags : '<span class="task_tag" >Tags: </span>' + tags
		};

	} else if ((viewMask & configs.taskView.tagsIcon) == configs.taskView.tagsIcon) {
		return {
			iconTags : true,
			htmlTags : '<a href="javascript:;" title="Tags: '+ tags +'" class="task_tag"><span>'+ tags +'</span></a>'
		};
	} else {
		return {
			iconTags : false,
			htmlTags : ''
		};
	};
}

/* draw task size depending task view */
function draw_tasks_size(newLine, TaskSize) {
	return {
		iconSize : newLine,
		htmlSize : '<span class="task_size">' + TaskSize + '</span>'
	};
}

function draw_task_deadline(viewMask, deadline, taskColor) {
	if((viewMask & configs.taskView.deadline) == configs.taskView.deadline) {
		return '<div class="deadline" style="background-color:'+ taskColor +'; color:' + getTextColor(taskColor) +'">'+ deadline +'</div>';
	} else {
		return '';
	}
};

function draw_task_externalLink(viewMask, externalLink) {
	if((viewMask & configs.taskView.externalLinkRow) == configs.taskView.externalLinkRow) {
		return {
			iconLink : false,
			htmlLink : '<span class="task_external_link">External link: </span><a href="'+ externalLink +'" title="External link: '+ externalLink +'" target="_blank">'+ externalLink +'</a>'
		};
	} else if((viewMask & configs.taskView.externalLinkIcon) == configs.taskView.externalLinkIcon) {
		return {
			iconLink : true,
			htmlLink : '<a href="'+ externalLink +'" title="Link: '+ externalLink +'" target="_blank" class="task_external_link"><span>'+ externalLink +'</span></a>'
		};
	} else {
		return {
			iconLink : true,
			htmlLink : ''
		};
	}
};

/*get type image from Types array
function get_type_icon(typeId) {
	var typesLength = typesArray.length;

	for(var type = 0; type < typesLength; type++) {
		if(parseInt(typesArray[type]['id'], 10) == parseInt(typeId, 10)) {
			return typesArray[type]['icon'];
			break;
		};
	};
};*/

function getTextColor(backgroundColor){
	backgroundColor = backgroundColor.replace('#','');

	var red = parseInt(backgroundColor.substr(0,1),16),
		green = parseInt(backgroundColor.substr(2,1),16),
		blue = parseInt(backgroundColor.substr(4,1), 16);

	if((red*0.299 + green*0.587 + blue*0.114) > 9)
		return '#000000';
	else
		return '#ffffff';
}

/* draw task*/
function draw_task(taskId /*title*/, taskColor, taskAssignee, taskTitle /*content*/, subtasks, completeSubtasks, priority, externalLink, tags, deadline, leadtime, TaskSize, taskMask, subtasksDetails, blocked, linkTo, type, typeImage, position, columnid) { //DM_Important
	var viewMask = taskMask;
	var taskIdShort = taskId;

	var htmlExtLink = '',
		iconExternalLink = false,
		objTags = {
			htmlTags : '',
			iconTags : false,
		},
		htmlDeadline = '',
		htmlSubtasks = '',
		iconSubtasks = false,
		htmlLeadtime = '',
		objSize = {
			htmlSize : '',
			iconSize : false
		},
		objLink = {
			htmlLink : '',
			iconLink : false
		},
		htmlPriority = '';

	if (externalLink) {
		objLink = draw_task_externalLink(viewMask, externalLink);
	}

	var additionalTag = (columnid=='backlog_5' || columnid=='archive_6')? '#' + type : '';
	if (additionalTag.length > 0)
		tags = (tags !== null && tags.length > 0)? additionalTag + ', ' + tags : additionalTag;

	if (tags) {
		objTags = draw_tasks_tags(viewMask, tags);
	};

	if (deadline) {
		htmlDeadline = draw_task_deadline(viewMask, deadline, taskColor);
	};

	if(leadtime) {
		htmlLeadtime = '<div class="leadtime" style="background-color:'+ taskColor +'; color:' + getTextColor(taskColor) + '">'+ leadtime +'</div>';
	};

	if(false/*priority*/) {
		htmlPriority = '<a href="javascript:;" title="Priority: '+ priority +'" class="task_priority '+ priority +'"><span>'+ priority +'</span></a>';
	};

	if(TaskSize) {
		objSize = draw_tasks_size(true, TaskSize); //false=new line; true=same line
	}

	if(taskId.length > 30)
		taskIdShort = jQuery.trim(taskId.substr(0,27)) + '...';

	if (parseInt(subtasks, 10)) {
		if((viewMask & configs.taskView.subtasksRows) == configs.taskView.subtasksRows) {
			if(subtasksDetails) {
				var subtaskDetailsLength = subtasksDetails.length,
					htmlSubtasks = htmlSubtasks + '<ul class="subtasks_collapse">';


				for(var sbt = 0; sbt < subtaskDetailsLength; sbt++) {
					htmlSubtasks = htmlSubtasks + '<li id="subtaskRow_'+ subtasksDetails[sbt]['taskid'] +'" title="'+ subtasksDetails[sbt]['title'] +'">'+
										'<label '+ (subtasksDetails[sbt]['assignedtome'] ? 'class="assignedtome_'+ subtasksDetails[sbt]['assignedtome'] +'"' : 'class="assignedtome_0"') +'><input type="checkbox" '+ (subtasksDetails[sbt]['completiondate'] ? 'checked="checked"' : '') +' '+ (subtasksDetails[sbt]['disabled'] ? 'disabled="disabled"' : '') +'/>'+ subtasksDetails[sbt]['title'] +'</label>'+
									'</li>';
				};

				htmlSubtasks = htmlSubtasks + '</ul>';
			}
		} else if ((viewMask & configs.taskView.subtasksIcon) == configs.taskView.subtasksIcon) {
			iconSubtasks = true;

			var htmlSubtasks = calculate_subtasks_percent(subtasks, completeSubtasks);
		};
	};

	var html =  '<li data-order="' + position + '" class="task '+ (parseInt(blocked, 10) ? 'blocked' : '') +'" id="task_'+ taskId +'" style="background-color: '+ taskColor +'">' +
					'<div class="task_inner type_' + type + '">' +
						'<div class="task_head" style="background-color:' + taskColor + '">' +
							'<a class="task_id" style="color:' + getTextColor(taskColor) + '" href="' + (linkTo?linkTo:'javascript:;') + '" title="' + taskId + '">'+ taskIdShort +'</a>' +
							'<strong class="task_assignee">'+ taskAssignee +'</strong>' +
						'</div>' +
						(linkTo? '<a href="' + linkTo + '"><div class="task_content">'+ taskTitle + '</div></a>': '<div class="task_content">' + taskTitle + '</div>') +
						'<div class="details">'+
							'<div class="task_icons">' +
								htmlLeadtime +
								'<div class="holder_deadline">'+ htmlDeadline +'</div>'+
								'<span class="icon_subtasks">'+ (iconSubtasks ? htmlSubtasks : '' ) +'</span>'+
								'<span class="icon_priority">'+ htmlPriority +'</span>'+
								'<span class="icon_tags">'+ (objTags.iconTags ? objTags.htmlTags : '') +'</span>'+
								'<span class="icon_size">'+ (objSize.iconSize ? objSize.htmlSize : '') +'</span>'+
								'<span class="icon_link">'+ (objLink.iconLink ? objLink.htmlLink : '') +'</span>'+
							'</div>' +
							'<div class="details_section">'+
							(!iconSubtasks ? htmlSubtasks : '' ) +
							'<div class="row row_size_view">'+ (!objSize.iconSize ? objSize.htmlSize : '') +'</div>'+
							'<div class="row row_tags_view">'+ (!objTags.iconTags ? objTags.htmlTags : '') +'</div>'+
							'<div class="row row_link_view">'+ (!objLink.iconLink ? objLink.htmlLink : '') +'</div>'+
						'</div></div>'+
					'</div>' +
				'</li>';

	return html;
};

function draw_board_tasks($tbody, tasksArray, refreshBoard) { //DM_Important
	var tasksLength = tasksArray.length,
		cellsArray = {},
		mask = configs.globalVars.taskViewsMask;

	for(var i = 0; i<tasksLength; i++) {
		var task = tasksArray[i],
			taskPosition = parseInt(task['position'], 10);
		var columnId;
		if(task['columnid'] == 'archive_6'){
			columnId = 'l_' + boardArray['lanes'][0].lcid +'_c_'+ task['columnid'];
			task['size'] = '#' + task['laneid'] + (task['size']==null?'': ' - ' + task['size']);
		}
		else
			columnId = 'l_' + task['laneid'] +'_c_'+ task['columnid'];

		if (!cellsArray[columnId]) {
			cellsArray[columnId] = [];
		};

		//cellsArray[columnId].splice(taskPosition, 0, task);
		cellsArray[columnId].push(task);
	};

	for(var cellId in cellsArray) {
		if (cellsArray.hasOwnProperty(cellId)) {
			cellsArray[cellId].sort(sort_objects);

			var tasksArrayLength = cellsArray[cellId].length;

			for(var taskPos = 0; taskPos < tasksArrayLength; taskPos++) {
				var htmlTask = draw_task(
					cellsArray[cellId][taskPos]['title'], //ex. taskid
					cellsArray[cellId][taskPos]['color'],
					cellsArray[cellId][taskPos]['assignee'],
					cellsArray[cellId][taskPos]['content'], //ex. title
					cellsArray[cellId][taskPos]['subtasks'],
					cellsArray[cellId][taskPos]['subtaskscomplete'],
					cellsArray[cellId][taskPos]['priority'],
					cellsArray[cellId][taskPos]['extlink'],
					cellsArray[cellId][taskPos]['tags'],
					cellsArray[cellId][taskPos]['datebox'], //ex. deadline
					cellsArray[cellId][taskPos]['leftbox'], //ex. leadtime // ej.: by C. Seaman
					cellsArray[cellId][taskPos]['leftmsg'], //ex. size // ej.: by M.C. Bastarrica
					mask,
					cellsArray[cellId][taskPos]['subtaskdetails'],
					cellsArray[cellId][taskPos]['blocked'],
					cellsArray[cellId][taskPos]['linkto'],
					cellsArray[cellId][taskPos]['type'],
					false,
					cellsArray[cellId][taskPos]['position'],
					cellsArray[cellId][taskPos]['columnid']);

				$tbody.find('#'+ cellId).append(htmlTask);
			};
		};
	};

	if(refreshBoard) {
		drawBoardArea();
		task_sortable();
	};

	//board_dimensions.init();
};

/* Sort objects in array by object property (position) */
function sort_objects(a,b) {
	if (parseInt(a.position, 10) < parseInt(b.position, 10)) {
		return 1;
	} else if (parseInt(a.position, 10) > parseInt(b.position, 10)) {
		return -1;
	} else {
		return 0;
	};
};

function setListHeight() {
	var $lists = $('tbody').find('ul.tasks_list');
	/* $lists.each(function() {
		var $list = $(this);
		$list.css('heihgt', 'auto');
	}); */
	$lists.each(function() {
		var $list = $(this);
		$list.css('height', $list.parent().height());
	});
};

function drawBoardArea() {
	var boardContainer = $('#board_container');

	if(!boardContainer.length) {
		return;
	};

	$('.header').addClass('collapse');

	boardContainer.hide();

	board_dimensions.init();

	//~ var bodyHeight = $('body').height() -6,
		//~ headerHeight = $('.header').height(),
		//~ topMenuHeight = $('.top_menu').height(),
		//~ footerHeight = $('.footer').height(),
		//~ viewpointHeight = bodyHeight - (headerHeight + topMenuHeight + footerHeight);

	var viewpointHeight = board_dimensions.viewpointHeight;

	boardContainer[0].style.height = (viewpointHeight) + "px";
	boardContainer[0].style.display = 'block';

	var $table = $('table.board'),
		tableHeight = $table.height(),
		$swimlanes = $table.find('td.swimlane_inner');

	if( tableHeight < viewpointHeight) {
		var heightDelta = viewpointHeight - tableHeight,
			swimnaleExtraheight = Math.floor(heightDelta / $swimlanes.length);

		$swimlanes.each(function() {
			var $tasksRow = $(this).parent().next(),
				currentHeight = $tasksRow.height();

			$tasksRow.css('height', (currentHeight + swimnaleExtraheight));
		});
	};

	$('#loading').hide();
	$table.css('visibility', 'visible');

	setListHeight();
}

/* check if users role have persions to do current action */
function check_role_permissions(action, ignorMessage) {

	if(configs.globalVars.isAdmin || configs.globalVars.isPM) {
		return true;
	};

	if((configs.actions[action] & configs.globalVars.rolesMask) == configs.actions[action]) {
		return true;
	} else {
		if(!ignorMessage) {
			display_custom_error(configs.messages.noPermissions);
		};
		return false;
	};
};

/* if column id in cookie collapse column else expand it */
function check_column_state(idPath) {
	var cookieName = 'boardview' + configs.globalVars.boardId,
		cookieData = $.cookie(cookieName);

	if(cookieData) {
		var columnsArray = cookieData.split(';');
		for(var i=0; i< columnsArray.length; i++) {
			if(columnsArray[i] == idPath) {
				return true;
			};
		};
	};

	return false;
};

function count_tasks_incolumn(columnId) {
	var tasksLength = tasksArray ? tasksArray.length : false,
		counter = 0;
	if(!tasksLength) {
		return 0;
	};
	for(var task = 0; task < tasksLength; task++) {
		var taskId = tasksArray[task]['columnid'],
			matches = taskId ? taskId.match(columnId) : false;
		if(matches) {
			counter++;
		};
	};

	return counter;
};

/* compare tasks now and column limit and return css class*/
function compare_tasksNow_limit(tasksNow, columnLimit) {
	if (columnLimit != 0 && tasksNow >  columnLimit) {
		return 'over';
	} else if (columnLimit != 0 && tasksNow == columnLimit) {
		return 'equal';
	} else {
		return '';
	};
};
/* End kanbanize.js */

/* edit_board.js */
function disableArrows($row, cellId) {
	var $cells = $row.find('[id^='+ cellId +']');

	$cells.find('a[class^=move_left]').attr('class', 'move_left');
	$cells.find('a[class^=move_right]').attr('class', 'move_right');
	$cells.first().find('a.move_left').attr('class', 'move_left_disabled');
	$cells.last().find('a.move_right').attr('class', 'move_right_disabled');
};

function updateRowspan() {
	var $rows = $('table.board thead tr'),
		rows_length = $rows.length;

	$rows.each(function() {
		var row = $(this),
			row_index = row.index();

		row.find('th').not('.swimlane, .backlog, .archive').each(function() {
			var cell = $(this),
				colspan = cell.attr('colspan'),
				rowspan = cell.attr('rowspan');

			if (colspan == 1) {
				if (row.next().find('th[id^=' + cell.attr('id') + ']').length) {
					cell.attr('rowspan', 1);
				} else {
					cell.attr('rowspan', (rows_length - row_index));
				};
			};
		});
	});
};

function disableDeleteIcon(section) {
	var $cells = $('table.board tr:eq(1)').find('th[id^='+ section +']');

	if ($cells.length <= 1) {
		$cells.find('.delete_column').attr('class', 'delete_column_disabled');
	} else {
		$cells.find('.delete_column_disabled').attr('class', 'delete_column');
	};
};
/* End edit_board.js */

/* board.js */
$(document).ready(function() {
	drawBoardArea();

	//~ $('#input_log_time, #refresh_interval, #hours_per_day').inputMask({
		//~ mask : 'numeric'
	//~ });

	//~ $('#task_deadline').inputMask({
		//~ mask : 'disabled'
	//~ });

	/* open and close backlog and archive */
	$('.backlog').click(function() {
		var $backlog = $('#backlog');
		if(!$backlog.hasClass('open')) {
			$backlog.trigger('click');
		};
	});

	$('.archive').click(function() {
		var $archive = $('#archive');
		if(!$archive.hasClass('open')) {
			$archive.trigger('click');
		};
	});

	$('#backlog, #backlog_fixed').click(function() {
		if (! $('.archive').hasClass('close')) return;

		var $backlog = $('#backlog, #backlog_fixed'),
			$backlog_text = $backlog.children('div'),
			$list = $('td.backlog').find('ul'),
			viewpointWidth = $(window).width(),
			speed = 1000,
			fixedHeaderVisible = false;

		if($backlog.is(':animated')) {
			return;
		};

		if(configs.globalVars.fixedHeader.is(':visible')) {
			configs.globalVars.fixedHeader.hide();
			fixedHeaderVisible = true;
		}

		if($backlog.hasClass('open')) {
			$backlog.stop().animate({
				'min-width' : 20
			}, {duration : speed, queue : false });
			$list.animate({
				'width' : 20
			}, {duration : speed, queue : false, complete : function() {
				$backlog.removeClass('open');
				$('.backlog').addClass('close');

				board_dimensions.close_backlog_or_archive();
				set_fixed_heder_width(configs.globalVars.fixedHeader);
				if(fixedHeaderVisible) {
					configs.globalVars.fixedHeader.show();
				}
			}});
			$backlog_text.hide();
		} else {
			$('.backlog').removeClass('close');
			$($backlog, $list).animate({
				'min-width' : (viewpointWidth / 2 )
			}, {duration : speed, queue : false });
			$list.animate({
				'width' : (viewpointWidth / 2 )
			}, {duration : speed, queue : false, complete : function() {
				$backlog.addClass('open');

				board_dimensions.open_backlog_or_archive({backlog : true});
				set_fixed_heder_width(configs.globalVars.fixedHeader);
				if(fixedHeaderVisible) {
					configs.globalVars.fixedHeader.show();
				}
			}});

			$backlog_text.show();
		};

	});

	$('#archive, #archive_fixed').click(function() {
		if (! $('.backlog').hasClass('close')) return;

		var $archive = $('#archive, #archive_fixed'),
			$archive_text = $archive.children('div'),
			$archive_settings = $('#board_archive_settings, #board_archive_settings_fixed'),
			$archiveName = $('th.archive > div.column_name'),
			$boardContainer = $('#board_container'),
			$list = $('td.archive').find('ul.tasks_list'),
			viewpointWidth = $(window).width(),
			scrollPosition = parseInt($boardContainer.find('table').width(), 10) -  (viewpointWidth / 2),
			speed = 1000,
			fixedHeaderVisible = false;

		if($archive.is(':animated')) {
			return;
		};

		if(configs.globalVars.fixedHeader.is(':visible')) {
			configs.globalVars.fixedHeader.hide();
			fixedHeaderVisible = true;
		}

		if($archive.hasClass('open')) {
			$archive_settings.hide();

			$archive.stop().animate({
				'min-width' : 20
			}, {duration : speed, queue : false});
			$list.animate({
				'width' : 20
			}, {duration : speed, queue : false, complete : function() {
				$archive.removeClass('open');
				$('.archive').addClass('close');

				board_dimensions.close_backlog_or_archive();
				set_fixed_heder_width(configs.globalVars.fixedHeader);
				if(fixedHeaderVisible) {
					configs.globalVars.fixedHeader.show();
				}
				isotope_refresh();
			}});

			$archive_text.hide();
		} else {
			$('.archive').removeClass('close');
			$archive.stop().animate({
				'min-width' : (viewpointWidth / 2 )
			}, { duration: speed, queue: false });
			$boardContainer.animate({
				scrollLeft : scrollPosition
			}, { duration: speed, queue: false});
			$list.animate({
				'width' : (viewpointWidth / 2 )
			}, {duration : speed, queue : false, complete : function() {
				$archive.addClass('open');
				//$archive_settings.show();

				board_dimensions.open_backlog_or_archive({archive : true});
				set_fixed_heder_width(configs.globalVars.fixedHeader);
				if(fixedHeaderVisible) {
					configs.globalVars.fixedHeader.show();
				}
				isotope_refresh();
			}});

			$archive_text.show();
		};
	});
	/* end functions to collapse and expand backlog and archive */

	/* focus and blur */
	$('#task_settings, #project_setings').find('input').focus(function() {
		input_focus($(this));
	}).blur(function() {
		input_blur($(this));
	});

	/* Task Filter */
	new function() {
		var $filterField = $('#filter'),
			$tasksArray = [];

		$filterField.focus(function() {
			$tasksArray = $('.task');
		});

		$filterField.keyup(function(ev) {
			var keyCode = ev.keyCode,
				filterValue = '';

			if(!$tasksArray.length) {
				return;
			};

			if(keyCode == 13 || keyCode == 32 || keyCode == 8 || keyCode == 0) {
				filterValue = $filterField.val().toLowerCase();
				filter_tasks($tasksArray, $.trim(filterValue));
			};
		});

	};

	//$('ul.subtasks_collapse > li').tooltip()
});
/* END DOCUMENT READY */

/* inialization board settings tab */
function int_board_settings() {

	function show_board_settings(Obj) {
		if(Obj.response) {
			$('#refresh_interval').val(Obj.resparray.message.refreshinterval);
			$('#hours_per_day').val(Obj.resparray.message.hoursperday);
			$('#default_assignee').children('option[value="'+  Obj.resparray.message.defaultassignee+'"]').attr('selected', 'selected');
			$('#default_template').children('option[value="template_'+  Obj.resparray.message.defaulttemplate+'"]').attr('selected', 'selected');
		}
	}

	var obj = {
			boardsettings : '',
			method : 'get',
			action : configs.actions.ACT_BOARDSETTINGS
		},
		ajaxPath = configs.ajax_paths.taskBoardSettings;

		ajax_post(ajaxPath, obj, show_board_settings);
}

/* match tasks by filter value */
function filter_tasks($tasks, value) {
	$tasks.each(function(i, el) {
		var task = $(el),
			taskId = task[0].id.split('_')[1],
			taskHeader = task.find('.task_head').text().toLowerCase(),
			taskAssignee = task.find('strong.task_assignee').text().toLowerCase(),
			taskTitile = task.find('div.task_content').text().toLowerCase(),
			taskSize = task.find('.task_size').text().toLowerCase(),
			taskLeadTime = task.find('.leadtime').text().toLowerCase(),
			taskTags = task.find('.row_tags_view').text().toLowerCase(),
			taskSubtags = task.find('.subtasks_collapse').text().toLowerCase(),
			fullString =  taskId + taskHeader + taskAssignee + taskTitile + taskSize + taskLeadTime + taskTags + taskSubtags;

		if(fullString.indexOf(value) > -1) {
			task.fadeTo("fast", 1.00);
		} else {
			task.fadeTo("fast", 0.1);
		};
	});
}
/*End board.js */

function int_fixed_header() {
	var boardContainer = $('#board_container');
	var fixedHeader = $('<table id="fixed_header" class="board" cellspacing="0" cellpadding="0" />');
	var tableOffsetTop = boardContainer.find('table').offset().top;
	var originalHeader =  boardContainer.find('table thead');
	var originalHeaderHeight =  boardContainer.find('table thead').height();

	isotope_run();

	var clonedHeader = originalHeader.clone();
	var shown = false;
	var intervalMoveHeader = 0;

	clonedHeader.find('th').each(function() {
		$(this)[0].id = $(this)[0].id + '_fixed';
	});

	fixedHeader.css({'position': 'absolute', 'top' : '0', 'left' : '0', 'opacity' : '0.96', 'display': 'none', 'z-index' : '9'});
	fixedHeader.html(clonedHeader)

	configs.globalVars.fixedHeader = fixedHeader;

	boardContainer[0].onscroll = function() {
		if($('#backlog, #backlog_fixed, #archive, #archive_fixed').is(':animated')) {
			return;
		};
		clearTimeout(intervalMoveHeader);
		var crollTop = boardContainer[0].scrollTop;

		if(crollTop > originalHeaderHeight) {
			if(!shown) {
				fixedHeader.fadeIn('fast');
				shown = true;
			};

			fixedHeader[0].style.top =  crollTop + 'px';
		} else {
			if(shown) {
				fixedHeader.hide();
				shown = false;
			}
		}
	};

	boardContainer.append(fixedHeader);
	set_fixed_heder_width(configs.globalVars.fixedHeader);

	if(boardContainer[0].scrollTop > originalHeaderHeight) {
		fixedHeader.fadeIn('fast');
		shown = true;
		fixedHeader[0].style.top = boardContainer[0].scrollTop;
	}
}

function set_fixed_heder_width(fixedHeader) {
	$('#backlog_fixed').width($('td.backlog').width());
	$('#archive_fixed').width($('td.archive').width());
	$('ul.tasks_list').each(function() {
		var list = $(this);
		var width = list.parent().outerWidth()-1;
		var columnId = list[0].id.split('_c_')[1];

		fixedHeader.find('#' + columnId +'_fixed').css('width', width);
	});
}

function isotope_run(){
	$.each(configs.globalVars.isotopeables, function(i, isotopeable){
		$(isotopeable).isotope({
			// options
			itemSelector : '.task',
			resizesContainer: true,
			columnWidth: 200,
			layoutMode : 'fitRows',
			getSortData : {
				position : function ( elem ) {
					return parseInt( $(elem).attr('data-order'));
				}
			},
			sortBy : 'position',
			sortAscending : false
		});
	});
}

function isotope_refresh(){
	$.each(configs.globalVars.isotopeables, function(i, isotopeable){
		$(isotopeable).isotope('layout');
	});
}

board_dimensions = new function() {
	var visibleArea,
		table,
		tableHeight,
		viewpointHeight,
		bodyHeight,
		footerHeight,
		headerHeight,
		topMenuHeight,
		viewpointHeight,
		swimlanes,
		swimlaneRows = [],
		tasksRows = [],
		lists,
		heightDelta,
		swimnaleExtraheight,
		self = this,
		alreadyInit = false;
		rowsHeightAuto = true;

	this.init = function() {
		//$(document).ready(function() {
			//self.hide_footer_and_header();

			visibleArea = $('#board_container');
			if(!visibleArea.length) {
				visibleArea = $('#charts_container');
				if(!visibleArea.length) {
					return;
				};
			}

			table = $('.board');
			self.calculate_viewpoint();

			swimlanes = table.find('td.swimlane_inner');
			swimlanes.each(function() {
				var swimlaneRow = $(this).parent();

				swimlaneRow.css('height', 12);
				swimlaneRows.push(swimlaneRow);
				tasksRows.push(swimlaneRow.next())
			});


			$(swimlaneRows).css('height', '12px');

			lists = $('tbody').find('ul.tasks_list');

			self.get_height_delta();
			self.draw_visible_area();

			$(window).resize(function() {
				self.resize();
			});
		//});
	};

	this.resize = function() {
		self.calculate_viewpoint();
		self.get_height_delta();
		self.draw_visible_area();
		set_fixed_heder_width(configs.globalVars.fixedHeader);
	};

	this.calculate_viewpoint = function() {
		bodyHeight = $('body').height() -6; //- 80; /* footer height */
		headerHeight = $('.header').height();
		topMenuHeight = $('.top_menu').height(); // + 60;
		footerHeight = $('.footer').height();
		viewpointHeight = bodyHeight - (headerHeight + topMenuHeight + footerHeight);
	}

	this.get_height_delta = function() {
		tableHeight = table.height();
		heightDelta = viewpointHeight - tableHeight;
		swimnaleExtraheight = Math.floor(heightDelta / swimlanes.length);
	}

	this.hide_footer_and_header = function() {
		$('.footer').hide();
		$('.header').addClass('collapse');
	};

	this.draw_visible_area = function() {
		visibleArea[0].style.height = (viewpointHeight) + "px";
		visibleArea[0].style.display = 'block';

		self.show_board();
		if(heightDelta > 0) {
			self.rows_height();
		}
	};

	this.show_board = function() {
		$('#loading').hide();
		table.css('visibility', 'visible');
	};

	this.rows_height = function() {
		var tbodyHeight = 0;

		$(tasksRows).each(function(index) {
			var tasksRow = $(this);


			currentHeight = tasksRow.height() - 10 /* borders */;
			tasksRow.css('height', (currentHeight + swimnaleExtraheight) + 'px');
		});

		self.set_list_height();
	};

	this.open_backlog_or_archive = function(params) {
		var parentList;

		if(params.backlog) {
			parentList = $('td.backlog > ul');
		} else if(params.archive) {
			parentList = $('td.archive > ul');
		};

		parentList.css('min-height', 'auto');

		//var tasksListArray = {};
		var backlogArchiveHeight = parentList.height();
		var tasksRowsHeight = 0;

		$(tasksRows).each(function(index) {
			var firstListHeight = this.children('td').eq(0).children('ul').eq(0).height();
			tasksRowsHeight =	tasksRowsHeight + firstListHeight; //+ swimlaneRows[index].outerHeight();
			//tasksListArray[index] = firstListHeight;
		});

		tasksRowsHeight = tasksRowsHeight + (19 /* simlane height */ * swimlanes.length);

		if(backlogArchiveHeight > tasksRowsHeight) {
			if(tasksRows.length > 1) {
				tasksRows[tasksRows.length - 1].css('height', 'auto');
			} else {
				tasksRows[0].css('height', backlogArchiveHeight);
			}

			self.set_list_height();
		}
	};

	this.close_backlog_or_archive = function() {
		lists.css({'min-height': 140, 'height' : 'auto'});
		$(tasksRows).each(function() { this.css('height', 'auto');});

		self.get_height_delta();
		self.rows_height({});
	};

	this.before_open_backlog_or_archive = function() {
		if(tasksRows.length > 1) {
			tasksRows[tasksRows.length - 1].css('height', 'auto');
		}
	}

	this.set_list_height = function() {
		lists.css({'min-height': 140, 'height' : 'auto'});
		lists.each(function() {
			var list = $(this);

			list.css('min-height', list.parent().height());
		});
	}
}

function ajax_post(/*...*/){ /*mock function*/ }

function blink(elem, times, speed) {
  if (times > 0 || times < 0) {
    if ($(elem).hasClass("blink"))
      $(elem).removeClass("blink");
    else
      $(elem).addClass("blink");
  }

  clearTimeout(function () {
  	blink(elem, times, speed);
  });

  if (times > 0 || times < 0) {
    setTimeout(function () {
   		blink(elem, times, speed);
    }, speed);
    times -= .5;
  }
}

$(function() {
  blink('#new_essay', 20, 500);
});
