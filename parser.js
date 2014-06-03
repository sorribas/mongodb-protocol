var stream = require('stream');
var util = require('util');
var Writable = stream.Writable || require('readable-stream').Writable;
var bson = require('bson').pure().BSON;

var MongoProtocolParser = function() {
  if (!(this instanceof MongoProtocolParser)) return new MongoProtocolParser();
  Writable.call(this);

  this._buffer = [];
  this._bufferSize = 0;
  this._getSize = 0;
  this._getCb = null;

  var self = this;
  
  var loop = function() {
    self._getHeader(function(header) {
      if (header.opCode === 1) {
        self._getReply(header, function(reply) {
          self.emit('reply', reply);
          loop();
        });
      }
    });
  };
  loop();
};

util.inherits(MongoProtocolParser, Writable);

MongoProtocolParser.prototype._getHeader = function(cb) {
  var self = this;
  this._get(16, function(buffer) {
    var header = {};

    header.messageLength = buffer.readUInt32LE(0);
    header.requestID = buffer.readUInt32LE(4);
    header.responseTo = buffer.readUInt32LE(8);
    header.opCode = buffer.readUInt32LE(12);
    cb(header);
  });
};

MongoProtocolParser.prototype._getReply = function(header, cb) {
  this._get(header.messageLength - 16, function(buffer) {
    var reply = {};
    reply.responseFlags = buffer.readUInt32LE(0);
    reply.cursorID = (buffer.readUInt32LE(4) * (1 << 16) * (1 << 16)) * buffer.readUInt32LE(8);
    reply.startingFrom = buffer.readUInt32LE(12);
    reply.numberReturned = buffer.readUInt32LE(16);
    reply.docs = bson.deserialize(buffer.slice(20));

    cb(reply);
  });
};

MongoProtocolParser.prototype._get = function(len, cb) {
  this._getSize = len;
  this._getCb = cb;
  this._getFromBuffer();
};

MongoProtocolParser.prototype._getFromBuffer = function() {
  if (this._bufferSize >= this._getSize) {
    var buf = Buffer.concat(this._buffer);
    this._buffer = [buf.slice(this._getSize)];
    this._bufferSize -= this._getSize;
    this._getCb(buf);
  }
};

MongoProtocolParser.prototype._write = function(buf, enc, cb) {
  this._buffer.push(buf);
  this._bufferSize += buf.length;

  this._getFromBuffer();
  cb();
};

module.exports = MongoProtocolParser;
