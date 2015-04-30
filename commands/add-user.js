var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var gh = require('../lib/gh');
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

    var ghclient = gh(bosco.config.get('github:authToken'));

    bosco.log('Fetching team list from Github ...');

    ghclient.getAllTeams(org, function(err, teams, teamsById) {
        var teamIds = getIds(teams);
        async.mapSeries(teamIds, function(team, cb) {
            bosco.log('Adding ' + user + ' to team ' + teamsById[team]);
            ghclient.addStaffToTeam(team, user, function(err, result) {
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

}
