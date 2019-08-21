const PromiseFtp = require('promise-ftp');
const fs = require('fs-extra');
const ftp = new PromiseFtp();
const log = require('single-line-log').stdout;
const {config,styles} = require('./config');

// 销毁
let ftpDestroy = function(message){
    if(message) {
        console.log(styles.red,message);
    }
    ftp.end();
    return false;
};
// 上传文件
function startUploadFile(){
    // 开始上传前先创建文件夹
    console.log('整理上传内容');
    let uploading = function(){
        ftp.cwd(config.remoteDir).then((list)=>{
            let successCount = 0;
            function loop(i) {
                let localFile = config.localDir + uploadFiles[i];
                let remoteFile = config.remoteDir + uploadFiles[i];
                ftp.put(localFile, remoteFile).then((res)=>{
                    successCount++;
                    // console.log(styles.grey,`${localFile} - Success(${successCount}/${fileCount})`);
                    let process = (successCount/fileCount).toFixed(2)*100;
                    let processBar = '';
                    for(var p=0;p<100;p++){
                        if(process>=p){
                            processBar += '#';
                        } else {
                            processBar += '_';
                        }
                    }
                    log('正在上传：['+ processBar +']' + (successCount/fileCount).toFixed(2)*100 + '%\n');
                    i++;
                    if(i<=uploadFiles.length-1) {
                        loop(i);
                    } else {
                        console.log(styles.yellow,'全部文件上传完成');
                        ftpDestroy();
                    }
                }).catch((e)=>{
                    console.log(e);
                    console.log(styles.red,`${localFile} - 上传失败`);
                    ftpDestroy();
                });
            }
            loop(0);

        }).catch((e)=>{
            ftpDestroy(`远程目录${config.remoteDir}不存在`,e);
            return false;
        });
    };
    let createDirs = function(){
        console.log('创建目录');
        function loop(i){
            ftp.cwd(config.remoteDir + uploadDirs[i]).then(()=>{
                if(i<=uploadDirs.length-1) {
                    i++;
                    loop(i);
                } else {
                    console.log('创建目录完成');
                    uploading();
                }
            }).catch(()=>{
                if(uploadDirs[i]) {
                    ftp.mkdir(config.remoteDir + uploadDirs[i]).then((res)=>{
                        if(i<=uploadDirs.length-1) {
                            i++;
                            loop(i);
                        } else {
                            console.log(styles.green,'创建目录完成');
                            uploading();
                        }
                    }).catch((e)=>{
                        console.log(e);
                        ftpDestroy('创建目录失败');
                    })
                } else {
                    if(i<=uploadDirs.length-1) {
                        i++;
                        loop(i);
                    } else {
                        console.log(styles.green,'创建目录完成');
                        uploading();
                    }
                }
            });
        }
        loop(0);
    };
    createDirs();
};
// 连接到ftp
let initFtp = function(){
    console.log(`正在连接到${config.host}`);
    ftp.connect(config)
        .then(function (serverMessage) {
            console.log(styles.green,'Ftp status：',ftp.getConnectionStatus());
            console.log(styles.green,serverMessage);
            ftp.cwd(config.remoteDir).then(()=>{
                setTimeout(()=>{
                    loop();
                },2000);
            }).catch(()=>{
                ftpDestroy(`错误:远程目录(${config.remoteDir})不存在`);
            });
        }).catch((e)=>ftpDestroy(e));
};
// 读取本地目录
function openDir(dir,callback){
    let path = config.localDir + dir;
    fs.pathExists(path).then((exists) => {
        if(exists) {
            fs.readdir(path).then((res)=>{
                callback(res);
            }).catch((e)=>{});
        } else {
            ftpDestroy(`错误：本地目录(${path})不存在`);
        }
    });
};
// 遍历所有要上传的文件
let timmer;
let uploadFiles = [];
let uploadDirs = [];
let fileCount = 0;
let dirCount = 0;
// 统计文件和文件夹
function loop(path=''){
    let pathStr = path.split('/')[path.split('/').length-1];
    let includeFile = new RegExp(".*("+ config.includeFile.join('|') +")$", 'ig');
    let exculdFile = new RegExp(".*("+ config.exculdFile.join('|') +")$", 'ig');
    let exculdDir = config.exculdDir;
    // 目录
    if(exculdDir.indexOf(path)<0) {
        clearInterval(timmer);
        if(pathStr.indexOf('.')<0) {
            uploadDirs.push(path);
            dirCount++;
            // 判断文件类型
            openDir(path,function(res){
                for(var i=0;i<res.length;i++) {
                    loop(path+'/'+res[i]);
                    if(i==res.length-1) {
                        timmer = setTimeout(()=>{
                            console.log(styles.yellow,`有(${dirCount-1})个目录将被创建,(${fileCount})个文件即将上传`);
                            startUploadFile();
                            clearTimeout(timmer);
                        },2000);
                    }
                }
            });
        } else if (includeFile.test(pathStr)) { // 文件
            if( (config.exculdFile.length>0) ? (!exculdFile.test(pathStr)) : true) {
                uploadFiles.push(path);
                fileCount++;
            }
        }
    }
}
// 初始化上传
initFtp();