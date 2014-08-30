/**
 * Pew.js 
 * 
 * Lightweight canvas framework experiment for games and animations
 *
 * @version   2014-07-30
 * @copyright François Lajoie 
 * @license   MIT
 *
 * 
 * Bundled with AnimationFrame.js
 * @copyright 2013 Oleg Slobodskoi - https://github.com/kof/animationFrame
 */
var Pew = (function(){

    "use strict";

    // current project instance
    var project_obj;
  
    /**
     * Auto increment z-index value
     */
    var zi = (function() {
        var i = 0;
        return {
            get: function(){
                return ++i;
            }
        }
    })();

    /**
     * Auto increment unique id
     */
    var uid = (function() {
        var i = 1000;
        return {
            get: function(){
                return ++i;
            }
        }
    })();

    /**
     * Project object
     */
    function Project(conf) {

        // settings
        var def_settings = {

            title     : "GameTitle",
            fps       : 60,
            resources : [],
            vars      : {},
        };

        // merge default setting with current game settings
        this.conf  = Pew.utils.extend({}, def_settings, conf);

        // scenes / layers and animation frame
        this.scenes = {};
        this.layers = {};
        this.animationFrame = new AnimationFrame(this.conf.fps);

        return this;
    }
    
    /**
     * Create a new layer canvas
     * 
     * @param  string name Layer name. ex: bg, fg, background, topmenu, etc...
     * @param  object opts Options @see GameLayer
     */
    Project.prototype.createLayer = function(name, opts) {

        var def = new Layer(opts);
        this.layers[name] = def;
        return def;
    };

    /**
     * Project animation start loop
     */
    Project.prototype.start = function(name){

        var scene = this.scenes[name].fn;

        if(scene.init)
            scene.init();

        scene.draw();
    };

    Project.prototype.pause = function(name) {

        this.scenes[name].fn.cancelAnim();
        //this.animationFrame.cancel(this.scenes[name].fn._fid);
    }

    /**
     * Create a new scene
     * 
     * @param  string  name 
     * @param  function fn   
     * @return object        
     */
    Project.prototype.createScene = function(name, fn) {

        this.scenes[name] = new Scene(name, fn);
        return this.scenes[name];
    };


     /**
     * Project Canvas Layer
     * 
     * @param object opts layer options
     */
    function Layer(opts) {
        var o = opts || {};

        this.full   = o.full || true;
        this.autoresize = o.autoresize || true,
        this.width  = o.width || "480";
        this.height = o.height || "320";
        this.canvas = o.canvas || null;
        this.ctx    = o.ctx || null;

        this.init();

        return this;
    }

    /**
     * Create canvas
     */
    Layer.prototype.init = function() {

        if(this.canvas == null) {
            this.canvas = document.createElement("canvas");
            this.ctx    = this.canvas.getContext('2d');

            //append canvas to DOM
            document.body.appendChild(this.canvas);
        }

        //default style
        this.canvas.style.display = "block";
        this.canvas.style.position = "absolute";
        this.canvas.style.zIndex = zi.get();

        // set w/h
        if(this.full) this.fullscreen();
        else {
            this.canvas.width  = this.width;
            this.canvas.height = this.height;
        }

        // bind this.fullscreen on window.onresize if autoresize = true
        if(this.autoresize) {
            var self = this;
            window.onresize = window.onresize || function() {
                for(var i in Pew.game().layers) {
                    if(Pew.game().layers[i].autoresize) {
                        Pew.game().layers[i].fullscreen();
                    }
                }
            }
        }
    }

    /**
     * Fullscreen
     */
    Layer.prototype.fullscreen = function() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width  = this.canvas.width;
        this.height = this.canvas.height;
        
    }

    /**
     * Context clearRect()
     * 
     * @param  int x  
     * @param  int y  
     * @param  int x2 
     * @param  int y2 
     */
    Layer.prototype.clear = function(x,y,x2,y2) {
        var x = x || 0,
            y = y || 0,
            x2 = x2 || this.canvas.width,
            y2 = y2 || this.canvas.height;

        this.ctx.clearRect(x,y,x2,y2); 
    };


    /**
     * Project scene object
     * 
     * @param string   name 
     * @param function fn   
     */
    function Scene(name, fn) {

        this.fn = fn || (function(){});

        (function(){ 

            this._name   = name,   //scene name
            this._fid    = 0,      //frame id
            this._status = 'idle', //animation status : "idle" or "playing"

            this.is = function(status) {
                return (this._status === status) ? true : false;
            };

            this.requestAnim = function(callback) {
                var callback = callback || this.draw;
                this._fid    = Pew.project().animationFrame.request(callback);
                this._status = 'playing';
            };

            this.cancelAnim = function() {
                Pew.project().animationFrame.cancel(this._fid);
                this._status = 'idle';
            };

        }).apply( this.fn );

        return this;
    }

    /**
     * Public pew method
     */
    return {

        //reference to priv func Project() so we can extends it outside
        //like this: Pew.Project.prototype.myFunc = function(){...}
        Project: Project, 
        Scene:   Scene, 
        Layer:   Layer, 

        //current project object instance stored in Pew
        project: function() {
            return project_obj;
        },

        //create a new Project() object
        createProject: function(settings) {
            project_obj = new Project(settings);
            return project_obj;
        },
    }
})(); 