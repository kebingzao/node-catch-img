var express = require('express');
var router = express.Router();
var cheerio = require("cheerio");
var fs = require("fs");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../lib/helper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('aso', {
    data: ''
  });
});

router.post('/', function(req, res, next) {
  var url = req.body["url"];
  var pageData = {
    title: "",
    time: "",
    th: ['名次','图标','名字','厂商'],
    td: []
  };
  // 获取dom
  airHelper.getPageData(url).then(function(data) {
    // 获取数据并下载
    var $ = cheerio.load(data);
    pageData.time = $(".date-range-picker span").html();
    pageData.title = $("title").html();
    var tdArr = [];
    $(".rank-list .thumbnail").each(function(i, e) {
      var name = $(e).find(".caption h5").html();
      var num = name.split(".")[0];
      tdArr.push({
        // 这边不需要总榜
        //num: $(e).find(".caption h6 span").html(),
        num: num,
        icon: $(e).find("img").attr("data-original") || $(e).find("img").attr("src"),
        name: name.substr(num.length + 1),
        company: $($(e).find(".caption h6")[0]).html()
      })
    });
    pageData.td = tdArr;
    res.render('aso', {
      data: pageData
    });
  },function(){
    console.log("error");
  });
});

module.exports = router;