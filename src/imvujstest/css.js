module({}, function (imports) {
    return {
        install: function () {
            // This is the worst
            var css = '.test-sandbox { position: absolute; top: 0; right: 50%; bottom: 0; left: 0; overflow: auto; padding: 0; margin: 0; } .test-output { position: absolute; top: 0; right: 0; bottom: 0; left: 50%; box-sizing: border-box; overflow: auto; border-left: 2px black inset; background-color: gray; color: white; padding: 0; margin: 0; } .test-output .status { background-color: white; font-weight: bold; color: yellow; height: 20px; } .test-output.pass { border-top-color: green; } .test-output.pass .status { color: green; } .test-output.fail { border-top-color: red; } .test-output.fail .status { color: red; } .test-output ul  { position: absolute; top: 20px; right: 0; bottom: 0; left: 0; overflow: auto; margin: 0; padding: 0; } .test-output li { font-family: sans-serif; padding: 0; margin: 0; list-style-type: none; } .test-output li.log:hover { background-color: #909080 !important; /* override .PASS and .FAIL */ } .test-output li.log.PASS { color: #004000; background-color: #809080; } .test-output li.log.FAIL { color: #400000; background-color: #908080; } .log .verdict { width: 50px; display: inline-block;}  a { color: #0D0DAF; text-decoration: none; }';
            var style = document.createElement('style');
            style.innerHTML = css;
            style.type = 'text/css';
            document.head.appendChild(style);
        }
    };
});
