// 商品抓取的共用方法
var Q = require("q");
var airHelper = require('../../lib/helper');
var _ = require("underscore");
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

module.exports = {
  // 下载每一个url对应的图片
  doCatchTheImg: function(url, option){
    var defer = Q.defer();
    console.log("开始抓取：" + url);
    airHelper.getPageData(url, option.encoding).then(function(data) {
      defer.resolve(data);
    },function(){
      console.log("error");
    });
    return defer.promise;
  },
  // 通过 phantom.js 获取页面中用js加载的东西
  // todo 京东的详情图片是不包含在页面的源代码里面的，而是通过页面的js加载出来的，因此要用phantom.js等页面加载完之后，再从dom里面取
  getDetailImg: function(url, callback, phantomUrlName, count){
    count = count || 0;
    var self = this;
    var childArgs = [
      path.join(__dirname, '../../public/phantom/'+ phantomUrlName +'.js'),
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
          console.log("使用phantom抓取图片成功：" + url);
          _.isFunction(callback) && callback(target.msg);
        }
      }catch(e){
        console.log("使用phantom抓取图片失败：" + url);
        if(count < 3){
          console.log("phantom 抓取重试");
          self.getDetailImg(url,callback, phantomUrlName, count + 1);
        }else{
          // 有问题，返回为空
          _.isFunction(callback) && callback([]);
        }
      }
    });
  },
  // 获取全部图片
  getAllImg: function(imgArr, fileName){
    var defer = Q.defer();
    // 接下来就循环一张一张下载
    var doCatchAllImage = function(){
      if(imgArr.length > 0){
        var imgSrcObj = imgArr.shift();
        var imgSrcArr = imgSrcObj.value;
        var detailFileName = fileName + "/" + imgSrcObj.key;
        airHelper.createDir(detailFileName, function(){
          // 接下来一张张下载
          var count = -1;
          var doCatchAndSaveImg = function(){
            if(imgSrcArr.length > 0){
              count = count + 1;
              airHelper.catchAndSaveImg(imgSrcArr.shift(), detailFileName + "/" + count).then(doCatchAndSaveImg, doCatchAndSaveImg);
            }else{
              doCatchAllImage();
            }
          };
          doCatchAndSaveImg();
        })
      }else{
        // 成功返回
        defer.resolve();
      }
    };
    doCatchAllImage();
    return defer.promise;
  }
};