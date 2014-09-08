//(function(){

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
        window.on('resize', resizeHandler);
    }());

    (function(){
        //////////////////////////////////////////////
        /*        Add functionality to tools        */
        //////////////////////////////////////////////
        var tools = document.querySelector('tools'),
            children = tools.children;

        for(var i = 0; i < children.length; i++) {
            var tool = children[i];
            tool.on('click', function(ev){
                var selected = document.querySelector('tool[selected]');
                selected.removeAttribute('selected');
                this.setAttribute('selected', '');
            }, false);
        }
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

    init();

    var img = new Image();
    img.onload = function() {
        console.log(this);
        img.posX = 0;
        img.posY = 0;
        img.scale = 1;
        drawImage(mainCanvas, this);
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
    
    mainCanvas.addEventListener('mousedown', onMouseDown);
    mainCanvas.addEventListener('mousemove', onMouseMove);
    mainCanvas.addEventListener('mouseup', onMouseUp);
    mainCanvas.addEventListener('mousewheel', onMouseWheel);

    // if the cursor is off of the canvas, this allows the user to continue
    // dragging the image around
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

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

    










    //addNewPictureFromDataUrl(mainCanvas.toDataURL());

    function addNewPictureFromDataUrl(imageData){
        var image = new Image(),
            picture = document.createElement('picture'),
            pictures = document.querySelector('pictures');
        image.onload = function() {
            picture.appendChild(image);
            prependElement(pictures, picture);
        }
        image.src = imageData;
    }

    function prependElement(parent, child){
        parent.insertBefore(child, parent.insertBefore);
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


    function wc() {
        console.log('in wc');
        getWCEndpoint(main);
    }

    //$(document).ready(wc);

    function main(wc_endpoint) {
        console.log('in main');
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

        var ws = new WearScriptConnection(
            new ReconnectingWebSocket(wc_endpoint),
            "wc-webapp",
            Math.floor(Math.random() * 100000),
            onopen
        );
        console.log(ws)

        function onopen() {
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
                    placePicture('data:image/jpg;base64,' + btoa(image));//, ws, 'image');
                    console.log('in if (!isTagging)');


                //ws.publish('words',,)

            });
            ws.send('register', 'registered', 'worker:' + currentTimeString());
        }
    };

    function placePicture(imageDataUrl, ws, channel) {
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
        image.src = imageDataUrl;
    }


//}());
