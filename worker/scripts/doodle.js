

var doodlePoints = new Array();
var painting = false;

	
var doodleCanvas = document.querySelector('#doodleCanvas'),
    doodleCtx = doodleCanvas.getContext('2d');

    resizeCanvasByWidth(
        doodleCanvas,
        computeCanvasWidth(),
        glassAspectRatio);



 function addClick (mouseXY,dragging) {

        mouseXY.dragging = dragging;
        doodlePoints.push(mouseXY);


    }


  function redraw(){

        doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height); // Clears the canvas
        doodleCtx.strokeStyle = "#df4b26";
        doodleCtx.lineJoin = "round";
        doodleCtx.lineWidth = 5;

         for(var i=0; i < doodlePoints.length; i++) {     
            doodleCtx.beginPath();
            if(doodlePoints[i].dragging && i){
                doodleCtx.moveTo(doodlePoints[i-1].x, doodlePoints[i-1].y);
            } else {
                doodleCtx.moveTo(doodlePoints[i].x-1, doodlePoints[i].y);
            }
            doodleCtx.lineTo(doodlePoints[i].x, doodlePoints[i].y);
            doodleCtx.closePath();
            doodleCtx.stroke();
         }
    }

function onMouseDownDoodle(){

	var selected = document.querySelector('tool[selected]');



	if(selected.id === 'paintTool') { 

		console.log('painting');

		painting = true;

		var x = event.clientX - doodleCanvas.offsetLeft - midContainer.offsetLeft;
        var y = event.clientY - doodleCanvas.offsetTop - midContainer.offsetTop;

        var pixelXY=new Object();

        pixelXY.x = x;
        pixelXY.y = y;
        console.log(pixelXY.x);

        addClick(pixelXY, false);

        redraw();

	}

}

function onMouseMoveDoodle(){

	var selected = document.querySelector('tool[selected]');

	if(selected.id === 'paintTool' && painting) { 

			var x = event.clientX- doodleCanvas.offsetLeft - midContainer.offsetLeft;
            var y = event.clientY- doodleCanvas.offsetTop - midContainer.offsetTop;;


            var pixelXY=new Object;
            pixelXY.x = x;
            pixelXY.y = y;
            addClick(pixelXY, true);
            redraw();

	}

}

function onMouseUpDoodle(){

	var selected = document.querySelector('tool[selected]');

	if(selected.id === 'paintTool') { 
		painting = false;
	}

}

doodleCanvas.addEventListener('mousedown', onMouseDownDoodle);
doodleCanvas.addEventListener('mousemove', onMouseMoveDoodle);
doodleCanvas.addEventListener('mouseup', onMouseUpDoodle);
        
