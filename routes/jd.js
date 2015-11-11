var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../lib/helper');
var TMPFILE = 'tmp';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('jd', {});
});

// 获取全部图片
var getAllImg = function(data, select, fileName){
  var defer = Q.defer();
  var $ = cheerio.load(data);
  var imgSrcArr = [];
  $(select).each(function(i, e) {
    imgSrcArr.push("http:" + $(e).attr("src"));
  });
  var tatalCount = imgSrcArr.length;
  var currentCount = 0;
  var doSuccess = function(){
    currentCount += 1;
    if(currentCount === tatalCount){
      defer.resolve();
    }
  };

  //todo 注意，这边只针对京东进行处理
  // todo http://img14.360buyimg.com/n5/jfs/t2053/317/924464287/25158/b0e589f2/5631d1a9N4668d62a.jpg
  // 只要把链接中的n5，改成n4，n3，n2，n1，就可以下载对应的图片
  // 目前只抓n1，并把n1改成 intro_big_pics
  //var allImgSrcArr = {
  //  'n5': imgSrcArr,
  //  'n4': _.map(imgSrcArr,function(item){
  //    return item.replace("/n5/", '/n4/');
  //  }),
  //  'n3': _.map(imgSrcArr,function(item){
  //    return item.replace("/n5/", '/n3/');
  //  }),
  //  'n2': _.map(imgSrcArr,function(item){
  //    return item.replace("/n5/", '/n2/');
  //  }),
  //  'n1': _.map(imgSrcArr,function(item){
  //    return item.replace("/n5/", '/n1/');
  //  })
  //};
  var allImgSrcArr = {
    'intro_big_pics': _.map(imgSrcArr,function(item){
      return item.replace("/n5/", '/n1/');
    })
  };
  // 这时候总数有变
  tatalCount = tatalCount * _.keys(allImgSrcArr).length;
  // 接下来就循环一张一张下载
  _.each(allImgSrcArr, function(itemArr, key){
    // 这时候要先建对应的文件夹
    (function(itemArr, key){
      var detailFileName = fileName + "/" + key;
      airHelper.createDir(detailFileName, function(){
        // 接下来一张张下载
        _.each(itemArr, function(item,index){
          (function(item, index){
            airHelper.catchAndSaveImg(item, detailFileName + "/" + index).then(doSuccess, doSuccess);
          })(item,index);
        });
      })
    })(itemArr,key);
  });
  return defer.promise;
};

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
        getAllImg(data, ".spec-items li img", fileName).then(function(){
          // 接下来是保存
          airHelper.writeZip(fileName + "/",TMPFILE + "/" + name,function(zipName){
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