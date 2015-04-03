"use strict";
var suite = new core.testrunner.Suite("Promises");


suite.test("successful promises", function() {

  var promise = core.event.Promise.resolve("TEST1");
  
  var fulfill = function(value) {
    this.isIdentical(value, "TEST1");
    this.done();
  };
  var reject = function(reason) {
    this.isIdentical(reason, "TEST2");
    this.done();
  };
  
  promise.then(fulfill, reject, this);
  
}, 1, 1000);


suite.test("rejected promises", function() {

  var promise = core.event.Promise.reject("TEST2");
  
  var fulfill = function(value) {
    this.isIdentical(value, "TEST1");
    this.done();
  };
  var reject = function(reason) {
    this.isIdentical(reason, "TEST2");
    this.done();
  };
  
  promise.then(fulfill, reject, this);

}, 1, 1000);


suite.test("flow value mapping (simple)", function() {

  var promise = core.event.Flow.all([0, 1, 9]);
  
  promise.then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (promises list)", function() {

  var promise0 = core.event.Promise.resolve(0);
  var promise1 = core.event.Promise.resolve(1);
  var promise9 = core.event.Promise.resolve(9);
  var promise = core.event.Flow.all([promise0, promise1, promise9]);
  
  promise.then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (mixed values)", function() {

  var promise0 = core.event.Promise.resolve(0);
  var promise9 = core.event.Promise.resolve(9);
  var promise = core.event.Flow.all([promise0, 1, promise9]);
  
  promise.then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (promise for array of values)", function() {

  var promise = core.event.Promise.resolve([0, 1, 9]);
  
  core.event.Flow.all(promise).then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (promise for array of promises)", function() {

  var promise0 = core.event.Promise.resolve(0);
  var promise1 = core.event.Promise.resolve(1);
  var promise9 = core.event.Promise.resolve(9);
  var promise = core.event.Promise.resolve([promise0, promise1, promise9]);
  
  core.event.Flow.all(promise).then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (promise for array of mixed values and promises)", function() {

  var promise0 = core.event.Promise.resolve(0);
  var promise9 = core.event.Promise.resolve(9);
  var promise = core.event.Promise.resolve([promise0, 1, promise9]);

  core.event.Flow.all(promise).then(function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, null, this);
  
}, 3, 1000);


suite.test("flow value mapping (reject one promise)", function() {

  var promise0 = core.event.Promise.reject("REASON");
  var promise9 = core.event.Promise.resolve(9);
  var promise = core.event.Promise.resolve([promise0, 1, promise9]);
  
  core.event.Flow.all(promise).then(null, function(reason) {
    this.isIdentical(reason, "REASON");
    this.done();
  }, this);
  
}, 1, 1000);

/*
suite.test("flow map", function() {

  var promise = new core.event.Promise;
  var promise0 = new core.event.Promise;
  var promise9 = new core.event.Promise;
  
  core.event.Flow.map(promise, function(value) {
    return "X" + value;
  }).then(function(value) {
    
    this.isTrue(core.Array.contains(value, "X0"));
    this.isTrue(core.Array.contains(value, "X1"));
    this.isTrue(core.Array.contains(value, "X9"));
    
    this.done();
  }, null, this);
  
  promise.fulfill([promise0, 1, promise9]);
  
  promise0.fulfill(0);
  promise9.fulfill(9);
  
}, 3, 1000);
*/

suite.test("flow any", function() {

  var promise0 = new core.event.Promise(function(resolve) {
    core.Function.immediate(function() {
      resolve(0);
    });
  });
  var promise1 = new core.event.Promise(function(resolve) {
    core.Function.immediate(function() {
      resolve(1);
    });
  });
  var promise9 = core.event.Promise.resolve(9);
  
  core.event.Flow.any([promise0, promise1, promise9]).then(function(value) {
    
    this.isIdentical(value, 9);
    
    this.done();
  }, null, this);
  
}, 1, 1000);

suite.test("flow any with one failing", function() {

  var promise0 = core.event.Promise.resolve(0);
  var promise1 = core.event.Promise.reject(1);
  
  core.event.Flow.any([promise0, promise1, 9]).then(function(value) {
    
    this.isIdentical(value, 9);
    
    this.done();
  }, null, this);
  
}, 1, 1000);


