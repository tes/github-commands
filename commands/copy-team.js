var _ = require('lodash');
var async = require('async');
var github = require('octonode');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = {
    name:'copy-team',
    description:'Copies all members of one team to another team',
    example: 'bosco staff-to-team <org> <team-from> <team-to>',
    cmd:cmd
}

function cmd(bosco, args, next) {

    var repoPattern = bosco.options.repo;
    var repoRegex = new RegExp(repoPattern);
    var org = args.shift();
    var fromTeam = args.shift();
    var toTeam = args.shift();

    if(!org || !fromTeam || !fromTeam) {
        bosco.error('You must provide an org and teams from and to.');
        process.exit(1);
    }

    var client = github.client(bosco.config.get('github:authToken'));

    bosco.log('Fetching staff list from Github ...');

    getAllTeams(function(err, teams) {
        if(!teams[fromTeam]) {
            bosco.error('Could not find the team: ' + fromTeam);
            process.exit(1);
        }
        if(!teams[toTeam]) {
            bosco.error('Could not find the team: ' + toTeam);
            process.exit(1);
        }
        getAllStaff(fromTeam, teams, function(err, staffList) {
            async.mapSeries(staffList, function(staff, cb) {
                bosco.log('Adding ' + staff + ' to team ' + toTeam);
                addStaffToTeam(client, teams[toTeam], staff, function(err, result) {
                    cb(err);
                });
            }, function(err) {
                if(err) {
                    return bosco.error(err.message);
                }
                bosco.log('Complete!');
            })
        })
    });

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
                var teams = {};
                teamList.forEach(function(team) {
                    teams[team.name] = team.id;
                });
                cb(err, teams)
            }
        );
    }

    function getAllStaff(fromTeam, teams, cb) {
        var more = true, page = 1, staffList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getStaff(client, teams[fromTeam], page, function(err, staff, isMore) {
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
