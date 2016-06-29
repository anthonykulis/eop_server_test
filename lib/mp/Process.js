let child_process = require('child_process');


class Process {
  constructor(name="", data=null){
    this._name = name;
    this._cp = null;
  }
  start(script=""){
    let _this = this;
    this._script = script;
    this._cp = child_process.fork(`./validators/${script}.js`);
    this._cp.on('message', function(m){
      m.name = script;
      _this._callback(m);
    });
  }
  validate(data={}, callback){
    this._callback = callback;
    this._cp.send(data);
  }

}

module.exports = Process;
