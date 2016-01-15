var express = require('express');
var comment = require('../controllers/comment');


var router = express.Router();

router.get('/', comment.home);

module.exports = router;