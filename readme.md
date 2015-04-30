# Helpful Github Commands

This is a set of Bosco commands that make managing github teams and users within a large organisation a little easier.

Ensure you have [bosco](https://github.com/tes/bosco) installed:

```
npm install bosco -g
```

Clone and install this project.

```
git clone git@github.com:tes/github-commands.git
cd github-commands
npm install
```

Now, the following bosco commands will work in this project.

#### Add a new member to a number of teams

```
bosco add-user [org] [username] [comma separated teams]
bosco add-user tes cliftonc Staff,Modules,Infra
```

#### Remove a user from the org

```
bosco remove-user [org] [username]
bosco remove-user tes cliftonc
```

#### Add All 'Staff' to a new team

```
bosco staff-team [org] [team]
bosco staff-team tes Modules
```

This will add all staff to the team 'modules'.

#### Add matching repositories to a team

```
bosco repo-team [org] [team] [regex]
bosco repo-team tes Modules modules-*
```

#### Remove staff without 2FA from the organisation

```
bosco enforce-2fa [org]
bosco enforce-2fa tes
```

#### Remove staff without 2FA from all teams and add them to a new team

```
bosco enforce-2fa [org] [team]
bosco enforce-2fa tes "Enable Two Factor Authentication"
```
