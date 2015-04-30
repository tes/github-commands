var _ = require('lodash');
var async = require('async');
var github = require('octonode');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = {
    name:'repo-team',
    description:'Adds repos matching the regex to a team',
    example: 'bosco repo-team <org> <team> <regex>',
    cmd:cmd
}

function cmd(bosco, args, next) {

    var org = args.shift();
    var team = args.shift();
    var repoRegex = args.shift();

    if(!org || !team || !repoRegex) {
        bosco.error('You must provide an org and team.');
        process.exit(1);
    }

    var repoRegex = new RegExp(repoRegex);

    var client = github.client(bosco.config.get('github:authToken'));

    bosco.log('Fetching repo list from Github ...');

    getAllTeams(function(err, teams) {
        if(!teams[team]) {
            bosco.error('Could not find the team: ' + team);
            process.exit(1);
        }
        getAllRepos(function(err, repoList) {
            async.mapSeries(repoList, function(repo, cb) {

                if(repo.name.match(repoRegex)) {
                    bosco.log('Adding ' + repo.name + ' to team ' + team);
                    addRepoToTeam(client, teams[team], org, repo.name, cb);
                } else {
                    cb();
                }


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

    function getAllRepos(cb) {
        var more = true, page = 1, repoList = [];
        async.whilst(
            function () { return more; },
            function (callback) {
                getRepos(client, org, page, function(err, repos, isMore) {
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

    function getTeams(client, org, page, next) {
        client.get('/orgs/' + org + '/teams', {per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, body, _.contains(headers.link, 'rel="next"'));
        });
    }

    function getRepos(client, org, page, next) {
        client.get('/search/repositories', {q: 'user:'+ org, per_page: 20, page: page}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, body.items, _.contains(headers.link, 'rel="next"'));
        });
    }

   function addRepoToTeam(client, team, org, repo, next) {
        client.put('/teams/' + team + '/repos/' + org + '/' + repo, {}, function (err, status, body, headers) {
            if(err) { return next(err); }
            next(err, status);
        });
   }

}
