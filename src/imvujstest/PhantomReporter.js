/*global console, window */
module({
}, function (imports) {
    return IMVU.BaseClass.extend('PhantomReporter', {
        startSuite: function (url) {
            console.log('Testing ' + url);
        },

        endSuite: function (passed) {
            this._report({
                type: 'all-tests-complete'
            });
        },

        error: function (errorMsg, url, lineNumber) {
            this._report({
                type: 'test-complete',
                success: false,
                stack: 'No stack available',
                name: window.location.hash.substr(1)
            });
        },

        startTest: function (test) {
            console.log('Test: ' + test.displayName + ' ...');
        },

        endTest: function (test, passed, stack, exception) {
            if (!passed) {
                console.log(test.name + ' has FAILED');
                console.log(stack);
                console.log(exception);
            }
            this._report({
                type: 'test-complete',
                success: passed,
                name: test.name,
                stack: stack
            });
        },

        _report: function (msg) {
            if (window.hasOwnProperty('callPhantom')) {
                window.callPhantom(msg);
            }
        },

        skipTest: function(){}
    });
});
