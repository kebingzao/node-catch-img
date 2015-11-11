// phantom.js �����ִ���ļ�

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
  // ����jquery
  page.includeJs( '/public/javascripts/jquery.min.js', function() {
    // ��ȡ����ͼ
    var imgMsg = page.evaluate(function() {
      //return document.title;
      var imgArr = [];
      $("#J-detail-content img").each(function(){
        imgArr.push($(this).attr("data-lazyload") || $(this).attr("src"));
      });
      return imgArr;
    });
    // ����������ֵ
    console.log(JSON.stringify({
      code : 1,
      msg: imgMsg
    }));
    phantom.exit();
  });
});