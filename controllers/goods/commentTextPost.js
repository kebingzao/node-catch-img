var siteCatch = require('./site');
// router goods/commentText  post
module.exports = function (req, res, next) {
    res.setTimeout(200000, function () {
        console.log("��Ӧ��ʱ.");
        res.send("ҳ��̫�࣬��Ӧ��ʱ");
    });
    siteCatch["commentWY"](req.body).then(function(data){
        res.render('commentText', {
            data: data
        });
    })
};