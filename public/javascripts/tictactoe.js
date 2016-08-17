/*
 *  Project: TicTacToe.js
 *  Description: Creates a TicTacToe and manages turns and winning
 *  Author: Juan David Diaz  http://juanddd.com
 *  License: MIT license
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window is passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    var // plugin name
        pluginName = "TicTacToe",
    // key using in $.data()
        dataKey = "plugin_" + pluginName;

    var privateMethod = function () {
        // ...
    };

    var Tictactoe = window['Tictactoe'] = window['Tictactoe'] ||  function (element, options) {

        this.element = $(element);

        this.options = {
            foo : 'bar'
            // default options
        }
        this.turn = 'w';

        this.moves = 0;
        /*
         * Initialization
         */

        this.init(options);
    };

    Tictactoe.prototype = {
        // initialize options
        init: function (options) {
            $.extend(this.options, options);

            console.log(this.options);

            this.board = new Array(this.options.size);
            for (var i = 0; i < this.options.size; i++) {
                this.board[i] = new Array(this.options.size);
            }
            /*
             * Update Tictactoe for options
             */
            this.render();
            this.bindEvents();
        },

        publicMethod: function () {
            // ...
        },

        getTurn : function(){
            return this.turn;
        },

        toggleTurn : function(){
            this.turn = this.turn == 'w' ? 'b' : 'w';
        },

        // turn String ( w or b )
        // move Array
        setMove : function(move){
            var button = $('#btn-'+move[0]+move[1]);
            button.addClass('btn-' + this.getTurn());
            button.prop('disabled', true);
            //button.html(turn); // Optional
            this.board[move[0]][move[1]] = this.getTurn();
            this.checkWin();
            this.toggleTurn(); //Affects self game and broadcast.
        },

        checkWin : function(){
            //Check if someone won
        },  

        // Click events
        bindEvents : function(){

            var buttons = $('button',this.element);
            var self = this;
            $.each(buttons, function(index, item){
                $(item).on('click', function(e){
                    if(self.getTurn() == self.options.side){
                        var move = $(this).data('index');
                        self.setMove(move); // Effects my board
                        self.options.newTurn(move); //Broadcast oponent player's board
                    }else{
                        console.log('Its not your turn');
                    }
                });
            });
        },

        render : function(){

            var html = $('<div class="tictactoe"></div>');
            for (var i = 0; i < this.options.size; i++) {
                var row = $('<div class="row"></div>');
                for (var j = 0; j < this.options.size; j++) {
                    var col = $('<div class="col col-' + this.options.size + '"></div>');
                    var button = $('<button id="btn-'+i+j+'" data-index="['+i+','+j+']" class="btn btn-block">+</button>');
                    col.append(button);
                    row.append(col);
                }
                html.append(row);
            }
            this.element.html(html.html());
        }
    };

    /*
     * Tictactoe wrapper, preventing against multiple instantiations and
     * return Tictactoe instance.
     */
    $.fn[pluginName] = function (options) {

        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof Tictactoe) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new Tictactoe(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
    };

}(jQuery, window, document));