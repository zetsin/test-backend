const io = require('socket.io-client')
const A = io('http://localhost:3000/a')

const data = [
  'Stage1.stage',
  'Stage2.stage',
  'Stage3.stage',
  'Stage4.stage',
  'Stage8.stage',
  'Stage7.stage',
  'Stage5.stage',
  'Stage3.stage',
  'Stage10.stage',
  'Stage1.stage',
  'Stage5.stage',
  'Stage3.stage',
  'Stage2.stage',
  'Stage4.stage',
  'Stage7.stage',
  'Stage0.stage',
  'Stage1.stage',
  'Stage5.stage',
  'Stage4.stage',
  'Stage8.stage',
  'Stage7.stage',
  'Stage10.stage',
]

class Stages {
  constructor(index = 0) {
    this.index = index
  }
  jump(index) {
    this.index = index
    if(this.index >= data.length) {
      this.index = 0
    }
    return this.current()
  }
  current() {
    return data[this.index].split('.')[0].toLowerCase()
  }
  forward() {
    return this.jump(this.index + 1)
  }
}

class Cmd {
  constructor(interval = 1000) {
    this.interval = interval
    this.interval_cb = null
    this.stages = new Stages
  }
  stop() {
    if(this.interval_cb) {
      clearInterval(this.interval_cb)
      this.interval_cb = null
    }
  }
  start(index = 0) {
    this.stop()
    this.stages.jump(index)

    const interval_cb = () => {
      A.emit('stage', this.stages.current())
      this.stages.forward()
    }
    this.interval_cb = setInterval(interval_cb, this.interval)
    interval_cb()
  }
  forward() {
    this.start(this.stages.index + 1)
  }
}

const command = new Cmd(5000)

A.on('cmd', (cmd)=> {
  command[cmd] && command[cmd]()
})

console.log('A started')
