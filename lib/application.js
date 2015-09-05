
var InterfaceManager = require("./interface-manager");
var AggregationRuleProcessor = require("./rules/aggregation");
var SharedMemoryAdapter = require("./adapters/shared-memory");
var ContextAggregator = require("./context-aggregator");

function Application(config){
  this.config = config;
  var interfaceManager = new InterfaceManager(config);
  var contextAggregator = new ContextAggregator();
  var aggRuleProcessor = new AggregationRuleProcessor(contextAggregator);

  interfaceManager.subscribe(contextAggregator);
  contextAggregator.subscribe(interfaceManager);

  this.interfaceManager = interfaceManager;
  this.aggRuleProcessor = aggRuleProcessor;
  this.contextAggregator = contextAggregator;
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
