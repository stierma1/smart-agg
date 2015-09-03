
var tingodb = require("tingodb")( {memStore:true, cacheMaxObjSize:2048, searchInArray:true, nativeObjectID:true});

var Bluebird = require("bluebird");
var util = require("util");
var PassEmitter = require("./util/pass-emitter");
var _ = require("lodash");

function ContextRegistry(){
  PassEmitter.call(this, [
    "rule-added", "active-provider-added", "update-predicate", "provider-predicate-changed" ,"response-provider-aggregation-rules", "response-provider-predicate-aggregation-rules", "rule-is-satisfied", "response-aggregation-event-rule", "IM:invoke-aggregation-rule"
  ]);
  Bluebird.promisifyAll(tingodb.Collection.prototype);
  this.db = new (tingodb.Db)('context-awareness-' + Math.random(), {searchInArray:true});
  var self = this;

  this.on("predicate-updated", function(data){
    data.timestamp = Date.now();
    self.handleUpdatePredicate(data);
  });

  this.on("request-provider-predicate-aggregation-rules", function(data){
    self.getRulesByProviderPredicate(data.provider, data.predicate, data.groundings)
      .then(_.partial(function(data,rules){
        data.rules = rules;
        self.emit("response-provider-predicate-aggregation-rules", data);
      }, data));
  });

  this.on("verify-rule-is-satisfied", function(data){
    Bluebird.all(data.ctxRules.map(function(rule){
      return self.isProviderPredicate(rule);
    })).then(_.partial(function(data, results){
      var payloads = results.reduce(function(reduced, result){
        if(reduced instanceof Array  && result){
          reduced.push(result.payload);
          return reduced;
        }
        return false;
      }, []);

      if(payloads){
        data.payloads = payloads;
        self.emit("rule-is-satisfied", data)
      }
    }, data));
  });
  this.on("request-aggregation-event-rule", function(data){
    self.getRule(data.rule)
      .then(_.partial(function(data, ruleDoc){
        data.resultContexts = ruleDoc.resultContexts;
        self.emit("response-aggregation-event-rule", data);
      }, data));
  });

  this.on("invoke-aggregation-rule", function(data){
    self.emit("IM:invoke-aggregation-rule", data);
  });
}

util.inherits(ContextRegistry, PassEmitter);

ContextRegistry.prototype.addRule = function(id, inputContexts, resultContexts){
  var self = this;
  this.db.collection("rules")
    .insert({_id:id, state:"uninitialized", inputContexts:inputContexts, resultContexts:resultContexts}, function(err, result){
      self.emit("rule-added", {rule:{_id:id, inputContexts:inputContexts, resultContexts:resultContexts}});
    });
}

ContextRegistry.prototype.addActiveProvider = function(id){
  var self = this;
  this.db.collection("active-providers")
    .insert({_id:id}, function(err, result){
      self.emit("active-provider-added", {provider:id});
    });
}

ContextRegistry.prototype.handleUpdatePredicate = function(data){
  var predicate = data.predicate;
  var provider = data.provider;
  var groundings = data.groundings;
  var payload = data.payload;

  var self = this;
  var query = {provider:provider, predicate:predicate};
  var coll = this.db.collection("provider-predicate");
  coll
    .findOneAsync(query)
    .then(function(doc){

      if(doc){
        var isSame = doc.groundings.reduce(function(reduced, grounding, idx){
          return reduced && grounding === groundings[idx];
        }, true);

        //is same nothing to do here
        if(isSame){
          return;
        }

        doc.groundings = groundings;
        doc.payload = payload;
      } else {
        doc = {
          predicate: predicate,
          groundings: groundings,
          provider:provider,
          payload:payload,
          timestamp:Date.now()
        };

        return coll.insertAsync(doc)
          .then(function(){
            return doc;
          })
          .then(function(doc){
            self.emit("provider-predicate-changed", doc);
          });
      }
      return coll.updateAsync({provider:provider, predicate:predicate}, doc, {multi:true})
        .then(function(){
          return doc;
        })
        .then(function(doc){
          self.emit("provider-predicate-changed", doc);
        });

    })
    .catch(function(err){
      console.log(err);
    });
}

