<template>
  <div class="main-content">
    <div class="header">
      <div class="action">
        <i class="el-icon-minus mini" @click="setMini"></i>
        <i class="el-icon-close close" @click="close"></i>
      </div>
      <div class="timer-div item">
        <span class="circle" v-show="startRecording"></span>
        <span class="timer" ref="timer">00:00:00</span>
      </div>
      <img
        class="item start"
        v-if="!startRecording"
        src="@/assets/start-record.png"
        height="43"
        title="开始录制"
        @click="start"
      />
      <img
        v-if="startRecording"
        class="item start"
        src="@/assets/recording.png"
        height="48"
        title="结束"
        @click="stop"
      />
      <el-button
        type="success"
        class="item start"
        :disabled="recordedChunks.length == 0"
        icon="el-icon-download"
        circle
        title="保存"
        @click="saveRecord"
      ></el-button>
    </div>
    <div v-if="startRecording">
      <video class="video" ref="video"></video>
    </div>
  </div>
</template>

<script>
import { desktopCapturer, Menu, MenuItem, remote } from "electron";
export default {
  name: "tool-bar",
  data() {
    return {
      constraints: {
        audio: false,
        video: true
      },
      startRecording: false,
      mediaRecorder: null,
      recordedChunks: [],
      menu: null,
    };
  },
  methods: {
    getSources() {
      let _this = this;
      let signleScreen = false
      const { Menu, MenuItem } = remote;
      desktopCapturer.getSources(
        { types: ["window", "screen"] },
        async (error, sources) => {
          this.menu = new Menu();
          for (const source of sources) {
            console.log(source)
            if(source.id.indexOf('screen') > -1) {
              if(source.name == 'Entire screen') {
                signleScreen = true
                _this.getAudioStream(source.id)
                return
              }
              this.menu.append(
                new MenuItem({label: source.name,
                  click() {
                    _this.getAudioStream(source.id)
                  }
                })
              );
            }
          }
          if(!signleScreen) {
            this.menu.popup(remote.getCurrentWindow());
          }
        }
      );
    },
    getAudioStream(sourceId) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(stream => {
          this.getVedioStream(sourceId, stream);
          stream.onended = () => {
            console.log("Micro audio ended.");
          };
        })
        .catch(error => {
          this.getVedioStream(sourceId);
          alert("audio getUserMedia failed");
          console.log("audio getUserMedia failed.");
        });
    },
    async getVedioStream(sourceId, audioStream) {
      try {
        const vedioStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1280,
              minHeight: 720,
              maxHeight: 720
            }
          }
        });
        if (audioStream) {
          let audioTracks = audioStream.getAudioTracks();
          vedioStream.addTrack(audioTracks[0]);
        }
        this.mediaRecorder = new MediaRecorder(vedioStream);
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstart = () => {
          console.log("开始录制");
          this.startRecording = true;
          this.startTimer();
          this.$electron.ipcRenderer.send("open-video-area");

          this.$nextTick(() => {
            this.$refs.video.src = null;
            this.$refs.video.srcObject = vedioStream;
            this.$refs.video.controls = false;
            this.$refs.video.muted = true;
            this.$refs.video.play();
          });
        };
        this.mediaRecorder.onstop = () => {
          console.log("停止录制");
          this.mediaRecorder = null;
          this.startRecording = false;
          if (this.timer) {
            clearInterval(this.timer);
            // this.$refs.timer.textContent = `00:00:00`;
          }
          this.$electron.ipcRenderer.send("close-video-area");
        };

        this.mediaRecorder.start();
      } catch (e) {
        alert("video getUserMedia failed");
      }
    },
    start() {
      this.getSources()
    },
    stop() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      } else {
        alert("还没有开始。");
      }
    },
    // 显示录制的秒数
    startTimer() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      let n = 0;
      this.$refs.timer.textContent = `00:00:00`;
      this.timer = setInterval(() => {
        n += 1;
        let timeStr = this.getDuration(n);
        this.$refs.timer.textContent = `${timeStr}`;
      }, 1000);
    },
    getDuration(second) {
      let hours = Math.floor(second / 3600);
      let minutes = Math.floor((second % 3600) / 60);
      let seconds = Math.floor((second % 3600) % 60);
      hours = hours < 10 ? "0" + hours : hours;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      let duration = hours + ":" + minutes + ":" + seconds;
      return duration;
    },
    formatLength(str, length) {
      str += "";
      if (str.length < length) {
        return this.formatLength("0" + str, length);
      } else {
        return str;
      }
    },

    getnowstr() {
      let now = new Date();
      let year = now.getFullYear(); //得到年份
      let month = this.formatLength(now.getMonth(), 2); //得到月份
      let date = this.formatLength(now.getDate(), 2); //得到日期
      let hour = this.formatLength(now.getHours(), 2); //得到小时
      let minu = this.formatLength(now.getMinutes(), 2); //得到分钟
      let all_time = year + "-" + month + "-" + date + "_" + hour + "-" + minu;
      return all_time;
    },

    // 保存视频
    saveRecord() {
      let blob = new Blob(this.recordedChunks, {
        type: "video/x-matroska;codecs=avc1,opus"
      });
      let url = URL.createObjectURL(blob);
      let a = document.createElement("a");
      let all_time = this.getnowstr();
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = all_time + "video.webm";
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    },
    close() {
      this.$electron.ipcRenderer.send("window-close");
    },
    setMini() {
      this.$electron.ipcRenderer.send("window-mini");
    }
  }
};
</script>

<style lang="scss" scoped>
.main-content {
  border-radius: 5px;
  background: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.video {
  width: 100%;
  flex: 1;
  padding: 5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-basis: column;
}
.header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  -webkit-app-region: drag;
  padding: 20px 80px 10px 10px;
  height: 50px;
  min-height: 45px;
  position: relative;
  .start {
    margin: 0 15px;
  }
  .action {
    position: absolute;
    top: 0;
    right: 0;
    -webkit-app-region: no-drag;
    cursor: auto;
    i {
      padding: 3px 5px;
    }
    .mini {
      &:hover {
        background: #ddd;
      }
    }
    .close {
      &:hover {
        background: red;
        color: white;
      }
    }
  }
  button {
    -webkit-app-region: no-drag;
    cursor: pointer;
  }
  img {
    -webkit-app-region: no-drag;
    cursor: pointer;
  }
  .timer-div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .circle {
      display: inline-block;
      height: 8px;
      width: 8px;
      border-radius: 8px;
      margin-right: -8px;
      background: red;
      animation: recording 1s infinite;
      -webkit-animation: recording 1s infinite;
    }
    .timer {
      position: relative;
      font-size: 18px;
      font-weight: 500;
      margin-left: 13px;
      // &:before {
      //   content: "";
      //   height: 8px;
      //   width: 8px;
      //   border-radius: 8px;
      //   background: red;
      //   position: absolute;
      //   top: 50%;
      //   left: -15px;
      //   transform: translateY(-50%);
      //   animation: recording 1s infinite;
      //   -webkit-animation: recording 1s infinite;
      // }
    }
  }
  @keyframes recording {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 1;
    }
    75% {
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
    // from {
    //   // opacity: 1;
    //   display: block;
    // }
    // to {
    //   // opacity: 0;
    //   display: none;
    // }
  }
}
</style>
