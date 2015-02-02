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
        // New subject
        subjects.push(Subject.fromTableRow($(this)));
      } else if (isActivityRow) {
        // New activity for the most recent subject
        var subject = subjects[subjects.length - 1];
        Activity.fromTableRow($(this));
      } else {
        // Irrelevant row
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
};

function Activity(type, number, day, startTime, duration, finishTime) {
  if (arguments.length < 5) {
    throw new Error('Too few arguments supplied to create the Activity object.');
  }
}

Activity.fromTableRow = function (row) {
  var cells = row.children().map(function() {return this.innerHTML;});
  
  var type       = cells[0],
      number     = cells[1],
      day        = cells[2],
      startTime  = cells[3],
      duration   = cells[4],
      finishTime = new Date('1/1/2015 ' + startTime).addMinutes(90).get24hrTime();
  
  return new Activity(type, number, day, startTime, duration, finishTime);
};

Date.prototype.addMinutes = function (minutes) {
  return new Date(this.getTime() + parseInt(minutes) * 60000);
};

Date.prototype.get24hrTime = function () {
  return this.getHours() * 100 + this.getMinutes();
};