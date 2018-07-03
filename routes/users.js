var userController = require('../controllers/auth');
var express = require('express');
var router = express.Router();

router.put('/', function (req, res, next) {
    userController.createDatabaseForUser(req, res);
});

router.get('/', function (req, res, next) {
    userController.listUsers(req, res);
});

module.exports = router;
