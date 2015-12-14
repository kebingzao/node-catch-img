var moment = require("moment");
var duobao_global = require("./global");
var dbSiteHelper = require('../../lib/dbSiteHelper');
var siteCatch = require("./site");
module.exports = function (req, res, next) {
  var site = req.query["site"];
  var pageData = {
    title: duobao_global.SITE_LIST[site],
    site: site,
    time: moment().format("YYYY-MM-DD"),
    data: ''
  };
  // 插入数据库
  var insertSiteData = function(){
    dbSiteHelper.getCollectionItem(site,{time: pageData.time}).then(function(){
      // 如果已经存在，那么直接覆盖
      console.log("已经存在，直接覆盖");
      dbSiteHelper.getCollection(site).update({
        "time": pageData.time
      }, {'$set':{
        "data": pageData.data
      }}, function (err, list) {
        if (err){
          console.log("err: " + err);
          throw err;
        }
        res.render('duobao/catch', pageData);
      });
    },function(){
      console.log("不存在，插入");
      dbSiteHelper.getCollection(site).insert({
        "name": site,
        "time": pageData.time,
        "data": pageData.data
      }, function (err, list) {
        if (err){
          console.log("err: " + err);
          throw err;
        }
        res.render('duobao/catch', pageData);
      });
    });
  };
  var doFinish = function(data){
    pageData.data = data;
    // 接下来入库
    dbSiteHelper.checkSiteExist(site).then(function(){
      // 已存在
      insertSiteData();
    },function(){
      dbSiteHelper.dbSiteList.insert({
        key: site,
        name: duobao_global.SITE_LIST[site]
      },function(){
        insertSiteData();
      });
    });
  };
  switch(site){
    case "yiyuan":
      siteCatch.yiyuan().then(doFinish);
      break;
    case "quanmin":
      siteCatch.quanmin().then(doFinish);
      break;
    case "yyyg":
      siteCatch.yyyg().then(doFinish);
      break;
    case "xunlei":
      siteCatch.xunlei().then(doFinish);
      break;
  }
};