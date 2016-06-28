let child_process = require('child_process');


class Process {
  constructor(name="", data=null){
    this._name = name;
    this._data = data;
    this._child_process = null;
  }
  start(script=""){
    this._script = script;
    this._child_process = child_process.fork(`./validators/${script}.js`);
  }
  validate(data={}, callback){
    let _this = this;
    this._child_process.on('message', function(m){
      m.name = _this._script;
      callback(m);
    });
    this._child_process.send(data);
  }

}

module.exports = Process;
