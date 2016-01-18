var siteCatch = require('./site');
// router goods/commentText  post
module.exports = function (req, res, next) {
    siteCatch["commentWY"](req.body).then(function(data){
        res.render('commentText', {
            data: data
        });
    })
};