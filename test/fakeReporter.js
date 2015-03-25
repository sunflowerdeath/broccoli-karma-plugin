var sinon = require('sinon')

var spy = sinon.spy(function(result) {
	if (exported.callback) exported.callback(result)
})

var FakeReporter = function(baseReporterDecorator) {
  baseReporterDecorator(this)
	this.onRunComplete = spy
}

FakeReporter.$inject = ['baseReporterDecorator']

var exported = {
	'reporter:fake': ['type', FakeReporter],
	spy: spy
}

module.exports = exported
