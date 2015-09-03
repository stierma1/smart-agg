var predicateParser = require("./predicate-parser");

function Context(predicateContext){
  var args = [];
  for(var i = 1; i < arguments.length; i++){
    args.push(arguments[i]);
  }

  return {
    is:{
      provided:{
        by: function(providerId){
          var predicateParsed = predicateParser(predicateContext);
          return {
            isBounded:true,
            provider:providerId,
            predicate: predicateParsed,
            groundings:args
          };
        }
      }
    },
    on: function(providerId){
      var predicateParsed = predicateParser(predicateContext);
      return {
        isBounded:true,
        provider:providerId,
        predicate: predicateParsed,
        groundings:args
      };
    }
  }
}

module.exports = Context;
