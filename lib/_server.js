"use strict";

const WebSocketServer = require("ws").Server;
const Splitter = require("stream-split");
const merge = require("mout/object/merge");

const NALseparator = Buffer.from([0, 0, 0, 1]); //NAL break

class _Server {
  constructor(server, options) {
    this.options = merge(
      {
        width: 1280,
        height: 720,
      },
      options
    );

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast = this.broadcast.bind(this);

    this.wss.on("connection", this.new_client);
  }

  start_feed() {
    var readStream = this.get_feed();
    this.readStream = readStream;

    readStream = readStream.pipe(new Splitter(NALseparator));
    readStream.on("data", this.broadcast);
  }

  get_feed() {
    throw new Error("to be implemented");
  }

  broadcast(data) {
    this.wss.clients.forEach(function (socket) {
      if (socket.buzy) return;

      socket.buzy = true;
      socket.buzy = false;

      socket.send(
        Buffer.concat([NALseparator, data]),
        { binary: true },
        function ack(error) {
          socket.buzy = false;
        }
      );
    });
  }

  new_client(socket, req) {
    var self = this;
    socket.ip = req.socket.remoteAddress;

    console.log(`${socket.ip}: Connected`);

    socket.send(
      JSON.stringify({
        action: "init",
        width: this.options.width,
        height: this.options.height,
      })
    );

    socket.on("message", function (data) {
      const cmd = "" + data;
      console.log(`${socket.ip}: ${cmd}`);

      const action = data.split(" ")[0];
      if (action == "REQUESTSTREAM") self.start_feed();
      if (action == "STOPSTREAM") self.readStream.pause();
    });

    socket.on("close", function () {
      self.readStream.end();
      console.log(`${socket.ip}: Disconnected`);
    });
  }
}

module.exports = _Server;
