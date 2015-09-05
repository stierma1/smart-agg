
var ContextAggregator = require("../lib/context-aggregator");
var AggregationRule = require("../lib/rules/aggregation");
var examples = require("./examples")
var chai = require("chai");
chai.should();

describe("#ContextAggregator" , function(){

  it("constructor", function(){
    var ctxAgg = new ContextAggregator();
  });

  it("should parse a rule", function(){
    var ctxAgg = new ContextAggregator();

    var aggRuleProcessor = new AggregationRule(ctxAgg);
    aggRuleProcessor.process("test1", examples["test1"]);
    aggRuleProcessor.process("test2", examples["test2"]);

  });


});
