(function(){
  var app = angular.module('myapp', ['ionic','ngCordova']);


  app.controller('mainController',function($http,$scope,$stateParams,feed,$ionicPopup,$cordovaSms,$document){
      
      
    $scope.entries = [];
    if(!feed.entries) feed.entries = []; else $scope.entries = feed.entries;
    $scope.index = $stateParams.index;
    $scope.next = 1;
    $scope.link = 'https://www.blogger.com/feeds/419291375100604865/posts/default?alt=json';
    $scope.feed = '';
    $scope.sms = {text: ''};
    $scope.currentColor = window.localStorage['color'] ||  'positive';
    $scope.hadithCache = window.localStorage.getItem('hadithCache') || {};
    $scope.firstTime = window.localStorage.getItem('hadithCache') ? true : false; //for the purpose of saving cache
    $scope.connectionError = false;
    $scope.colors = [
        {
            name: 'Blue',
            type: 'positive'
        },
        {
            name: 'Dark',
            type: 'dark'
        },
        {
            name: 'Red',
            type: 'assertive'
        },
        {
            name: 'Green',
            type: 'balanced'
        },
        {
            name: 'White',
            type: 'stable'
        },
        {
            name: 'Purple',
            type: 'royal'
        },
        {
            name: 'Calm',
            type: 'calm'
        }
    ]
      
    $scope.getHadith = function(){
            if(!$scope.entries[$scope.index]) return;
            //return angular.element($scope.entries[$scope.index].content.$t).text();
            return $scope.entries[$scope.index].content.$t;
      }
    $scope.getTitle = function(){
            if(!$scope.entries[$scope.index]) return;
            return  $scope.entries[$scope.index].title.$t ? String($scope.entries[$scope.index].title.$t).replace(/<[^>]+>/gm, '') : '';
        }


    $scope.loadMore = function(){ 
        $http.get($scope.link)
        .success(function(response){
            $scope.firstTime = false;
            $scope.link = response.feed.link[response.feed.link.length-1].href; //next page link
            if($scope.feed==='') window.localStorage.setItem('hadithCache',JSON.stringify(response.feed));
            $scope.feed  = response.feed;
            angular.forEach(response.feed.entry,function(entry){
                $scope.entries.push(entry);
                feed.entries.push(entry); //feed custome service to share feed among all the controllers.
          });
        $scope.$broadcast('scroll.infiniteScrollComplete');
            
        }).error(function(){
            
            if($scope.firstTime){

                var cache = JSON.parse($scope.hadithCache);
                angular.forEach(cache.entry,function(entry){
                    $scope.entries.push(entry);
                    feed.entries.push(entry); //feed - custome service to share feed among all the controllers.
                });
                $scope.entries.push({title: {$t: 'Connection to the internet failed. Restart your app.'}});
                $scope.firstTime = false;
                $scope.connectionError = true;
            }else
            {
                alert('No network connection found. Please connect to the Internet & then restart the app.');
                //$scope.entries.push({title:{$t: 'ERROR in connection'}});
                ionic.Platform.exitApp();
            }
            
        });
        
    }
    
    $scope.moreDataCanBeLoaded = function(){
        //console.log($scope.feed.link[$scope.feed.link.length-1]);
        if(($scope.feed==='' || $scope.feed.link[$scope.feed.link.length-1].rel==='next') && !($scope.connectionError))
            return true;
        else
            return false;
    }
    
    $scope.changeColor = function(color){
        
        var header = $document.find('ion-header-bar');
        var tabs = $document.find('ion-tabs');
        
        header.removeClass('bar-'+$scope.currentColor);
        header.addClass('bar-'+color);
        
        tabs.removeClass('tabs-'+$scope.currentColor);
        tabs.addClass('tabs-'+color);
        
        $scope.currentColor = color;
        window.localStorage['color'] = color;
        
    }
    
    $scope.changeColor($scope.currentColor);
    
    
    $scope.showSmsPopup = function(){
        var mypopup = $ionicPopup.show({
            templateUrl: 'templates/smspopup.html',
            scope: $scope,
            buttons: [
                {
                    text: 'Abort',
                    onTap: function(){
                        return 'abort'
                    }
                },
                {
                    text: 'Send',
                    onTap: function(){
                        return 'send'
                    }
                }
            ]
        });
        mypopup.then(function(result){
            if(result==='send'){
                document.addEventListener('deviceready',function(){
                    $cordovaSms.send('+923455791810',$scope.sms.text,options)
                    .then(
                        function(){alert('Send Success.'); $scope.sms.text = '';},
                        function(error){alert('Send Failed.');}
                    );
                });
            }else return;
        });
    }
        
  });
    
    app.filter('renderHtml',function($sce){
        return function(text){
            return $sce.trustAsHtml(text);
        }
    });
    
    app.config(function($stateProvider,$urlRouterProvider){
        $urlRouterProvider.otherwise('/tab/list');
        
        $stateProvider
            
        .state('tab',{
            url: '/tab',
            abstract: true,
            templateUrl: 'templates/tab.html'
        })    
            
        .state('tab.list',{
            url: '/list',
            views: {
                'hadith-view': {
                    templateUrl: 'templates/title.html',
                    controller: 'mainController'
                }
            }
        })
        .state('tab.hadith',{
            url: '/hadith/:index',
            views: {
                'hadith-view': {
                    templateUrl: 'templates/hadith.html',
                    controller: 'mainController'
                }
            }
        })
        
        .state('tab.about',{
            url:'/about',
            views: {
                'about-view': {
                    templateUrl: 'templates/about.html',
                    controller: 'mainController'
                }
            }
        })
        
        .state('tab.settings',{
            url: '/settings',
            views: {
                'settings-view': {
                    templateUrl: 'templates/settings.html',
                    controller: 'mainController'
                }
            }
        })
        
    });
    
    
    app.service('feed',function(){
        //don't remove it.
    });


  app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
      
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
      
      
  });
})}());
