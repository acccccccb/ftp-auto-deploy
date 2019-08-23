'use strict';
const readlineSync = require('readline-sync');
const PromiseFtp = require('promise-ftp');
const fs = require('fs-extra');
const log = require('single-line-log').stdout;
const ftp = new PromiseFtp();
const {styles} = require('./config');

let ftpAutoDeploy = new Object({
    config:{},
    writable:true,
    configurable:true,
    timmer:null,
    uploadFiles:[],
    uploadDirs:[],
    failFiles:[],
    tempFileIndex:0,
    successCount:0,
    fileCount:0,
    dirCount:0,
    ftpDestroy:function(message){
        if(message) {
            console.log(styles.red,message);
        }
        ftp.end();
        return false;
    },
    startUploadFile(fileLists){
        let _this = this;
        // 开始上传前先创建文件夹
        let uploading = function(){
            ftp.cwd(_this.config.remoteDir).then((list)=>{
                function loop(i) {
                    let localFile = _this.config.localDir + fileLists[i];
                    let remoteFile = _this.config.remoteDir + fileLists[i];
                    ftp.put(localFile, remoteFile).then((res)=>{
                        _this.successCount++;
                        _this.tempFileIndex++;
                        // console.log(styles.grey,`${localFile} - Success(${successCount}/${fileCount})`);
                        let process = (_this.successCount/_this.fileCount).toFixed(2)*100;
                        let processBar = '';
                        for(var p=0;p<100;p++){
                            if(process>=p){
                                processBar += '▮';
                            } else {
                                processBar += '▯';
                            }
                        }
                        log(`开始上传：${localFile} - Success(${_this.successCount}/${_this.fileCount})\n${processBar} ${((_this.successCount/_this.fileCount).toFixed(3)*100).toString().substring(0,4)}%\n`);
                        i++;
                        if(i<=fileLists.length-1) {
                            loop(i);
                        } else {
                            console.log(styles.green,`上传完成 成功 ${_this.successCount-_this.failFiles.length} 失败 ${_this.failFiles.length}`);
                            if(_this.failFiles.length>0) {
                                let reUpload = readlineSync.question(`${_this.failFiles.length} files upload failed,does the upload fail to retry? (Y/N)`);
                                if(reUpload=='Y' || reUpload=='y') {
                                    _this.startUploadFile(_this.uploadFiles);
                                } else {
                                    _this.ftpDestroy();
                                    return false;
                                }
                            } else {
                                _this.ftpDestroy();
                                return false;
                            }
                        }
                    }).catch((e)=>{
                        console.log(styles.red,e.toString());
                        console.log(styles.red,`上传失败 ${localFile}`);
                        if(_this.failFiles.indexOf(localFile)<0) {
                            _this.failFiles.push(localFile);
                        }
                        let reUpload = readlineSync.question(`${_this.failFiles.length} files upload failed,does the upload fail to retry? (Y/N)`);
                        if(reUpload=='Y' || reUpload=='y') {
                            _this.startUploadFile(_this.uploadFiles);
                        } else {
                            console.log(styles.green,`上传完成 成功 ${_this.successCount} 失败 ${_this.failFiles.length}`);
                            _this.failFiles = [];
                            _this.ftpDestroy();
                            return false;
                        }
                    });
                }
                loop(_this.tempFileIndex);
            }).catch((e)=>{
                _this.ftpDestroy(`远程目录${_this.config.remoteDir}不存在,无法上传文件`,e);
                return false;
            });
        };
        let createDirs = function(){
            function loop(i){
                ftp.cwd(_this.config.remoteDir + _this.uploadDirs[i]).then(()=>{
                    if(i<=_this.uploadDirs.length-1) {
                        i++;
                        loop(i);
                    } else {
                        console.log(styles.yellow,'创建目录完成');
                        uploading();
                    }
                }).catch(()=>{
                    if(_this.uploadDirs[i]) {
                        ftp.mkdir(_this.config.remoteDir + _this.uploadDirs[i]).then((res)=>{
                            if(i<=_this.uploadDirs.length-1) {
                                i++;
                                loop(i);
                            } else {
                                console.log(styles.yellow,'创建目录完成');
                                uploading();
                            }
                        }).catch((e)=>{
                            console.log(e);
                            _this.ftpDestroy('创建目录失败');
                        })
                    } else {
                        if(i<=_this.uploadDirs.length-1) {
                            i++;
                            loop(i);
                        } else {
                            console.log(styles.yellow,'创建目录完成');
                            uploading();
                        }
                    }
                });
            }
            loop(0);
        };
        createDirs();
    },
    upload:function(){
        let _this = this;
        console.log(`正在连接到${_this.config.host}`);
        ftp.connect(_this.config)
            .then(function (serverMessage) {
                console.log(styles.green,'Ftp status：',ftp.getConnectionStatus());
                console.log(styles.green,serverMessage);
                ftp.cwd(_this.config.remoteDir).then(()=>{
                    setTimeout(()=>{
                        _this.loop();
                    },2000);
                }).catch(()=>{
                    _this.ftpDestroy(`错误:远程目录(${_this.config.remoteDir})不存在`);
                });
            }).catch((e)=>{
            console.log('连接错误');
            _this.ftpDestroy(e)
        });
    },
    openDir:function(dir,callback){
        let _this = this;
        let path = _this.config.localDir + dir;
        fs.pathExists(path).then((exists) => {
            if(exists) {
                fs.readdir(path).then((res)=>{
                    callback(res);
                }).catch((e)=>{
                    console.log(e.toString());
                });
            } else {
                _this.ftpDestroy(`错误：本地目录(${path})不存在`);
            }
        });
    },
    isDir:function(filePath){
        let stat = fs.lstatSync(this.config.localDir + '/' + filePath);
        return stat.isDirectory();
    },
    loop:function(path=''){
        let _this = ftpAutoDeploy;
        let pathStr = path.split('/')[path.split('/').length-1];
        let includeFile = new RegExp(".*("+ _this.config.includeFile.join('|') +")$", 'ig');
        let exculdFile = new RegExp(".*("+ _this.config.exculdFile.join('|') +")$", 'ig');
        let exculdDir = _this.config.exculdDir;
        // 先排除目录
        if(exculdDir.indexOf(path)<0) {
            clearInterval(_this.timmer);
            if(_this.isDir(path)) { // 如果是目录 加入到目录队列
                _this.uploadDirs.push(path);
                _this.dirCount++;
                // 判断文件类型
                _this.openDir(path,function(res){
                    for(var i=0;i<res.length;i++) {
                        _this.loop(path+'/'+res[i]);
                        if(i==res.length-1) {
                            _this.timmer = setTimeout(()=>{
                                console.log(styles.yellow,`有(${_this.dirCount-1})个目录将被创建,(${_this.fileCount})个文件即将上传`);
                                _this.startUploadFile(_this.uploadFiles);
                                clearTimeout(_this.timmer);
                            },1000);
                        }
                    }
                });
            } else if (includeFile.test(pathStr)) { // 如果是文件 加入到文件队列
                if(pathStr.indexOf('.')>-1) { // 排除没有后缀名的文件
                    if( (_this.config.exculdFile.length>0) ? (!exculdFile.test(pathStr)) : true) {
                        _this.uploadFiles.push(path);
                        _this.fileCount++;
                    }
                }
            }
        }
    }
});

module.exports = function(config){
    ftpAutoDeploy.config = config;
    return new Promise(resolve => {
        resolve(ftpAutoDeploy);
    });
};
