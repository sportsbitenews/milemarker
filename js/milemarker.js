$(function() {
  var reposloaded = false;
  var md = new Remarkable({
    linkify: true
  });

  // Invoked when the user clicks the radio buttons.
  function filterDidChange(radio) {
    localStorage.setItem('filter', radio.value);
    if (!reposloaded) {
      return;
    }
    $('#container tbody tr').hide();
    $('.tag-' + radio.value).show();
  }

  // Add event listeners to each radio button.
  var radioButtons = document.filter.filterby;
  for(var i = 0; i < radioButtons.length; i++) {
    radioButtons[i].onclick = function() {
      filterDidChange(this)
    };
  }

  function loadRadioState() {
    var filter = localStorage.getItem('filter');
    if (filter) {
      var radio = document.getElementById('filter-' + filter);
      radio.click();
      filterDidChange(radio);
    } else {
      var radio = document.getElementById('filter-android');
      radio.click();
      filterDidChange(radio);
    }
  }  
  $(document).ready(loadRadioState);

  // Refresh button
  document.getElementById('refresh').onclick = function() {
    localStorage.clear();
  };

  requestGitHubAPI('/orgs/material-motion/repos', function(json) {
    json = json.sort(function(a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    for (var i = 0; i < json.length; ++i) {
      var repo = json[i];

      var name = repo.name.replace(/^material-motion-/, '');
      repo['shortName'] = name;

      var filterClass = 'tag-other';
      if (repo.name.match(/-android$/)) {
        filterClass = 'tag-android';
      } else if (repo.name.match(/-(objc|swift)$/)) {
        filterClass = 'tag-appleos';
      } else if (repo.name.match(/-(web|js)$/)) {
        filterClass = 'tag-web';
      }

      function startRow() {
        var row = document.createElement('tr');
        row.className = filterClass;

        var col1 = document.createElement('td');
        col1.className = 'mdl-data-table__cell--non-numeric';

        var button = document.createElement('a');
        button.href = repo.html_url;
        button.appendChild(document.createTextNode(repo.shortName));
        componentHandler.upgradeElement(button);

        col1.appendChild(button);
        row.appendChild(col1);

        $('#container tbody').append(row);
        return row;
      }

      // Fetch this repo's milestones.

      requestGitHubAPI('/repos/material-motion/' + repo.name + '/milestones', function(json) {
        if (json.length == 0) {
          var row = startRow();
          var col2 = document.createElement('td');
          col2.className = 'mdl-data-table__cell--non-numeric';
          row.appendChild(col2);

          var col3 = document.createElement('td');
          col3.className = 'mdl-data-table__cell--non-numeric';
          row.appendChild(col3);
        }
        for (var i = 0; i < json.length; ++i) {
          var row = startRow();

          var col2 = document.createElement('td');
          col2.className = 'mdl-data-table__cell--non-numeric';
          row.appendChild(col2);

          var col3 = document.createElement('td');
          col3.className = 'mdl-data-table__cell--non-numeric';
          row.appendChild(col3);
          
          var milestone = json[i];
          if (milestone.state == 'open') {
            var totalIssues = milestone.closed_issues + milestone.open_issues;

            var title = document.createElement('a');
            title.href = "https://github.com/" + repo.owner.login + "/" + repo.name + "/milestone/" + milestone.number;

            title.appendChild(document.createTextNode(milestone.title));

            var description = document.createElement('div');
            var descriptionHTML = md.render(milestone.description);
            descriptionHTML += "<br/>" + milestone.open_issues + " issues remain";
            description.innerHTML = descriptionHTML;

            col2.appendChild(createCard(title, description));

            if (totalIssues > 0) {
              var progress = document.createElement('div');
              progress.className = 'mdl-progress mdl-js-progress';
              componentHandler.upgradeElement(progress);
              progress.MaterialProgress.setProgress(milestone.closed_issues / totalIssues * 100);

              col3.appendChild(progress);
            }
          }
        }
      });
    }
    
    reposloaded = true;

    loadRadioState();
  });
  
  // Utility methods

  // Create a material lite card.
  function createCard(titleNode, descriptionNode) {
    var card = document.createElement('div');
    card.className = 'mdl-card mdl-shadow--2dp';
    titleNode.className = 'mdl-card__title';
    descriptionNode.className = 'mdl-card__supporting-text';
    card.appendChild(titleNode);
    card.appendChild(descriptionNode);
    return card;
  }

  // Cached github request.
  function requestGitHubAPI(path, callback) {
    var storage = localStorage.getItem(path);
    if (storage) {
      callback.call(null, JSON.parse(storage));
      return;
    }
    $.ajax({
      url: 'https://api.github.com' + path,
      complete: function(xhr) {
        localStorage.setItem(path, JSON.stringify(xhr.responseJSON));
        callback.call(null, xhr.responseJSON);
      }
    });
  }
});
