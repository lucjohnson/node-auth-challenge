'use strict';

angular.module('Authentication', [])
    .constant('userapi', '/api/v1')
    // this controller specifies all of the functions invoked by forms
    .controller('FormController', function($scope, $http, $window, userapi) {
        
        // used to sign an existing local user in
        $scope.signin = function(user) {
            $scope.loading = true;
            $http.post(userapi + '/signin', user)
                .success(function(response) {
                    $window.location.href = '/profile.html';
                })
                .error(function(err) {
                    if(err.status === 401) {
                        $scope.signInAlert = 'Invalid email/password combination';
                    }
                })
                .finally(function() {
                    $scope.loading = false;
                })
        }
        
        // used to sign up a brand new user
        $scope.signup = function(user) {
            if(user.upPassword !== user.upPasswordConf) {
                $scope.signUpAlert = 'Passwords do not match!';
            } else {
                $scope.loading = true;
                $http.post(userapi + '/signup', user)
                    .success(function(response) {
                        $window.location.href = '/profile.html';
                    })
                    .error(function(err) {
                        if(err.status === 401) {
                            $scope.signUpAlert = 'This email is already being used';
                        }
                    })
                    .finally(function() {
                        $scope.loading = false;
                    })
            }
        }    
        
        // allows user to change their display name
        $scope.changeDisplayName = function(user) {
            $http.put(userapi + '/editDisplayName', user)
                .success(function(data){
                    $window.location.reload();
                })
        }
        
        // allows user to change their password, as long as they provide their current password
        $scope.changePassword = function(user) {
            $http.put(userapi + '/editPassword', user)
                .then(function(response) {
                    if(response.data.status === "failed") {
                        $scope.passwordAlert = response.data.message;
                    } else {
                        $scope.passwordAlert = 'Password has been updated!';
                        $window.location.reload();
                    }
                })
        }  
    })
    
    // this controller is a more general one, used to get a signed in user's profile data
    .controller('AuthController', function($scope, $http, userapi) {
        $http.get(userapi + '/profile')
            .success(function(data) {
                $scope.fullUser = data;
                if(data.signUpMethod == 'fb') {
                    $scope.user = data.facebook;
                } else {
                    $scope.user = data.local;
                }
            })     
    });