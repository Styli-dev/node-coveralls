'use strict';

const should = require('should');
const axios = require('axios');
const sinon = require('sinon');
const logDriver = require('log-driver');
const index = require('..');

logDriver({ level: false });

describe('sendToCoveralls', () => {
  let realCoverallsHost;
  beforeEach(() => {
    realCoverallsHost = process.env.COVERALLS_ENDPOINT;
  });

  afterEach(() => {
    sinon.restore();
    if (realCoverallsHost !== undefined) {
      process.env.COVERALLS_ENDPOINT = realCoverallsHost;
    } else {
      delete process.env.COVERALLS_ENDPOINT;
    }
  });

  it('passes on the correct params to axios.post', done => {
    // Mock axios.post with sinon and resolve the promise
    const axiosStub = sinon.stub(axios, 'post').resolves({
      data: 'body',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    });
    const obj = { 'some': 'obj' };
    const url = 'https://coveralls.io/api/v1/jobs';
    // Call the function that makes the axios request
    index.sendToCoveralls(obj, (err, response, body) => {
      try {
        // Verify that axios.post was called with the correct URL and data
        axiosStub.calledWith(url, { json: JSON.stringify(obj) }).should.be.true();
        // Assert the expected behavior of the callback
        err.should.be.null();
        response.status.should.equal(200);
        body.should.equal('body');
        done();
      } catch (error) {
        done(error); // Pass the error to Mocha if an assertion fails
      } finally {
        axiosStub.restore(); // Always restore the stub after the test
      }
    });
  });

  it('allows sending to enterprise url', done => {
    // Set the enterprise URL in the environment variable
    process.env.COVERALLS_ENDPOINT = 'https://coveralls-ubuntu.domain.com';
    // Stub axios.post to resolve a response
    const axiosStub = sinon.stub(axios, 'post').resolves({
      data: 'body',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    });
    const obj = { 'some': 'obj' };
    const expectedUrl = `${process.env.COVERALLS_ENDPOINT}/api/v1/jobs`;
    // Call the function that makes the axios request
    index.sendToCoveralls(obj, (err, response, body) => {
      try {
        // Verify that axios.post was called with the correct URL and data
        axiosStub.calledWith(expectedUrl, { json: JSON.stringify(obj) }).should.be.true();
        // Assert the expected callback behavior
        err.should.be.null();
        response.status.should.equal(200);
        body.should.equal('body');
        done();
      } catch (error) {
        done(error); // Pass any assertion errors to Mocha
      } finally {
        axiosStub.restore(); // Restore axios after the test
        delete process.env.COVERALLS_ENDPOINT; // Clean up the environment variable
      }
    });
  });
  it('writes output to stdout when --stdout is passed', done => {
    const obj = { 'some': 'obj' };

    // set up mock process.stdout.write temporarily
    const origStdoutWrite = process.stdout.write;
    process.stdout.write = function(string, ...args) {
      if (string === JSON.stringify(obj)) {
        process.stdout.write = origStdoutWrite;
        return done();
      }

      origStdoutWrite.apply(this, args);
    };

    index.options.stdout = true;

    index.sendToCoveralls(obj, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);
    });
  });
});
