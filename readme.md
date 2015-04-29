# Helpful Github Commands

```
git clone
npm install
```

Then the following new bosco commands will work in this project:

## Add a new member to a number of teams

```
bosco add-user tes cliftonc Staff,Modules,Infra
```

## Remove a user from the org

```
bosco remove-user tes cliftonc
```

## Add All 'Staff' to a new team

```
bosco staff-team tes Modules
```

This will add all staff to the team 'modules'.

## Remove staff without 2FA from all teams

```
bosco enforce-2fa tes "Enable Two Factor Authentication"
```

## Remove staff without 2FA the organisation

```
bosco enforce-2fa tes
```
