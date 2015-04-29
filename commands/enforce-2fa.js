var _ = require('lodash');
var async = require('async');
var github = require('octonode');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = {
    name:'enforce-2fa',
    description:'Enforces 2fa by moving all users without it into a holding team (optional).',
    example: 'bosco enforce-2fa <org> <team>',
    cmd:cmd
}

function cmd(bosco, args, next) {

    var repoPattern = bosco.options.repo;
    var repoRegex = new RegExp(repoPattern);
    var org = args.shift();
    var team = args.shift();

    if(!org) {
        bosco.error('You must provide an org and destination team.');
        process.exit(1);
    }

    var client = github.client(bosco.config.get('github:authToken'));

    bosco.log('Fetching staff list from Github ...');

    getAllTeams(function(err, teams, teamIds) {
        if(team && !teams[team]) {
            bosco.error('Could not find the team: ' + team);
            process.exit(1);
        }
        getAllStaff(teams, function(err, staffList) {
            async.mapSeries(staffList, function(staff, cb) {
                if(!team) {
                    console.log('Removing ' + staff + ' from ' + org);
                    removeUserFromOrg(client, org, staff, cb);
                } else {
                    removeFromAllTeams(client, teams, teamIds, staff, function(err) {
                        console.log('Adding ' + staff + ' to "' + team + '"');
                        addUserToTeam(client, teams[team], staff, cb);
                    });
                }
            }, function(err) {
                if(err) {
                    return bosco.error(err.message);
                }
                bosco.log('Complete!');
            })
        })
    });

    function removeFromAllTeams(client, teams, teamIds, staff, next) {
        var teamList = _.values(teams);
        async.mapSeries(teamList, function(team, cb) {
            console.log('Removing ' + staff + ' from "' + teamIds[team] + '"');
            removeUserFromTeam(client, team, staff, cb);
        }, next);
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
                cb(err, teams, teamIds)
            }
        );
    }

    function getAllStaff(teams, cb) {
        var more = true, page = 1, staffList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getOrgMembers(client, org, page, function(err, staff, isMore) {
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

    function getOrgMembers(client, org, page, next) {
        client.get('/orgs/' + org + '/members', {filter: '2fa_disabled', per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, _.pluck(body,'login'), _.contains(headers.link, 'rel="next"'));
        });
   }

   function addUserToTeam(client, team, username, next) {
        client.put('/teams/' + team + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
   }

    function removeUserFromTeam(client, team, username, next) {
        client.del('/teams/' + team + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
    }

    function removeUserFromOrg(client, org, username, next) {

        client.requestOptions({
            headers: {'Accept':'application/vnd.github.moondragon+json'}
        });

        client.del('/orgs/' + org + '/memberships/' + username, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });

   }


}
