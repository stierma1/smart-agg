
var AggregationRule = require("../../lib/rules/aggregation");
var ContextRegistry = require("../../lib/context-registry");
var examples = require("../examples");

describe("#AggregationRule" , function(){

  it("should parse a rule", function(done){
    var cR = new ContextRegistry();

    var contextRegistry = {
      addRule: function(){
        console.log(arguments)
      }
    }
    var aggRuleProcessor = new AggregationRule(cR);
    aggRuleProcessor.process("test1", examples["test1"]);
    aggRuleProcessor.process("test2", examples["test2"]);
    setTimeout(function(){
      cR.getInputPredicatesByProvider("watch")
      .then(function(docs){
        done()
      })
      .catch(function(err){
        console.log(err)
        done();
      });
    }, 20)
    //console.log(aggRule);
  });

  it("should parse a rule2", function(done){
    var cR = new ContextRegistry();

    var contextRegistry = {
      addRule: function(){
        console.log(arguments)
      }
    }
    var aggRuleProcessor = new AggregationRule(cR);
    aggRuleProcessor.process("test1", examples["test1"]);
    aggRuleProcessor.process("test2", examples["test2"]);
    setTimeout(function(){
      cR.getResultPredicatesByProvider("hello")
      .then(function(docs){
        done()
      })
      .catch(function(err){
        console.log(err)
        done(err);
      });
    }, 20)
  });

    it("should get input devices by predicate", function(done){
      var cR = new ContextRegistry();

      var contextRegistry = {
        addRule: function(){
          console.log(arguments)
        }
      }

      var aggRuleProcessor = new AggregationRule(cR);
      aggRuleProcessor.process("test1", examples["test1"]);
      aggRuleProcessor.process("test2", examples["test2"]);
      setTimeout(function(){
        cR.getInputProvidersByPredicate("jobs(Status)")
        .then(function(docs){
          done()
        })
        .catch(function(err){
          console.log(err)
          done();
        });
      }, 20)
    //console.log(aggRule);
  });
});
