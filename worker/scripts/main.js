//(function(){

    //helper methods
    EventTarget.prototype.on = EventTarget.prototype.addEventListener;
    EventTarget.prototype.off = EventTarget.prototype.removeEventListener;

    var middleContainerPadding = 100
        navDrawWidth = 100;

    // check if fullscreen is required
    (function(){
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

    // resizeHandler
    (function(){
        var resizeTimeout;
        function resizeHandler() {
            console.log('resize even called')
            window.clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(function(){
                setSizeByWidth(
                    window.innerWidth - (navDrawWidth * 2) - (middleContainerPadding * 2),
                    glassAspectRatio);
            }, 300);
        }
        function destructor() {
            window.off('resize', resizeHandler);
        }
        //add listeners
        window.on('resize', resizeHandler);
    }());

    function setSizeByWidth(width, ratio){
        backgroundCanvas.width = width;
        backgroundCanvas.height = width / ratio;
        makeBackgroundGrid();

        canvas.width = width;
        canvas.height = width / ratio;
        if(img){
            redrawImage(img);
        }
    }

    (function(){
        var tools = document.querySelector('tools'),
            children = tools.children;

        for(var i = 0; i < children.length; i++) {
            var tool = children[i];
            tool.on('click', function(ev){
                var selected = document.querySelector('tool[selected]');
                selected.removeAttribute('selected');
                this.setAttribute('selected', '');
                //ev.
            }, false);
        }
    }());





    // SPATIAL DIMENSIONS
    var glassAspectRatio = 4.0/3.0;

    var virtualImageOffset = -200;
    var virtualCanvasWidth = 1500;
    var virtualCanvasHeight = 750;

    var actualCanvasWidth = 1000; // later window.innerWidth?
    var actualCanvasHeight = 500; // later window.innerHeight?

    var pixelImageWidth = 416;
    var pixelImageHeight = 304;

    var canvas = document.querySelector('#canvas'),
        backgroundCanvas = document.querySelector('#backgroundCanvas'),
        ctx = canvas.getContext('2d'),
        backgroundCtx = backgroundCanvas.getContext('2d');

    var midContainer = document.querySelector('#midContainer');

    setSizeByWidth(window.innerWidth - 200 - 200, glassAspectRatio);
    // -200 for left and right drawer.
    // -200 for padding.

    
    function makeBackgroundGrid(){
        var w = backgroundCanvas.width;
        var h = backgroundCanvas.height;

        for(var x = 0.5; x < w; x+=10){
            backgroundCtx.moveTo(x, 0);
            backgroundCtx.lineTo(x, h);
        }
        for(var y = 0.5; y < h; y+=10){
            backgroundCtx.moveTo(0, y);
            backgroundCtx.lineTo(w, y);
        }
        backgroundCtx.strokeStyle = "#000";
        backgroundCtx.stroke();
        
    }
    makeBackgroundGrid();

    var img = new Image();
    img.onload = function() {
        console.log(this);
        img.posX = 0;
        img.posY = 0;
        img.scale = 1;
        drawImage(this);
    };
    img.src = 'images/glass.jpg';

    function clearCanvas(c){
        c.width = c.width;
    }
    function drawImage(image){
        ctx.drawImage(image,
            image.posX, image.posY,
            image.width * image.scale, image.height * image.scale);
    }
    function redrawImage(image){
        clearCanvas(canvas);
        drawImage(image);
    }




    var movingImage = false;

    function onMouseDown(ev){
        movingImage = true;
    }
    function onMouseMove(ev){
        if(movingImage){
            console.log(ev);
            img.posX += ev.movementX;
            img.posY += ev.movementY;
            redrawImage(img);
        }
    }
    function onMouseUp(ev){
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

        var newRelativeWidth = img.width * img.scale,
            dx = (relativeWidth - newRelativeWidth) * percentXOffset,

            newRelativeHeight = img.height * img.scale,
            dy = (relativeHeight - newRelativeHeight) * percentYOffset;

        img.posX += dx;
        img.posY += dy;

        //console.log(img.scale)
        console.log(ev)
        redrawImage(img);
    }
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousewheel', onMouseWheel);

    var curX,
        curY;
    function onTouchStart(ev){
        console.log('onTouchStart');
        movingImage = true;
        curX = ev.x;
        curY = ev.y;
    }
    function onTouchMove(ev){
        //console.log('onTouchMove');
        if(movingImage){
            console.log(ev);
            var dx = ev.x - curX,
                dy = ev.y - curY;
            img.posX += dx;
            img.posY += dy;
            redrawImage(img);
        }
    }
    function onTouchEnd(ev){
        console.log('onTouchEnd');
        movingImage = false;
    }
    function onTouchWheel(ev){
        console.log('onTouchWheel');
        img.scale += ev.wheelDelta > 0 ? 0.1 : -0.1;
        console.log(img.scale)
        redrawImage(img);
    }

    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend',   onTouchEnd);
    canvas.addEventListener('touchwheel',onTouchWheel);
    
    //canvas.addEventListener







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
//}());
