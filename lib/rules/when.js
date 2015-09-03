function whenClosure(id, contextRegistry){
  return function (){
    var args = [];
    for(var i = 0; i < arguments.length; i++){
      args.push(arguments[i]);
      if(!arguments[i].isBounded){
        throw new Error("Context was unbounded", arguments[i]);
      }
    }

    return {
      set:setClosure(id, contextRegistry, args)
    }
  }
}

function setClosure(id, contextRegistry, inputContexts){
  return function(){
    var resultContexts = [];
    for(var i = 0; i < arguments.length; i++){
      resultContexts.push(arguments[i]);
      if(!arguments[i].isBounded){
        throw new Error("Context was unbounded ");
      }
    }
    contextRegistry.addRule(id, inputContexts, resultContexts);
  }
}

module.exports = {
  whenClosure:whenClosure,
  _setClosure:setClosure
}
