var cheerio = require("cheerio");
var Q = require("q");
var _ = require("underscore");
var catchCommon = require('../common');
// 抓取天猫的商品数据
module.exports = {
    // 配置
    setting: {
      //天猫的页面是gbk编码，所以要带上gbk，不然中文会乱码
      encoding: "gbk",
      // phantom 脚本的名字
      phantomUrlName: "tmall"
    },
    // 从抓取的页面获取商品信息
    getGoodsData: function(data,url){
      var defer = Q.defer();
      var $ = cheerio.load(data);
      var imgSrcArr = [];
      $("#J_UlThumb li img").each(function(i, e) {
        var imgSrc = $(e).attr("src");
        if(imgSrc.indexOf("http") != 0){
          imgSrc = "http:" + imgSrc
        }
        imgSrcArr.push(imgSrc);
      });
      // 这边要用text，不然中文会乱码, 同时还要过滤掉一些敏感字符
      var goodName = $(".tb-detail-hd h1").text().trim().replace(/[`~!@#$^&*()+=|\[\]\{\}:;'\,.<>/?]/g, "");
      // todo https://img.alicdn.com/bao/uploaded/i3/TB1gALrJpXXXXXyXXXXXXXXXXXX_!!0-item_pic.jpg_60x60q90.jpg
      // 只要把链接中的60x60改成 430x430
      var allImgSrcArr = [
        {
          key: 'intro_big_pics',
          value: _.map(imgSrcArr, function (item) {
            return item.replace("60x60", '430x430').replace("https:", "http");
          })
        }
      ];
      // 使用phantom js 或者详情图片
      catchCommon.getDetailImg(url,function(arr){
        allImgSrcArr.push({
          key: "descr",
          value: arr
        });
        defer.resolve({
          imgArr: allImgSrcArr,
          goodsName: goodName
        });
      },this.setting.phantomUrlName);
      return defer.promise;
    }
};