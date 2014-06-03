var test = require('tape');
var protocol = require('../index')
var fs = require('fs');
var net = require('net');

test('should parse a reply from a mongodb server', function(t) {
  var p = protocol.parser();

  var file = fs.readFileSync(__dirname + '/fixtures/command-ismaster', null);
  var client = net.connect({port: 27017}, function() {
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
