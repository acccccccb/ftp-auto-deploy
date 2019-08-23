## ftp-auto-deploy
![avatar](http://www.ihtmlcss.com/wp-content/uploads/2019/08/ftp-auto-deploy.png)

> 实现功能：ftp自动化部署

> 使用环境：nodejs

> 如何配置package.js可参考这里：http://www.ihtmlcss.com/archives/1126.html

#### 依赖
- fs,
- fs-extra,
- promise-ftp,
- readline-sync,
- single-line-log
##### 安装
```
npm install ftp-auto-deploy --save-dev
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
    localDir:'D:/phpStudy/PHPTutorial/WWW/phpcrm/dist',// 本地目录
    includeFile:[],// 包含文件类型 不填则上传所有文件
    exculdFile:[],// 排除指定类型的文件
    exculdDir:['/static/js'],// 排除文件夹
}).then((res)=>{
    // 返回对象
    res.upload(); // 执行上传方法
});
```
##### 开发测试
```$xslt
npm run test
```

##### 参数说明
| 属性名 | 作用 | 类型  | 必填 | 默认值 |
|:----:|----|:----:|:----:|:----:|
|host|主机地址|String|是|-|
|port|端口号|String|是|21|
|encoding|编码|String|是|UTF8|
|user|用户名|String|是|-|
|password|密码|String|是|-|
|remoteDir|远程目录|String|是|-|
|localDir|本地目录|String|是|-|
|includeFile|包含文件后缀名,空则上传所有类型文件 eg:['.js']|Array|否|[]|
|exculdFile|排除文件后缀名 eg:['.tmp']|Array|否|选择图片|
|exculdDir|排除文件夹 eg:['/static/js/']|Array|否|选择图片|