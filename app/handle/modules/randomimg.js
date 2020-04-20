const request = require("request");
const fs = require("fs");
module.exports = {
    take : function(api, callback){
        let url = `urlhere`
        request({
            uri: url
        })
        .pipe(fs.createWriteStream(__dirname +'/../src/randomimg.png'))
        .on('close', function() {
            callback();
        });
    }
} spkit