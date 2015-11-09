var express = require('express');
var router = express.Router();
var http = require("http");
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var archiver = require('archiver');

/**
 * Returns array of file names from specified directory
 *
 * @param {dir} directory of source files.
 * return {array}
 */
var getDirectoryList = function(dir){
  var fileArray = [];
  var walk = function(path,childPath){
    var files = fs.readdirSync(path);
    files.forEach(function(item) {
      var tmpPath = path + "/" + item,
          stats = fs.statSync(tmpPath);
      if (stats.isDirectory()) {
        walk(tmpPath,childPath + item + '/');
      } else {
        var obj = {name: childPath + item, path: dir};
        fileArray.push(obj);
      }
    });
  };

  walk(dir,'');
  return fileArray;
};

function writeZip (dir,name,callback) {
  var zipName = name + ".zip",
      fileArray = getDirectoryList(dir),
      output = fs.createWriteStream(zipName),
      archive = archiver('zip');

  archive.pipe(output);
  output.on('close', function() {
    console.log('archiver has been finalized and the output file descriptor has closed.');
    // 执行回调函数
    callback(zipName);
  });
  fileArray.forEach(function(item){
    var file = item.path + item.name;
    archive.append(fs.createReadStream(file), { name: item.name });
  });

  archive.finalize(function(err, written) {
    if (err) {
      throw err;
    }
  });
}

function download(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}
// 获取单张图片
function catchImg(url, name){
  var defer = Q.defer();
  console.log("加载的图片为" + url);
  http.get(url,function (res) {
    //二进制（binary）
    res.setEncoding('binary');
    var re ='';
    res.on('data',function (data) {
      re += data;
    }).on('end', function () {
      //var b = new Buffer(re);
      fs.writeFile('tmp/' + name + ".jpg", re, 'binary',function(err){
        if(err) throw err;
        console.log("保存成功2");
        defer.resolve();
      });
    })
  }).on('error', function (e) {
    defer.reject();
    console.log("Got error: " + e.message);
  });
  return defer.promise;
}

// 获取全部图片
function getAllImg(data, select, res){
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
      // todo http://img14.360buyimg.com/n5/jfs/t2053/317/924464287/25158/b0e589f2/5631d1a9N4668d62a.jpg
      // 只要把链接中的n5，改成n4，n3，n2，n1，就可以下载对应的图片
      // 最后下载
      writeZip("tmp/","n5",function(zipName){
        // 下载到本地
        res.download(zipName);
        //defer.resolve();
      });
    }
  };
  // 接下来一张张下载
  _.each(imgSrcArr, function(item,index){
    (function(item, index){
      catchImg(item,index).then(doSuccess, doSuccess);
    })(item,index);
  });
  return defer.promise;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var url = "http://item.jd.com/2025639.html";

  download(url, function(data) {
    if (data) {
      getAllImg(data, ".spec-items li img", res).then(function(){
        res.render('index', { title: 'Express' });
      });
      console.log("done");
    } else {
      console.log("error");
    }
  });
});

module.exports = router;
