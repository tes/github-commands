var _ = require('lodash');
var async = require('async');
var github = require('octonode');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = {
    name:'add-user',
    description:'Add a user to multiple teams',
    example: 'bosco add-user <org> <user> <teamlist>',
    cmd:cmd
}

function cmd(bosco, args, next) {

    var repoPattern = bosco.options.repo;
    var repoRegex = new RegExp(repoPattern);
    var org = args.shift();
    var user = args.shift();
    var teamlist = args.shift();

    if(!org || !user || !teamlist) {
        bosco.error('You must provide an org, user and teamlist');
        process.exit(1);
    }

    var teamlist = teamlist.split(",");

    var client = github.client(bosco.config.get('github:authToken'));

    bosco.log('Fetching team list from Github ...');

    getAllTeams(function(err, teams, teamsById) {
        var teamIds = getIds(teams);
        async.mapSeries(teamIds, function(team, cb) {
            bosco.log('Adding ' + user + ' to team ' + teamsById[team]);
            addStaffToTeam(client, team, user, function(err, result) {
                cb(err);
            });
        }, function(err) {
            if(err) {
                return bosco.error(err.message);
            }
            bosco.log('Complete!');
        })
    });

    function getIds(teams) {
        return _.uniq(_.map(teamlist, function(item) {
            if(!teams[item]) {
                console.log('Could not find team: ' + item + ', skipping.');
            }
            return teams[item];
        }));
    }

    function getAllTeams(cb) {
        var more = true, page = 1, teamList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getTeams(client, org, page, function(err, teams, isMore) {
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

    function getAllStaff(teams, cb) {
        var more = true, page = 1, staffList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getStaff(client, teams['staff'], page, function(err, staff, isMore) {
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

    function getTeams(client, org, page, next) {
        client.get('/orgs/' + org + '/teams', {per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, body, _.contains(headers.link, 'rel="next"'));
        });
    }


    function getStaff(client, team, page, next) {
        client.get('/teams/' + team + '/members', {per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, _.pluck(body, 'login'), _.contains(headers.link, 'rel="next"'));
        });
   }

   function addStaffToTeam(client, team, username, next) {
        client.put('/teams/' + team + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
   }

}
