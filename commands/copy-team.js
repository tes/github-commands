var _ = require('lodash');
var async = require('async');
var gh = require('../lib/gh');
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

    var ghclient = gh(bosco.config.get('github:authToken'));

    bosco.log('Fetching staff list from Github ...');

    ghclient.getAllTeams(org, function(err, teams) {
        if(!teams[fromTeam]) {
            bosco.error('Could not find the team: ' + fromTeam);
            process.exit(1);
        }
        if(!teams[toTeam]) {
            bosco.error('Could not find the team: ' + toTeam);
            process.exit(1);
        }
        ghclient.getAllStaffInTeam(teams[fromTeam], function(err, staffList) {
            async.mapSeries(staffList, function(staff, cb) {
                bosco.log('Adding ' + staff + ' to team ' + toTeam);
                ghclient.addStaffToTeam(teams[toTeam], staff, function(err, result) {
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

}
