var _ = require('lodash');
var async = require('async');
var gh = require('../lib/gh');
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

    var ghclient = gh(bosco.config.get('github:authToken'));

    bosco.log('Fetching staff list from Github ...');

    ghclient.getAllTeams(org, function(err, teams, teamIds) {
        if(team && !teams[team]) {
            bosco.error('Could not find the team: ' + team);
            process.exit(1);
        }
        ghclient.getAll2faDisabledStaff(org, function(err, staffList) {
            async.mapSeries(staffList, function(staff, cb) {
                if(!team) {
                    console.log('Removing ' + staff + ' from ' + org);
                    ghclient.removeUserFromOrg(org, staff, cb);
                } else {
                    removeFromAllTeams(teams, teamIds, staff, function(err) {
                        console.log('Adding ' + staff + ' to "' + team + '"');
                        ghclient.addUserToTeam(teams[team], staff, cb);
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

    function removeFromAllTeams(teams, teamIds, staff, next) {
        var teamList = _.values(teams);
        async.mapSeries(teamList, function(team, cb) {
            console.log('Removing ' + staff + ' from "' + teamIds[team] + '"');
            ghclient.removeUserFromTeam(team, staff, cb);
        }, next);
    }


}
