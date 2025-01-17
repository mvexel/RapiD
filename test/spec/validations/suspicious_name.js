describe('validations.suspicious_name', function () {
    var context;

    before(function() {
        Rapid.services.nsi = Rapid.serviceNsi;
        Rapid.fileFetcher.cache().nsi_presets = { presets: {} };
        Rapid.fileFetcher.cache().nsi_features = { type: 'FeatureCollection', features: [] };
        Rapid.fileFetcher.cache().nsi_dissolved = { dissolved: {} };
        Rapid.fileFetcher.cache().nsi_replacements = { replacements: {} };

        Rapid.fileFetcher.cache().nsi_trees = {
          trees: {
            brands: {
              mainTag: 'brand:wikidata'
            }
          }
        };
        Rapid.fileFetcher.cache().nsi_data = {
          nsi: {
            'brands/shop/supermarket': {
              properties: {
                path: 'brands/shop/supermarket',
                exclude: {
                  generic: ['^(mini|super)?\\s?(market|mart|mercado)( municipal)?$' ],
                  named: ['^(famiglia cooperativa|семейный)$']
                }
              }
            }
          }
        };
        Rapid.fileFetcher.cache().nsi_generics = {
          genericWords: ['^stores?$']
        };
    });

    after(function() {
        delete Rapid.services.nsi;
    });

    beforeEach(function() {
        context = Rapid.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = Rapid.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = Rapid.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = Rapid.osmNode({id: 'n-3', loc: [5,5]});
        var w = Rapid.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            Rapid.actionAddEntity(n1),
            Rapid.actionAddEntity(n2),
            Rapid.actionAddEntity(n3),
            Rapid.actionAddEntity(w)
        );
    }

    function validate(validator) {
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function(done) {
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores way with no tags', function(done) {
        createWay({});
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with no name', function(done) {
        createWay({ shop: 'supermarket' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with a specific name', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature with a specific name that includes a generic name', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s Store' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('ignores feature matching excludeNamed pattern in name-suggestion-index', function(done) {
        createWay({ shop: 'supermarket', name: 'famiglia cooperativa' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags feature matching a excludeGeneric pattern in name-suggestion-index', function(done) {
        createWay({ shop: 'supermarket', name: 'super mercado' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature matching a global exclude pattern in name-suggestion-index', function(done) {
        createWay({ shop: 'supermarket', name: 'store' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a name that is just a defining tag key', function(done) {
        createWay({ amenity: 'drinking_water', name: 'Amenity' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a name that is just a defining tag value', function(done) {
        createWay({ shop: 'red_bicycle_emporium', name: 'Red Bicycle Emporium' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('generic_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('ignores feature with a non-matching `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lou\'s', 'not:name': 'Lous' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags feature with a matching `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Lous' });
        var validator = Rapid.validationSuspiciousName(context);
        window.setTimeout(function() {   // async, so data will be available
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('not_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags feature with a matching a semicolon-separated `not:name` tag', function(done) {
        createWay({ shop: 'supermarket', name: 'Lous', 'not:name': 'Louis\';Lous;Louis\'s' });
        window.setTimeout(function() {   // async, so data will be available
            var validator = Rapid.validationSuspiciousName(context);
            var issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            var issue = issues[0];
            expect(issue.type).to.eql('suspicious_name');
            expect(issue.subtype).to.eql('not_name');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

});
