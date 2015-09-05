
var SharedMemoryAdapter = require("./adapters/shared-memory.js");
var util = require("util");
var PassEmitter = require("./util/pass-emitter");
var _ = require("lodash");

function InterfaceManager(config){
  PassEmitter.call(this, [
    "provider-adding", "provider-initializing", "predicate-updated"
  ]);
  var self = this;
  this.on("IM:invoke-aggregation-rule", function(data){
    self.emit(data.provider + ":invoke-rule", data);
  });
  this.config = config;
  this.protocolAdapters = {};
  this.protocolSubscriptions = {};

}

util.inherits(InterfaceManager, PassEmitter);

InterfaceManager.prototype.addProtocolAdapter = function(protocolAdapter){
  var self = this;
  var interfacE = protocolAdapter.interface;
  this.protocolAdapters[interfacE] = protocolAdapter;

  var config = _.extend(protocolAdapter.defaults || {}, this.config.interfaces[interfacE] || {});

  protocolAdapter.on("create-provider", function(data){
    protocolAdapter.createProviderHandler(data, self);
  });

  protocolAdapter.init(config);
}

InterfaceManager.prototype._internalInterceptor = function(event){
  return event;
}

InterfaceManager.prototype.noHandler = function(event){
  console.log("No Handler:", event);
}

InterfaceManager.prototype.addProvider = function(id, client){
  this.emit({
    type:"provider-adding",
    provider:id
  });
}

module.exports = InterfaceManager;
