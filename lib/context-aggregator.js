var Bluebird = require("bluebird");
var util = require("util");
var PassEmitter = require("./util/pass-emitter");
var _ = require("lodash");

function ContextAggregator(){
    PassEmitter.call(this, ["IM:invoke-aggregation-rule"]);

    this.database = {
      rules:{
      },
      currentData:{
      },
      providers:{
      }
    };

    this.on("predicate-updated", this.updatePredicate);

}

util.inherits(ContextAggregator, PassEmitter);

//@params string data.provider, [] data.predicates
ContextAggregator.prototype.addProvider = function(data){
  this.database.providers[data.provider] = {
    predicates:data.predicates
  };

  //this.providerChanged(data.provider);
};

ContextAggregator.prototype.addRule = function(id, inputContexts, resultContexts){
    this.database.rules[id] =
    {
      id:id,
      state:"uninitialized",
      inputContexts:inputContexts,
      resultContexts:resultContexts
    }

    //this.ruleChanged(id);
}

ContextAggregator.prototype.deleteRule = function(id){
  try{
    delete this.database.rules[id];
  } catch(err){
    console.log(err);
  }
}

ContextAggregator.prototype.updatePredicate = function(data){

  var predicate = data.predicate;
  var provider = data.provider;
  var groundings = data.groundings;
  var payload = data.payload;
  //Check if provider and predicate exists is the database
  var curGroundings = this.database.currentData[provider] && this.database.currentData[provider][predicate] && this.database.currentData[provider][predicate].groundings;

  var equal = curGroundings && _.reduce(curGroundings, function(residuel, curGround, idx){
    return residuel && (curGround === groundings[idx])
  }, true);

  if(equal){
    //There was no change
    return;
  }

  this.database.currentData[provider] = this.database.currentData[provider] || {};
  this.database.currentData[provider][predicate] = this.database.currentData[provider][predicate] || {};
  this.database.currentData[provider][predicate] = {groundings: groundings, payload:payload};

  this._predicateChanged(provider, predicate, groundings);
}

ContextAggregator.prototype._predicateChanged = function(provider, predicate, groundings){
  var self = this;
  var rules = this.getRulesByInputPPG(provider, predicate, groundings);
  //rules.filter(function(rule){
  //  return rule.state !== "uninitialized";
  //});

  if(!rules){
    //No change
    return;
  }

  var satisifiedRules = rules.map(function(rule){
    return self.checkIfSatisfied(rule);
  }).filter(function(rule){return rule;});

  satisifiedRules.map(function(rule){
    self.invokeRule(rule);
  });
};

ContextAggregator.prototype.invokeRule = function(rule){
  var self = this;
  rule.resultContexts.map(function(ctx){
    var provider = ctx.provider;
    var predicate = ctx.predicate.raw;
    var groundings = ctx.groundings;
    var payloads = rule.payloads;

    self.emit("IM:invoke-aggregation-rule", {
      provider:provider,
      predicate: predicate,
      groundings: groundings,
      payloads:payloads,
      rule:rule.id
    });
  })
}

ContextAggregator.prototype.getRulesByInputPPG = function(provider, predicate, groundings){
  var rules =  this.database.rules;

  rules = _.mapValues(rules, function(ruleObj, id){
    var matched = ruleObj.inputContexts.filter(function(ctx){
      return ctx.provider === provider && ctx.predicate.raw === predicate && arrEquals(groundings, ctx.groundings);
    }) || false;

    if(matched){
      return ruleObj;
    }
    return false;
  });

  for(var i in rules){
    if(!rules[i]){
      delete rules[i];
    }
  }
  var out = [];
  for(var i in rules){
    rules[i].id = i;
    out.push(rules[i]);
  }

  return out;
}

ContextAggregator.prototype.checkIfSatisfied = function(rule){
  var inCtx = rule.inputContexts;
  var self = this;
  var payloads = inCtx.map(function(ctx){
    var groundings = ctx.groundings;
    var predicate = ctx.predicate.raw;
    var provider = ctx.provider;

    var curGroundings = self.database.currentData[provider] && self.database.currentData[provider][predicate] && self.database.currentData[provider][predicate].groundings;

    var equal = curGroundings && _.reduce(curGroundings, function(residuel, curGround, idx){
      return residuel && (curGround === groundings[idx] || groundings[idx] === "_");
    }, true);

    if(!equal){
      return false;
    }

    return self.database.currentData[provider][predicate].payload
  });

  if(payloads.indexOf(false) !== -1){
    return false;
  }

  rule.payloads = payloads;
  return rule;
}

function arrEquals(arr1, arr2){
  if(arr1.length !== arr2.length){
    return false;
  }

  for(var i = 0; i < arr1.length; i++){
    if(arr1[i] !== arr2[i] && arr2[i] !== "_"){
      return false;
    }
  }

  return true;
}

module.exports = ContextAggregator;
