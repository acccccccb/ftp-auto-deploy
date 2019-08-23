## ftp-auto-deploy
> 使用环境：nodejs

> 实现功能：ftp自动化部署

#### 引用了以下modules
- fs,
- fs-extra,
- promise-ftp,
- readline-sync,
- single-line-log

##### 测试
```$xslt
npm run test
```
##### 引入文件
```
const ftpInit = require('../src/index.js');
```
##### 上传
```
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
```
