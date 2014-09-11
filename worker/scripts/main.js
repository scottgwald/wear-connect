//(function(){
    //////////////////////////////////////////////
    /*          Hook up custom elements         */
    //////////////////////////////////////////////
    var globals = this,
        customElementPrototypes = {
            'tools-container': function(){
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                prototype.foo = function(){
                    console.log('called foooo');
                }
                Object.defineProperty(prototype, "bar", {value: 5});
                return { prototype: prototype };
            },
            'tool-element': function(){
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                prototype._type = '';
                Object.defineProperty(prototype, "selected", {
                    set: function(){
                        //debugger;
                    }
                });
                Object.defineProperty(prototype, "type", {
                    set: function(type){
                        //debugger;
                    },
                    get: function(){
                        return this._type;
                    }
                });
                prototype.commonInit = function() {
                    var type = this.getAttribute('type'),
                        composer = document.querySelector('picture-composer');
                    this._type = type;
                    this.addEventListener('click', function(ev){
                        console.log('tool clicked: ' + type);
                        var selected = document.querySelector('tool-element[selected]');
                        if(this != selected) {
                            selected.removeAttribute('selected');
                            this.setAttribute('selected', '');
                        }
                        composer.mode = type;
                    }, false);
                };
                prototype.createdCallback = function() {
                    this.commonInit();
                };
                return { prototype: prototype };
            },
            'picture-composer': function() {
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                prototype._width = 100;
                prototype._height = 100;
                prototype._mode = '';
                prototype._moving = false;
                prototype._offsetX = 0;
                prototype._offsetY = 0;
                prototype._scale = 1;
                Object.defineProperty(prototype, "width", {
                    set: function(val){
                        if(typeof val !== 'number') {
                            throw new Error("Property 'width' must be a Number");
                        }
                        this._width = val;
                        this.setAttribute('width', val);
                        this.style.width = val + 'px';
                    },
                    get: function(){
                        return this._width;
                    }
                });
                Object.defineProperty(prototype, "height", {
                    set: function(val){
                        if(typeof val !== 'number') {
                            throw new Error("Property 'height' must be a Number");
                        }
                        this._height = val;
                        this.setAttribute('height', val);
                        this.style.height = val + 'px';
                    },
                    get: function(){
                        return this._height;
                    }
                });
                Object.defineProperty(prototype, "mode", {
                    set: function(mode){
                        console.log('composer mode set: ' + mode);
                        // if(mode === "pan") {

                        // } else if(mode === "doodle") {

                        // } else if(mode === "text") {

                        // } else if(mode === "audio") {

                        // } else if(mode === "help") {

                        // }
                        this._mode = mode;
                        this.setAttribute('mode', mode);
                    },
                    get: function(){
                        return this._mode;
                    }
                });
                Object.defineProperty(prototype, "moving", {
                    set: function(bool){
                        if(typeof bool !== 'boolean') {
                            throw new Error("Property 'moving' must be a Boolean");
                        }
                        this._moving = bool;
                        this.setAttribute('moving', bool);
                    },
                    get: function(){
                        return this._moving;
                    }
                });
                Object.defineProperty(prototype, "offsetX", {
                    set: function(val){
                        if(typeof val !== 'number') {
                            throw new Error("Property 'offsetX' must be a Number");
                        }
                        this._offsetX = val;
                        this.setAttribute('offset-y', val);
                    },
                    get: function(){
                        return this._offsetX;
                    }
                });
                Object.defineProperty(prototype, "offsetY", {
                    set: function(val){
                        if(typeof val !== 'number') {
                            throw new Error("Property 'offsetY' must be a Number");
                        }
                        this._offsetY = val;
                        this.setAttribute('offset-y', val);
                    },
                    get: function(){
                        return this._offsetY;
                    }
                });
                Object.defineProperty(prototype, "scale", {
                    set: function(val){
                        if(typeof val !== 'number') {
                            throw new Error("Property 'scale' must be a Number");
                        } else if(val > 0) {
                            this._scale = val;
                            this.setAttribute('scale', val);
                        }
                    },
                    get: function(){
                        return this._scale;
                    }
                });



                prototype.reset = function(){
                    this.resetPanZoom();
                    var layers = this.children;
                    for(var i = 0; i < layers.length; i++){
                        var layer = layers[i];
                        if(layer.reset){
                            layer.reset();
                        }
                    }
                };
                prototype.drawLayers = function() {
                    var layers = this.children;
                    for(var i = 0; i < layers.length; i++){
                        var layer = layers[i];
                        if(layer.draw){
                            layer.draw();
                        }
                    }
                };
                prototype.resetPanZoom = function(){
                    this.offsetX = 0;
                    this.offsetY = 0;
                    this.scale = 1;
                }
                prototype.registerEventListener = function(type, fn) {
                    this.addEventListener(type, fn);
                };
                prototype.createdCallback = function(){
                    var tool = document.querySelector('tool-element[selected]');
                    this.mode = tool.type;
                    this.width = parseFloat(this.getAttribute('width')) || this._width;
                    this.height = parseFloat(this.getAttribute('height')) || this._height;
                    if(this.getAttribute('mode'))
                        this.mode = this.getAttribute('mode');
                    if(this.getAttribute('offset-x'))
                        this.offsetX = this.getAttribute('offset-x');
                    if(this.getAttribute('offset-y'))
                        this.offsetY = this.getAttribute('offset-y');
                    if(this.getAttribute('scale'))
                        this.scale = this.getAttribute('scale');
                    
                };


                return { prototype: prototype };
            },
            'composer-image-layer': function(){
                var superClass = HTMLCanvasElement,
                    prototype = Object.create(superClass.prototype);
                Object.defineProperty(prototype, "bar", {value: 100});
                Object.defineProperty(prototype, "src", {
                    set: function(src) {
                        this.image.src = src;
                        this.redraw();
                    }
                });
                prototype.reset = function(){
                    this.image.src = '';
                    this.clear();
                };
                prototype.clear = function(){
                    this.width = this.width;
                };
                prototype.redraw = function(){
                    this.clear();
                    this.draw();
                };
                prototype.draw = function(){
                    var ctx = this.getContext('2d'),
                        composer = document.querySelector('picture-composer');
                    ctx.drawImage(this.image,
                        composer.offsetX, composer.offsetY,
                        this.image.width * composer.scale, this.image.height * composer.scale);
                };


                prototype.checkImageScale = function(){

                }
                prototype.checkImagePosition = function(){
                    var composer = document.querySelector('picture-composer'),
                        relativeWidth = this.image.width * composer.scale,
                        relativeHeight = this.image.height * composer.scale,
                        check = true,
                        margin = 10;

                    if(composer.offsetX + relativeWidth < 0 + margin) {
                        composer.offsetX =  margin - relativeWidth;
                        check = false;
                    }

                    if(composer.offsetY + relativeHeight < 0 + margin) {
                        composer.offsetY = margin - relativeHeight;
                        check = false;
                    }

                    if(composer.offsetX > this.width - margin) {
                        composer.offsetX = this.width - margin;
                        check = false;
                    }
                    
                    if(composer.offsetY > this.height - margin) {
                        composer.offsetY = this.height - margin;
                        check = false;
                    }
                    return check;
                }


                prototype.onComposerMouseDown = function(ev) {
                    var composer = document.querySelector('picture-composer');
                    if(composer.mode === "pan") {
                        composer.moving = true;
                    }
                };
                prototype.onComposerMouseUp = function(ev) {
                    var composer = document.querySelector('picture-composer');
                    if(composer.mode === "pan") {
                        ev.stopPropagation();

                        composer.moving = false;
                    }
                };
                prototype.onComposerMouseMove = function(ev) {
                    var composer = document.querySelector('picture-composer');
                    if(composer.mode === "pan") {
                        ev.stopPropagation();
                        if(composer.moving){
                            //console.log(ev);
                            composer.offsetX += ev.movementX;
                            composer.offsetY+= ev.movementY;

                            this.checkImagePosition();

                            //redrawImage(mainCanvas, img);
                            this.redraw();
                        }
                    }
                };
                prototype.onComposerMouseWheel = function(ev) {
                    var composer = document.querySelector('picture-composer');
                    if(composer.mode === "pan") {
                        var relativeWidth = this.image.width * composer.scale,
                            touchX = ev.layerX - composer.offsetX,
                            percentXOffset = touchX / relativeWidth,

                            relativeHeight = this.image.height * composer.scale,
                            touchY = ev.layerY - composer.offsetY,
                            percentYOffset = touchY / relativeHeight;

                        composer.scale *= ev.wheelDelta > 0 ? 1 + .05 : 1 - 0.05;

                        this.checkImageScale(mainCanvas, img);///////////////

                        console.log('composer.scale =', composer.scale);
                        var newRelativeWidth = this.image.width * composer.scale,
                            dx = (relativeWidth - newRelativeWidth) * percentXOffset,

                            newRelativeHeight = this.image.height * composer.scale,
                            dy = (relativeHeight - newRelativeHeight) * percentYOffset;

                        composer.offsetX += dx;
                        composer.offsetY += dy;

                        this.checkImagePosition();////////////

                        //console.log(composer.scale)
                        //console.log(ev)
                        this.redraw();
                    }
                };

                prototype.createdCallback = function() {
                    var composer = document.querySelector('picture-composer');
                    composer.registerEventListener('mousedown', this.onComposerMouseDown.bind(this));
                    composer.registerEventListener('mousemove', this.onComposerMouseMove.bind(this));
                    composer.registerEventListener('mouseup', this.onComposerMouseUp.bind(this));
                    composer.registerEventListener('mousewheel', this.onComposerMouseWheel.bind(this));

                    // if the cursor is off of the canvas, this allows the user to continue
                    // dragging the image around
                    document.addEventListener('mouseup', this.onComposerMouseUp.bind(this));
                    document.addEventListener('mousemove', this.onComposerMouseMove.bind(this));


                    this.addEventListener('click', function(ev){
                        
                    }, false);
                };
                
                prototype.image = new Image();
                return { prototype: prototype,
                         extends: 'canvas' };
            },
            'pictures-container': defaultPrototypeFunction,
            'picture-element': defaultPrototypeFunction,
            'incoming-images': function(){
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                prototype.addBinaryImage = function(binaryImageData){
                    //console.log(binaryImageData);
                    var dataURL = 'data:image/jpg;base64,' + btoa(binaryImageData),
                        incomingImage = new IncomingImage(),
                        self = this;
                    incomingImage.onload = function(){
                        self.appendChild(incomingImage);
                    };
                    incomingImage.src = dataURL;
                }
                return { prototype: prototype };
            },
            'incoming-image': function(){
                var superClass = HTMLImageElement,
                    prototype = Object.create(superClass.prototype);
                prototype.createdCallback = function() {
                    var composer = document.querySelector('picture-composer'),
                        composerImageLayer = document.querySelector('canvas[is="composer-image-layer"]')
                    this.addEventListener('click', function(ev){
                        composer.reset();
                        composerImageLayer.src = this.src;
                        composerImageLayer.redraw();
                    }, false);
                };
                Object.defineProperty(prototype, "bar", {value: 100});

                
                return { prototype: prototype,
                         extends: 'img' };
            },
            'outgoing-image': function(){
                var superClass = HTMLImageElement,
                    prototype = Object.create(superClass.prototype);
                prototype.createdCallback = function() {
                    this.addEventListener('click', function(ev){
                        // TODO: what happens when you click an outgoing image?
                    }, false);
                };
                Object.defineProperty(prototype, "bar", {value: 100});


                return { prototype: prototype,
                         extends: 'img' };
            }
        };

    function defaultPrototypeFunction() {
        var superClass = HTMLElement,
            prototype = Object.create(superClass.prototype);
        console.log('defaultPrototypeFunction()')
        return { prototype: prototype };
    }

    function tagNameToConstructorName(tag){
        // "x-custom-tag" -> "XCustomTag"
        var elementName = '',
            x = tag.split('-');
        for(var i = 0; i < x.length; i++){
            elementName += x[i].substr(0,1).toUpperCase() + x[i].substr(1);
        }
        return elementName;
    }

    for(key in customElementPrototypes){
        // var cutsomPrototype = customElementPrototypes[key];
        // customElementConstructors[key] =
        //     document.registerElement(key, {
        //         prototype: Object.create(HTMLElement.prototype, cutsomPrototype)
        //     });

        //==========================//

        var customPrototype = customElementPrototypes[key](),
            elementName = tagNameToConstructorName(key);
        globals[elementName] =
            document.registerElement(key, customPrototype);
    }

    //////////////////////////////////////////////
    /*         Helper methods for Events        */
    //////////////////////////////////////////////
    EventTarget.prototype.on = EventTarget.prototype.addEventListener;
    EventTarget.prototype.off = EventTarget.prototype.removeEventListener;

    //////////////////////////////////////////////
    /*             Constant  values             */
    //////////////////////////////////////////////
    var middleContainerPadding = 100
        navDrawWidth = 100,
        canvasTop = 66,
        glassPictureRatio = 79 / 58,
        glassAspectRatio = 640 / 360; // 16/9

    function computeCanvasWidth(){
        //return window.innerWidth - (navDrawWidth * 2) - (middleContainerPadding * 2);
        return 640;
    }
    function resizeCanvasByWidth(canvas, width, ratio, callback){
        canvas.width = width;
        canvas.height = width / (ratio || 1);
        //makeGrid(canvas);

        if(callback){
            callback();
        }
    }
    // TODO: remove this everywhere and handle redrawing the image in a better way
    function _redrawImg(){
        if(img){
            redrawImage(mainCanvas, img);
        }
    }

    (function(){
        //////////////////////////////////////////////
        /*      Check if fullscreen is required     */
        //////////////////////////////////////////////
        function toggleFullScreen() {
            if (!document.fullscreenElement &&    // alternative standard method
                    !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
                if (document.body.requestFullscreen) {
                    document.body.requestFullscreen();
                } else if (document.body.msRequestFullscreen) {
                    document.body.msRequestFullscreen();
                } else if (document.body.mozRequestFullScreen) {
                    document.body.mozRequestFullScreen();
                } else if (document.body.webkitRequestFullscreen) {
                    document.body.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }
        function toggleFullScreenPrompt(element){
            if(element.getAttribute('displayed') === 'true'){
                element.setAttribute('displayed', 'false');
                element.style.display = 'none';
            } else {
                element.setAttribute('displayed', 'true');
                element.style.display = 'block';
            }
        }
        function setFullscreenChangeListeners(fn){
            document.on('webkitfullscreenchange', function(){
                console.log('webkitfullscreenchange');
                fn();
            });
            document.on('mozfullscreenchange', function(){
                console.log('mozfullscreenchange');
                fn();
            });
            document.on('fullscreenchange', function(){
                console.log('fullscreenchange');
                fn();
            });
        }
        function requireFullscreen(){
            var rf = document.querySelector('require-fullscreen');
            rf.addEventListener('click', toggleFullScreen);
            toggleFullScreenPrompt(rf);
            setFullscreenChangeListeners(function(){
                toggleFullScreenPrompt(rf);
            });
        }
        function mobileCheck() {
            
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        if(mobileCheck()){
            console.log('is mobile');
            requireFullscreen();
        }
    }());

    (function(){
        //////////////////////////////////////////////
        /*          Handle resizing window          */
        //////////////////////////////////////////////
        var resizeTimeout;
        function resizeHandler() {
            console.log('resize even called')
            window.clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(function(){
                var width = computeCanvasWidth();
                resizeCanvasByWidth(
                    mainCanvas,
                    width,
                    glassAspectRatio,
                    function(){
                        makeGrid(backgroundCanvas, "#f9f9f9");
                        _redrawImg();
                    });
                resizeCanvasByWidth(
                    backgroundCanvas,
                    width,
                    glassAspectRatio,
                    function(){
                        makeGrid(backgroundCanvas, "#f9f9f9");
                        _redrawImg();
                    });
            }, 300);
        }
        function destructor() {
            window.off('resize', resizeHandler);
        }
        //add listeners
        //window.on('resize', resizeHandler);
    }());

    (function(){
        //////////////////////////////////////////////
        /*     Add functionality to right drawer    */
        //////////////////////////////////////////////
        var rightDrawer = document.querySelector('.right-container');
        var rightContainerToggle = document.querySelector('#rightContainerToggle')
        rightContainerToggle.addEventListener('click', function(ev){
            var state = rightDrawer.getAttribute('state');
            if(state == 'open'){
                rightDrawer.setAttribute('state', 'closed');
            } else {
                rightDrawer.setAttribute('state', 'open');
            }
        },false);
    }());

    var mainCanvas = document.querySelector('#mainCanvas'),
        mainCtx = mainCanvas.getContext('2d'),
        backgroundCanvas = document.querySelector('#backgroundCanvas'),
        backgroundCtx = backgroundCanvas.getContext('2d');

    var midContainer = document.querySelector('#midContainer');


    makeGrid(backgroundCanvas, "#f9f9f9");
    function init(){
        resizeCanvasByWidth(
            mainCanvas, computeCanvasWidth(),
            glassAspectRatio, _redrawImg);
        resizeCanvasByWidth(
            backgroundCanvas, computeCanvasWidth(),
            glassAspectRatio, _redrawImg);
        makeGrid(backgroundCanvas, "#f9f9f9");
    }


    function makeGrid(canvas, color){
        var w = canvas.width,
            h = canvas.height,
            ctx = canvas.getContext('2d');

        for(var x = 0.5; x < w; x+=10){
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for(var y = 0.5; y < h; y+=10){
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.strokeStyle = color || "#000";
        ctx.stroke();
    }

    //init();

    var img = new Image();
    img.onload = function() {
        console.log(this);
        img.posX = 0;
        img.posY = 0;
        img.scale = 1;
        //drawImage(mainCanvas, this);
    };
    img.src = 'images/glass.jpg';

    function clearCanvas(canvas){
        canvas.width = canvas.width;
    }
    function drawImage(canvas, image){
        var ctx = canvas.getContext('2d');
        /**
         *  image.posX,
                 .posY,
                 .scale
            I added all of these properties
         */
        ctx.drawImage(image,
            image.posX, image.posY,
            image.width * image.scale, image.height * image.scale);
    }
    function redrawImage(canvas, image){
        clearCanvas(canvas);
        drawImage(mainCanvas, image);
    }

    function checkImagePosition(canvas, image){
        var relativeWidth = image.width * image.scale,
            relativeHeight = image.height * image.scale,
            check = true,
            margin = 10;

        if(image.posX + relativeWidth < 0 + margin) {
            image.posX =  margin - relativeWidth;
            check = false;
        }

        if(image.posY + relativeHeight < 0 + margin) {
            image.posY = margin - relativeHeight;
            check = false;
        }

        if(image.posX > canvas.width - margin) {
            image.posX = canvas.width - margin;
            check = false;
        }
        
        if(image.posY > canvas.height - margin) {
            image.posY = canvas.height - margin;
            check = false;
        }
        return check;
    }

    function checkImageScale(canvas, image) {
        var relativeWidth = image.width * image.scale,
            relativeHeight = image.height * image.scale,
            check = true;

        if(relativeWidth < canvas.width){
            // TODO: correct image's scale
        }

        return true;
    }



    var movingImage = false;

    function onMouseDown(ev){
        movingImage = true;
    }
    function onMouseMove(ev){
        ev.stopPropagation();
        if(movingImage){
            //console.log(ev);
            img.posX += ev.movementX;
            img.posY += ev.movementY;

            checkImagePosition(mainCanvas, img);

            redrawImage(mainCanvas, img);
        }
    }
    function onMouseUp(ev){
        ev.stopPropagation();
        movingImage = false;
    }
    function onMouseWheel(ev){
        var relativeWidth = img.width * img.scale,
            touchX = ev.layerX - img.posX,
            percentXOffset = touchX / relativeWidth,

            relativeHeight = img.height * img.scale,
            touchY = ev.layerY - img.posY,
            percentYOffset = touchY / relativeHeight;
        
        img.scale *= ev.wheelDelta > 0 ? 1+.05 : 1-0.05;

        checkImageScale(mainCanvas, img);

        console.log('img.scale =', img.scale);
        var newRelativeWidth = img.width * img.scale,
            dx = (relativeWidth - newRelativeWidth) * percentXOffset,

            newRelativeHeight = img.height * img.scale,
            dy = (relativeHeight - newRelativeHeight) * percentYOffset;

        img.posX += dx;
        img.posY += dy;

        checkImagePosition(mainCanvas, img);

        //console.log(img.scale)
        //console.log(ev)
        redrawImage(mainCanvas, img);
    }
    
    // mainCanvas.addEventListener('mousedown', onMouseDown);
    // mainCanvas.addEventListener('mousemove', onMouseMove);
    // mainCanvas.addEventListener('mouseup', onMouseUp);
    // mainCanvas.addEventListener('mousewheel', onMouseWheel);

    // // if the cursor is off of the canvas, this allows the user to continue
    // // dragging the image around
    // document.addEventListener('mouseup', onMouseUp);
    // document.addEventListener('mousemove', onMouseMove);

/*
    public class TouchListHandler {
        Array touches = [];
        public TouchListHandler(){
            this.touches = [];
            this.numTouches = 0;
        }

        public void addTouch(touch){
            this.touches.push(touch);
        }
    }
*/

    /*
     * @name TouchListHandler
     * @description Used to manage multiple touches on a touch enabled device
     *
     * @reference https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events
     */
    function TouchListHandler(){
        this.touches = [];
        this.numTouches = 0;
    }
    TouchListHandler.prototype.addTouch = function(touch){
        for(var i = 0; i < this.touches.length; i++){
            if(this.touches[i] === undefined){
                this.touches[i] = touch;
                this.numTouches++;
                return;
            }
        }
        this.touches.push(touch);
        this.numTouches++;
    };
    TouchListHandler.prototype.getTouchIndexById = function(id){
        for(var i = 0; i < this.touches.length; i++){
            if(this.touches[i] && this.touches[i].identifier === id){
                return i;
            }
        }
        return -1;
    };
    TouchListHandler.prototype.removeTouchById = function(id){
        for(var i = 0; i < this.touches.length; i++){
            if(this.touches[i] && this.touches[i].identifier === id){
                this.touches[i] = undefined;
                this.numTouches--;
            }
        }
    };
    TouchListHandler.prototype.copyTouch = function(touch) {
        return { 
            identifier: touch.identifier,
            pageX: pageXToLocal(touch.pageX), 
            pageY: pageXToLocal(touch.pageY) 
        };
    };
    
    TouchListHandler.prototype.updateTouchFromEventByIndex = function(touch, idx){
        this.touches.splice(idx, 1, touch);
    };
    TouchListHandler.prototype.updateTouchByIndex = function(t, idx){
        // todo: handle converting pageX and pageY to local
        var touch = this.touches[idx];
        touch.pageX = t.pageX;
        touch.pageY = t.pageY;
    };
    TouchListHandler.prototype.updateTouchById = function(id){
        this.updateTouchByIndex(this.getTouchIndexById(id));
    };


    function pageXToLocal(x){
        return x - navDrawWidth - middleContainerPadding;
    }
    function pageYToLocal(y){
        return y - canvasTop;
    }


    var touchList = new TouchListHandler(),
        startX = 0,
        startY = 0;

    function onTouchStart(ev){
        console.log('onTouchStart', 'touch list length: ', ev.changedTouches.length, 'id of 0: ', 
            ev.changedTouches[0].identifier);

        var touches = ev.changedTouches,
            numTouches = touches.length,
            sumX = 0,
            sumY = 0;
            
        for (var i=0; i < touches.length; i++) {
            console.log("touchstart:"+i+"...");
            touchList.addTouch(touchList.copyTouch(touches[i]));
            sumX += pageXToLocal(touches[i].pageX);
            sumY += pageYToLocal(touches[i].pageY);
            console.log("touchstart:"+i+".");
        }
        if(!movingImage){
            startX = (sumX / numTouches) - img.posX;
            startY = (sumY / numTouches) - img.posY;
            movingImage = true;
        }
    }
    function onTouchMove(ev){
        var touches = ev.changedTouches,
            sumX = 0,
            sumY = 0,
            numTouches = touches.length,
            avgX = 0,
            avgY = 0;

        // iterateover each touch point and calculate
        // the average x and y coord.
        for (var i=0; i < touches.length; i++) {
            var idx = touchList.getTouchIndexById(touches[i].identifier);
            if(idx >= 0) {
                // swap in the new touch record
                touchList.updateTouchFromEventByIndex(
                    touchList.copyTouch(touches[i]), idx);
                //touchList.updateTouchByIndex(touches[i], idx);
                sumX += pageXToLocal(touches[i].pageX);
                sumY += pageYToLocal(touches[i].pageY);
            } else {
                console.log("can't figure out which touch to continue");
            }
        }

        avgX = sumX / numTouches;
        avgY = sumY / numTouches;

        // TODO: I don't think I'm suppose to be using the average when I draw
        //       like this. If a new finger is added, the image shouldn't jump
        //       from one position to a new averaged position.
        img.posX = avgX - startX;
        img.posY = avgY - startY;
        redrawImage(mainCanvas, img);

        // if(movingImage){
        //     //console.log(ev);
        //     var dx = ev.x - curX,
        //         dy = ev.y - curY;
        //     img.posX += dx;
        //     img.posY += dy;
        //     redrawImage(img);
        // }
    }
    function onTouchEnd(ev){
        console.log('onTouchEnd');

        var touches = ev.changedTouches;
        //touchList.removeTouchById(ev)
        for (var i=0; i < touches.length; i++) {
            touchList.removeTouchById(touches[i].identifier);
        }
        if(touchList.numTouches === 0){
            movingImage = false;
        }
    }
    function onTouchCancel(){

    }
    function onTouchLeave(){

    }

    mainCanvas.addEventListener('touchstart', onTouchStart);
    mainCanvas.addEventListener('touchmove', onTouchMove);
    mainCanvas.addEventListener('touchend',   onTouchEnd);
    mainCanvas.addEventListener('touchcancel', onTouchCancel);
    mainCanvas.addEventListener('touchleave', onTouchLeave);

    










    //addNewPictureFromDataURL(mainCanvas.toDataURL());

    function addNewPictureFromDataURL(imageData){
        var image = new Image(),
            picture = document.createElement('picture-element'),
            pictures = document.querySelector('pictures-container');
        image.onload = function() {
            picture.appendChild(image);
            prependElement(pictures, picture);
        }
        image.src = imageData;
    }

    function prependElement(parent, child){
        parent.insertBefore(child, parent.insertBefore);
    }







    Date.prototype.today = function() {
    
        return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
    }
    Date.prototype.timeNow = function() {
    
        return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
    }
    Date.prototype.timeNowMilli = function() {
    
        return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds() + "." + padInt(this.getMilliseconds(), 3);
    }
    function padInt(_int, len) {
        paddingNeeded = len - _int.toString().length;
        if (paddingNeeded < 0) {
            return _int;
        } else {
            paddingArr = [];
            for (var k = 0; k < paddingNeeded; k++) {
                paddingArr.push('0');
            }
            return paddingArr.join("") + _int.toString();
        }
    }
    function currentTimeString() {
    
        return new Date().today() + " @ " + new Date().timeNowMilli();
    }




    var configURL = "config.json";

    function getWCEndpoint(callback) {
        console.log('in getWCEndpoint');
        var request = new XMLHttpRequest();
        request.open("GET", configURL, true);
        request.onreadystatechange = function() {
            if (request.readyState != 4 || request.status != 200) return;
            parseEndpoint(request.responseText, callback);
        };
        request.send();
    }

    function parseEndpoint(wcConfigRaw, callback) {
        console.log('in parseEndpoint');
        var wcConfig = {};
        if (typeof wcConfigRaw === "string") {
            wcConfig = JSON.parse(wcConfigRaw);
        } else if (typeof wcConfigRaw === "object") {
            wcConfig = wcConfigRaw
        }
        getEndpoint(wcConfig, callback);
    }

    function getEndpoint(wcConfig, callback) {
        console.log('in getEndpoint', wcConfig);
        if (wcConfig.use_local) {
            callback(wcConfig.wc_ip_address);
        } else {
            // Parse.initialize(wcConfig.applicationId, wcConfig.javaScriptKey);
            // var query = new Parse.Query(wcConfig.className);
            // query.get(wcConfig.objectId, {
            //     success: function(object) {
            //         wc_endpoint = object.attributes[wcConfig.columnName];
            //         callback(wc_endpoint);
            //     },
            //     error: function(object, error) {
            //         console.log("Parse error, sad face.");
            //     }
            // });
        }
    }


    function startWordConnect() {
        console.log('in startWordConnect');
        getWCEndpoint(main);
    }

    //$(document).ready(startWordConnect);

    var incomingImageHandler = undefined;

    function main(wc_endpoint) {
        console.log('in main');

        wearScriptConnection = new WearScriptConnection(
                new ReconnectingWebSocket(wc_endpoint),
                "wc-webapp",
                Math.floor(Math.random() * 100000),
                onopen
            );

        incomingImageHandler = new IncomingImageHandler(wearScriptConnection);

        //console.log(ws)

        function onopen() {
            var ws = wearScriptConnection;
            var incomingImages = document.querySelector('incoming-images');
            console.log("WearScriptConnection onopen");
            ws.subscribe('registered', function(channel, name) {
                console.log('registered as ' + name);
            });
            console.log("%cAbout to subscribe to image channel", "color: green");
            console.log(ws)
            ws.subscribe('image', function(chan, timestamp, image) {
                console.log('%cgot image', "color: green")
                console.log(JSON.stringify({
                    chan: chan,
                    timestamp: timestamp
                }), null, 4);

                //$('img').attr('src', 'data:image/jpg;base64,' + btoa(image));
                //if (!isTagging) {
                    //placePicture('data:image/jpg;base64,' + btoa(image));//, ws, 'image');
                    //console.log('in if (!isTagging)');
                incomingImages.addBinaryImage(image);

                //ws.publish('words',,)

            });
            ws.send('register', 'registered', 'worker:' + currentTimeString());
        }
    };

    function placePicture(imageDataURL, ws, channel) {
        console.log('in placePicture');
        if(ws){
            console.log('unsubscribe', channel)
            ws.unsubscribe(channel);
        }
        var incomingImages = document.querySelector('incoming-images'),
            incomingImage = document.createElement('incoming-image'),
            image = new Image();

        image.onload = function(){
            incomingImage.appendChild(image);
            prependElement(incomingImages, incomingImage);
        }
        image.src = imageDataURL;
    }

    function IncomingImageHandler(incomingImages){
        this.incomingImages = incomingImages | document.querySelector('incoming-images');
        this.images = [];
    }
    IncomingImageHandler.prototype.addImageFromDataURL = function(){

    }


//}());
