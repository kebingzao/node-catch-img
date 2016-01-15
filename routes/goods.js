var express = require('express');
var goods = require('../controllers/goods');


var router = express.Router();

router.get('/', goods.home);
router.post('/catch', goods.catch);
router.get('/comment', goods.comment);
router.post('/commentImg', goods.commentImg);

module.exports = router;