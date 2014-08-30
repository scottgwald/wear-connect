//(function(){
    //helper methods
    window.on = window.addEventListener;
    window.off = window.removeEventListener;



    function setSize(){
        var width = window.innerWidth - 240 // 240 is the sum of both asides width
                                        // and some extra padding

        canvas.width = width;
        canvas.height = width / glassAspectRatio;
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
    var glassAspectRatio = 16.0/9.0;

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

    var width = window.innerWidth - 240 // 240 is the sum of both asides width
                                        // and some extra padding

    canvas.width = width;
    canvas.height = width / glassAspectRatio;

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
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        
    }
//}());
