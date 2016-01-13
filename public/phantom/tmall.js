// phantom.js 用于抓取京东详细页

function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(function() {
        if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
          // If not time-out yet and condition not yet fulfilled
          condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
        } else {
          if(!condition) {
            // If condition still not fulfilled (timeout but condition is 'false')
            console.log("'waitFor()' timeout");
            phantom.exit(1);
          } else {
            // Condition fulfilled (timeout and/or condition is 'true')
            console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
            typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
            clearInterval(interval); //< Stop this interval
          }
        }
      }, 250); //< repeat check every 250ms
}

var page = require('webpage').create();
//page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36';
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
  if (status !== "success") {
    console.log("Unable to access network");
  } else {
    waitFor(function() {
      // Check in the page if a specific element is now visible
      return page.evaluate(function() {
        console.log(document.getElementById("description").innerText);
        return document.getElementById("description").children[1].children.length > 1;
      });
    }, function() {
      console.log("The sign-in dialog should be visible now.");
      var imglength = page.evaluate(function() {
        //return document.getElementById("description").innerText;
        return document.getElementById("description").innerHTML;
      });
      console.log(imglength);
      phantom.exit();
    },10000);
  }
});