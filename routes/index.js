var express = require('express');
var router = express.Router();
var airHelper = require('../lib/helper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

/* GET catch page. */
router.get('/catch', function(req, res, next) {
  var name = req.query["name"];
  //var url = "http://item.jd.com/2025639.html";
  var url = req.query["url"];
  airHelper.getPageData(url).then(function(data) {
    airHelper.getAllImg(data, ".spec-items li img").then(function(zipName){
      // 下载到本地
      res.download(zipName);
    });
  },function(){
    console.log("error");
  });
});

module.exports = router;