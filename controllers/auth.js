var rp = require('request-promise-native');

let BASE_API_URL = "http://admin:Malaysia@54.255.228.108:5984/";

let DATABASES = [
    'profile',
    'production',
    'farm',
    'customer',
    'demand'
];

function setSecurityForDatabase(userId, database) {
    console.debug("setSecurityForDatabase userId:" + userId + " database: " + database);
    let url = BASE_API_URL + database + '/_security';

    let putBody = {
        admins: {
            names:
                [userId],
            roles:
                ['admins']
        },
        members: {
            names:
                [userId],
            roles:
                ['admins']
        }
    };

    let options = {
        method: 'PUT',
        uri: url,
        body: putBody,
        json: true
    };
    return rp.put(options)
        .then(function () {
            console.debug("setSecurityForDatabase: " + database + " success");
        })
        .catch(function (err) {
            console.error(err);
        })
}

function createDatabase(userId, database) {
    database = 'user_' + userId + '_' + database;
    console.debug('createDatabase: ' + database);
    let url = BASE_API_URL + database;

    let options = {
        method: 'PUT',
        uri: url
    };
    return rp.put(options)
        .then(function () {
            return setSecurityForDatabase(userId, database);
        })
}

function createDatanasesForUser(userId) {
    let promises = [];
    DATABASES.forEach(function (database) {
        promises.push(createDatabase(userId, database));
    });
    return promises;
}

exports.createDatabaseForUser = function (req, res) {
    let body = {
        name: req.body.id,
        type: 'user',
        roles: [],
        password: req.body.couchPassword
    };

    let url = BASE_API_URL + "_users/org.couchdb.user:" + req.body.id.toString();
    console.debug(url);

    let options = {
        method: 'PUT',
        uri: url,
        body: body,
        json: true
    };
    rp.put(options)
        .then(function () {
            return Promise.all(createDatanasesForUser(req.body.id));
        })
        .then(function () {
            res.status(200).type('text/plain').send('OK');
        })
        .catch(function (err) {
            res.status(409).type('text/plain').send(err.message);
        });

};