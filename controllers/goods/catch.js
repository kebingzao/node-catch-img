var airHelper = require('../../lib/helper');
var catchCommon = require('./common');
var siteCatch = require("./site");
var TMPFILE = 'tmp';

// router js/catch
module.exports = function (req, res, next) {
  // 根据换行符分行
  var urls = req.body["url"].split("\n");
  var total = urls.length;
  // 是否超时
  var isTimeout = false;
  res.setTimeout(Math.max(total * 60000, 30000),function(){
    console.log("响应超时.");
    //isTimeout = true;
    res.send("响应超时");
  });
  var unionId = "goodsCacth_" + new Date().getTime();
  var parentFileName = TMPFILE + "/" + unionId;
  var doSuccess = function(){
    // 接下来是保存
    if(isTimeout){
      // 超时，直接删掉资源文件
      airHelper.removeDir(parentFileName, function(){

      });
    }else{
      airHelper.writeZip(parentFileName + "/",TMPFILE + "/" + unionId,function(zipName){
        // 最后下载到本地
        // 清掉这个临时的目录，然后下载zip
        airHelper.removeDir(parentFileName, function(){
          console.log("成功抓取"+ total +"个商品");
          res.download(zipName);
        });
      });
    }
  };
  // 改为单进程
  var doCatch = function(){
    if(!isTimeout){
      if(urls.length > 0){
        var url = urls.shift().trim();
        if(url){
          // 默认京东的处理方式
          var catchHandler = siteCatch["catchJd"];
          // 判断是否是天猫
          if(url.indexOf("detail.tmall.com") > -1){
            catchHandler = siteCatch["catchTmall"];
          }
          catchCommon.doCatchTheImg(url, catchHandler.setting).then(function(data){
            catchHandler.getGoodsData(data, url).then(function(goodsData){
              var fileName = parentFileName + "/" + goodsData.goodsName;
              // 接下来创建一个对应文件夹
              airHelper.createDir(fileName, function(){
                // 获取数据并下载
                catchCommon.getAllImg(goodsData.imgArr, fileName).then(function(){
                  console.log("成功抓取：" + goodsData.goodsName);
                  doCatch();
                });
              });
            });
          });
        }else{
          doCatch();
        }
      }else{
        doSuccess();
      }
    }else{
      console.log("不应该进入到这里来");
    }
  };
  // 接下来创建文件夹
  // 接下来创建一个对应文件
  airHelper.createDir(parentFileName, function(){
    // 改为单进程，一条一条执行
    doCatch();
  });
};