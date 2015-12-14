var express = require('express');
var jd = require('../controllers/jd');


var router = express.Router();

router.get('/', jd.home);
router.get('/catch', jd.catch);

module.exports = router;