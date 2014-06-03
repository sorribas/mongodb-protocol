var test = require('tape');
var protocol = require('../index')

test('should parse a reply from a mongodb server', function(t) {
  var p = protocol.parser();

  var file = require('fs').readFileSync(__dirname + '/fixtures/command-ismaster', null);
  var client = require('net').connect({port: 27017}, function() {
    client.write(file);
    client.pipe(p);
  });

  p.on('reply', function(reply) {
    t.ok(reply.docs.ismaster);
    t.equal(reply.numberReturned, 1);
    t.end();
    client.destroy();
  });
});
