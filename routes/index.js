var express = require('express');
var router = express.Router();
var airHelper = require('../lib/helper');
var TMPFILE = 'tmp';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

/* GET catch page. */
// 目前只针对京东
router.get('/catch', function(req, res, next) {
  var name = req.query["name"];
  //var url = "http://item.jd.com/2025639.html";
  var url = req.query["url"];
  var fileName = TMPFILE + "/" + name;
  // 首先清空tmp目录
  airHelper.clearDir(TMPFILE, function(){
    // 接下来创建一个对应文件
    airHelper.createDir(fileName, function(){
      // 获取dom
      airHelper.getPageData(url).then(function(data) {
        // 获取数据并下载
        airHelper.getAllImg(data, ".spec-items li img", fileName).then(function(){
          // 接下来是保存
          airHelper.writeZip(fileName + "/",name,function(zipName){
            // 最后下载到本地
            res.download(zipName);
          });
        });
      },function(){
        console.log("error");
      });
    });
  });
});

module.exports = router;