var fs = require('fs')
var path = require('path')

var Q = require('q')
var karma = require('karma')
var rimraf = require('rimraf')
var quickTemp = require('quick-temp')
var symlinkOrCopySync = require('symlink-or-copy').sync


var Tree = function(inputTree, options) {
	if (!(this instanceof Tree)) return new Tree(inputTree, options)

	this.inputTree = inputTree
	quickTemp.makeOrRemake(this, 'karmaDir')
	this.options = options
	this.options.basePath = this.karmaDir
}

Tree.prototype.description = 'Karma'

var copyDirContent = function(srcDir, destDir) {
	var items = fs.readdirSync(srcDir)
	for (var i in items) {
		var item = items[i]
		var src = path.join(srcDir, item)
		var dest = path.join(destDir, item)
		symlinkOrCopySync(src, dest)
	}
}

Tree.prototype.read = function(readTree) {
	var _this = this
	return readTree(this.inputTree)
		.then(function(inputDir) {
			// We always copy files to the karmaDir to trigger karma autoWatch
			rimraf.sync(_this.karmaDir + '/*')
			copyDirContent(inputDir, _this.karmaDir)
			return _this.runKarma(_this.options)
		})
		.then(function() { return _this.karmaDir })
}

Tree.prototype.runKarma = function(options) {
	if (options.singleRun) {
		// Start server and wait until it exits.
		// When tests fail, build will fail too.
		var deferred = Q.defer()
		karma.server.start(options, function(exitCode) {
			if (exitCode !== 0) {
				deferred.reject(new Error('Karma exited with error'))
			} else {
				deferred.resolve()
			}
		})
		return deferred.promise
	} else {
		// Start server once and do not block - usable with 'broccoli serve'
		if (!this.server) {
			karma.server.start(options, function(){})
			this.server = true
		}
	}
}

Tree.prototype.cleanup = function() {}


module.exports = Tree
