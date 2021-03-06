//Year View Start ----------------------------------------------------------------------------------
//add by kebin --> 6
fcViews.year = YearView;

function YearView(element, calendar) {
	var t = this;
	// exports
	t.render = render;
	
	// imports
	BasicYearView.call(t, element, calendar, 'year');
	var opt = t.opt;
	var renderYear = t.renderYear;
	var formatDate = calendar.formatDate;  
	
	function render(date, delta) {
		if (delta) {
			t.curYear = addYears(date, delta);
		}
		var start = cloneDate(date, true);		
    var firstMonth = opt('firstMonth') || 0;
		//start.setDate(1);
		start.setFullYear(start.getFullYear(),firstMonth,1);
		var end = cloneDate(date);
		end.setFullYear(end.getFullYear()+((firstMonth+12)/12)|0, (firstMonth+11)%12,31);
		
		var visStart = cloneDate(start); //set startDay
    var firstDay = opt('firstDay');
    
		var visEnd = cloneDate(end);
		var nwe = opt('weekends') ? 0 : 1;
    addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
    addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
		colAndRow = '3x4'; //'2x6', '3x4', '4x3' 3 types

		t.title = formatDate(start, opt('titleFormat'));
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderYear(colAndRow, 6, nwe ? 5 : 7, true);
	}
}

