var userController = require('../controllers/auth');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.put('/', function (req, res, next) {
    userController.createDatabaseForUser(req, res);
});

module.exports = router;
