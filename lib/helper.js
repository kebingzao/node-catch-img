var http = require("http");
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var archiver = require('archiver');
var airRmdir = require('rimraf');

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

// 生成zip文件
exports.writeZip = function (dir,name,callback) {
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
};

// 创建对应的文件夹
exports.createDir = function(path,cb){
  var dirArr = [];
  var pathArr = path.split(".")[0].replace(/\\/g,"/").split("/");
  if(path.split(".")[1]){
    // 如果存在后缀名，那么去掉最后一个
    pathArr.pop();
  }
  var tempArr = [];
  _.each(pathArr,function(item){
    tempArr.push(item);
    dirArr.push(tempArr.join("/"))
  });
  var count = 0;
  var makeDir = function(dirPath){
    if(dirPath){
      fs.exists(dirPath,function(exists) {
        count += 1;
        if (exists) {
          makeDir(dirArr[count]);
        } else {
          try{
            // 这边同步，防止提前回调
            fs.mkdirSync(dirPath);
            makeDir(dirArr[count]);
            console.log("创建"+ dirPath +"文件夹成功");
          }catch(e){
            console.log("创建"+ dirPath +"文件夹失败");
            makeDir(dirArr[count]);
          }
        }
      });
    }else{
      _.isFunction(cb) && cb(path);
    }
  };
  makeDir(dirArr[count]);
};

// 跟进url获取页面的html数据
exports.getPageData = function(url) {
  var defer = Q.defer();
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      defer.resolve(data);
    });
  }).on("error", function() {
    defer.reject();
  });
  return defer.promise;
};

// 获取并保存单张图片
exports.catchAndSaveImg = function(url, name){
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
        console.log("保存成功");
        defer.resolve();
      });
    })
  }).on('error', function (e) {
    defer.reject();
    console.log("Got error: " + e.message);
  });
  return defer.promise;
};

// 获取全部图片
exports.getAllImg = function(data, select){
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
      exports.writeZip("tmp/","n5",function(zipName){
        console.log("名字为");
        defer.resolve(zipName);
      });
    }
  };
  // 接下来一张张下载
  _.each(imgSrcArr, function(item,index){
    (function(item, index){
      exports.catchAndSaveImg(item,index).then(doSuccess, doSuccess);
    })(item,index);
  });
  return defer.promise;
};