var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../lib/helper');

var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

var TMPFILE = 'tmp';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('jd', {});
});

// 通过 phantom.js 获取页面中用js加载的东西
// todo 京东的详情图片是不包含在页面的源代码里面的，而是通过页面的js加载出来的，因此要用phantom.js等页面加载完之后，再从dom里面取
var getDetailImg = function(url){
  var defer = Q.defer();
  var childArgs = [
    path.join(__dirname, '../public/phantom/jd.js'),
    url
  ];
  childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
    var firstIndex = stdout.indexOf('{"code');
    var lastIndex = stdout.indexOf('"]}');
    var target = stdout.substr(firstIndex, lastIndex - firstIndex + 3);
    try{
      target = JSON.parse(target);
      if(target.code == 1){
        // 返回详情图片数组
        defer.resolve(target.msg);
      }
    }catch(e){
      defer.reject();
    }
  });
  return defer.promise;
};

// 获取全部图片
var getAllImg = function(imgSrcArr, fileName, url){
  var defer = Q.defer();
  var tatalCount = 0;
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
  // 开始一张张加载
  var doLoad = function(){
    // 这时候总数有变
    _.each(allImgSrcArr,function(item){
      tatalCount += item.length;
    });
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
  };
  // 接下来就获取详情图片了
  getDetailImg(url).then(function(arr){
    allImgSrcArr["descr"] = arr;
    doLoad();
  });
  return defer.promise;
};

/* GET catch page. */
// 目前只针对京东
router.get('/catch', function(req, res, next) {
  //var url = "http://item.jd.com/2025639.html";
  var url = req.query["url"];
  // 首先清空tmp目录
  airHelper.clearDir(TMPFILE, function(){
    // 获取dom
    // 京东的页面是gbk编码，所以要带上gbk，不然中文会乱码
    airHelper.getPageData(url, 'gbk').then(function(data) {
      var $ = cheerio.load(data);
      var imgSrcArr = [];
      $(".spec-items li img").each(function(i, e) {
        imgSrcArr.push("http:" + $(e).attr("src"));
      });
      // 这边要用text，不然中文会乱码, 同时还要过滤掉一些敏感字符
      var goodName = $("#name h1").text().replace(/[`~!@#$^&*()+=|\[\]\{\}:;'\,.<>/?]/g, "");
      console.log(goodName);
      var fileName = TMPFILE + "/" + goodName;
      // 接下来创建文件夹
      // 接下来创建一个对应文件
      airHelper.createDir(fileName, function(){
        // 获取数据并下载
        getAllImg(imgSrcArr, fileName, url).then(function(){
          // 接下来是保存
          airHelper.writeZip(fileName + "/",TMPFILE + "/" + goodName,function(zipName){
            // 最后下载到本地
            res.download(zipName);
          });
        });
      });
    },function(){
      console.log("error");
    });
  });
});

module.exports = router;