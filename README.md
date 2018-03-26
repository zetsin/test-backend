# test-backend

## 如何开始
1. 使用 npm 进行初始化:
```javascript
npm install
```
2. 启动服务器
```javascript
npm start
```
3. 启动 A 模拟程序
```javascript
npm test
```

## 说明文档

### 1. 服务端
> DIR /src

服务端最为简单，主要作用是前端与A程序的数据交换，在此使用了 socket.io。
1. 将所有来自 A 程序的 StageX.stage 消息转发给前端；
2. 将所有来自前端的 CMD（比如 start, forward）消息转发给 A 程序；
3. 另外还需要处理来自前端的录像结束消息，并将录像文件发动到指定email，目前只是将文件保存到服务器本地。

### 2. 前端
> DIR /public

前端最为繁琐，主要实现了以下几点：
1. 使用 MediaRecorder 进行录像；
2. 在录像过程中，可以关闭视频或关闭录音；
3. 使用 canvas 将视频流转换成照片，实现在任何时候都可以拍照；
4. 监听服务器的 StageX.stage 的消息；
5. 控制界面 UI 显示和隐藏

### 3. A 程序
> DIR /tests/test

## 存在问题

1. “在后端，给每个stage 有一个预定义的Json 文件。 Json 文件包含以下内容...” - 目前尚无法实现通过JSON文件描述动作，并将动作脚本在前端直接运行
2. “能够把整个场景录制下来 (提示：你可以用WebRTC录制)” - WebRTC貌似是对用户桌面进行屏幕捕捉，并不仅仅针对于当前页面