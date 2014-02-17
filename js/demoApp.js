/*
* -> Test Localstorage
* */

// Feature detect + local reference
var storage = (function() {
  var uid = new Date,
      storage,
      result;
  try {
    (storage = window.sessionStorage).setItem(uid, uid);
    result = storage.getItem(uid) == uid;
    storage.removeItem(uid);
    return result && storage;
  } catch(e) {}
}());


// Object Size
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


// init Angular as Module with no dependencies
var demoApp = angular.module('demoApp', ['uiPagination', 'ngAnimate']);

// Add Controller to the demoApp
demoApp.controller('filtering', [ '$rootScope', '$scope', '$log', '$http', function( $rootScope, $scope, $log, $http ){

    /*
     Movie Top 300 Austria: https://itunes.apple.com/at/rss/topmovies/limit=300/json
     Apps Top (Free) 300 Austria: https://itunes.apple.com/at/rss/toppaidapplications/limit=300/json
     */

    $scope.pagelimit = 10;
    $scope.pageLength = 0;
    $scope.currentPage = 1;
    $scope.startPage = 0;
    $scope.maxSize = 5;
    $scope.trailerId = window.location.href;

    var jsonLinks = {
        movie: 'https://itunes.apple.com/at/rss/topmovies/limit=400/json',
        freeApps: 'https://itunes.apple.com/at/rss/toppaidapplications/limit=400/json'
    };

    if( storage ){
        var dataInStorage = JSON.parse( storage.getItem('movies') );

        if( dataInStorage ){
            var nextUpdate = new Date();
            nextUpdate = nextUpdate.setDate( (new Date(Date.parse(dataInStorage.feed.updated.label))).getDate()+1 );

            if( nextUpdate < (new Date()).getTime() ){
                // Load a new Version
                loadFileFromServer( jsonLinks.movie );
            }else{
                // Use the LocalStorage Version
                $scope.appData = dataInStorage.feed.entry;
            }
        }else{
            loadFileFromServer( jsonLinks.movie );
        }

    }






	// Inline Filter
    $scope.category = function( _obj ){
	    if( $scope.search.cat.length >= 1 ){
	        if( $scope.search.cat.action == _obj.category.attributes['im:id'] ){
				return true;
	        }
		    return false;
	    }else{
		    return true;
	    }
    };

    $scope.$watch('currentPage', function(){
        if ($scope.appData) {
            $scope.pageLength = Math.ceil($scope.appData.length / $scope.pagelimit);
            if( $scope.currentPage == 1 ){
                $scope.startPage = 0;
            }else{
                $scope.startPage = ($scope.currentPage - 1) * $scope.pagelimit;
            }
        }
    });

    $scope.$watch('movies', function () {
        if ($scope.movies) {
            if( $scope.movies.length ){
                $scope.pageLength = Math.floor($scope.movies.length / $scope.pagelimit);
            }else{
                $scope.pageLength = Math.floor(0 / $scope.pagelimit);
            }
        }
    }, true);


    $scope.$on('recalculatePages', function(){
        if ($scope.data) {
            if( $scope.data.length ){
                $scope.pageLength = Math.floor($scope.data.length / $scope.pagelimit);
            }else{
                $scope.pageLength = Math.floor(0 / $scope.pagelimit);
            }
        }
    });


    // Load File From Server (iTunes)
    function loadFileFromServer( _link ){
        $http({ method: 'GET', url: _link })
            .success(function( _data, _status ){
                if( storage ){
                    storage.setItem('movies', JSON.stringify(_data) );
                }
                $scope.appData = _data.feed.entry;
                if( $scope.appData.length ){
                    $scope.pageLength = Math.floor($scope.appData.length / $scope.pagelimit);
                }else{
                    $scope.pageLength = Math.floor(0 / $scope.pagelimit);
                }
            })
            .error(function( _data, _status ){
                $log.debug( _data, _status );
            });
    }

    $scope.searchOverAll = function(){
        $http({ method: 'GET', url: 'https://itunes.apple.com/search?media=movie&term=' + $scope.globalkeyword })
            .success(function( _data, _status ){
               console.log(_data);
            })
            .error(function( _data, _status ){
                $log.debug( _data, _status );
            });
    };


    $scope.searchMovie = function ( input ){
        if( $scope.search ){
            var hasKeyword = false;
            if( $scope.keyword ){
                var regName = new RegExp( $scope.keyword, 'i');
                if( input['im:name'].label.match( regName ) ){
                    hasKeyword = true;
                }else if( input.summary.label.match( regName ) ){
                    hasKeyword = true
                }else if( input['im:artist'].label.match( regName ) ){
                    hasKeyword = true;
                }
            }else{
                delete $scope.keyword;
            }
            if( $scope.keyword ){
                if( hasKeyword ){
                    return true;
                }else{
                    return false;
                }
            }else{
                return true;
            }
        }else{
            return true;
        }
    };

    $scope.category = function( input ){
        var available = false;
        if( $scope.search ){
            if( $scope.search.action ){
                if( input.category.attributes['im:id'] == '4401' ){
                    available = true;
                }
            }else{
                delete $scope.search.action
            }

            if( $scope.search.comedy ){
                if( input.category.attributes['im:id'] == '4404' ){
                    available = true;
                }
            }else{
                delete $scope.search.comedy
            }

            if( $scope.search.drama ){
                if( input.category.attributes['im:id'] == '4406' ){
                    available = true;
                }
            }else{
                delete $scope.search.drama
            }

            if( $scope.search.horror ){
                if( input.category.attributes['im:id'] == '4408' ){
                    available = true;
                }
            }else{
                delete $scope.search.horror
            }

            if( $scope.search.sports ){
                if( input.category.attributes['im:id'] == '4417' ){
                    available = true;
                }
            }else{
                delete $scope.search.sports
            }


            if( available ){
                return true;
            }else{
                if( Object.size( $scope.search ) == 0 ){
                    return true;
                }
                return false;
            }
        }else{
            return true;
        }

    };

}])

.filter('startFrom', function() {

    return function(input, idx) {
        if( typeof input != 'undefined'){
            idx = +idx; //parse to int
            return input.slice(idx);
        }
    };
});
