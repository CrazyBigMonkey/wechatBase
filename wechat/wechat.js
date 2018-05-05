
var sha1 = require("sha1"); //引入加密模块
var formidable = require("formidable");
var parseString = require('xml2js').parseString;
var msg = require("./msg");
var fs = require("fs");
var request = require("request");
var accessTokenJson = require("./access_token");
var util = require("util");
var menu = require("./menu");
var path = require("path");

// 构造函数
function WeChat(config) {
    // 传入配置文件
    this.config = config;
    this.token = config.token;
    this.appID = config.appID;
    this.appScrect = config.appScrect;
    this.prefix = config.prefix;
    this.diyApi = config.diyApi;
    this.weather = config.weather;
}

// 微信授权验证方法
WeChat.prototype.auth = function(req, res, next) {
    var that = this;
    this.getAccessToken().then(function(data){
        var url = util.format(that.diyApi.createMenu, that.prefix, data);
        console.log(url);
        that.requestPost(url,JSON.stringify(menu)).then(function(data){
            //将结果打印
            console.log(data);
        });
    });
    // 获取微信服务器发送的数据
    var signature = req.query.signature,
    timestamp = req.query.timestamp,
        nonce = req.query.nonce,
    echostr = req.query.echostr;

    // token、timestamp、nonce三个参数进行字典序排序
    var arr = [this.token, timestamp, nonce].sort().join('');
    // sha1加密    
    var result = sha1(arr);

    if(result === signature){
        res.send(echostr);
    }else{
        res.send('mismatch');
    }
}

// 微信消息回复
WeChat.prototype.autoMsg = function(req, res, next) {
    var buffer = [],
        that = this;

    req.on('data',function(data){
        buffer.push(data);
    });
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        parseString(msgXml,{explicitArray : false},function(err,result){
            // 如果有错误直接抛出
            if(err) throw err;
            result = result.xml;

            var toUser = result.ToUserName; 
            var fromUser = result.FromUserName;
            var resultXml = "";
            // 判断消息类型
            if(result.MsgType === "event") {
                // 关注微信公众号
                if(result.Event === "subscribe") {
                    resultXml = msg.textMsg(fromUser, toUser, "欢迎关注，哈哈哈哈！");
                    res.send(resultXml);
                }else if(result.Event === "click") {
                    
                }
            }else {
                if(result.MsgType === "text") {
                    switch(result.Content){
                        case '1':
                            resultXml = msg.textMsg(fromUser,toUser, "你好呀，我们又见面了！");
                            res.send(resultXml);
                            break;
                        case '2':
                            var contentArr = [
                                {Title:"第一篇文章",Description:"这可能是最好的一篇文章",PicUrl:"https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1525083071090&di=efe4ed8c2d464b2e1a1eec4771efda85&imgtype=0&src=http%3A%2F%2Fww2.sinaimg.cn%2Fbmiddle%2F0062HhmSjw1f4nlwracz3j30a00a0my0.jpg",Url:"https://mp.weixin.qq.com/s?timestamp=1525073044&src=3&ver=1&signature=LW6J7-QE3F81rIjjBrbiT7liFeL4mAHYlosOprCOjIPGVsrjcZjbJlpkRCWaYwjI8LErlUl7tJeutLaIBEM*ejsdymMKA40RSlwcwfaM60PIQnUAvgZ3MmDldVxPSRtRBP-lp4eSRpSyCiLQuJGKgHsGyB0PMuGSMHNiXT-jZ8w="},
                                {Title:"第二篇文章",Description:"这可能不是最好的文章",PicUrl:"https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1525083071090&di=efe4ed8c2d464b2e1a1eec4771efda85&imgtype=0&src=http%3A%2F%2Fww2.sinaimg.cn%2Fbmiddle%2F0062HhmSjw1f4nlwracz3j30a00a0my0.jpg",Url:"https://mp.weixin.qq.com/s?timestamp=1525073044&src=3&ver=1&signature=LW6J7-QE3F81rIjjBrbiT7liFeL4mAHYlosOprCOjIPGVsrjcZjbJlpkRCWaYwjI8LErlUl7tJeutLaIBEM*ejsdymMKA40RSlwcwfaM60PIQnUAvgZ3MmDldVxPSRtRBP-lp4eSRpSyCiLQuJGKgHsGyB0PMuGSMHNiXT-jZ8w="},
                                {Title:"第三篇文章",Description:"这应该不是最坏的文章",PicUrl:"https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1525083071090&di=efe4ed8c2d464b2e1a1eec4771efda85&imgtype=0&src=http%3A%2F%2Fww2.sinaimg.cn%2Fbmiddle%2F0062HhmSjw1f4nlwracz3j30a00a0my0.jpg",Url:"https://mp.weixin.qq.com/s?timestamp=1525073044&src=3&ver=1&signature=LW6J7-QE3F81rIjjBrbiT7liFeL4mAHYlosOprCOjIPGVsrjcZjbJlpkRCWaYwjI8LErlUl7tJeutLaIBEM*ejsdymMKA40RSlwcwfaM60PIQnUAvgZ3MmDldVxPSRtRBP-lp4eSRpSyCiLQuJGKgHsGyB0PMuGSMHNiXT-jZ8w="}
                            ];
                            resultXml = msg.graphicMsg(fromUser,toUser,contentArr);
                            res.send(resultXml);
                            break;
                        case '3':
                            var urlPath = path.join(__dirname, "../material/timg.jpg");
                            that.uploadFile(urlPath, "image").then(function(mdeia_id) {
                                resultXml = msg.imgMsg(fromUser, toUser, mdeia_id);
                                console.log(resultXml);
                                res.send(resultXml);
                            })
                            break;
                        case '4':
                            that.getUserInfomation(fromUser).then(function(city) {
                                if(city) {
                                    // 获取的城市名为中文，不能直接访问，得通过encode编码一下
                                    var url = encodeURI(util.format(that.weather, city));
                                    request(url,function(err, response, body) {
                                        var obj =JSON.parse(body).data.forecast;
                                        // 拼接字符串
                                        var str = JSON.parse(body).city +'今天的天气情况为:   ' + obj[0].high +obj[0].low +'天气情况:' +obj[0].type +'温馨提示:' + obj[0].notice;
                                        resultXml = msg.textMsg(fromUser,toUser, str);
                                        res.send(resultXml);
                                    })    
                                }else {
                                    resultXml = msg.textMsg(fromUser,toUser, "未获取到城市信息");
                                    res.send(resultXml);
                                }
                            })
                            break; 
                                           
                    }
                }
            }

        })
    })


}

