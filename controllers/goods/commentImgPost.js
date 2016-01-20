var catchCommon = require('./common');
// router goods/commentImg  post
module.exports = function (req, res, next) {
    catchCommon.catchImgSimpleHandle(req, res, next, {
      timeout: 1000000,
      active: "comment"
    })
};