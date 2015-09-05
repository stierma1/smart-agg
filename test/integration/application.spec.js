
var Application = require("../../lib/application");
var examples = require("../examples");
var chai = require("chai");
chai.should();

describe("#Application" , function(){

  it.skip("should create provider", function(done){
    var app = new Application({interfaces:{}});
    app.contextRegistry.on("provider-predicate-changed", function(data){
      data.provider.should.equal("provider1");
      data.predicate.should.equal("jobs(Status)");
      done();
    });
    app.processAggregationRule("single-provider-case", examples["single-provider-case"]);
    var client = app.createSharedMemoryProvider("provider1");
    client.init();
    client.updatePredicate("jobs(Status)", ["empty"], "I see nothing");

  });

  it.skip("should drop duplicate updates", function(done){
    var app = new Application({interfaces:{}});
    var triggered = false;
    app.contextRegistry.on("provider-predicate-changed", function(data){

      data.provider.should.equal("provider1");
      data.predicate.should.equal("jobs(Status)");

      setTimeout(function(){
        done();
      }, 200);

      if(!triggered){
        triggered = true;
      } else {
        done(new Error("Duplicate updates triggered multiple change events"));
      }
    });
    app.processAggregationRule("single-provider-case", examples["single-provider-case"]);
    var client = app.createSharedMemoryProvider("provider1");
    client.init();
    client.updatePredicate("jobs(Status)", ["empty"], "I see nothing");
    setTimeout(function(){
      client.updatePredicate("jobs(Status)", ["empty"], "I see nothing");
    }, 100);
  });

  it("end-to-end 1-1", function(done){
    var app = new Application({interfaces:{}});
    app.processAggregationRule("single-provider-case", examples["single-provider-case"]);
    var client = app.createSharedMemoryProvider("provider1");
    client.on("invoke-rule", function(data){
      data.rule.should.equal("single-provider-case");
      data.payloads[0].should.equal("I see nothing");
      done();
    });
    client.init();
    client.updatePredicate("jobs(Status)", ["empty"], "I see nothing");
  });

  it("end-to-end 2-1", function(done){
    var app = new Application({interfaces:{}});
    app.processAggregationRule("two-provider-case", examples["two-provider-case"]);
    var client1 = app.createSharedMemoryProvider("job_queue");
    var client2 = app.createSharedMemoryProvider("worker");
    client2.on("invoke-rule", function(data){
      data.rule.should.equal("two-provider-case");
      data.payloads[0].should.equal("I see nothing");
      done();
    });
    client1.init();
    client1.updatePredicate("jobs(Status)", ["filled"], "I see nothing");
    client2.init();
    client2.updatePredicate("work(Status)", ["none"], "Nothing to do");


  });

  it("end-to-end 2-2", function(done){
    var app = new Application({interfaces:{}});
    app.processAggregationRule("two-provider-case-two-emitter", examples["two-provider-case-two-emitter"]);

    var client1 = app.createSharedMemoryProvider("jane");
    var client2 = app.createSharedMemoryProvider("bob");
    var client1Invoked = false;
    var client2Invoked = false;

    client1.on("invoke-rule", function(data){
      data.rule.should.equal("two-provider-case-two-emitter");
      data.payloads[0].should.equal("I see nothing");
      client1Invoked = true;
      if(client2Invoked){
        done();
      }
    });

    client2.on("invoke-rule", function(data){
      data.rule.should.equal("two-provider-case-two-emitter");
      data.payloads[0].should.equal("I see nothing");
      client2Invoked = true;
      if(client1Invoked){
        done();
      }
    });

    client1.init();
    client1.updatePredicate("likes(Person)", ["bob"], "I see nothing");
    client2.init();
    client2.updatePredicate("likes(Person)", ["jane"], "Nothing to do");

  });

  it("_ 1-1", function(done){
    var app = new Application({interfaces:{}});
    app.processAggregationRule("stuff-happens", examples["stuff-happens"]);
    var client = app.createSharedMemoryProvider("things");
    client.on("invoke-rule", function(data){
      data.rule.should.equal("stuff-happens");
      data.payloads[0].should.equal("I see nothing");
      done();
    });
    client.init();
    client.updatePredicate("stuff(Event)", ["empty"], "I see nothing");
  });

});
