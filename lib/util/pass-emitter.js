var EE = require("events").EventEmitter;
var util = require("util");

function PassEmitter(passEvents){
  EE.call(this);
  var self = this;
  this.subscribers = [];
  this.passEvents = {};

  passEvents.map(function(val){
    self.passEvents[val] = true;
  });

  var oldEmit = this.emit;
  this.emit = this._emit(oldEmit);
}

util.inherits(PassEmitter, EE);

PassEmitter.prototype._pass = function(event, data){
  if(this.passEvents[event]){
    for(var i = 0; i < this.subscribers.length; i++){
      this.subscribers[i].emit(event, data);
    }
  }
};

PassEmitter.prototype._emit = function(oldFunc){
    return function(event, data){
      this._pass(event, data);
      oldFunc.call(this, event, data);
    };
};

PassEmitter.prototype.subscribe = function(subscriber){
  this.subscribers.push(subscriber);
};

module.exports = PassEmitter;
