var assert = require('assert')
var path = require('path')
var fs = require('fs-extra')

var _ = require('underscore')
var Q = require('q')
var broccoli = require('broccoli')

var BroccoliKarma = require('..')

describe('broccoli-karma', function() {
	this.timeout(8000)

	var ORIG_DIR = path.join(__dirname, 'files')
	var DIR = path.join(__dirname, 'files-copy')

	var fakeReporter = require(path.join(__dirname, 'fakeReporter'))

	var OPTIONS = {
		files: ['ok.js'],
		browsers: ['PhantomJS'],
		frameworks: ['mocha'],
		plugins: [
			'karma-mocha',
			'karma-phantomjs-launcher',
			path.join(__dirname, 'fakeReporter')
		],
		reporters: ['fake', 'progress'],
		singleRun: true
	}

	var FAIL_OPTIONS = _.extend({}, OPTIONS, { files: ['fail.js'] })

	var builder

	beforeEach(function() {
		// Copy files because we change them to trigger autoWatch
		fs.copySync(ORIG_DIR, DIR)
	})

	afterEach(function() {
		if (builder) builder.cleanup()
		fs.removeSync(DIR)
		fakeReporter.spy.reset()
	})

	it('runs tests and exit in singleRun', function() {
		var tree = BroccoliKarma(DIR, OPTIONS)
		builder = new broccoli.Builder(tree)
		return builder.build().
			then(function() {
				var results = fakeReporter.spy.firstCall.args[0].getResults()
				assert.equal(results.success, 1)
			})
	})

	it('fails build when test fails in singleRun', function(done) {
		var tree = BroccoliKarma(DIR, FAIL_OPTIONS)
		builder = new broccoli.Builder(tree)
		builder.build()
			.then(function() {
				done(new Error('Build did not failed'))
			})
			.catch(function(error) {
				assert.equal(error.message, 'Karma exited with error')
				var results = fakeReporter.spy.firstCall.args[0].getResults()
				assert.equal(results.failed, 1)
				done()
			})
	})

	it('runs karma in background without singleRun', function() {
		var options = _.extend({}, OPTIONS, {singleRun: false})
		var tree = BroccoliKarma(DIR, options)
		builder = new broccoli.Builder(tree)
		// 1. build
		return builder.build()
			// 2. wait until tests ran
			.then(function() {
				var deferred = Q.defer()
				fakeReporter.callback = function() { deferred.resolve() }
				return deferred.promise
			})
			.then(function() {
				// 3. test should be run
				var results = fakeReporter.spy.firstCall.args[0].getResults()
				assert.equal(results.success, 1)
				// 4. change file
				fs.appendFileSync(path.join(DIR, 'ok.js'), ';')
				// 5. build again
				return builder.build()
			})
			// 6. wait until tests run again
			.then(function() {
				var deferred = Q.defer()
				fakeReporter.callback = function() { deferred.resolve() }
				return deferred.promise
			})
			// 7. test should be run again
			.then(function() {
				var results = fakeReporter.spy.secondCall.args[0].getResults()
				assert.equal(results.success, 1)
			})
	})

})
