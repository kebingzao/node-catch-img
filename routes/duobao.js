var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../lib/helper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('duobao', {

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
            name: $(e).html()
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
    data: ''
  };
  switch(site){
    case "yiyuan":
      pageData.title = "针对网易一元夺宝的商品页面抓取";
      catchYiYuan().then(function(data){
        pageData.data = data;
        res.render('duobao/catch', pageData);
      });
      break;
    case "quanmin":
      pageData.title = "针对全民夺宝的商品页面抓取";
      catchQuanmin().then(function(data){
        pageData.data = data;
        res.render('duobao/catch', pageData);
      });
      break;
    case "yyyg":
      pageData.title = "针对一元云购的商品页面抓取";
      break;
  }
});
module.exports = router;