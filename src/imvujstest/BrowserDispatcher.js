module({
    css: 'css.js',
    DomReporter: 'DomReporter.js',
    LeprechaunReporter: 'LeprechaunReporter.js',
    CompositeReporter: 'CompositeReporter.js'
}, function (imports) {
    return {
        dispatch: function (run_all, superfixtureUrl) {
            imports.css.install();
            $('<div class="test-sandbox"></div>').appendTo(document.body);
            var output = $('<div class="test-output"></div>').appendTo(document.body);

            var reporter = new imports.CompositeReporter([
                new imports.DomReporter({ el: output }),
                new imports.LeprechaunReporter()
            ]);

            window.onerror = reporter.error.bind(reporter);

            var runTest = function () {
                var testUrl = window.location.hash.substr(1);
                module.dynamicImport({
                    test: testUrl,
                    superfixtures: superfixtureUrl
                }, function (imports) {
                    run_all(testUrl, reporter, function onComplete(success) {
                        // What do I do here?
                    });
                });
            };

            runTest();
            window.addEventListener('hashchange', runTest);
        }
    };
});
