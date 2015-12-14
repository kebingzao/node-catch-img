var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../../lib/helper');

var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

var TMPFILE = 'tmp';

// ͨ�� phantom.js ��ȡҳ������js���صĶ���
// todo ����������ͼƬ�ǲ�������ҳ���Դ��������ģ�����ͨ��ҳ���js���س����ģ����Ҫ��phantom.js��ҳ�������֮���ٴ�dom����ȡ
var getDetailImg = function(url){
  var defer = Q.defer();
  var childArgs = [
    path.join(__dirname, '../../public/phantom/jd.js'),
    url
  ];
  childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
    var firstIndex = stdout.indexOf('{"code');
    var lastIndex = stdout.indexOf('"]}');
    var target = stdout.substr(firstIndex, lastIndex - firstIndex + 3);
    try{
      target = JSON.parse(target);
      if(target.code == 1){
        // ��������ͼƬ����
        defer.resolve(target.msg);
      }
    }catch(e){
      defer.reject();
    }
  });
  return defer.promise;
};

// ��ȡȫ��ͼƬ
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

  //todo ע�⣬���ֻ��Ծ������д���
  // todo http://img14.360buyimg.com/n5/jfs/t2053/317/924464287/25158/b0e589f2/5631d1a9N4668d62a.jpg
  // ֻҪ�������е�n5���ĳ�n4��n3��n2��n1���Ϳ������ض�Ӧ��ͼƬ
  // Ŀǰֻץn1������n1�ĳ� intro_big_pics
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
  // ��ʼһ���ż���
  var doLoad = function(){
    // ��ʱ�������б�
    _.each(allImgSrcArr,function(item){
      tatalCount += item.length;
    });
    // ��������ѭ��һ��һ������
    _.each(allImgSrcArr, function(itemArr, key){
      // ��ʱ��Ҫ�Ƚ���Ӧ���ļ���
      (function(itemArr, key){
        var detailFileName = fileName + "/" + key;
        airHelper.createDir(detailFileName, function(){
          // ������һ��������
          _.each(itemArr, function(item,index){
            (function(item, index){
              airHelper.catchAndSaveImg(item, detailFileName + "/" + index).then(doSuccess, doSuccess);
            })(item,index);
          });
        })
      })(itemArr,key);
    });
  };
  // �������ͻ�ȡ����ͼƬ��
  getDetailImg(url).then(function(arr){
    allImgSrcArr["descr"] = arr;
    doLoad();
  });
  return defer.promise;
};

// ����ÿһ��url��Ӧ��ͼƬ
var doCatchTheImg = function(url, parentFileName){
  var defer = Q.defer();
  // ������ҳ����gbk���룬����Ҫ����gbk����Ȼ���Ļ�����
  airHelper.getPageData(url, 'gbk').then(function(data) {
    var $ = cheerio.load(data);
    var imgSrcArr = [];
    $(".spec-items li img").each(function(i, e) {
      imgSrcArr.push("http:" + $(e).attr("src"));
    });
    // ���Ҫ��text����Ȼ���Ļ�����, ͬʱ��Ҫ���˵�һЩ�����ַ�
    var goodName = $("#name h1").text().trim().replace(/[`~!@#$^&*()+=|\[\]\{\}:;'\,.<>/?]/g, "");
    console.log(goodName);
    var fileName = parentFileName + "/" + goodName;
    // �����������ļ���
    // ����������һ����Ӧ�ļ�
    airHelper.createDir(fileName, function(){
      // ��ȡ���ݲ�����
      getAllImg(imgSrcArr, fileName, url).then(function(){
        defer.resolve();
      });
    });
  },function(){
    console.log("error");
  });
  return defer.promise;
};

// router js/catch
module.exports = function (req, res, next) {
  // ���ݻ��з�����
  var urls = req.query["url"].split("\n");
  var total = urls.length;
  var count = 0;
  var parentFileName = TMPFILE + "/" + "jd";
  var doSuccess = function(){
    if(count === total){
      // �������Ǳ���
      airHelper.writeZip(parentFileName + "/",TMPFILE + "/" + "jd",function(zipName){
        // ������ص�����
        res.download(zipName);
      });
    }
  };
  // �������tmpĿ¼
  airHelper.clearDir(TMPFILE, function(){
    // �����������ļ���
    // ����������һ����Ӧ�ļ�
    airHelper.createDir(parentFileName, function(){
      // ��ȡdom
      _.each(urls,function(item){
        (function(url){
          doCatchTheImg(url, parentFileName).then(function(){
            count += 1;
            doSuccess();
          })
        })(item.trim());
      });
    });
  });
};