ContextRegistry.prototype.isProviderPredicate = function(data){
  var predicate = data.predicate;
  var provider = data.provider;
  var groundings = data.groundings;
  var query = {provider:provider, predicate:predicate, groundings:groundings};
  var coll = this.db.collection("provider-predicate");
  return coll
    .findOneAsync(query);
}

//Will race with addRule
ContextRegistry.prototype.getRulesByProviderPredicate = function(providerId, predicate, groundings){
  var defer = Bluebird.defer();
  var query = {"inputContexts.provider":providerId, "inputContexts.predicate.raw":predicate};
  if(groundings){
    query["inputContexts.groundings"] = groundings;
  }
  this.db.collection("rules")
    .find(query, function(err, cursor){
      if(err){
        return defer.reject(err);
      }

      try{
        cursor.toArray(function(err, docs){
          if(err){
            defer.reject(err);
            return;
          }
          defer.resolve(docs);
        });
      } catch(err){
        defer.reject(err);
      }
    });

  return defer.promise;
}

//Will race with addRule
ContextRegistry.prototype.getRule = function(ruleId){
  var query = {_id:ruleId};

  return this.db.collection("rules")
    .findOneAsync(query)
}

ContextRegistry.prototype.getInputPredicatesByProvider = function(providerId){
  var defer = Bluebird.defer();
  this.db.collection("rules")
    .find({"inputContexts.provider":providerId}, function(err, cursor){
      if(err){
        return defer.reject(err);
      }

      try{
        cursor.toArray(function(err, docs){
          if(err){
            defer.reject(err);
            return;
          }
          defer.resolve(docs.reduce(function(reduced, rule){
            return reduced.concat(
                rule.inputContexts.filter(function(val){ return val.provider === providerId;})
              );
          },[]));
        });
      } catch(err){
        defer.reject(err);
      }
    });

  return defer.promise;
}

ContextRegistry.prototype.getResultPredicatesByProvider = function(providerId){
  var defer = Bluebird.defer();
  this.db.collection("rules")
    .find({"resultContexts.provider":providerId}, function(err, cursor){
      if(err){
        return defer.reject(err);
      }

      try{
        cursor.toArray(function(err, docs){
          if(err){
            defer.reject(err);
            return;
          }
          defer.resolve(docs.reduce(function(reduced, rule){
            return reduced.concat(
                rule.resultContexts.filter(function(val){ return val.provider === providerId;})
              );
          },[]));
        });
      } catch(err){
        defer.reject(err);
      }
    });

  return defer.promise;
}

ContextRegistry.prototype.getInputProvidersByPredicate = function(predicateString){
  var defer = Bluebird.defer();
  this.db.collection("rules")
    .find({"inputContexts.predicate.raw":predicateString}, function(err, cursor){
      if(err){
        return defer.reject(err);
      }

      try{
        cursor.toArray(function(err, docs){
          if(err){
            defer.reject(err);
            return;
          }
          defer.resolve(docs.reduce(function(reduced, rule){
            return reduced.concat(
                rule.inputContexts.filter(function(val){ return val.predicate.raw === predicateString;})
              );
          },[]));
        });
      } catch(err){
        defer.reject(err);
      }
    });

  return defer.promise;
}

ContextRegistry.prototype.getResultProvidersByPredicate = function(predicateString){
  var defer = Bluebird.defer();
  this.db.collection("rules")
    .find({"resultContexts.predicate.raw":predicateString}, function(err, cursor){
      if(err){
        return defer.reject(err);
      }

      try{
        cursor.toArray(function(err, docs){
          if(err){
            defer.reject(err);
            return;
          }
          defer.resolve(docs.reduce(function(reduced, rule){
            return reduced.concat(
                rule.resultContexts.filter(function(val){ return val.predicate.raw === predicateString;})
              );
          },[]));
        });
      } catch(err){
        defer.reject(err);
      }
    });

  return defer.promise;
}

module.exports = ContextRegistry;