function BasicYearView(element, calendar, viewName) {
	var t = this;
	
	// exports
	t.renderYear = renderYear;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // for selection (kinda hacky)
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.defaultEventEnd = defaultEventEnd;
	t.getHoverListener = function() { return hoverListener };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
	t.cellIsAllDay = function() { return true };
	t.allDayRow = allDayRow;
	t.allDayBounds = allDayBounds;
	t.getRowCnt = function() { return rowCnt; };
	t.getColCnt = function() { return colCnt; };
	t.getColWidth = function() { return colWidth; };
	t.getBodyRows = function() { return bodyRows; };
	t.getDaySegmentContainer = function() { return daySegmentContainer; };
  t.getRowLefts = getRowLefts;
  t.gridToView = gridToView;  
	
	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
  BasicEventRenderer.call(t);
  t.compileDaySegs = compileYearSegs;
  t.calculateDayDelta = calculateDayDelta;
	//BasicYearEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var daySelectionMousedown = t.daySelectionMousedown;
	var formatDate = calendar.formatDate;
	
	
	// locals
	var table;
	//var head;
	//var headCells;
	var body;
	var bodyRows;
	
	var mainBody;
	var subTables;
	
	var bodyCells;
	//var bodyFirstCells;
	var bodyCellTopInners;
	var daySegmentContainer;
	
	var viewWidth;
	var viewHeight;
	var colWidth;
	
	var rowCnt, colCnt;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;
  var otherMonthDays = [];
  var rowsForMonth = [];
	
	var rtl, dis, dit;
	var firstDay;
  var firstMonth;
	var nwe;
	var tm;
	var colFormat;
	
	
	
	/* Rendering
	------------------------------------------------------------*/
	
	
	disableTextSelection(element.addClass('fc-grid'));
	
	
	function renderYear(maxr, r, c, showNumbers) {
		rowCnt = r;
		colCnt = c;
		updateOptions();
		var firstTime = !table;
		if (firstTime) {
			buildSkeleton(maxr, showNumbers);      
		}else{
			clearEvents();
		}
		
    updateCells(firstTime);
	}
	
	
	
	function updateOptions() {
		rtl = opt('isRTL');
		if (rtl) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		firstDay = opt('firstDay');
    firstMonth = opt('firstMonth') || 0;
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');
	}
	
	
	
	function buildSkeleton(maxRowCnt, showNumbers) {
		var s;
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var i, j;
		var dayStr;
		var di = cloneDate(t.start);
    var monthsPerRow = parseInt(maxRowCnt); //a bit hookey, "3x4" parses to 3
		
    
    rowCnt = 0;
		var localWeekNames =['S','M','T','W','T','F','S'];
		var localMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		s ="<table class='fc-border-separate fc-year-main-table' style='width:100%'><tr >";
		for(var m=0; m<12; m++) {
      var mi = (m+firstMonth)%12;
      var miYear = di.getFullYear() + ((m+firstMonth)/12)|0;
			di.setFullYear(miYear,mi,1);
      if (nwe) { skipWeekend(di); }
			di.setFullYear(miYear,mi,1-di.getDay()+firstDay);
			if(m%monthsPerRow==0 && m > 0) s+="</tr><tr>";
			
			s +="<td class='fc-year-monthly-td'>";
			s +="<table class='fc-border-separate' style='width:100%' cellspacing='0'>"+
				"<thead>"+
				"<tr><td colspan='7' class='fc-year-monthly-header' /><a data-year='"+di.getFullYear()+"' data-month='"+mi+"' class='fc-year-monthly-name' href=\"#\">"+localMonthNames[mi]+"</a></td></tr>"+
				"<tr>";
  		for (i=firstDay; i<colCnt+firstDay; i++) {
	  		s +="<th class='fc-year-month-weekly-head'>"+ localWeekNames[i%7]+"</th>"; // need fc- for setDayID
		  }
  		s +="</tr>" +
	  		"</thead>" +
		  	"<tbody>";

      rowsForMonth[mi] = 0;
      for (i=0; i<6; i++) {                
        if (nwe) {
          skipWeekend(di);
        }
        //don't show week if all days are in next month
        if (di.getMonth() == (mi+1)%12) {
          continue;
        }
        rowsForMonth[mi]++;
        
        rowCnt++;
			  s +="<tr class='fc-week" + i + "'>";
        for (j=0; j<colCnt; j++) {
		  		if(di.getMonth()== mi) {
			  		dayStr=formatDate(di, '-yyyy-MM-dd');
				  }else{
					  dayStr="";
  				}
	  			s +="<td class='fc- " + contentClass + " fc-day" + dayStr + "'>" + // need fc- for setDayID
		  			"<div>" +
			  		(showNumbers ?
				  		"<div class='fc-day-number'/>" :
					  	''
						  ) +
  					"<div class='fc-day-content' style='min-height:20px'>" +
            "<div style='position:relative;'></div>" +
	  				"</div>" +
		  			"</div>" +
			  		"</td>";
				  addDays(di, 1);	
  			}
        if (nwe) {
          skipWeekend(di);
        }
  			s +="</tr>";			
		  }
  		s +="</tbody>" +
	  		"</table>";
		  s+="</td>";
		}
		s+="</tr></table>";
		table = $(s).appendTo(element);
		head = table.find('thead');
		headCells = head.find('th.fc-year-month-weekly-head');
		//mainBody = table.find('tbody table');
		subTables = table.find('table');
		//subTables.each( function(x, _sub){
		//   });
		
		
		bodyRows = table.find('table tbody tr');
		bodyCells = table.find('tbody').find('td').not('.fc-year-monthly-td');
		bodyFirstCells = bodyCells.filter(':first-child');
		bodyCellTopInners = bodyRows.eq(0).find('div.fc-day-content div');
		
		markFirstLast(head.add(head.find('tr'))); // marks first+last tr/th's
		markFirstLast(bodyRows); // marks first+last td's
    
    table.find('.fc-year-monthly-name').click(function() {
      calendar.gotoDate($(this).attr('data-year'), $(this).attr('data-month'), 1);
      calendar.changeView('month');
    });
		
		dayBind(bodyCells);
		daySegmentContainer =$("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(element);
	}
			
	function updateCells(firstTime) {
		var startYear = t.start.getFullYear();
		var today = clearTime(new Date());
		var cell;
		var date;
		var row;    
    
		subTables.each(function(i, _sub){
		  if ( !t.curYear ) t.curYear = t.start;
      otherMonthDays[i] = [0,0];
            
  		var d = cloneDate(t.curYear);
      var mi = (i+firstMonth)%12;
      var miYear = d.getFullYear() + ((i+firstMonth)/12)|0;
	  	d.setFullYear(miYear,mi,1);
      if (nwe) { skipWeekend(d); }
      d.setFullYear(miYear,mi,1-d.getDay()+firstDay);
  		$(_sub).find('tbody > tr').each(function(iii, _tr) {
        if (nwe) { skipWeekend(d); }
        $(_tr).find('td').each(function(ii, _cell) {
			
			    var dayStr;
  			  cell = $(_cell);
      
  		  	if (d.getMonth() == mi) {
	  		  	cell.removeClass('fc-other-month');
		  		  dayStr=formatDate(d, '-yyyy-MM-dd');
  		  	} else{
	  		  	cell.addClass('fc-other-month');
		  		  dayStr="";
            if ((d.getMonth() < i) || (i==0 && d.getMonth() == 11)) {
              otherMonthDays[i][0]++;
            } else {
              otherMonthDays[i][1]++;
            }
  			  }
    			if (+d == +today && d.getMonth() == i) {
	    			cell.addClass(tm + '-state-highlight fc-today');
		    	}else{
			    	cell.removeClass(tm + '-state-highlight fc-today');
    			}
	    		var $div = cell.find('div.fc-day-number');
		    	$div.text(d.getDate()); 
			    $div.parent().parent().attr('class', "fc-widget-content fc-day" + dayStr);

  			  addDays(d, 1);
        });
        if (nwe) { skipWeekend(d); }
  		});
    });
		bodyRows.filter('.fc-year-have-event').removeClass('fc-year-have-event');
	}
	
	
	
	function setHeight(height) {
		/*
		viewHeight = height;
		
		var bodyHeight = viewHeight - head.height();
		var rowHeight;
		var rowHeightLast;
		var cell;
			
		if (opt('weekMode') == 'variable') {
			rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight = Math.floor(bodyHeight / rowCnt);
			rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
		}
		
		bodyFirstCells.each(function(i, _cell) {
			if (i < rowCnt) {
				cell = $(_cell);
				setMinHeight(
					cell.find('> div'),
					(i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
				);
			}
		});
		*/
	}
	
	
	function setWidth(width) {
		/*
		viewWidth = width;
		colContentPositions.clear();
		colWidth = Math.floor(viewWidth / colCnt);
		setOuterWidth(headCells.slice(0, -1), colWidth);
		*/
	}
	
  function compileYearSegs(events) {
    var segs = [];
    var rowStart = cloneDate(t.visStart);
    var visEventsEnds = $.map(events, exclEndDay);
    
    var row = 0;
  	subTables.each(function(i, _sub) {                  
  		var d = cloneDate(t.curYear);
      var mo = (i + firstMonth)%12;
      var moYear = d.getFullYear() + ((i+firstMonth)/12)|0;
	  	d.setFullYear(moYear,mo,1);
      if (nwe) { skipWeekend(d); }
      d.setFullYear(moYear,mo,1-d.getDay()+firstDay);
  		$(_sub).find('tbody > tr').each(function(iii, _tr) {
        if (nwe) { skipWeekend(d); }
        
        var rowStart = cloneDate(d);
        var curCols = colCnt;
        while (rowStart.getMonth() != mo) {
          addDays(rowStart, 1);
          curCols--;
        }
        
        var rowEnd = cloneDate(rowStart);
        for (i = 0; i < curCols; i++) {
          addDays(rowEnd, 1);
          if (rowEnd.getMonth() > rowStart.getMonth()) {
            break;
          }
        }
        
        rowSeg = stackSegs(sliceSegs(events, visEventsEnds, rowStart, rowEnd));
  			for (j=0; j<rowSeg.length; j++) {
	  			level = rowSeg[j];
		  		for (k=0; k<level.length; k++) {
			  		seg = level[k];
				  	seg.row = row;
					  seg.level = j; // not needed anymore
  					segs.push(seg);
	  			}
		  	}                
        
        row += 1;
        addDays(d, 5);
        if (nwe) { skipWeekend(d); }
      });
      
    });
    
    return segs;
	}
	
	
	/* Day clicking and binding
	-----------------------------------------------------------*/
	
	
	function dayBind(days) {
		days.click(dayClick).mousedown(daySelectionMousedown);
	}
		
	function dayClick(ev) {
		if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var match = this.className.match(/fc\-day\-(\d+)\-(\d+)\-(\d+)/);
			var date = new Date(match[1], match[2], match[3]);
			trigger('dayClick', this, date, true, ev);
		}
	}
	
	
	
	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/
	
	
	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var rowStart = cloneDate(t.visStart);
    
    var row = 0;
  	subTables.each(function(m, _sub){      
  		var d = cloneDate(t.curYear);
      var mo = (m+firstMonth)%12;
      var moYear = d.getFullYear()+((m+firstMonth)/12)|0;
	  	d.setFullYear(moYear,mo,1);
      if (nwe) { skipWeekend(d); }
      d.setFullYear(moYear,mo,1-d.getDay()+firstDay);
  		$(_sub).find('tbody > tr').each(function(iii, _tr) {
        if (nwe) { skipWeekend(d); }
        
        var curCols = colCnt;
        var rowStart = cloneDate(d);
        while (rowStart.getMonth() != mo) {
          addDays(rowStart, 1);
          curCols--;
        }
        
        var rowEnd = cloneDate(rowStart);
        for (i = 0; i < curCols; i++) {
          addDays(rowEnd, 1);
          if (rowEnd.getMonth() > rowStart.getMonth()) {
            break;
          }
        }
        
        var stretchStart = new Date(Math.max(rowStart, overlayStart));
		  	var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));            
			  if (stretchStart < stretchEnd) {
				  var colStart, colEnd;
  				if (rtl) {
	  				colStart = dayDiff(stretchEnd, d)*dis+dit+1;
		  			colEnd = dayDiff(stretchStart, d)*dis+dit+1;
			  	}else{
				  	colStart = dayDiff(stretchStart, d);
					  colEnd = dayDiff(stretchEnd, d);
  				}        
	  			dayBind(
		  			renderCellOverlay(row, colStart, row, colEnd-1)
			  	);
        }
        
        row += 1;
        addDays(d, 5);
        if (nwe) { skipWeekend(d); }
      });
      
    });    	
	}
	
	
	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
    var a = viewToGrid(col0,row0);
    col0 = a[0]; row0 = a[1];
    a = viewToGrid(col1,row1);    
    col1 = a[0]; row1 = a[1];
    
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}
	
  function getRowLefts(rowDivs) {    
    var i;
		var rowCnt = rowDivs.length;
		var lefts = [];
		for (i=0; i<rowCnt; i++) {
			lefts[i] = rowDivs[i][0].offsetLeft - rowDivs[0][0].offsetLeft; // !!?? but this means the element needs position:relative if in a table cell!!!!
		}
		return lefts;
  }
	
	/* Selection
	-----------------------------------------------------------------------*/
	
	
	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}
	
	
	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}
	
	
	function clearSelection() {
		clearOverlays();
	}
	
	
	function reportDayClick(date, allDay, ev) {
		var cell = dateCell(date);
		var _element = bodyCells[cell.row*colCnt + cell.col];
		trigger('dayClick', _element, date, allDay, ev);
	}
	
	
	
	/* External Dragging
	-----------------------------------------------------------------------*/
	
	
	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
			}
		}, ev);
	}
	
	
	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			var d = cellDate(cell);
			trigger('drop', _dragElement, d, true, ev, ui);
		}
	}
	
	
	
	/* Utilities
	--------------------------------------------------------*/
  function calculateDayDelta(cell, origCell, rowDelta, colDelta) {
	  var origMo = (origCell.row/5)|0;
    var newMo = (cell.row/5)|0;    
    var extra = 0;
    
    if (newMo >= origMo) {
      for (var i = origMo; i < newMo; i++) {
        if (otherMonthDays[i][1] > 0) {
          extra += 7;
        }
      }
    } else {
      for (var i = origMo; i >= newMo; i--) {
        if (otherMonthDays[i][0] > 0) {
          extra -= 7;
        }
      }      
    }
    
    return rowDelta*7 + colDelta * (opt('isRTL') ? -1 : 1) - extra;
  }
	
	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}
  
  function modRowsInMonth(a)
  {
    var rAdd = 0;
    for (var i = 0; i < 12; i += 3) {
      var weeksInRow = rowsForMonth[i]+rowsForMonth[i+1]+rowsForMonth[i+2];      
      if (a >= weeksInRow) {
        a -= weeksInRow;        
      } else {
        break;
      }
    }
    return a;
  }
  
  function gridToView(c,r)
  {
    r += modRowsInMonth(((c/colCnt)|0)*5);
    c = c % colCnt;// + ((c/15)|0)*15;
    
    return [c,r];
  }
  
  function viewToGrid(c,r)
  {
    c += (((r/5)|0)*colCnt)%15;
    
    var rAdd = 0;
    for (var i = 0; i < 12; i += 3) {
      var weeksInRow = rowsForMonth[i]+rowsForMonth[i+1]+rowsForMonth[i+2];      
      if (r >= weeksInRow) {
        r -= weeksInRow;
        rAdd += weeksInRow;
      } else {
        break;
      }
    }
    r = (r % 5)+rAdd;
    return [c,r];
  }

	
	
	coordinateGrid = new CoordinateGrid(function(rows, cols) {    
		var e, n, p;
		headCells.each(function(i, _e) {      
			e = $(_e);
			n = e.offset().left;
			p = [n, n+e.outerWidth()];
			cols[i] = p;
		});
		bodyRows.each(function(i, _e) {
			if (i < rowCnt) {
				e = $(_e);
				n = e.offset().top;				
				p = [n, n+e.outerHeight()];
				rows[i] = p;
			}
		});		
	}, function(c,r) { return t.gridToView(c,r); });
	
	
	hoverListener = new HoverListener(coordinateGrid);
	
	
	colContentPositions = new HorizontalPositionCache(function(col) {
		return bodyCellTopInners.eq(col);
	});
	
	
	function colContentLeft(col) {
		return colContentPositions.left(col);
	}
	
	
	function colContentRight(col) {
		return colContentPositions.right(col);
	}
	
	
	
	
	function dateCell(date) {
		return {
			row: Math.floor(dayDiff(date, t.visStart) / 7),
			col: dayOfWeekCol(date.getDay())
		};
	}
	
	
	function cellDate(cell) {
		return _cellDate(cell.row, cell.col);
	}
	
	
	function _cellDate(row, col) {
		return addDays(cloneDate(t.visStart), row*7 + col*dis+dit);
		// what about weekends in middle of week?
	}
	
	
	
	function dayOfWeekCol(dayOfWeek) {
    return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
	}
	
	
	
	
	function allDayRow(i) {
		return bodyRows.eq(i);
	}
	
	
	function allDayBounds(i) {
		return {
			left: 0,
			right: viewWidth
		};
	}
	
	
}

