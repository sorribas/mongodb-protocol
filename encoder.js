var stream = require('stream');
var util = require('util');
var Readable = stream.Readable || require('readable-stream').Readable;
var bson = require('bson').pure().BSON;

var createHeader = function(opts) {
  var header = new Buffer(16);
  header.writeUInt32LE(opts.length, 0);
  header.writeUInt32LE(opts.requestID, 4);
  header.writeUInt32LE(opts.responseTo, 8);
  header.writeUInt32LE(opts.opCode, 12);

  return header;
};

var MongoProtocolEncoder = function() {
  if (!(this instanceof MongoProtocolEncoder)) return new MongoProtocolEncoder();
  Readable.call(this);
};

util.inherits(MongoProtocolEncoder, Readable);

MongoProtocolEncoder.prototype.query = function(query, opts) {
  var flags = 0; // TODO
  var collectionName = opts.collectionName + '\0';
  var skip = opts.numberToSkip || 0;
  var n = opts.numberToReturn || 0;

  var optsBuffer = new Buffer(12 + collectionName.length);
  optsBuffer.writeUInt32LE(flags, 0);
  optsBuffer.write(collectionName, 4);
  optsBuffer.writeUInt32LE(skip, 4 + collectionName.length);
  optsBuffer.writeUInt32LE(n, 8 + collectionName.length);

  var queryBuf = bson.serialize(query);
  var header = createHeader({
    length: 16 + queryBuf.length + optsBuffer.length,
    requestID: 1,
    responseTo: 0,
    opCode: 2004
  });

  this.push(Buffer.concat([header, optsBuffer, queryBuf]));
};

MongoProtocolEncoder.prototype._read = function() {};

module.exports = MongoProtocolEncoder;
