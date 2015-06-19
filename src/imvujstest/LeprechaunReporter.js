module({
    Reporter: 'Reporter.js'
}, function (imports) {
    return imports.Reporter.extend('LeprechaunReporter', {
        _report: function (msg) {
            window.postMessage(JSON.stringify(msg), "*");
        }
    });
});