function BasicYearEventRenderer() {
	var t = this;
	
	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.bindDaySeg = bindDaySeg;
	
	
	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	//var setOverflowHidden = t.setOverflowHidden;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getHoverListener = t.getHoverListener;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var getBodyRows = t.getBodyRows;
	//var renderDaySegs = t.renderDaySegs;
	var resizableDayEvent = t.resizableDayEvent;
	
	
	
	/* Rendering
	--------------------------------------------------------------------*/
	
	
	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		//renderDaySegs(compileSegs(events), modifiedEventId);
    renderDayEvents(events, modifiedEventId);
	}
	
	
	function clearEvents() {
		reportEventClear();
    getBodyRows().find('.fc-day-content').html('');
		getDaySegmentContainer().empty();
	}
	
	
	function compileSegs(events) {
		var rowCnt = getRowCnt(),
			colCnt = getColCnt(),
			d1 = cloneDate(t.visStart),
			d2 = cloneDate(t.visEnd),
			visEventsEnds = $.map(events, exclEndDay),
			i, row,
			j, level,
			k, seg,
			segs=[];
			row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
			for (j=0; j<row.length; j++) {
				level = row[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.row = i;
					seg.level = j; // not needed anymore
					segs.push(seg);
				}
			}
		return segs;
	}
	
	function sliceSegs(events, visEventEnds, start, end) {
	var segs = [],
		i, len=events.length, event,
		eventStart, eventEnd,
		segStart, segEnd,
		isStart, isEnd;
	for (i=0; i<len; i++) {
		event = events[i];
		eventStart = event.start;
		eventEnd = visEventEnds[i];
		if (eventEnd > start && eventStart < end) {
			if (eventStart < start) {
				segStart = cloneDate(start);
				isStart = false;
			}else{
				segStart = eventStart;
				isStart = true;
			}
			if (eventEnd > end) {
				segEnd = cloneDate(end);
				isEnd = false;
			}else{
				segEnd = eventEnd;
				isEnd = true;
			}
			segs.push({
				event: event,
				start: segStart,
				end: segEnd,
				isStart: isStart,
				isEnd: isEnd,
				msLength: segEnd - segStart
			});
		}
	} 
	return segs.sort(segCmp);
}


