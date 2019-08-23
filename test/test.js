'use strict';
const ftpInit = require('../src/index.js');
ftpInit({
    user: "ftp",// 用户名
    password: "123456",// 密码
    host: "localhost",//主机
    port:21,// 端口
    encoding:'UTF8',
    remoteDir:'/dist',//远程根目录
    localDir:'D:/phpStudy/PHPTutorial/WWW/phpcrm/dist',
    includeFile:[],
    exculdFile:[],
    exculdDir:['/static/js'],
}).then((res)=>{
    // do something
    res.upload();
});