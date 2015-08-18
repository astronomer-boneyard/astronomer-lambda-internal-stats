"use strict";

import "co-mocha";
import fs from "fs";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import proxyquire from "proxyquire";
import {downloadFile, generateRowSQL} from "../MyLambda";

// let proxyQuireStrict = proxyquire.noCallThru();
// let handler;

global.expect = chai.expect;
chai.use(sinonChai);

describe("astronomer-lambda-internal-stats", function() {
  describe("exports.handler()", function() {
    // beforeEach(function() {
    //   handler = sinon.stub(myLambda, "handler");
    // });
    // afterEach(function() {
    //   handler.restore();
    // });
    describe("with s3 input", function() {
      it("download file", function* () {
        let event = { Records: [
          { s3: { bucket: { name: "astronomer-archive" }, object: { key: "data/WxmYs69Yc83pwBfsF/1439555790342" } }}
        ]};
        let result = yield downloadFile(event);
        expect(result.Body).to.have.length(51149);
      });
    });
  });

  describe("exports.generateRowSQL()", function() {
    describe("with sample input", function() {
      it("parses input file into multi-row insert", function() {
        var input = fs.readFileSync("test/data/test-data.txt");
        var rows = generateRowSQL(input);
        expect(rows).to.have.length(86);
      });
    });
  });
});
