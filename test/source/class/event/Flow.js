var suite = new core.testrunner.Suite("Flow");


suite.test("sequence", function() {
  var result = [];  

  var func1 = function() {
    return new core.event.Promise(function(resolve) {
      core.Function.timeout(function() {
        result.push("func1");
        resolve("func1");
      }, null, 50);
    });
  };
  var func2 = function() {
    result.push("func2");
    return "func2";
  };
  var func3 = function() {
    result.push("func3");
    return "func3";
  };

  core.event.Flow.sequence([func1, func2, func3]).then(function() {
    this.isIdentical(result.length, 3);
    this.isIdentical(result[0], "func1");
    this.isIdentical(result[1], "func2");
    this.isIdentical(result[2], "func3");
    this.done();
  }, null, this).done();

}, 4, 1000);

