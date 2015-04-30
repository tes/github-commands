var _ = require('lodash');
var async = require('async');
var gh = require('../lib/gh');
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

    var ghclient = gh(bosco.config.get('github:authToken'));

    bosco.log('Fetching repo list from Github ...');

    ghclient.getAllTeams(org, function(err, teams) {
        if(!teams[team]) {
            bosco.error('Could not find the team: ' + team);
            process.exit(1);
        }
        ghclient.getAllRepos(org, function(err, repoList) {
            async.mapSeries(repoList, function(repo, cb) {
                if(repo.name.match(repoRegex)) {
                    bosco.log('Adding ' + repo.name + ' to team ' + team);
                    ghclient.addRepoToTeam(teams[team], org, repo.name, cb);
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

}
