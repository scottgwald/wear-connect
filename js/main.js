//(function(){

    //helper methods
    document.on = document.addEventListener;
    document.off = document.removeEventListener;
    window.on = window.addEventListener;
    window.off = window.removeEventListener;


    function mobileCheck() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

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
    if(mobileCheck()){
        console.log('is mobile');
        requireFullscreen();
    }

    function setSize(){
        var width = window.innerWidth - 200 - 200 // 200 is the sum of both asides width
                                        // and some extra padding

        canvas.width = width;
        canvas.height = width / glassAspectRatio;
        makeGrid();
    }


    var timeout;
    function resizeHandler() {
        console.log('resize even called')
        window.clearTimeout(timeout);
        timeout = window.setTimeout(setSize, 300);
    }

    function destructor() {
        window.off('resize', resizeHandler);
    }

    //add listeners
    window.on('resize', resizeHandler);
    

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
        ctx = canvas.getContext('2d');

    var midContainer = document.querySelector('#midContainer');

    setSize();

    function makeGrid(){
        var w = canvas.width;
        var h = canvas.height;

        for(var x = 0.5; x < w; x+=10){
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for(var y = 0.5; y < h; y+=10){
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.strokeStyle = "#000";
        ctx.stroke();
        
    }
    makeGrid();
//}());
