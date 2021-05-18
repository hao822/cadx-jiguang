'use strict';
var net = require('net');
var mysql = require('mysql');
const short = require('short-uuid');
let dingshiqi;

//创建tcp_server
var tcp_server = net.createServer();

module.exports = function init() {

    //监听端口
    tcp_server.listen(7007, function () {
        console.log('tcp_server listen 7007');
    })

    //处理客户端连接
    tcp_server.on('connection', function (socket) {

        //先给客户端发送[IT:60]
        socket.write('[IT:60]')

        //读取客户端发来的数据
        socket.on('data', function (data) {
            data = data.toString();
            if (data == '[DGDZ]') {
                socket.write('[ZDGD]');
                console.log('连接成功，进入数据传输模式');
            } else if (data.includes('ID')) {
                console.log('数据传输模式');
                clearInterval(dingshiqi)
                //保存下获得这条数据的时间
                let time = new Date();
                console.log('time', time);
                dingshiqi = setInterval(() => {
                    let newTime = new Date();
                    // console.log('newtime', newTime, time);
                    if ((newTime.getTime() - time.getTime()) > 120000) {
                        console.log('超时未发送');
                        socket.write('[LINKTEST]')
                        clearInterval(dingshiqi)
                    }
                }, 1000);

                //保存数据
                data = data.replace('[', '');
                data = data.replace(']', '');
                data = data.replace('{', '');
                data = data.replace('}', '')
                data = data.split(',')
                var key = [];
                var value = [];
                for (var i = 0; i < data.length; i++) {
                    var num = data[i].indexOf(':');
                    var num1 = data[i].indexOf('"');
                    var num2 = data[i].lastIndexOf('"');
                    key.push(data[i].substring(0, num))
                    value.push(data[i].substring(num1 + 1, num2))
                }
                const uuid = short.generate();
                const returnData = {
                    ID: value[0],
                    X: value[1],
                    Y: value[2],
                    Z: value[3]
                }
                returnData.uuid = uuid;
                console.log('returnData', returnData);

                //创建连接
                var connection = mysql.createConnection({
                    host: '39.100.65.255',
                    // host: '47.93.230.161',
                    user: 'building_user',
                    // user: 'root',
                    password: 'building123',
                    // password: 'yue825822',
                    database: 'building'
                });
                connection.connect();

                //库操作
                let sql = "INSERT INTO jgdata SET ?"
                connection.query(sql, returnData, (err, result) => {
                    if (err) {
                        socket.write(err + '');
                    } else {
                        socket.write('[RETU]')
                    }
                })
                //关闭库
                connection.end();
            } else if (data == '[RESTART]') {
                //重启验证模式
                socket.write('[LINKOK]')
            } else if (data == '[LINKOK]') {
                console.log('连接正常');
            } else {
                socket.write('Command error')
            }
        })
    })
    tcp_server.on('end', function () {
        console.log('tcp_server end!');
    })

    tcp_server.on('error', function () {
        console.log('tcp_server error!');
    })
}