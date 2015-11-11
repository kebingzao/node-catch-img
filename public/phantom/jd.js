// phantom.js 里面的执行文件

var page = require('webpage').create();
var url = "";
if (phantom.args.length === 0) {
  console.log(JSON.stringify({
    code : 0,
    msg : "no url"
  }));
  phantom.exit();
}else{
  url = phantom.args[0];
}
console.log(url);
page.open(url, function(status) {
  // 加载jquery
  page.includeJs( '/public/javascripts/jquery.min.js', function() {
    // 获取详情图
    var imgMsg = page.evaluate(function() {
      //return document.title;
      var imgArr = [];
      $("#J-detail-content img").each(function(){
        imgArr.push($(this).attr("data-lazyload") || $(this).attr("src"));
      });
      return imgArr;
    });
    // 这个是输出的值
    console.log(JSON.stringify({
      code : 1,
      msg: imgMsg
    }));
    phantom.exit();
  });
});