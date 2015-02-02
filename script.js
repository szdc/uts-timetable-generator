// ==UserScript==
// @name         UTS Timetable Generator
// @author       szdc
// @namespace    http://github.com/szdc
// @version      0.1
// @description  Timetable generator for UTS students
// @match        https://mysubjects.uts.edu.au/aplus2015/aptimetable*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @copyright    2015+, szdc
// ==/UserScript==

$(document).ready(function () {
  'use strict';
  
  var subjects = [];

  init();

  function init() {
    var table = $('table[cellspacing="1"] tr');
    table.each(function (index) {
      var isSubjectHeader = $(this).find('td > a').length > 0,
          isActivityRow   = $(this).attr('bgcolor') === '#eeeeee';
      
      if (isSubjectHeader) {
        subjects.push(Subject.fromTableRow($(this)));
      } else if (isActivityRow) {
        console.log('Activity row');
      } else {
        console.log('Header row');
      }
    });
    console.log('Subjects found: ' + subjects.length);
  }
});

function Subject(name, code, semester) {
  if (arguments.length < 3) {
    throw new Error('Too few arguments supplied to create the Subject object.');
  }
}

Subject.fromTableRow = function (row) {
  var content = row.find('b:first');
  
  var name     = content.text().substr(content.text().indexOf(':') + 1).trim(),
      code     = content.children('a').attr('href').match(/\d+/)[0],
      semester = /AUT/.test(content.text()) ? 'autumn' : 'spring';
  
  return new Subject(name, code, semester);
}

function Activity(type, number, day, startTime, duration) {
  if (arguments.length < 5) {
    throw new Error('Too few arguments supplied to create the Activity object.');
  }
}