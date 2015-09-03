var When = require("./when");
var context = require("./context");

function AggregationRuleProcessor(contextRegistry){
  this.contextRegistry = contextRegistry;
  this.when = When.whenClosure;
}

AggregationRuleProcessor.prototype.process = function(id, aggRuleConfig){
  aggRuleConfig(When.whenClosure(id, this.contextRegistry), context);
}

module.exports = AggregationRuleProcessor;