// event rendering calculation utilities
function stackSegs(segs) {
	var levels = [],
		i, len = segs.length, seg,
		j, collide, k;
	for (i=0; i<len; i++) {
		seg = segs[i];
		j = 0; // the level index where seg should belong
		while (true) {
			collide = false;
			if (levels[j]) {
				for (k=0; k<levels[j].length; k++) {
					if (segsCollide(levels[j][k], seg)) {
						collide = true;
						break;
					}
				}
			}
			if (collide) {
				j++;
			}else{
				break;
			}
		}
		if (levels[j]) {
			levels[j].push(seg);
		}else{
			levels[j] = [seg];
		}
	}
	return levels;
}
	
	function bindDaySeg(event, eventElement, seg) {
		if (isEventDraggable(event)) {
			draggableDayEvent(event, eventElement);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableDayEvent(event, eventElement, seg);
		}
		eventElementHandlers(event, eventElement);
			// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
	}
  
  function renderDayEvents(segs, modifiedEventId) {
    var segCnt = segs.length;
		var rowsTd = getBodyRows();			
		for(var i=0;i<segs.length;i++){
      var seg = segs[i];
			var sd = cloneDate(seg.start);        
      var td = rowsTd.filter('.fc-day-'+formatDate(sd, 'yyyy-MM-dd'));
        
      if (td.length == 1) {
        var el = daySegHTML(seg);
        td.find('.fc-day-content').append(el);
        draggableDayEvent(seg, el);
      }      
		}
  }
  	
	function renderDaySegs(segs, modifiedEventId) {
		try{
			var segCnt = segs.length;
			var rowsTd = getBodyRows();
			//alert(rowsTd.find('td.fc-day-1-1'));
			//rowsTd.find('td.fc-day-1-1').addClass('fc-year-have-event');
			/*
			rowsTd.each(function(i,_td){
				alert(_td.className.match('\\d{4}-\\d{2}-\\d{2}'));
				$(_td).css();
			});
			*/
			for(var i=0;i<segs.length;i++){
				var sd = cloneDate(segs[i].start);        
				while(sd.getTime() < segs[i].end.getTime()) {
					rowsTd.filter('.fc-day-'+formatDate(segs[i].start, 'yyyy-MM-dd')).addClass('fc-year-have-event');
					addDays(sd,1);
				}
			}
			
			
		}catch(e){
			alert("MyrenderDaySegs:"+e);
		}
	}
	
	/* Dragging
	----------------------------------------------------------------------------*/
	
	
	function draggableDayEvent(event, eventElement) {
    zzz();
		var hoverListener = getHoverListener();
		var dayDelta;
		eventElement.draggable({
			zIndex: 9,
			delay: 50,
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				//hideEvents(event, eventElement);
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
					clearOverlays();
					if (cell) {
						//setOverflowHidden(true);
						dayDelta = rowDelta*7 + colDelta * (opt('isRTL') ? -1 : 1);
						renderDayOverlay(
							addDays(cloneDate(event.start), dayDelta),
							addDays(exclEndDay(event), dayDelta)
						);
					}else{
						//setOverflowHidden(false);
						dayDelta = 0;
					}
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (dayDelta) {
					eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
				}else{
					eventElement.css('filter', ''); // clear IE opacity side-effects
					showEvents(event, eventElement);
				}
				//setOverflowHidden(false);
			}
		});
	}


}

// Year View END ----------------------------------------------------------------------------------
