
var Bluebird = require("bluebird");
var util = require("util");
var PassEmitter = require("./util/pass-emitter");

function ContextManager(){
  PassEmitter.call(this, ["request-provider-aggregation-rules", "request-provider-predicate-aggregation-rules", "verify-rule-is-satisfied","request-aggregation-event-rule", "invoke-aggregation-rule"]);
  this.activeCorrelations = {};
  this.on("rule-added", this.handleRuleAdded);
  this.on("active-provider-added", this.handleActiveProviderAdded);
  this.on("provider-predicate-changed", this.handleProviderPredicateChanged);
  this.on("response-provider-aggregation-rules", this.handleResponseProviderAggregationRules);
  this.on("response-provider-predicate-aggregation-rules", this.handleResponseProviderPredicateAggregationRules);
  this.on("rule-is-satisfied", this.handleRuleIsSatisfied);
  this.on("response-aggregation-event-rule", this.handleResponseAggregationEventRule);
  //this.on("provider-initialized", this.handleProviderInitialized);
  //this.contextRegistry = contextRegistry;
  //his.cRSubscription = contextRegistry.map(this.registryEventHandler).flatMap(function(data){return data}).subscribe(function(){});
}

util.inherits(ContextManager, PassEmitter);

ContextManager.prototype.handleRuleAdded = function(rule){
  var defer = Bluebird.defer();
  var self = this;

  return defer.promise;
}

ContextManager.prototype.handleActiveProviderAdded = function(provider){
  var defer = Bluebird.defer();
  var self = this;
//  this.contextRegistry.get

  return defer.promise;
}

ContextManager.prototype.handleProviderPredicateChanged = function(data){
  this.emit("request-provider-predicate-aggregation-rules", {id:Math.random().toString(), provider:data.provider, predicate:data.predicate, groundings:data.groundings});
}

ContextManager.prototype.handleResponseProviderPredicateAggregationRules = function(data){
  var self = this;
  this.extractProviderPredicatesFromRules(data.rules).map(function(rule){
    rule.id = data.id;
    self.emit("verify-rule-is-satisfied", rule);
  });
}

ContextManager.prototype.handleRuleIsSatisfied = function(data){
  this.emit("request-aggregation-event-rule", data)
}

ContextManager.prototype.handleResponseAggregationEventRule = function(data){
  var self = this;
  data.resultContexts.map(function(resultContext){
    var provider = resultContext.provider;
    var predicate = resultContext.predicate.raw;
    var groundings = resultContext.groundings;
    self.emit("invoke-aggregation-rule", {id:data.id, predicate:predicate, provider:provider, groundings:groundings, payloads:data.payloads, rule:data.rule});
  });
}

ContextManager.prototype.handleResponseProviderAggregationRules = function(data){
  var correl = this.activeCorrelations[data.id];

}

ContextManager.prototype.createCorrelationObj = function(trigger){
  var val = Math.random().toString();
  var correlationObj = {id: val, trigger:trigger, workspace:{heap:[]}};
  this.activeCorrelations[val] = correlationObj;
  return correlationObj;
}

ContextManager.prototype.extractProviderPredicatesFromRules = function(rules){

  return rules.reduce(function(reduced, rule){
    var ctxs = rule.inputContexts.reduce(function(ctxPredProviders, ctxRule){
      ctxPredProviders.push({provider:ctxRule.provider, predicate:ctxRule.predicate.raw, groundings:ctxRule.groundings});
      return ctxPredProviders;
    }, []);

    reduced.push({
      rule:rule._id,
      ctxRules: ctxs
    });

    return reduced;
  },[]);

}

module.exports = ContextManager;
