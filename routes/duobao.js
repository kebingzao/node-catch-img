var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var moment = require("moment");
var _ = require("underscore");
// 要抓取的站点列表
var SITE_LIST = {
  "yiyuan": "一元夺宝",
  "quanmin": "全民夺宝",
  "yyyg": "一元云购"
};

var airHelper = require('../lib/helper');
var dbSiteHelper = require('../lib/dbSiteHelper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('duobao', {
    data: _.pairs(SITE_LIST)
  });
});
// 抓取网易的一元夺宝
var catchYiYuan = function(){
  var defer = Q.defer();
  var pageData = {
    title: "网易一元夺宝",
    th: ['编号','名称'],
    td: []
  };
  // 最大页数
  var maxPage = 15;
  var getPageUrl = function(index){
    return "http://1.163.com/list/0-0-1-"+ index +".html";
  };
  var count = 1;
  var doCatch = function(){
    if(count > maxPage){
      defer.resolve(pageData)
    }else{
      airHelper.getPageData(getPageUrl(count)).then(function(data) {
        // 获取数据并下载
        var $ = cheerio.load(data);
        var tdArr = [];
        $(".w-quickBuyList-item .w-goods-title a").each(function(i, e) {
          tdArr.push({
            name: $(e).text()
          })
        });
        pageData.td = pageData.td.concat(tdArr);
        count += 1;
        doCatch();
      },function(){
        console.log("error");
      });
    }
  };
  doCatch();
  return defer.promise;
};

// 抓取一元云购的页面
var catchYYYG = function(){
  var defer = Q.defer();
  var pageData = {
    title: "一元云购",
    th: ['编号','名称'],
    td: []
  };
  // 最大页数
  var maxPage = 5;
  var getPageUrl = function(index){
    return "http://www.yyyg.com/goods_list/index.html?p=" + index;
  };
  var count = 1;
  var doCatch = function(){
    if(count > maxPage){
      defer.resolve(pageData);
    }else{
      airHelper.getPageData(getPageUrl(count)).then(function(data) {
        // 获取数据并下载
        var $ = cheerio.load(data);
        var tdArr = [];
        $("#ulGoodsList .w-goods-title a").each(function(i, e) {
          tdArr.push({
            name: $(e).text().replace(/([一十1]元云购)(.*)/,"$2")
          })
        });
        // 获取尾页
        var pageEndUrl = $("#Page_End a").attr("href");
        pageEndUrl && (maxPage = pageEndUrl.replace(/(.*)(\?p=)(.*)/, "$3").trim());
        pageData.td = pageData.td.concat(tdArr);
        count += 1;
        doCatch();
      },function(){
        console.log("error");
      });
    }
  };
  doCatch();
  return defer.promise;
};

// 抓取全民夺宝的页面
var catchQuanmin = function(){
  var defer = Q.defer();
  var pageData = {
    title: "全民夺宝",
    th: ['编号','名称'],
    td: []
  };
  // 最大页数
  var maxPage = 15;
  var getPageUrl = function(index){
    return "http://www.qmduobao.com/list/hot20/p_"+ index +".html";
  };
  var count = 1;
  var doCatch = function(){
    if(count > maxPage){
      defer.resolve(pageData);
    }else{
      airHelper.getPageData(getPageUrl(count)).then(function(data) {
        // 获取数据并下载
        var $ = cheerio.load(data);
        var tdArr = [];
        $("#ulGoodsList .soon-list-name a").each(function(i, e) {
          tdArr.push({
            name: $(e).text().replace(/(\(第\S+期\))(.*)/g, "$2").replace("【全民夺宝】","")
          })
        });
        pageData.td = pageData.td.concat(tdArr);
        count += 1;
        doCatch();
      },function(){
        console.log("error");
      });
    }
  };
  doCatch();
  return defer.promise;
};

router.get('/catch', function(req, res) {
  var site = req.query["site"];
  var pageData = {
    title: site,
    site: site,
    data: ''
  };
  switch(site){
    case "yiyuan":
      pageData.title = "针对网易一元夺宝的商品页面抓取";
      break;
    case "quanmin":
      pageData.title = "针对全民夺宝的商品页面抓取";
      break;
    case "yyyg":
      pageData.title = "针对一元云购的商品页面抓取";
      break;
  }
  res.render('duobao/catch', pageData);
});

router.post('/catch', function(req, res, next) {
  var site = req.query["site"];
  var pageData = {
    title: site,
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
        name: SITE_LIST[site]
      },function(){
        insertSiteData();
      });
    });
  };
  switch(site){
    case "yiyuan":
      pageData.title = "针对网易一元夺宝的商品页面抓取";
      catchYiYuan().then(doFinish);
      break;
    case "quanmin":
      pageData.title = "针对全民夺宝的商品页面抓取";
      catchQuanmin().then(doFinish);
      break;
    case "yyyg":
      pageData.title = "针对一元云购的商品页面抓取";
      catchYYYG().then(doFinish);
      break;
  }
});



module.exports = router;