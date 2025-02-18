module({include: 'includes/include.js'}, function(imports) {
    test("calling imported code", function() {
        assert.equal(10, imports.include.ReturnsTen());
    });

    test("explicit name", function() {
    });

    test("foo", function() {
        assert.true(true);
        assert.false(false);
        //assert.true(0);
        //assert.equal(10, "hi");
        //assert.equal('equal', assert.equal.name);
        assert.throws(TypeError, function() {
            throw new TypeError;
        });
        this.foo = 10;
    });

    test("bar", function() {
        assert.equal(undefined, this.foo);
    });

    fixture("Fixture", function() {
        this.setUp(function() {
            this.foo = 10; 
        });
        
        test("foo is big", function() {
            assert.notNull(this.foo);
            assert.equal(10, this.foo);
        });
    });

    fixture("Has a teardown", function() {
        this.tearDown(function() {
        });

        test("tearDown", function() {
        });
    });
});
