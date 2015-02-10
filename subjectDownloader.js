'use strict';

// Modules
var request = require('request'),
    async   = require('async'),
    fs      = require('fs');

getSubjectList([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], function(err, subjects) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Subject list downloaded!');
  subjects.map(function (subject) {
    var code = /^\d+/.exec(subject.value)[0],
        name = /: (.+)/.exec(subject.content)[1].trim();
    subject.name = code + ': ' + name;
    delete subject.content;
  });
  subjects.sort(function (a, b) {
    return a.value.localeCompare(b.value);
  })
  fs.writeFile('timetableSubjects.json', JSON.stringify(subjects), function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Subject list saved successfully.');
    }
  });
});

/**
 * Compiles a list of subjects offered by UTS given the
 * specified filters.
 *
 * @param filters {Array}
 * An array of numbers that subject codes must start with,
 * e.g. [0, 1, 2] downloads subjects starting with 0, 1 and 2.
 *
 * @param callback {Function}
 * A function to receive the results array. 
 * Invoked with arguments (err, subjects).
 */
function getSubjectList(filters, callback) {
  var allSubjects = [];
  
  iterate(filters, function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null, allSubjects);
    }
  });
  
  /**
   * Iterates over an array of filters and downloads subject 
   * information for each.
   *
   * @param filters {Array}
   * An array of numbers to filter by.
   *
   * @param iterationDone {Function}
   * A function to receive notification that the iteration
   * is complete, or an error on failure.
   * Invoked with arguments (err).
   */
  function iterate(filters, iterationDone) {
    async.each(filters, function (filter, cb) {
      getSubjectsStartingWith(filter, function (err, subjects) {
        if (err) return cb(err);
        if (subjects.length === 400) {
          // 400 is the maximum number of subjects that load
          // at any one time, so determine the filter needed to
          // download the remaining subjects.
          var lastSubject = subjects.pop(),
              code = /^\d+/.exec(lastSubject.value)[0],
              newFilter = this.filter + code.substr(this.filter.toString().length, 1);
          
          // Remove the subjects that will appear when the remaining
          // subjects are downloaded (i.e. remove duplicates).
          subjects = subjects.filter(function (subject) {
            return new RegExp('^' + newFilter).test(subject.value) === false;
          });
          
          // Add the downloaded subjects to the array.
          allSubjects = allSubjects.concat(subjects);
          
          // Download the remaining subjects.
          iterate(getFilters(this.filter, code), function (err) {
            cb();
          });
        } else {
          allSubjects = allSubjects.concat(subjects);
          cb();
        }
      });
    }, function (err) {
      iterationDone();
    });
  }
  
  /**
   * Gets an array of filters given a prefix and subject code.
   *
   * @param prefix {String}
   * The static start of the subject code.
   *
   * @param subjectCode {String}
   * The subject code - used to find at what number to start the 
   * filter array from.
   */
  function getFilters(prefix, subjectCode) {
    var filters = [];
    var startAt = parseInt(subjectCode.substr(prefix.toString().length, 1));
    for (var i = startAt; i <= 9; i++) {
      filters.push('' + prefix + i);
    }
    return filters;
  }
}

/**
 * Downloads a list of subjects that start with the specified
 * filter, e.g. 1 downloads 10000 to 19999.
 *
 * @param filter {String}
 * The filter string that the subject code must start with.
 *
 * @param callback {Function}
 * A function to receive the results array. 
 * Invoked with arguments (err, subjects).
 */
function getSubjectsStartingWith(filter, callback) {
  var urlYQL = 'https://query.yahooapis.com/v1/public/yql?' +
               'q={query}&format=json&env=store://datatables.org/alltableswithkeys',
      query = 'select * from htmlpost where ' + 
              'url="https://mysubjects.uts.edu.au/aplus2015/aptimetable?fun=unit_select" ' + 
              'and postdata="filter=' + filter + '&filter_name=&faculty=ALL" ' + 
              'and xpath=\'//select[@name="unassigned"]/option\'',
      url = urlYQL.replace('{query}', encodeURIComponent(query));
  
  
  
  request(url, function (err, res, body) {
    if (err || res.statusCode !== 200) {
      return callback(new Error('Failed to complete the request.'));
    }
    
    var results = JSON.parse(body).query.results;
    if (!results || results.postresult.option.constructor !== Array) {
      return callback(new Error('No results found.'));
    }
    
    var subjects = results.postresult.option.slice(1);
    callback.call({filter: filter}, null, subjects);
  });
}