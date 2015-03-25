# broccoli-karma-plugin

Plugin for Broccoli that runs tests with [Karma](http://karma-runner.github.io/).

# Install

```
npm install broccoli-karma-plugin
```

# Usage

```js
var broccoliKarma = require('broccoli-karma-plugin')

var runTests = broccoliKarma('inputTree/', {
  files: ['**/*.js'] // Files paths are relative to input tree
  // Here any karma options
})

module.exports = runTests
```

To use plugin with `broccoli serve` you need option `autoWatch: true`
(by default it is true).<br>
Then on first build plugin will start karma server,
and on rebuild file changes will be watched by karma.

To use with `broccoli build` you need to set option `singleRun: true`.<br>
With this option karma starts server, runs tests and exits
(so-called continious integration mode).<br>
Plugin will wait until karma exits, and if some test will fail, task will return an error.

# License

Public domain, see the `LICENCE.md` file.

