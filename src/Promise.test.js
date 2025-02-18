module({
    FakeEventLoop: '../fakes/FakeEventLoop.js'
}, function(imports) {
    var BaseFixture = fixture("promises", function() {
        this.setUp(function() {
            this.eventLoop = new imports.FakeEventLoop();
            this.Promise = new IMVU.PromiseFactory(this.eventLoop);

            this.accepts = [];
            this.rejects = [];

            this.acceptCallback = this.accepts.push.bind(this.accepts);
            this.rejectCallback = this.rejects.push.bind(this.rejects);
        });
    });

    BaseFixture.extend("Promise tests", function() {
        test("accept after then", function() {
            var r;
            (new this.Promise(function(resolver) {
                r = resolver;
            })).then(this.acceptCallback);

            r.accept("hello");
            assert.deepEqual([], this.accepts);
            this.eventLoop._flushTasks();
            assert.deepEqual(["hello"], this.accepts);
        });

        test("then after accept", function() {
            var r;
            var future = new this.Promise(function(resolver) {
                r = resolver;
            });
            r.accept("hello");
            this.eventLoop._flushTasks();
            future.then(this.acceptCallback);
            assert.deepEqual([], this.accepts);

            this.eventLoop._flushTasks();
            assert.deepEqual(["hello"], this.accepts);
        });

        test("reject after then", function() {
            var r;
            (new this.Promise(function(resolver) {
                r = resolver;
            })).then(undefined, this.rejectCallback);

            r.reject("bye");
            assert.deepEqual([], this.rejects);
            this.eventLoop._flushTasks();
            assert.deepEqual(["bye"], this.rejects);
        });

        test("second accept is ignored", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            });
            p.then(this.acceptCallback);
            r.accept("hello");
            r.accept("two");

            this.eventLoop._flushTasks();
            assert.deepEqual(["hello"], this.accepts);
        });

        test("resolve", function() {
            var r;
            new this.Promise(function(resolver) {
                r = resolver;
            }).then(this.acceptCallback);
            r.resolve("hello");
            this.eventLoop._flushTasks();
            assert.deepEqual(['hello'], this.accepts);
        });

        test("resolve given a future", function() {
            var r1;
            var f1 = new this.Promise(function(resolver) {
                r1 = resolver;
            });

            var r2;
            var f2 = new this.Promise(function(resolver) {
                r2 = resolver;
            });

            f1.then(this.acceptCallback);
            r1.resolve(f2);

            this.eventLoop._flushTasks();
            assert.deepEqual([], this.accepts);

            r2.resolve('hello');

            this.eventLoop._flushTasks();
            assert.deepEqual(['hello'], this.accepts);
        });

        test("chaining then", function() {
            var r;
            var f = new this.Promise(function(resolver) {
                r = resolver;
            });

            f.then().then(this.acceptCallback, this.rejectCallback);
            r.accept('hey');

            this.eventLoop._flushTasks();
            assert.deepEqual([], this.rejects);
            assert.deepEqual(['hey'], this.accepts);
        });

        test('null is then-able', function () {
            var r;
            var f = new this.Promise(function(resolver) {
                r = resolver;
            }).then(function () {
                return null;
            }).then(this.acceptCallback, this.rejectCallback);

            r.accept(1);
            this.eventLoop._flushTasks();

            assert.deepEqual([], this.rejects);
            assert.deepEqual([null], this.accepts);
        });

        test("static accept returns accepted Promise", function() {
            var f = this.Promise.accept("hello");
            f.then(this.acceptCallback);
            this.eventLoop._flushTasks();
            assert.deepEqual(['hello'], this.accepts);
        });

        test("then.catch", function() {
            var e = "value";
            var caught;
            this.Promise.accept(e).
                then(function(value) {
                    throw value;
                })
                ['catch'](function(error) {
                    caught = error;
                });
            assert.equal(undefined, caught);
            this.eventLoop._flushTasks();
            assert.equal(e, caught);
        });

        test("Promises do not leak callbacks after being resolved", function() {
            var p = this.Promise.accept();
            var wasCalled = false;
            p['catch'](function(){ wasCalled = true;});
            assert.equal(0, p.rejectCallbacks.length);
            assert.false(wasCalled);
        });

        test("Promise.any empty", function() {
            this.Promise.any([]).then(this.acceptCallback);
            this.eventLoop._flushTasks();
            assert.deepEqual([undefined], this.accepts);
        });

        test("Promise.any: first reject, second accept", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.any([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r1.reject(1);
            r2.accept(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([], this.accepts);
            assert.deepEqual([1], this.rejects);
        });

        test("Promise.any: first accept, second reject", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.any([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r1.accept(1);
            r2.reject(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([1], this.accepts);
            assert.deepEqual([], this.rejects);
        });

        test("Promise.every: rejection passes through", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.every([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r1.reject(1);
            r2.accept(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([], this.accepts);
            assert.deepEqual([1], this.rejects);
        });

        test("Promise.every: completion gives list of results", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.every([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r1.accept(1);
            r2.accept(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([[1, 2]], this.accepts);
            assert.deepEqual([], this.rejects);
        });

        test("Promise.some: one accept returns", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.some([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r2.accept(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([2], this.accepts);
            assert.deepEqual([], this.rejects);
        });

        test("Promise.some: all rejections returns list", function() {
            var r1, r2;
            var p1 = new this.Promise(function(resolver) { r1 = resolver; });
            var p2 = new this.Promise(function(resolver) { r2 = resolver; });
            this.Promise.some([p1, p2]).then(this.acceptCallback, this.rejectCallback);
            r1.reject(1);
            r2.reject(2);

            this.eventLoop._flushTasks();
            assert.deepEqual([], this.accepts);
            assert.deepEqual([[1, 2]], this.rejects);
        });
    });

    BaseFixture.extend("immediate & error extension", function() {
        test("handlers run immediately and errors bubble", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: true,
                exposeErrors: true
            });

            p.then(function(x) {
                throw new SyntaxError('boom');
            });
            assert.throws(SyntaxError, function() {
                r.accept(10);
            });
        });

        test("handlers run immediately and errors bubble even if chained", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: true,
                exposeErrors: true
            });

            p.then().then(function(x) {
                return x;
            }).then(function(x) {
                throw new SyntaxError('boom');
            });
            assert.throws(SyntaxError, function() {
                r.accept(10);
            });
        });

        test("handlers run immediately and errors bubble even if chained with custom returned promise", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: true,
                exposeErrors: true
            });

            p.then(function(x) {
                return new this.Promise(function(resolver) {
                    resolver.accept(10);
                }, {
                    immediateCallbacks: true,
                    exposeErrors: true
                });
            }.bind(this)).then(function(x) {
                throw new SyntaxError();
            });

            assert.throws(SyntaxError, function() {
                r.accept(10);
            });
        });

        test("does not trip reentrancy, even with immediate delivery", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: true,
                exposeErrors: true
            });

            var c = 0;
            var reentrant = false;

            var fxn = function() {
                c++;
                p.then(function() {
                    if (c > 1) {
                        reentrant = true;
                    }
                });
                c=0;
            };

            p.then(fxn);
            p.then(fxn);
            r.accept(1);

            assert.equals(false, reentrant);
        });

        test("reentrantly-structured code will all get called eventually", function() {
            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: true,
                exposeErrors: true
            });

            var c = 0;

            var fxn = function() {
                c++;
                p.then(function() {
                    c++;
                });
            };

            p.then(fxn);
            p.then(fxn);
            r.accept(1);

            assert.equals(4, c);
        });
    });

    fixture("global options fixture", function() {
        this.setUp(function(){
            this.eventLoop = new imports.FakeEventLoop();

            this.accepts = [];
            this.rejects = [];

            this.acceptCallback = this.accepts.push.bind(this.accepts);
            this.rejectCallback = this.rejects.push.bind(this.rejects);

        });

        test('set exposeErrors, but not immediateCallbacks', function() {
            this.Promise = new IMVU.PromiseFactory(this.eventLoop, {exposeErrors: true});

            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            });

            var caught = false;
            p.then(function(x) {
                this.acceptCallback(x);
                throw new SyntaxError('boom');
            }.bind(this))
            ['catch'](function(error) {
                caught = true;
            });
            r.resolve(10);
            assert.throws(SyntaxError, function() {
                this.eventLoop._flushTasks();
            }.bind(this));
            assert.deepEqual([10], this.accepts);

            // flush again to run handlers that may have been queued by errors
            // in the previous eventLoop tick's callbacks.
            this.eventLoop._flushTasks();

            // Even if exposeErrors is true, catch handlers should still have
            // fired.
            assert['true'](caught);
        });

        test('set both exposeErrors and immediateCallbacks', function() {
            this.Promise = new IMVU.PromiseFactory(this.eventLoop, {exposeErrors: true, immediateCallbacks: true});

            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            });

            var caught = false;
            p.then(function(x) {
                this.acceptCallback(x);
                throw new SyntaxError('boom');
            }.bind(this))
            ['catch'](function(error) {
                caught = true;
            });
            assert.throws(SyntaxError, function() {
                r.resolve(10);
            }.bind(this));
            assert.deepEqual([10], this.accepts);

            // Even if exposeErrors is true, catch handlers should still have
            // fired.
            assert['true'](caught);
        });

        test('override exposeErrors', function() {
            this.Promise = new IMVU.PromiseFactory(this.eventLoop, {exposeErrors: true});

            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                exposeErrors: false
            });

            var caught = false;
            p
                .then(function(x) {
                     throw new SyntaxError('boom');
                })
                .then(function(){
                    assert.fail('should not happen');
                })
                ['catch'](function(){
                    caught = true;
                });
            r.accept(10);
            this.eventLoop._flushTasks();
            assert['true'](caught);
        });

        test('set immediateCallbacks, but not exposeErrors', function() {
            this.Promise = new IMVU.PromiseFactory(this.eventLoop, {immediateCallbacks: true});

            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            });
            var caught = false;
            p.then(function(value) {
                this.acceptCallback(value);
                throw new Error('Thunder struck house.');
            }.bind(this))
            ['catch'](function() {
                caught = true;
            });
            r.resolve(10);
            assert.deepEqual([10], this.accepts);

            // Even if immediateCallbacks is true, catch handlers should still
            // have fired.
            assert['true'](caught);
        });

        test('override immediateCallbacks', function() {
            this.Promise = new IMVU.PromiseFactory(this.eventLoop, {immediateCallbacks: true});

            var r;
            var p = new this.Promise(function(resolver) {
                r = resolver;
            }, {
                immediateCallbacks: false
            });
            p.then(this.acceptCallback, this.rejectCallback);

            r.accept(10);
            assert.deepEqual([], this.accepts);
            this.eventLoop._flushTasks();
            assert.deepEqual([10], this.accepts);
        });
    });

});
