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

let usernamePrefix = 'org.couchdb.user:';

function listUsers() {
    let url = BASE_API_URL + '_users/_all_docs';
    console.debug(url);

    let options = {
        method: 'GET',
        uri: url
    };
    return rp.get(options)
        .then(function (docs) {
            docs = JSON.parse(docs);
            let usernames = docs.rows
                .filter(x => x.id.includes(usernamePrefix))
                .map(x => x.id.slice(usernamePrefix.length));
            return Promise.all(getProfileInfos(usernames));
        })
        .then(function (results) {
            return results
                .filter(x => typeof x !== 'undefined' && x);
        })
}

exports.listUsers = function (req, res) {
    listUsers()
        .then(function (docs) {
            res.status(200).type('json').send({names: docs});
        })
        .catch(function (err) {
            res.status(409).type('text/plain').send(err.message);
        });
};

function getProfileInfos(usernames) {
    let promises = [];
    usernames.forEach(function (username) {
        promises.push(getProfileInfo(username));
    });
    return promises;
}

function getProfileInfo(username) {
    let database = 'user_' + username + '_profile';
    let url = BASE_API_URL + database + '/profile';
    console.debug(url);

    let options = {
        method: 'GET',
        uri: url
    };
    return rp.get(options)
        .then(function (docs) {
            let profile = JSON.parse(docs);
            profile.username = username;
            delete profile._id;
            delete profile._rev;
            return profile;
        })
        .catch(function (err) {
            // console.error(err);
            // throw err;
        });
}

exports.listUsersExcel = function (req, res) {
    listUsers()
        .then(function (docs) {
            const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
            const header = Object.keys(docs[0])
            let csv = docs.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
            csv.unshift(header.join(','))
            csv = csv.join('\r\n')


            res.setHeader('Content-disposition', 'attachment; filename=testing.csv');
            res.set('Content-Type', 'text/csv');
            res.status(200).send(csv);
        });
}