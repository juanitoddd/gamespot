var ws_url = 'http://46.101.241.152:3000/';
//var ws_url = 'http://socket:3000/';

$( document ).ready(function() {

    /*
     * When the user is logged in, it's name is loaded in the "data" attribute of the "#loggedUser" element.
     * This name is then passed to the socket connection handshake query
     */
    var username;
    var time_out=300;//5 minutes in seconds
    if($("#loggedUser").length) {
        username = $("#loggedUser").data("user");
    } else {
        username = "Anonymous";
    }

    // socket used for real time games
    var socket = io( ws_url, { query: 'user=' + username });

    //socket used to broadcast live games on tv page
    var tvSocket = io( ws_url + 'tv');

    // socket used to broadcast events to monitoring page
    var monitorSocket = io( ws_url + 'monitor');

    /*
     * Game page
     */
    if ($("#board").length) {

        /*
            Socket.io Events:

                new-move:
                join:
                wait:
                ready:
                resign:
                player-resigned:
                opponent-disconnected:
                full:

         */

        var size = $("#board").data('size');
        var token = $("#board").data('token');
        var side = $("#board").data('side');
        var opponentSide = side === "black" ? "white" : "black";

        var newTurn = function(move) {
            $('.turn').removeClass("fa fa-spinner");
            $('#turn-' + game.getTurn()).addClass("fa fa-spinner");
            $('.list-group-item').removeClass('active');
            $('#player-' + game.getTurn()).addClass("active");
            socket.emit('new-move', {
                token: token,
                turn : game.getTurn(),
                move: move
            });
        };

        var victory = function(turn) {
            var content = side.charAt(0) == turn ? "<h1>Victory, you won!</h1>" : "<h1>Defeat, you lose!</h1>";
            $('#gameResult').html(content);
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
            socket.emit('victory', {
                token: token,
                turn : turn
            });
        };

        /*
         * Initialize a new game
         */

        var cfg = {
            size : size,
            side : side.charAt(0),
            newTurn : newTurn,
            victory : victory
        }

        var game = new Tictactoe('#board', cfg);

        /*
         * Victory for user
         */
        socket.on('victory', function(data){
            var content = side.charAt(0) == data.turn ? "<h1>Victory, you won!</h1>" : "<h1>Defeat, you lose!</h1>";
            $('#gameResult').html(content);
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * A new move has been made by a player => update the UI
         */
        socket.on('new-move', function(data){
            game.setMove(data.move);
            $('.turn').removeClass("fa fa-spinner");
            $('#turn-' + game.getTurn()).addClass("fa fa-spinner");
            $('.list-group-item').removeClass('active');
            $('#player-' + game.getTurn()).addClass("active");
        });

	    /*
         * Timer : displays time taken by each player while making moves
         */
        var timer = function(time_set)
        {
            if(true)
            {
                if(game.getTurn().toString()=='w')
                {
                    time_set[0]+=1;
                    if(time_set[0]>time_out)
                    {
                        //handle time out
                        $('#gameResult').html('TimeOut! Black Won !');
                        $('#gameResultPopup').modal({
                            keyboard: false,
                            backdrop: 'static'
                        });
                        clearInterval(timer_interval);
                    }
                    $("#timew").html(("00" + Math.floor(time_set[0]/60)).slice (-2)+":"+("00" + time_set[0]%60).slice (-2));
                }
                if(game.getTurn().toString()=='b')
                {
                    time_set[1]+=1;
                    if(time_set[1]>time_out)
                    {
                        //handle time out
                        $('#gameResult').html('TimeOut!  White Won !');
                        $('#gameResultPopup').modal({
                            keyboard: false,
                            backdrop: 'static'
                        });
                        clearInterval(timer_interval);
                    }
                    $("#timeb").html(("00" + Math.floor(time_set[1]/60)).slice (-2)+":"+("00" + time_set[1]%60).slice (-2));
                }
            }
            return time_set;
        };

        /*
         * When the game page is loaded, fire a join event to join the game room
         */
        socket.emit('join', {
            'token': token,
            'side': side,
            'size': size
        });

        /*
         * When a new game is created, the game creator should wait for an opponent to join the game
         */
        socket.on('wait', function () {

            var url = ws_url + "game/" + token + "/" + size + "/" + opponentSide;
            $('#gameUrl').html(url);
            $('#gameUrlPopup').modal({ // show modal popup to wait for opponent
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * A second player has joined the game => the game can start
         */
        socket.on('ready', function (data) {
	        //intialize the timer
            var time_sets = [0,0];
            timer_interval = setInterval(function(){ time_sets = timer(time_sets)}, 1000);//repeat every second
            $('#turn-w').addClass("fa fa-spinner");
            $('#player-w').addClass("active");
            $('#player-white').html(side == 'white' ? 'you' : data.white);
            $('#player-black').html(side == 'black' ? 'you' : data.black);
            $('#gameUrlPopup').modal('hide');
        });

        /*
         * A player resigns the game
         */
        $('#resignButton').click(function (ev) {
            ev.preventDefault();
            socket.emit('resign', {
                'token': token,
                'side': side
            });
        });

        /*
         * Notify opponent resignation
         */
        socket.on('player-resigned', function (data) {
            $('#gameResult').html(data.side + ' resigned.');
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * Notify opponent disconnection
         */
        socket.on('opponent-disconnected', function () {
            $('#gameResult').html('Your opponent has been disconnected.');
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * Notify that the game is full => impossible to join the game
         */
        socket.on('full', function () {
            alert("This game has been already joined by another person.");
            window.location = '/';
        });

    }

    /*
     * Monitoring page
     */

    if ($("#monitor").length) {

        var nbUsers, nbGames, totalGames;

        monitorSocket.on('update', function(data) {
            /*
             * load monitoring event data
             */
            nbUsers = data.nbUsers;
            nbGames = data.nbGames;
            totalGames = nbGames; // todo: should be set from data.totalGames;
            $("#nbUsers").html(nbUsers);
            $("#nbGames").html(nbGames);
            $("#totalGames").html(totalGames);

            /*
             * Update the status chart
             */
            var chart = $('#chart').highcharts();
            chart.series[0].addPoint(nbUsers, true, true);
            chart.series[1].addPoint(nbGames, true, true);
        });

        $('#chart').highcharts({
            chart: {
                type: 'spline',
                renderTo: 'container',
                defaultSeriesType: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10
            },
            title: {
                text: ''
            },
            yAxis: {
                title: {
                    text: 'Total'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            legend: {
                enabled: true
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: 'active users',
                data: [0,0,0,0,0,0]
            },{
                name: 'active games',
                data: [0,0,0,0,0,0]
            }]
        });

    }

    /*
     * Search page
     */
    if ($("#searchGameForm")) {
        $( "#searchGameFormSubmit" ).on("click", function( event ) {
            $.ajax({
                type: "POST",
                url: "http://localhost:3000/search",
                data: {
                    white: $( "input[name$='white']" ).val(),
                    black: $( "input[name$='black']" ).val(),
                    content: $( "input[name$='content']" ).val(),
                    result: $( "input[name$='result']" ).val()
                },
                success: function (data){
                    var games = data.games;
                    console.log(games.length);
                    $('#foundGamesTable tbody tr').remove();
                    for (var i = 0; i < games.length; i++) {
                        var game = "<tr>" +
                            "<td>" + games[i]._id + "</td>" +
                            "<td>" + games[i]._source.white + "</td>" +
                            "<td>" + games[i]._source.black + "</td>" +
                            "<td>" + games[i]._source.result + "</td>" +
                            "<td>" + "<a title='Not implemented' href='#'><i class='fa fa-eye'></i> Preview</a>" + "</td>" +
                            "</tr>";
                        $('#foundGamesTable tbody').append(game);
                    }
                    $('#totalFoundGames').html(games.length);
                    $("#searchResult").show();
                },
                error: function() {
                    alert("Error while searching games!");
                }
            });
            event.preventDefault();
        });
    }

    /*
     * Show error message on login failure
     */
    if ($("#loginError").length && !$("#loginError").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: $("#loginError").html(),
            type: 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show error message on registration failure
     */
    if ($("#registerError").length && !$("#registerError").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: $("#registerError").html(),
            type: 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show message on successful logout
     */
    if ($("#logoutSuccess").length && !$("#logoutSuccess").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: $("#logoutSuccess").html(),
            type: 'success',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show welcome message on registration success
     */
    if ($("#registerSuccess").length && !$("#registerSuccess").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: $("#registerSuccess").html(),
            type: 'success',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show welcome message on login success
     */
    if ($("#welcomeMessage").length && !$("#welcomeMessage").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: $("#welcomeMessage").html(),
            type: 'success',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show message on account update success
     */
    if ($("#updateStatus").length && !$("#updateStatus").is(':empty')) {

        var ok = $("#updateStatus").data('ok');
        var message = $("#updateStatus").html();

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-top'
        }).post({
            message: message,
            type: ok ? 'success' : 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }
});

