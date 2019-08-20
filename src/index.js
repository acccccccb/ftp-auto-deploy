let PromiseFtp = require('promise-ftp');
const fs = require('fs-extra');
let ftp = new PromiseFtp();
const {config,styles} = require('./config');
// 连接ftp后行为
let startUploadFile = function(){
    ftp.cwd(config.remoteDir).then((list)=>{
        ftp.destroy();
    }).catch((e)=>{
        ftpDestroy('目录不存在',e);
        return false;
    });
};
// 销毁
let ftpDestroy = function(message){
    console.log(styles.red,message);
    ftp.destroy();
    return false;
};
// 连接到ftp
let initFtp = function(){
    ftp.connect(config)
        .then(function (serverMessage) {
            console.log(styles.green,'Ftp status：',ftp.getConnectionStatus());
            console.log(styles.green,serverMessage);
            loop();
        }).catch((e)=>ftpDestroy(e));
};
initFtp();
// 读取本地目录
function openDir(dir,callback){
    let path = config.localDir + dir;
    fs.pathExists(path).then((exists) => {
        if(exists) {
            fs.readdir(path).then((res)=>{
                callback(res);
            }).catch((e)=>{});
        } else {
            console.log(styles.red, path);
        }
    });
};
// 遍历所有要上传的文件
let readyUploadFiles = [];
function loop(path=''){
    console.log(path);
    ftp.rmdir(config.remoteDir + path,true).then((res)=>{
        console.log(res);
        openDir(path,function(res){
            res.forEach((item)=>{
                loop(path+'/'+item);
            })
        });
    }).catch((e)=>{
        console.log(e);
        ftp.destroy();
        return false;
    });

}
