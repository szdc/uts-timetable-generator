app.service('utsYqlService', function ($http, timetabler) {
  this.getTimetableList = function (subjects, callback) {
    var yql =   'https://query.yahooapis.com/v1/public/yql?format=json&' +
                'q={query}&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys',
        query = 'select * from htmlpost where ' + 
                'url="https://mysubjects.uts.edu.au/aplus2015/aptimetable?' +
                'fun=unit_select&flat_timetable=yes" ' +
                'and postdata="student_set={subjects}" ' +
                'and xpath="//table[@cellspacing=\'1\']/tr"',
        subjectQueryString = subjects.reduce(function (queryString, subject) {
          return queryString + '&assigned=' + subject.value;
        }, '');
    
    query = query.replace('{subjects}', subjectQueryString);
    var url = yql.replace('{query}', encodeURIComponent(query));
    
    $http.get(url)
      .then(function (res) {
        var timetableList = getTimetableListFromResponse(res);
        callback(timetableList);
      }, function (err) {
        console.log(err);
      }
    );
  }

  function getTimetableListFromResponse(res) {  
    var results = res.data.query.results;
    if (results.length === 0) {
      console.log('No timetables found.');
      return [];
    }
    
    var rows = results.postresult.tr;

    var subjects = subjectsFromRows(rows);
    subjects.forEach(function (s) {
      console.log(s.getCode());
    });
    
    // Get all activity groups
    var activityGroups = activityGroupsFromSubjects(subjects);
    console.log('Total activity groups: ' + activityGroups.length);
    
    // Get all timetable combinations
    var timetableCombinations = cartesianProductOf(activityGroups);
    timetableCombinations = timetableCombinations.map(function (timetable) {
      return new timetabler.Timetable(timetable);
    });
    console.log('Timetable combinations: ' + timetableCombinations.length);
    
    var timetableList = new timetabler.TimetableList(timetableCombinations);
    return timetableList;
  }
  
  function subjectsFromRows(rows) {
    return rows.reduce(function (subjects, row) {
      var isSubjectHeader = typeof row.td.a !== 'undefined',
          isActivityRow   = row.bgcolor === '#EEEEEE';

      if (isSubjectHeader) {
        // New subject
        subjects.push(subjectFromTableRow(row));
      } else if (isActivityRow) {
        // New activity under the latest subject
        var subject   = subjects[subjects.length - 1],
            activity  = activityFromTableRow(row, subject);
        if (activity !== null) {
          subject.addActivity(activity);
        }
      }
      return subjects;      
    }, []);
  }
  
  function subjectFromTableRow(row) {
    var name     = row.td.strong.content.substr(2),
        code     = row.td.a.href.match(/\d+/)[0],
        semester = /AUT/.test(row.td.a.href) ? 'autumn' : 'spring';
    
    console.log('Added: ' + name + ' ' + code + ' ' + semester);
    
    return new timetabler.Subject(name, code, semester);
  }
  
  function activityFromTableRow(row, subject) {
    var cells = row.td.map(function(td) {
      if (td !== null) return td.p;
    });
    
    var invalidActivityTypes = ['ups', 'drp'],
        activityType = cells[0].toLowerCase().substr(0, 3);    
    
    if (invalidActivityTypes.indexOf(activityType) !== -1) return null;
    
    var details = {
      "type":       cells[0],
      "numbers":    [cells[1]],
      "day":        cells[2],
      "startTime":  parseInt(cells[3].replace(':', '')),
      "duration":   parseInt(cells[4]),
      "finishTime": new Date('1/1/2015 ' + cells[3]).addMinutes(cells[4]).get24hrTime(),
      "subject":    subject
    };
    
    return new timetabler.Activity(details);
  }
  
  function activityGroupsFromSubjects(subjects) {
    return subjects.reduce(function (activityGroups, subject) {
      var groups = subject.getActivityGroups(),
          keys = Object.keys(groups);
      
      keys.forEach(function (key) {
        activityGroups.push(groups[key]);
      });
      
      return activityGroups;
    }, []);
  }
  
  /**
   * Returns the cartesian product of N arrays.
   */
  function cartesianProductOf(arr) {
    return arr.reduce(function(a, b) {
      var ret = [];
      a.forEach(function(a) {
        b.forEach(function(b) {
          ret.push(a.concat([b]));
        });
      });
      return ret;
    }, [[]]);
  }
});

/**
 * Adds minutes to the date object.
 */
Date.prototype.addMinutes = function (minutes) {
  return new Date(this.getTime() + parseInt(minutes) * 60000);
};

/**
 * Returns the 24hr-formatted time.
 */
Date.prototype.get24hrTime = function () {
  return this.getHours() * 100 + this.getMinutes();
};