$(document).ready(() => {

  const socket = io('/clients')

  const start_button = $('#start')
  const recorder_button = $('#recorder')
  const stage_label = $('#stage')

  const username = $('#username')
  const email = $('#email')

  const video = $('#video')[0]
  const canvas = $('#canvas')[0]
  const audio = $('#audio')[0]

  const stages = $('.stages > *')
  const stage1 = $('.stages > .stage1')
  const stage2 = $('.stages > .stage2')
  const stage3 = $('.stages > .stage3')
  const stage4 = $('.stages > .stage4')

  const RM = new RecorderManager(true, true)
  RM.open(stream => {
    video.srcObject = stream
  })
  const recorder = new Recorder(RM)
  const audioex = new AudioEx(audio, () => {
    // 如果有音乐播放的时候，音乐每放８秒，发一个信号要求C++　能够自动转到其他STAGE
    socket.emit('cmd', 'forward')
  }, 8 * 1000)

  start_button.on('click', () => {
    // 发送“开始＂的信号
    socket.emit('cmd', 'start')
  })
  recorder_button.on('click', () => {
    if(recorder.recorder) {
      // 停止录像
      recorder.stop()
      recorder_button.text('启动录像')
    }
    else {
      // 启动录像
      recorder.start((data) => {
        // 录像结束以后，如果录像是由用户开始的，那么把录像送到用户的Email 里面
        socket.emit('upload', data, 'webm', {
          email: email.val()
        })
      })
      recorder_button.text('终止录像')
    }
  })

  socket.on('stage', (stage) => {
    stage_label.text(stage)

    if(stage === 'stage0') {
      // 开始录像
      recorder.start()
      recorder_button.text('终止录像')
    }
    else if(stage === 'stage1') {
      // 去掉屏幕以前显示的任何东西
      stages.hide('normal')
      // 在左上角，显示一个球转动的GIF，在GIF的旁边，写绿色的字：”Begin”
      stage1.show('normal')
      // 没有任何音乐
      audioex.pause()
      // 不能录音
      RM.toggleAudio(false)
    }
    else if(stage === 'stage2') {
      // 把屏幕上原有的显示都去掉
      stages.hide('normal')
      // 在中间，写红色的字：“你好”
      stage2.show('normal')
      // 播放“生日快乐”的音乐
      audioex.play(true)
      // 拍照
      snapshot()
    }
    else if(stage === 'stage3') {
      // 在右下角，显示一个用CSS 画的一个蓝色方块，在方块里面，显示白色的字，”不错！”
      stage3.show('normal')
      // 继续前面的音乐播放
      audioex.play()
      // 允许用户录音
      RM.toggleAudio(true)
    }
    else if(stage === 'stage4') {
      // 在右上角，显示一个用CSS 画的一个在左右晃动的白色三角形，在白色三角形里面，显示红色的字，”搞定了！”
      stage4.show('normal')
      // 继续前面的音乐播放
      audioex.play()
      // 继续允许用户录音
      RM.toggleAudio(true)
    }
    else if(stage === 'stage5') {
      // 拍照
      snapshot()
      // 继续所有显示
      stages.show('normal')
      // 继续前面的音乐播放
      audioex.play()
    }
    else if(stage === 'stage7') {
      // 去掉所有显示
      stages.hide('normal')
      // 停止生日快乐歌
      audioex.pause()
    }
    else if(stage === 'stage10') {
      // 如果在录像，停止录像
      recorder.stop()
      recorder_button.text('启动录像')
      // 如果有音乐，停止音乐播放
      audioex.pause()
    }
  })

  function snapshot() {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    const url = canvas.toDataURL("image/png")

    const arr = url.split(',')
    const mimetype = arr[0].match(/:(.*?);/)
    const mime = [1]
    const bstr = atob(arr[1])
    let n = bstr.length
    let u8arr = new Uint8Array(n)
    while(n--){
        u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], {type:mime})

    socket.emit('upload', blob, 'png')
  }
})

class RecorderManager {
  constructor(video=true, audio=true) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || window.getUserMedia

    this.video = video
    this.audio = audio
    this.stream = null
  }
  open(onstream=()=>{}) {
    if(this.stream) {
      onstream(this.stream)
    }
    else {
      navigator.getUserMedia({
        video: this.video,
        audio: this.audio
      }, (stream) => {
        this.stream = stream
        onstream(stream)
      }, () => {})
    }
  }
  new(onopen=()=>{}, onstop=()=>{}, ondataavailable=()=>{}) {
    this.open(() => {
      let chunks = []
      let recorder = new MediaRecorder(this.stream)
      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
        ondataavailable(e)
      }
      recorder.onstop = (e) => {
        onstop(new Blob(chunks, {
          'type' : recorder.mimeType
        }), recorder.mimeType.split('/')[1])

        chunks = []
        recorder = null
      }
      onopen(recorder)
    })
  }
  toggleAudio(enabled) {
    if(this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        if(typeof track.stop === 'function') {
          track.enabled = enabled
        }
      })
    }
  }
  toggleVideo(enabled) {
    if(this.stream) {
      this.stream.getVideoTracks().forEach(track => {
        if(typeof track.stop === 'function') {
          track.enabled = enabled
        }
      })
    }
  }
}

class Recorder {
  constructor(rm) {
    this.rm = rm
    this.recorder = null
  }
  start(onstop, ondataavailable) {
    this.stop()
    this.rm.new(recorder => {
      this.recorder = recorder
      this.recorder.start()
    }, onstop, ondataavailable)
  }
  stop() {
    if(this.recorder) {
      this.recorder.stop()
      this.recorder = null
    }
  }
}

class AudioEx {
  constructor(audio, onplay, interval) {
    this.audio = audio
    this.onplay = onplay
    this.interval = interval
  }
  play(fresh = false) {
    if(fresh) {
      this.audio.currentTime = 0
    }
    this.interval_cb = setInterval(this.onplay, this.interval)
    this.audio.play().catch(e => {})
  }
  pause() {
    if(this.interval_cb) {
      clearInterval(this.interval_cb)
      this.interval_cb = null
    }
    this.audio.pause()
  }
}
