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
// 网易的一元夺宝的数据
router.get('/yiyuan', function(req, res, next) {
  res.render('duobao/yiyuan', {
    data: ''
  });
});

router.post('/yiyuan', function(req, res, next) {
  var pageData = {
    title: "网易一元夺宝",
    th: ['编号','名称'],
    td: []
  };
  // 最大页数
  var maxPage = 10;
  var getPageUrl = function(index){
    return "http://1.163.com/list/0-0-1-"+ index +".html";
  };
  var count = 1;
  var doCatch = function(){
    if(count > maxPage){
      res.render('duobao/yiyuan', {
        data: pageData
      });
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
});

module.exports = router;