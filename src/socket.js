'use strict';

// TODO FTP ACTIVE MODE
const {config,styles} = require('./config');
const net = require('net');
const fs = require('fs-extra');
function getIPAddress(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
}
const LOCAL_IP = getIPAddress();
console.log(LOCAL_IP);
// 创建服务
//tcp服务端
// let sever=net.createServer(function(connection){
//     //客户端关闭连接执行的事件
//     connection.on('end',function(){
//         //  console.log('客户端关闭连接')
//     });
//     connection.on('data',function(data){
//         console.log('服务端：收到客户端发送数据为'+data.toString())
//     });
//     connection.on('error',function(error){
//         console.log('服务端：收到客户端发送数据为'+error.toString())
//     });
//     //给客户端响应的数据
//     connection.write('access-control-allow-origin:*');
//     connection.write('content-type: application/json;charset=UTF-8');
// });
// sever.listen(1024,function(){
//     // console.log('监听端口')
// });
let ftp;
function send(cmd){
    return new Promise(function (resolve, reject) {
        ftp.write(`${cmd}\r\n`,config.encoding,function(res){
            resolve(res);
        });
    }).catch(function (Err) {
        console.log(Err);
        return false;
    });
};
async function start(i){
    return await send(CMD[i]);
}

let CMD = [
    `USER ${config.user}`,
    `PASS ${config.password}`,
    `CWD ${config.remoteDir}`,
    `PWD`,
    `TYPE I`,
    // `STOR ${config.localDir}/index.html`,
];
ftp = net.connect({
    host:config.host,
    port:config.port,
},function(res){
    // ftp.setEncoding('utf8');
    ftp.setEncoding('binary');
    ftp.on('ready',()=>{
        let i = 0;
        let timmer = setInterval(()=>{
            if(i<CMD.length) {
                start(i++);
            } else {
                fs.readFile(`${config.localDir}/index.ftl`,function(err,data){
                    if(err){
                        return console.error(err);
                    } else{
                        send(`STOR ${config.localDir}/index.ftl`);
                        return console.log(data);
                    }
                });
                clearInterval(timmer);
            }
        },1000)
    });
    ftp.on('drain',()=>{
        console.log('drain');
    });
    ftp.on('end',()=>{
        console.log('end');
    });
    ftp.on("data", (data)=> {
        let reMessage = data.toString();
        console.log(reMessage);
        // switch(reMessage.substring(0,3)) {
        //     case '220':
        //         console.log(styles.green,`连接 ${config.host} 成功`);
        //         console.log(styles.green,`用户名:${config.user}`);
        //         break;
        //     case '331':
        //         console.log(styles.green,'密码:*******');
        //         break;
        //     case '230':
        //         console.log(styles.green,'登录成功');
        //         break;
        //     case '221':
        //         console.log(styles.green,'退出登录');
        //         break;
        //     case '530':
        //         console.log(styles.red,`530 登陆被拒绝`);
        //         send(`QUIT`);
        //         break;
        //     case '503':
        //         console.log(styles.red,`530 错误的指令`);
        //         send(`QUIT`);
        //         break;
        //     case '550':
        //         console.log(styles.red,`550 远程目录 ${config.remoteDir} 不存在`);
        //         send(`QUIT`);
        //         break;
        //     case '553':
        //         console.log(styles.red,`无法创建文件`);
        //         send(`QUIT`);
        //         break;
        //     default:
        //         console.log(reMessage);
        // }
    });
    ftp.on("error", (Err)=> {
        console.log(Err);
        send(`QUIT`);
        return false;
    });
});