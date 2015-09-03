
module.exports = function predicateParser(predicateString){
  var split1 = predicateString.split("(");
  var split2 = split1[1].split(")");
  var args = split2[0].split(",");
  if(args[0] === ""){
    args.pop();
  }
  var predicate = split1[0];

  return {
    raw: predicateString,
    name: predicate,
    arguments: args
  }
}
