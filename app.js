
// 引入express模块
var express = require("express");
var app = express();
var config = require("./config"); //引入配置文件
var WeChat = require("./wechat/wechat"); 

var wechat = new WeChat(config); //实例化一个WeChat对象

app.get("/", (req, res, next)=> {
    wechat.auth(req, res, next);
})

app.post("/", (req,res, next)=> {
    wechat.autoMsg(req, res, next);
})

// 监听1234端口
app.listen(1234);