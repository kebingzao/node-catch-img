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

// 清空某一个文件夹
exports.clearDir = function(path,callback){
  fs.readdir(path, function(err, files){
    //err 为错误 , files 文件名列表包含文件夹与文件
    if(err){
      console.log('error:\n' + err);
      return;
    }
    var count = files.length;
    var delFinish =0;
    if(count == 0){
      _.isFunction(callback) && callback();
    }else{
      files.forEach(function(file,index){
        var filePath = path + '/' + file;
        fs.stat(filePath, function(err, stat){
          if(err){console.log(err); return;}
          if(stat.isDirectory()){
            // 如果是文件夹
            airRmdir(filePath,function(err){
              if(!err){
                console.log("删除=="+ filePath +"目录成功");
                delFinish += 1;
                // 判断是否是最后一个
                if(delFinish === count){
                  console.log("执行回调");
                  _.isFunction(callback) && callback();
                }
              }else{
                console.log("删除目录失败");
              }
            })
          }else{
            // 读出所有的文件
            // 如果是文件，就删除;
            fs.unlink(filePath, function (err) {
              delFinish += 1;
              if (err) {
                // 出错
                console.log("删除文件出错");
              }
              // 判断是否是最后一个
              if(delFinish === count){
                _.isFunction(callback) && callback();
              }
            });
          }
        });
      });
    }
  });
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
      fs.writeFile(name + ".jpg", re, 'binary',function(err){
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
exports.getAllImg = function(data, select, fileName){
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
  // 接下来一张张下载
  _.each(imgSrcArr, function(item,index){
    (function(item, index){
      exports.catchAndSaveImg(item, fileName + "/" + index).then(doSuccess, doSuccess);
    })(item,index);
  });
  return defer.promise;
};