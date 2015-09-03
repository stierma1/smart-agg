
var SharedMemoryAdapter = require("../lib/adapters/shared-memory");
var chai = require("chai");
chai.should();

describe("#InterfaceManager" , function(){

  it("should create provider", function(done){
    var InterfaceManager = require("../lib/interface-manager");
    var interfaceManager = new InterfaceManager({protocols:{}});
    var sharedMemoryAdapter = new SharedMemoryAdapter();
    var client = sharedMemoryAdapter.createProvider("test1");

    client.id.should.equal("test1");
    done();
  });

});
