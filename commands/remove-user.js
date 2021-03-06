var _ = require('lodash');
var async = require('async');
var gh = require('../lib/gh');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = {
    name:'remove-user',
    description:'Remove a user from your org',
    example: 'bosco remove-user <org> <user>',
    cmd:cmd
}

function cmd(bosco, args, next) {

    var repoPattern = bosco.options.repo;
    var repoRegex = new RegExp(repoPattern);
    var org = args.shift();
    var user = args.shift();

    if(!org || !user) {
        bosco.error('You must provide an org and user');
        process.exit(1);
    }

    var ghclient = gh(bosco.config.get('github:authToken'));

    bosco.log('Removing ' + user + ' from org ' + org);
    ghclient.removeUserFromOrg(org, user, function(err, result) {
        bosco.log('Done');
    });

}
