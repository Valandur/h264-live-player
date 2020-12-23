"use strict";

const util = require("util");
const spawn = require("child_process").spawn;
const merge = require("mout/object/merge");

const Server = require("./_server");

class RpiServer extends Server {
  constructor(server, opts) {
    super(
      server,
      merge(
        {
          fps: 30,
          bitrate: 3500000,
        },
        opts
      )
    );
  }

  get_feed() {
    if (this.streamer) {
      this.streamer.kill();
    }

    var msk = "raspivid -t 0 -o - -w %d -h %d -fps %d -b %d";
    var cmd = util.format(
      msk,
      this.options.width,
      this.options.height,
      this.options.fps,
      this.options.bitrate
    );
    console.log(cmd);
    var streamer = spawn("raspivid", [
      "-t",
      "0",
      "-o",
      "-",
      "-w",
      this.options.width,
      "-h",
      this.options.height,
      "-fps",
      this.options.fps,
      "-b",
      this.options.bitrate,
      "-pf",
      "baseline",
    ]);
    streamer.on("exit", function (code) {
      if (code) {
        console.log("Failure", code);
      }

      this.streamer = null;
    });
    this.streamer = streamer;

    return streamer.stdout;
  }
}

module.exports = RpiServer;
