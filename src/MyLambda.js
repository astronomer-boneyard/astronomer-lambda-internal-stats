"use strict";

// XXX: Can't use ES2015 modules due to the way lambda executes
require("babel/polyfill");
let _ = require("lodash");
let co = require("co");
let config = require("config");
let async = require("async");
let AWS = require("aws-sdk");
let thenify = require("thenify");
// let zlib = require("zlib");

let pgp = require("pg-promise")({});
let redshift = pgp(config.get("redshift_url"));
let s3 = new AWS.S3();

exports.downloadFile = function* (event) {
  let record = event.Records[0];
  let params = { Bucket: record.s3.bucket.name, Key: record.s3.object.key };
  s3.getObject = thenify(s3.getObject);
  return yield s3.getObject(params);
};

exports.generateRowSQL = function(input) {
  let data = new Buffer(input, "base64").toString("utf8");
  let records = data.split(/\r\n|[\n\r\u0085\u2028\u2029]/g);
  records = records.slice(0, -1);
  return _.map(records, function(record, i) {
    let o = JSON.parse(record);
    return `('${o.appId}', '${o.sentAt}', '${o.messageId}', '${o.type}')`;
  });
};

exports.insertFacts = function* (rows) {
  try {
    let rowSQL = rows.join(",");
    let sql = `insert into ingestion_stats values ${rowSQL}`;
    let r = yield redshift.any(sql);
  } catch(e) {
    console.error(e);
  }
};

exports.handler = function (event, context) {
  co(function* () {
    let file = yield exports.downloadFile(event);
    let rows = exports.generateRowSQL(file.Body);
    yield exports.insertFacts(rows);
  }).then(context.done);
};