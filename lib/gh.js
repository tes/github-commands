var github = require('octonode');
var _ = require('lodash');
var async = require('async');

module.exports = function(token) {

    var client = github.client(token);

    return {
        getAllTeams: getAllTeams,
        getAll2faDisabledStaff: getAll2faDisabledStaff,
        getAllRepos: getAllRepos,
        getAllStaffInTeam: getAllStaffInTeam,
        addStaffToTeam: addStaffToTeam,
        removeUserFromTeam: removeUserFromTeam,
        addRepoToTeam: addRepoToTeam,
        removeUserFromOrg: removeUserFromOrg
    }

    function getAllTeams(org, cb) {
        var more = true, page = 1, teamList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getTeams(org, page, function(err, teams, isMore) {
                    if(err) { return callback(err); }
                    teamList = _.union(teamList, teams);
                    if(isMore) {
                        page = page + 1;
                    } else {
                        more = false;
                    }
                    callback();
                });
            },
            function (err) {
                var teams = {}, teamIds = {};
                teamList.forEach(function(team) {
                    teams[team.name] = team.id;
                    teamIds[team.id] = team.name;
                });
                cb(null, teams, teamIds);
            }
        );
    }

    function getAllStaffInTeam(team, cb) {
        var more = true, page = 1, staffList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getStaffInTeam(team, page, function(err, staff, isMore) {
                    if(err) { return callback(err); }
                    staffList = _.union(staffList, staff);
                    if(isMore) {
                        page = page + 1;
                    } else {
                        more = false;
                    }
                    callback();
                });
            },
            function (err) {
                cb(err, staffList)
            }
        );
    }

    function getAll2faDisabledStaff(org, cb) {
        var more = true, page = 1, staffList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getOrgMembers2faDisabled(org, page, function(err, staff, isMore) {
                    if(err) { return callback(err); }
                    staffList = _.union(staffList, staff);
                    if(isMore) {
                        page = page + 1;
                    } else {
                        more = false;
                    }
                    callback();
                });
            },
            function (err) {
                cb(err, staffList)
            }
        );
    }

    function getAllRepos(org, cb) {
        var more = true, page = 1, repoList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getRepos(org, page, function(err, repos, isMore) {
                    if(err) { return callback(err); }
                    repoList = _.union(repoList, repos);
                    if(isMore) {
                        page = page + 1;
                    } else {
                        more = false;
                    }
                    callback();
                });
            },
            function (err) {
                cb(err, repoList)
            }
        );
    }

    function getTeams(org, page, next) {
        client.get('/orgs/' + org + '/teams', {per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, body, _.contains(headers.link, 'rel="next"'));
        });
    }

    function getOrgMembers2faDisabled(org, page, next) {
        client.get('/orgs/' + org + '/members', {filter: '2fa_disabled', per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, _.pluck(body,'login'), _.contains(headers.link, 'rel="next"'));
        });
    }

    function removeUserFromTeam(team, username, next) {
        client.del('/teams/' + team + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
    }

    function getRepos(org, page, next) {
        client.get('/search/repositories', {q: 'user:'+ org, per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, body.items, _.contains(headers.link, 'rel="next"'));
        });
    }

    function addRepoToTeam(team, org, repo, next) {
        client.put('/teams/' + team + '/repos/' + org + '/' + repo, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
    }

    function removeUserFromOrg(org, username, next) {
        client.requestOptions({
            headers: {'Accept':'application/vnd.github.moondragon+json'}
        });
        client.del('/orgs/' + org + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
    }

    function getStaffInTeam(team, page, next) {
        client.get('/teams/' + team + '/members', {per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, _.pluck(body, 'login'), _.contains(headers.link, 'rel="next"'));
        });
    }

    function addStaffToTeam(team, username, next) {
        client.put('/teams/' + team + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
   }

}