suite.test("flow any with all failing", function() {

  var promise0 = core.event.Promise.reject(0);
  var promise1 = core.event.Promise.reject(1);
  var promise9 = core.event.Promise.reject(9);
  
  core.event.Flow.any([promise0, promise1, promise9]).then(null, function(value) {
    
    this.isTrue(core.Array.contains(value, 0));
    this.isTrue(core.Array.contains(value, 1));
    this.isTrue(core.Array.contains(value, 9));
    
    this.done();
  }, this);
  
}, 3, 1000);


suite.test("flow sequence", function() {

  var mutex = null;

  var promise1 = new core.event.Promise(function(resolve) {
    core.Function.immediate(function() {
      resolve(1);
    });
  });
  
  var func1 = function(arg1, arg2) {
    this.isNull(mutex);
    mutex = "func1";
    
    return promise1.then(function(value) {
      this.isEqual(mutex, "func1");
      mutex = null;
      
      return [arg1, arg2, value];
    }, null, this);
  };
  
  var func2 = function(arg1, arg2) {
    this.isNull(mutex);
    mutex = "func2";
    return new core.event.Promise(function(resolve) {
      core.Function.timeout(function() {
        this.isEqual(mutex, "func2");
        mutex = null;
        
        resolve([arg1, arg2, 2]);
      }, this, 200);
    }, this);
  };
  var func3 = function(arg1, arg2) {
    return [arg1, arg2, 3];
  };
  
  core.event.Flow.sequence([func1, func2, func3], this, "a", "b").then(function(value) {

    this.isTrue(core.Array.contains(value[0], "a"), "Array 0 contains a");
    this.isTrue(core.Array.contains(value[0], "b"), "Array 0 contains b");
    
    this.isTrue(core.Array.contains(value[1], "a"), "Array 1 contains a");
    this.isTrue(core.Array.contains(value[1], "b"), "Array 1 contains b");
    
    this.isTrue(core.Array.contains(value[2], "a"), "Array 2 contains a");
    this.isTrue(core.Array.contains(value[2], "b"), "Array 2 contains b");
    
    this.isTrue(core.Array.contains(value[0], 1) || core.Array.contains(value[1], 1) || core.Array.contains(value[2], 1), "One array contains 1");
    this.isTrue(core.Array.contains(value[0], 2) || core.Array.contains(value[1], 2) || core.Array.contains(value[2], 2), "One array contains 2");
    this.isTrue(core.Array.contains(value[0], 3) || core.Array.contains(value[1], 3) || core.Array.contains(value[2], 3), "One array contains 3");
    
    
    this.done();
  }, function(reason) {
    throw reason;
  }, this);
  
}, 13, 1000);


suite.test("flow pipe", function() {

  var mutex = null;

  var promise1 = core.event.Promise.resolve(1);
  
  var func1 = function(arg) {
    this.isIdentical(arg, "a");
    return promise1.then(function(value) {
      return value;
    }, null, this);
  };
  
  var func2 = function(arg) {
    this.isIdentical(arg, 1);
    return new core.event.Promise(function(resolve) {
      core.Function.timeout(function() {
        resolve(2);
      }, this, 200);
    });
  };
  var func3 = function(arg) {
    this.isIdentical(arg, 2);
    return 3;
  };
  
  core.event.Flow.pipeline([func1, func2, func3], this, "a").then(function(arg) {
    this.isIdentical(arg, 3);
    this.done();
  }, function(reason) {
    throw new Error(reason);
  }, this);
  
}, 4, 1000);


suite.test("flow pipe (rejected)", function() {

  var mutex = null;

  var promise1 = core.event.Promise.resolve(1);
  
  var func1 = function(arg) {
    this.isIdentical(arg, "a");
    return promise1.then(function(value) {
      return value;
    }, null, this);
  };
  
  var func2 = function(arg) {
    this.isIdentical(arg, 1);
    return new core.event.Promise(function(resolve, reject) {
      core.Function.timeout(function() {
        reject(2);
      }, this, 200);
      
    });
  };
  var func3 = function(arg) {
    this.isIdentical(arg, 2);
    return 3;
  };
  
  core.event.Flow.pipeline([func1, func2, func3], this, "a").then(function(arg) {
    throw new Error("Should fail, but did not do it");
  }, function(reason) {
    this.isIdentical(reason, 2);
    this.done();
  }, this);
  
}, 3, 1000);
