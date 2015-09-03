
var util = require("util");
var EE = require("events").EventEmitter;

function Client(providerId, predicates){
  EE.call(this);
  this.id = providerId;
  this.predicates = predicates;
}

util.inherits(Client, EE);

Client.prototype.init = function(){
  this.emit("provider-initializing", {
    provider:this.id,
    predicates:this.predicates
  });
}

Client.prototype.updatePredicate = function(predicate, groundings, payload){
  this.emit("update-predicate", {
    predicate:predicate,
    groundings:groundings,
    provider:this.id,
    payload:payload
  });
}

function SharedMemoryAdapter(){
  EE.call(this);
  this.interface = "shared_memory";
  this.defaults = {};
}

util.inherits(SharedMemoryAdapter, EE);

SharedMemoryAdapter.prototype.init = function(){};

SharedMemoryAdapter.prototype.createProviderHandler = function(event, interfaceManager){
  interfaceManager.on(event.client.id + ":invoke-rule", function(client){
    return function(data){
      client.emit("invoke-rule", data);
    };
  }(event.client));

  event.client.on("update-predicate", function(data){
    interfaceManager.emit("predicate-updated", data);
  });

  event.client.once("provider-initializing", function(data){
    interfaceManager.emit("provider-initializing", data);
  });
};

SharedMemoryAdapter.prototype.createProvider = function(providerId, predicates){
  var client = new Client(providerId, predicates);
  this.emit("create-provider", {protocol:this.protocol, client:client});
  return client;
};

module.exports = SharedMemoryAdapter;
