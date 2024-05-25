import { defineStore } from "pinia";
import { printStatusApi } from "@/api/xxx";
// export const WS_URL = 'ws://127.0.0.1:13528'
import { RefNumEnum, WS_URL } from "@/utils/constant";
import { ElMessageBox } from "element-plus";

export const useWebSocketStore = defineStore("websocket", {
  state: () => ({
    ws: null, // 全局存储一个 websoket ，避免重复创建
    isConnected: false, // 判断菜鸟组件是否以及启动
    reconnectInterval: 5000,
    reconnectTimer: null,
    callbackEventObj: {},
    isShowErrBox: false,
  }),
  actions: {
    connect(cb, callbackType) {
      this.callbackEventObj[callbackType] = cb; // 打印成功或则失败的回调函数，场景不同用callbackType 来判断对于的回调
      if (this.ws && this.ws.readyState === 1) return;
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
      };
      this.ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        // 处理收到的消息
        this.subscribe(JSON.parse(event.data || ""), cb);
      };
      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnected = false;
        this.reconnect(cb, callbackType);
      };
      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.reconnect(cb, callbackType);
      };
    },
    send(message) {
      if (this.isConnected) {
        this.ws.send(message);
      } else {
        console.warn("WebSocket is not connected");
      }
    },
    close() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    },
    subscribe(data, callBackFn) {
      switch (data.cmd) {
        case "getPrinters":
          console.log("获取打印机列表", data.printers);
          if (data.printers) {
            data.printers = data.printers.filter((i) => {
              return i.status == "enable";
            });
          }
          // 缓存起来
          localStorage.setItem("PRINTERS", JSON.stringify(data.printers || []));
          break;
        case "getPrinterConfig":
          console.log("获取打印机配置");
          console.log(data.printer);
          break;
        case "print":
          console.log("发送打印");
          // console.log(data)
          if (data?.status === "failed" && !this.isShowErrBox) {
            this.isShowErrBox = true;
            ElMessageBox({
              title: "Warning",
              message: `${data?.msg}`,
              confirmButtonText: "I know",
              callback: () => {
                this.isShowErrBox = false;
              },
            });
          }
          break;
        case "notifyPrintResult":
          console.log("打印通知----", data);
          if (["printed", "failed"].includes(data.taskStatus)) {
            // 打印成功/失败 回调记录状态Api接口
            this.printStatus(data);
          }
          break;
        case "setPrinterConfig":
          console.log("设置打印机配置");
          console.log(data);
          break;
      }
    },
    // 这里的data是发送给菜鸟组件的数据按文档要求来，一般有requestID，TaskID等，把自定义的拼接进去
    async printStatus(data) {
      // 传参
      let curId = data?.requestID.split("#") && data?.requestID.split("#")[0];
      await printStatusApi(curId);
      this.callbackEventObj[markType]();
    },
    // 这里的重连可以设置一个次数后，停止重连
    reconnect(cb, callbackType) {
      if (!this.reconnectTimer) {
        console.log(`WebSocket will reconnect in ${this.reconnectInterval} ms`);
        this.reconnectTimer = setTimeout(() => {
          console.log("WebSocket reconnecting...");
          this.connect(cb, callbackType);
          this.reconnectTimer = null;
        }, this.reconnectInterval);
      }
    },
    stopReconnect() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    },
  },
});
