
var InterfaceManager = require("./interface-manager");
var ContextManager = require("./context-manager");
var ContextRegistry = require("./context-registry");
var AggregationRuleProcessor = require("./rules/aggregation");
var SharedMemoryAdapter = require("./adapters/shared-memory");

function Application(config){
  this.config = config;
  var interfaceManager = new InterfaceManager(config);
  var contextRegistry = new ContextRegistry();
  var contextManager = new ContextManager();
  var aggRuleProcessor = new AggregationRuleProcessor(contextRegistry);

  interfaceManager.subscribe(contextRegistry);
  contextRegistry.subscribe(interfaceManager);
  contextRegistry.subscribe(contextManager);
  contextManager.subscribe(contextRegistry);

  this.interfaceManager = interfaceManager;
  this.contextRegistry = contextRegistry;
  this.contextManager = contextManager;
  this.aggRuleProcessor = aggRuleProcessor;
  this.sharedMemoryAdapter = new SharedMemoryAdapter();
  this.interfaceManager.addProtocolAdapter(this.sharedMemoryAdapter);

  if(config.adapters){
    this._loadAdditionalAdapters(config.adapters);
  }
}

Application.prototype.processAggregationRule = function(id, rule){
  this.aggRuleProcessor.process(id, rule);
}

Application.prototype.createSharedMemoryProvider = function(id, predicates){
  return this.sharedMemoryAdapter.createProvider(id, predicates);
}

Application.prototype._loadAdditionalAdapters = function(adapters){
  var self = this;
  adapters.map(function(adapter){
    var Adapter = require(adapter);
    var instance = new Adapter(self.config.interfaces[Adapter.interface]);
    self.interfaceManager.addProtocolAdapter(instance);
  })
}

module.exports = Application;
