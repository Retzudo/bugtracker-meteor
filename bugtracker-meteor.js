var Reports = new Mongo.Collection('reports');

if (Meteor.isClient) {
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    angular.module('BugReportApp', ['angular-meteor', 'ui.router']);

    angular.module('BugReportApp').config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/');

            $stateProvider
                .state('index', {
                    url: '/',
                    templateUrl: 'partials/list.ng.html',
                    controller: 'ReportsListController'
                })
                .state('new', {
                    url: '/new',
                    templateUrl: 'partials/new.ng.html',
                    controller: 'NewReportController'
                })
                .state('view', {
                    url: '/bug/:number',
                    templateUrl: 'partials/view.ng.html',
                    controller: 'ViewReportController'
                })
            ;
        }
    ]);

    angular.module('BugReportApp').controller('ReportsListController', ['$scope', '$meteor',
        function ($scope, $meteor) {
            $scope.reports = $meteor.collection(function() {
                return Reports.find({status: {$ne: 'closed'}});
            });

            $scope.closedReports = $meteor.collection(function() {
                return Reports.find({status: 'closed'});
            });
        }
    ]);

    angular.module('BugReportApp').controller('ViewReportController', ['$scope', '$meteor', '$stateParams', '$state',
        function ($scope, $meteor, $stateParams, $state) {
            $scope.report = $meteor.object(Reports, {number: $stateParams.number});
            $scope.references = $meteor.collection(function () {
                return Reports.find({number: {$in: $scope.report.references || []}});
            });

            $scope.edit = false;

            $scope.delete = function () {
                if (confirm('Are you sure?')) {
                    $meteor.call('deleteReport', $scope.report._id)
                        .then(function () {
                            $state.go('index');
                        });
                }
            };

            $scope.close = function () {
                $meteor.call('closeReport', $scope.report._id);
            };

            $scope.open = function () {
                $meteor.call('openReport', $scope.report._id);
            };
        }
    ]);

    angular.module('BugReportApp').controller('NewReportController', ['$scope', '$meteor', '$state',
        function ($scope, $meteor, $state) {
            if (!Meteor.userId()) {
                $state.go('index');
            }

            $scope.create = function () {
                $meteor.call('createReport', $scope.title, $scope.description)
                    .then(function () {
                        $state.go('index');
                    });
            };
        }
    ]);
}

if (Meteor.isServer) {
    Meteor.startup(function () {

    });
}

Meteor.methods({
    createReport: function (title, description) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        var nextNumber;
        var lastReport = Reports.findOne({}, {sort: {number: -1}});

        if (lastReport) {
            nextNumber = '' + (parseInt(lastReport.number) + 1);
        } else {
            nextNumber = '1';
        }

        Reports.insert({
            number: nextNumber,
            title: title,
            description: description,
            reporter: Meteor.userId(),
            username: Meteor.user().username,
            reportedOn: new Date(),
            status: 'open',
            references: []
        });
    },

    deleteReport: function (id) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Reports.remove({_id: id});
    },

    closeReport: function(id) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Reports.update({_id: id}, {
            $set: {
                status: 'closed'
            }
        });
    },

    openReport: function(id) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Reports.update({_id: id}, {
            $set: {
                status: 'open'
            }
        });
    }
});
