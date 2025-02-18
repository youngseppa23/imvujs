module({}, function(imports) {
    var uglify = require('uglify-js');
    var path = require('path');
    var combine = require('../bin/combine.js');
    var fs = require('fs');

    var expected = [
        'module({}, function($module$deferred) {',
        '    var $module$1 = function(imports) {',
        '        var $module$exports;',
        '        function define(a, b) {',
        '            $module$exports = b();',
        '        }',
        '        define.amd = true;',
        '        function foo() {}',
        '        function bar() {}',
        '        define([], function() {',
        '            return {',
        '                foo: foo,',
        '                bar: bar',
        '            };',
        '        });',
        '        return $module$exports;',
        '    }({});',
        '    var $module$2 = function(imports) {',
        '        return a_export_table;',
        '    }({',
        '        e: $module$1',
        '    });',
        '    var $module$3 = function(imports) {',
        '        return b_export_table;',
        '    }({',
        '        a: $module$2',
        '    });',
        '    var $module$4 = function(imports) {',
        '        return c_export_table;',
        '    }({',
        '        a: $module$2',
        '    });',
        '    var imports = {',
        '        b: $module$3,',
        '        c: $module$4',
        '    };',
        '    return d_export_table;',
        '});'
    ].join('\n');
    function sorted(ls) {
        var rv = ls.slice(0);
        rv.sort();
        return rv;
    }

    fixture('functional', function() {
        this.setUp(function() {
            this.cwd = process.cwd();
            process.chdir(path.dirname(__filename));
        });

        this.tearDown(function() {
            process.chdir(this.cwd);
        });

        test('basic functionality', function() {
            var q = combine.combine(combine.readModules('combine/d.js'), 'combine/d.js');
            assert.equal(expected, combine.gen_code(q, {
                beautify: true
            }));
        });

        test('expected is equal to combined in filesystem', function () {
            // if we had a fake filesystem, we wouldn't need this sillyness
            var fsData = fs.readFileSync('combine/combined.js', 'utf-8');
            assert.equal(expected + '\n', fsData);
        });

        test('combined module can be combined', function () {
            var q = combine.combine(combine.readModules('combine/needs_combined.js'), 'combine/needs_combined.js');
            // if we had a fake filesystem, we wouldn't need this sillyness
            var expected = fs.readFileSync('combine/needs_combined_combined.js', 'utf-8');
            var actual = combine.gen_code(q, {
                beautify: true
            });
            assert.equal(expected,  actual + '\n');
        });

        test('combine produces error if any modules are missing', function() {
            var exc = assert.throws(combine.ScriptError, function() {
                combine.combine(combine.readModules('combine/has-missing.js'), 'combine/has-missing.js');
            });
            assert.equal("ES5: Module '" + path.normalize('combine/missing.js') + "' is missing, referred to by: combine/has-missing.js", exc.message);
        });

        test('readModules returns module dependencies', function() {
            var _ref = combine.readModules(path.normalize('combine/d.js'));
            var modules = _ref.resolved;
            var missing = _ref.missing;
            assert.deepEqual({}, missing);
            assert.deepEqual(["combine/a.js", "combine/c.js", "combine/d.js", "combine/e.js", "combine/subdir/b.js"].map(path.normalize), sorted(Object.keys(modules)));
        });

        test('readModules: root can be missing', function() {
            var _ref = combine.readModules('combine/missing.js');
            var modules = _ref.resolved;
            var missing = _ref.missing;
            assert.deepEqual({
                'combine/missing.js': {
                    '<root>': true
                }
            }, missing);
        });

        test('readModules: can refer to missing modules', function() {
            var missing_js = path.normalize('combine/missing.js');
            var has_missing_js = path.normalize('combine/has-missing.js');
            var _ref = combine.readModules(has_missing_js);
            var modules = _ref.resolved;
            var missing = _ref.missing;
            expected = {};
            expected[missing_js] = {};
            expected[missing_js][has_missing_js] = true;
            assert.deepEqual(expected, missing);
            assert.deepEqual([has_missing_js, missing_js], sorted(Object.keys(modules)));
        });
    });

    test('invalid source produces an error message', function() {
        var ast, e;
        ast = uglify.parse('module({}, function(imports) { }());');
        e = assert.throws(Error, combine.readModule.bind(null, 'blarp', ast));
        assert.equal('ES5: Bad module body', e.message);
    });

    test('invalid dependency list produces an error message', function() {
        var ast, e;
        ast = uglify.parse('module(["a", "b.js"], function(imports) { });');
        e = assert.throws(Error, combine.readModule.bind(null, 'blarp', ast));
        assert.equal('ES5: Bad deps', e.message);
    });

    test('missing return statement produces an error message', function() {
        var ast;
        ast = uglify.parse('module({}, function(imports) { function oh_no_i_have_forgotten_to() { return; } });');
        assert.throws(combine.ScriptError, combine.combine.bind(null, combine.readModules('combine/noreturn.js'), 'combine/noreturn.js'));
    });

    fixture('deferred alias combining and custom loaders', function () {
        this.setUp(function() {
            this.cwd = process.cwd();
            process.chdir(path.dirname(__filename));
        });

        this.tearDown(function() {
            process.chdir(this.cwd);
        });

        this.expectCombine = function (expected, toCombine) {
            var q = combine.combine(combine.readModules(toCombine), toCombine);
            // if we had a fake filesystem, we wouldn't need this sillyness
            var expected = fs.readFileSync(expected, 'utf-8');
            var actual = combine.gen_code(q, {
                beautify: true
            });
            assert.equal(expected,  actual + '\n');
        };
        test('simple', function () {
            this.expectCombine('combine/deferred-alias/simple.combined.js', 'combine/deferred-alias/simple.js');
        });
        test('simple_deep', function () {
            this.expectCombine('combine/deferred-alias/simple_deep.combined.js', 'combine/deferred-alias/simple_deep.js');
        });
        test('simple_double', function () {
            this.expectCombine('combine/deferred-alias/simple_double.combined.js', 'combine/deferred-alias/simple_double.js');
        });
        test('double_double', function () {
            this.expectCombine('combine/deferred-alias/double_double.combined.js', 'combine/deferred-alias/double_double.js');
        });
        test('custom action simple', function () {
            this.expectCombine('combine/custom-loaders/simple.combined.js', 'combine/custom-loaders/simple.js');
        });
        test('custom action two references to the same', function () {
            this.expectCombine('combine/custom-loaders/simple_double.combined.js', 'combine/custom-loaders/simple_double.js');
        });
        test('custom action updates relative paths', function () {
            this.expectCombine('combine/custom-loaders/relative.combined.js', 'combine/custom-loaders/relative.js');
        });
    });
});
