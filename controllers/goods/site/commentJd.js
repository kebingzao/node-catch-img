var cheerio = require("cheerio");
var Q = require("q");
var _ = require("underscore");
var airHelper = require('../../../lib/helper');

// 抓取京东的晒单数据
module.exports = {
    // 配置
    setting: {
      //京东的页面是gbk编码，所以要带上gbk，不然中文会乱码
      encoding: "gbk"
    },
    // 从抓取的页面获取商品信息
    getGoodsData: function(data,url, opt){
      var defer = Q.defer();
      var $ = cheerio.load(data);
      var id = url.replace(/(.*item\.jd\.com\/)(\S+)(\.html.*)/g, '$2');
      // 这边要用text，不然中文会乱码, 同时还要过滤掉一些敏感字符
      var goodName = $("#name h1").text().trim().replace(/[`~!@#$^&*()+=|\[\]\{\}:;'\,.<>/?]/g, "");
      var originImgArr = [];
      var urlSetting = opt.urlsSetting[url];
      var count = urlSetting.start || 0;
      // 最大页数
      var maxPage = urlSetting.end;
      if(maxPage < count){
        maxPage = count + 10;
      }
      var getPageUrl = function(index){
        // 有图的评价
        //return 'http://club.jd.com/productpage/p-'+ id +'-s-4-t-3-p-'+ index +'.html';
        // 总的评价， 不一定有图
        return 'http://club.jd.com/productpage/p-'+ id +'-s-0-t-3-p-'+ index +'.html';
      };
      var doCatch = function(){
        if(count > maxPage){
          defer.resolve({
            imgArr: [
              {
                key: '340X400',
                value: _.map(originImgArr, function (item) {
                  return item.replace("128x96", '340x400').replace("https:", "http");
                })
              }
            ],
            goodsName: goodName
          });
        }else{
          console.log(count);
          airHelper.getPageData(getPageUrl(count)).then(function(data) {
            // 获取数据并下载
            //console.log(data);
            try{
              if(data){
                data = JSON.parse(data);
                if(data.comments && data.comments.length > 0){
                  _.each(data.comments,function(comments){
                    _.each(comments.images,function(item){
                      // 先取340
                      originImgArr.push(item.imgUrl);
                    });
                  });
                }
              }else{
                count = maxPage;
              }
            }catch(e){
              count = maxPage;
            }
            count += 1;
            doCatch();
          },function(){
            console.log("error");
          });
        }
      };
      doCatch();
      return defer.promise;
    }
};