"use strict";

// XXX: Can't use ES2015 modules due to the way lambda executes
require("babel/polyfill");
var _ = require("lodash");
var co = require("co");
var config = require("config");
var async = require("async");
var AWS = require("aws-sdk");
var thenify = require("thenify");
// let zlib = require("zlib");

var pgp = require("pg-promise")({});
var redshift = pgp(config.get("redshift_url"));
var s3 = new AWS.S3();

exports.downloadFile = regeneratorRuntime.mark(function callee$0$0(event) {
  var record, params;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        record = event.Records[0];
        params = { Bucket: record.s3.bucket.name, Key: record.s3.object.key };

        s3.getObject = thenify(s3.getObject);
        context$1$0.next = 5;
        return s3.getObject(params);

      case 5:
        return context$1$0.abrupt("return", context$1$0.sent);

      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
});

exports.generateRowSQL = function (input) {
  var data = new Buffer(input, "base64").toString("utf8");
  var records = data.split(/\r\n|[\n\r\u0085\u2028\u2029]/g);
  records = records.slice(0, -1);
  return _.map(records, function (record, i) {
    var o = JSON.parse(record);
    return "('" + o.appId + "', '" + o.sentAt + "', '" + o.messageId + "', '" + o.type + "')";
  });
};

exports.insertFacts = regeneratorRuntime.mark(function callee$0$0(rows) {
  var rowSQL, sql, r;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.prev = 0;
        rowSQL = rows.join(",");
        sql = "insert into ingestion_stats values " + rowSQL;
        context$1$0.next = 5;
        return redshift.any(sql);

      case 5:
        r = context$1$0.sent;
        context$1$0.next = 11;
        break;

      case 8:
        context$1$0.prev = 8;
        context$1$0.t0 = context$1$0["catch"](0);

        console.error(context$1$0.t0);

      case 11:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this, [[0, 8]]);
});

exports.handler = function (event, context) {
  co(regeneratorRuntime.mark(function callee$1$0() {
    var file, rows;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return exports.downloadFile(event);

        case 2:
          file = context$2$0.sent;
          rows = exports.generateRowSQL(file.Body);
          context$2$0.next = 6;
          return exports.insertFacts(rows);

        case 6:
        case "end":
          return context$2$0.stop();
      }
    }, callee$1$0, this);
  })).then(context.done);
};