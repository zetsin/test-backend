
const fs = require('fs')

const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const A = io.of('/a')
const clients = io.of('/clients')

app.use(express.static(__dirname + '/../public'))

http.listen(3000, () => {
  console.log('listening on *:3000')
})

// 监听 A 程序的连接
A
.on('connection', (socket) => {
  console.log('A connected')

  // 将 stage 消息转发给客户端
  socket.on('stage', (stage) => {
    clients.emit('stage', stage)
  })
})

// 接听客户端的连接
clients
.on('connection', (socket) => {
  console.log('a user connected')

  // 将 cmd 命令转发给 A 程序
  socket.on('cmd', (cmd) => {
    A.emit('cmd', cmd)
  })

  // 处理文件上传，目前仅仅是将所有文件保存在 /data 目录
  socket.on('upload', (data, mimetype, opts) => {
    fs.writeFile(__dirname + `/../data/${opts.email + '-' || ''}${Math.random()}.${mimetype}`, data, (e) => {
      console.log(e)
    })
  })

  socket.on('disconnect', () => {
    A.emit('cmd', 'stop')
  })
})