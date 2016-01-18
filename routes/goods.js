var express = require('express');
var goods = require('../controllers/goods');


var router = express.Router();

router.get('/', goods.home);
router.post('/catch', goods.catch);
router.get('/commentImg', goods.commentImgGet);
router.post('/commentImg', goods.commentImgPost);

module.exports = router;