// 获取全局票据
WeChat.prototype.getAccessToken =function() {
    var that = this;
    return new Promise(function(resolve,reject){
        var currentTime = new Date().getTime();
        //格式化请求地址,把刚才的%s按顺序替换
        var url = util.format(that.diyApi.getAccessToken, that.prefix, that.appID, that.appScrect);      
        //判断本地存储的 access_token 是否有效
        if(accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime){
            that.requestGet(url).then(function(data){
                var result = JSON.parse(data); 
                if(data.indexOf("errcode") < 0){
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                    //更新本地存储的
                    fs.writeFile('./wechat/access_token.json',JSON.stringify(accessTokenJson));
                    resolve(accessTokenJson.access_token);
                }else{
                    resolve(result);
                } 
            });
        }else{
            //将本地存储的 access_token 返回
            resolve(accessTokenJson.access_token);  
        }
    }); 
}

// 封装一个get请求方法
WeChat.prototype.requestGet = function(url) {
    return new Promise (function(resolve, reject) {
        request(url, (error, response, body)=> {
            resolve(body);
        })
    })
}

// 封装一个post请求方法
WeChat.prototype.requestPost = function(url, data) {
    return new Promise (function(resolve, reject) {
        request.post({url: url, formData:data}, function(err, httpResponse, body){
            resolve(body);
        })
    })
}

// 素材上传
WeChat.prototype.uploadFile = function(urlPath, type) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.getAccessToken().then(function(data){ 
            var form = { //构造表单
                media: fs.createReadStream(urlPath)
            }
            var url = util.format(that.diyApi.uploadFile, that.prefix, data, type);
            that.requestPost(url, form).then(function(result) {
                resolve(JSON.parse(result).media_id);
            })
        })
    })
}

// 获取用户信息
WeChat.prototype.getUserInfomation = function(openid) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.getAccessToken().then(function(data){ 
            var url = util.format(that.diyApi.username, that.prefix, data, openid);
            that.requestGet(url).then(function(result) {
                resolve(JSON.parse(result).city);
            })
        })
    })
}


// 暴露WeChat对象
module.exports = WeChat;