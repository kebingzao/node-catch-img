var express = require('express');
var router = express.Router();
var airHelper = require('../lib/helper');
/* GET home page. */
router.get('/', function(req, res, next) {
  var url = "http://item.jd.com/2025639.html";

  airHelper.getPageData(url).then(function(data) {
    airHelper.getAllImg(data, ".spec-items li img").then(function(zipName){
      // 下载到本地
      res.download(zipName);
    });
  },function(){
    console.log("error");
  });
  //res.render('index', { title: 'Express' });
});

module.exports = router;
