
verify = require '../bin/verify'
uglify = require 'uglify-js'

parse = uglify.parser.parse

reject = (code) ->
    errors = verify.check parse code
    assert.notEqual 0, errors.length

accept = (code) ->
    errors = verify.check parse code
    if errors.length > 0
        console.error(errors)
    assert.equal 0, errors.length

test 'empty function', ->
    accept 'function foo() { }'

test 'simple', ->
    reject 'blah = 9;'
    accept 'var blah; blah = 9;'

test 'dot', ->
    reject 'window.XMLHttpResponse = thing;'
    accept 'var blah; blah.property = thing;'

test 'bracket', ->
    reject 'window["XMLHttpResponse"] = thing;'
    accept 'var foo; foo["bar"] = thing;'

test 'complicated', ->
    reject 'window.thing["foobar"].that = this;'

test 'closures', ->
    accept 'var foo; function f() { foo = 9; }'
    accept 'function f() { var foo; foo = 9; }'
    reject 'function f() { var foo; } foo = 9;'

test 'arguments', ->
    accept 'function f(x) { x = 0; }'
    reject 'function f(x) { } x = 9;'

test 'recursion', ->
    accept 'function f(x) { function g(y) { x = y; } }'
    reject 'function f() { function g(x) { } } x = 9;'

test 'reports multiple errors in a single run', ->
    errors = parse 'a = b; c = d;'
    assert.equal 2, errors.length
