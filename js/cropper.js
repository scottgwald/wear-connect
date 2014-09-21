var DBG = false;
var scene;
var currentPreview;
var currentTag;
var isClicked;
var mouseDownPosition = new THREE.Vector2();

var currentMousePosition = new THREE.Vector2();
var lastX, lastY;
var projector = new THREE.Projector();
var camera;
var elem;
var boundingRect;
var width, height;
var plane;
var ctx;
var image;
var planeG;
var control;

var actualTagWidth;
var actualTagHeight;

// SPATIAL DIMENSIONS
var glassAspectRatio = 16.0/9.0;

var virtualImageOffset = -200;
var virtualCanvasWidth = 1500;
var virtualCanvasHeight = 750;

// var actualCanvasWidth = 1000; // later window.innerWidth?
// var actualCanvasHeight = 500; // later window.innerHeight?

var actualCanvasWidth =  window.innerWidth-20;
var actualCanvasHeight = actualCanvasWidth/2;

//for glass.jpg test image
// var pixelImageWidth = 2528;
// var pixelImageHeight = 1856;

// for images from glass
var pixelImageWidth = 1500;
var pixelImageHeight = 1096;

var cameraZ = 400;

var imageWidthProportion = 0.75;
var listWidthProportion = 0.25;
var imageHeightProportion = 1;
var listHeightProportion = 1;
var virtualImageWidth = imageWidthProportion * virtualCanvasWidth;
var virtualImageHeight = imageHeightProportion * virtualCanvasHeight;
var virtualListWidth = listWidthProportion * virtualCanvasWidth;
var virtualListHeight = listHeightProportion * virtualCanvasHeight;
var listItemProportion = 1.0 / 6.0;
var actualListWidth = listWidthProportion * actualCanvasWidth;
var actualImageWidth = imageWidthProportion * actualCanvasWidth;
var listItemHeight = virtualListHeight * listItemProportion;
var listItemPadding = 15;

var thumbWidthProportion = 0.33;

var thumbWidth = listItemHeight - listItemPadding;
var thumbHeight = thumbWidth;
var textWidth = virtualListWidth - 2 * listItemPadding - thumbWidth;
var textmessage_Width = virtualListWidth - 2 * listItemPadding;

var c;
var textCanvas;
var textCanvasWidth = 500;
var textCanvasHeight = 90;
var textCanvasPadding = 8;
var nextListPosition;
var text = 'Tag';
var tagNum = 0;
var itemList = [];
var selectedItem;
var selector;
var isTagging = false;
var dataURL;
var list;

var listItemY;

var addTags =0;
var ctrlPressed = false;
var spacePressed = false;
var greenList= [];

// MOUSE EVENT VARIABLES //

var windowHalfX = window.innerWidth;
var windowHalfY = window.innerHeight;
var touched; 
var touchStartPosition = new THREE.Vector2();
var currentTouchPosition = new THREE.Vector2();
var lastTouch= new THREE.Vector2();

var currentPicture = 0;
var input = [];
var ready = false;
var start;
var times = [];
var errors = [];
var currentPictureTime;
var finish = false;


init();

// GEOMETRY / MATERIAL / MESH

var listItemGeometry;
var listItemMaterial;

var thumbGeometry = new THREE.PlaneGeometry( thumbWidth, thumbHeight);
var textGeometry = new THREE.PlaneGeometry( textWidth, textWidth * textCanvasHeight / textCanvasWidth );
var textMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, overdraw: true } );
// var textMessageGeometry = new THREE.PlaneGeometry( textmessage_Width, listItemHeight - listItemPadding );
var textMessageGeometry;
//y position for MESH LIST MINA
var fullListItemY=[];

// COORDINATE MAPPINGS

function advance(){
    errors[currentPicture]= [-1,-1];
    nextPicture();
}

 function nextPicture() {
        var finishTime = new Date().getTime();
        times.push(finishTime- currentPictureTime);
        scene.remove(input[currentPicture].prev);

        if (currentPicture == 9){
            finish = true;
            times.push(finishTime-start);

            console.log('-----------Times---------')

            for (var i = 0; i<11 ; i++){
                console.log('picture '+ i + ' :'+times[i]);
            }
            
            console.log('-----------Error---------')

            for (var i = 0; i<10 ; i++){
                console.log('picture ' +i+ 'pixel: '+errors[i][0]+ ' non: '+ errors[i][1]);
            }
        }

        currentPicture = (currentPicture + 1) % input.length ;
        placePicture(input[currentPicture].image);
        currentPictureTime = new Date().getTime();
        scene.add(input[currentPicture].prev);
    }


function error( crop_topleft_positionX, crop_topleft_positionY, crop_width, crop_height, bounding_topleft_positionX, bounding_topleft_positionY, bounding_width, bounding_height ){
        var error=0;
        // console.log("crop_topleft_positionX: "+crop_topleft_positionX +" crop_topleft_positionY: "+ crop_topleft_positionY+ " crop_width: "+crop_width+ " crop_height: "+crop_height+" bounding_topleft_positionX: "+ bounding_topleft_positionX+" bounding_topleft_positionY: "+ bounding_topleft_positionY+ " bounding_width: "+bounding_width+" bounding_height: "+ bounding_height);
 
        boundingCenter={x:getCenterX (bounding_topleft_positionX, bounding_width), y:getCenterY (bounding_topleft_positionY, bounding_height)}
        // console.log("boundingCenter: x "+boundingCenter.x+" y "+boundingCenter.y);
 
    crop_topLeft={x:crop_topleft_positionX,y:crop_topleft_positionY};
    // console.log("crop_topLeft: x "+crop_topLeft.x+" y "+crop_topLeft.y);
       
        crop_topRight={x:get_topRightX(crop_topleft_positionX, crop_width),y:get_topRightY(crop_topleft_positionY)};
        // console.log("crop_topRight: x "+crop_topRight.x+" y "+crop_topRight.y);
       
        crop_bottomRight={x:get_bottomRightX(crop_topleft_positionX, crop_width),y:get_bottomRightY (crop_topleft_positionY, crop_height)};
        // console.log("crop_bottomRight: x "+crop_bottomRight.x+" y "+crop_bottomRight.y);
 
        crop_bottomLeft={x:get_bottomLeftX(crop_topleft_positionX),y:get_bottomLeftY (crop_topleft_positionY, crop_height)};
        // console.log("crop_bottomLeft: x "+crop_bottomLeft.x+" y "+crop_bottomLeft.y);
 
        fixedHalfDiagonal=halfDiagonal(bounding_width,bounding_height);
        // console.log("fixedHalfDiagonal: "+fixedHalfDiagonal);
 
        distanceTopLeft=distanceBtwPoints(boundingCenter, crop_topLeft);
        distanceTopRight=distanceBtwPoints(boundingCenter, crop_topRight);
        distanceBottomLeft=distanceBtwPoints(boundingCenter, crop_bottomLeft);
        distanceBottomRight=distanceBtwPoints(boundingCenter, crop_bottomRight);
 
        // console.log("distanceTopLeft: "+distanceTopLeft);
        // console.log("distanceTopRight: "+distanceTopRight);
        // console.log("distanceBottomLeft: "+distanceBottomLeft);
        // console.log("distanceBottomRight: "+distanceBottomRight);
 
        diffTopLeft=Math.abs(distanceTopLeft-fixedHalfDiagonal);
        diffTopRight=Math.abs(distanceTopRight-fixedHalfDiagonal);
        diffBottomLeft=Math.abs(distanceBottomLeft-fixedHalfDiagonal);
        diffBottomRight=Math.abs(distanceBottomRight-fixedHalfDiagonal);
   
        // console.log("diff all start");
        // console.log(diffTopLeft);
        // console.log(diffTopRight);
        // console.log(diffBottomLeft);
        // console.log(diffBottomRight);
        // console.log("diff all end");
 
        errorTopLeft=(diffTopLeft/fixedHalfDiagonal)*100;
        errorTopRight=(diffTopRight/fixedHalfDiagonal)*100;
        errorBottomLeft=(diffBottomLeft/fixedHalfDiagonal)*100;
        errorBottomRight=(diffBottomRight/fixedHalfDiagonal)*100;
 
    // console.log("errorTopLeft: "+errorTopLeft);
    // console.log("errorTopRight: "+errorTopRight);
    // console.log("errorBottomLeft: "+errorBottomLeft);
    // console.log("errorBottomRight: "+errorBottomRight);
 
        error=Math.max(errorTopLeft, errorTopRight, errorBottomLeft, errorBottomRight);
    error_pixel=Math.max(diffTopLeft, diffTopRight, diffBottomLeft, diffBottomRight);
    console.log("error: "+error);
        return [error, error_pixel];
}
 
function distanceBtwPoints(pointA, pointB){
        var Xdiff=pointB.x-pointA.x;
        var Ydiff=pointB.y-pointA.y;
        var dist_square=Math.pow(Xdiff,2)+Math.pow(Ydiff,2);
//      console.log("distanceBtwPoints :"+dist_square);
        var dist=Math.pow(dist_square, 0.5);
        return dist;
}
 
function halfDiagonal(width, height){
        var halfDiag;
        var diag_square=Math.pow(width,2)+Math.pow(height,2);
        var diag=Math.pow(diag_square, 0.5);
        halfDiag=0.5*diag;
        return halfDiag;
}
 
function getCenterX (topLeftX, width){
        var centerX;
        centerX=topLeftX+width/2;
        return centerX;
}
 
function getCenterY (topLeftY, height){
        var centerY;
        centerY=topLeftY+height/2;
        return centerY;
}
 
function get_topRightX (topLeftX, width){
        var topRightX;
        topRightX=topLeftX+width;
        return topRightX;
}
 
function get_topRightY (topLeftY){
        return topLeftY;
}
 
function get_bottomRightX (topLeftX, width){
        var bottomRightX;
        bottomRightX=topLeftX+width;
        return bottomRightX;
}
 
function get_bottomRightY (topLeftY, height){
        var bottomRightY;
        bottomRightY=topLeftY+height;
        return bottomRightY;
}
 
function get_bottomLeftX (topLeftX){
        return topLeftX;
}
 
function get_bottomLeftY (topLeftY, height){
        var bottomLeftY;
        bottomLeftY=topLeftY+height;
        return bottomLeftY;
}

function actualToVirtualScale( coord ) {
    return new THREE.Vector2( coord.x * virtualCanvasWidth / actualCanvasWidth,
            coord.y * virtualCanvasHeight / actualCanvasHeight);
}

function actualToVirtualPos( coord ) {
    return actualToVirtualScale( new THREE.Vector2( coord.x, actualCanvasHeight - coord.y ) );
}

function virtualToActualScale( coord ) {
    return new THREE.Vector2( coord.x * actualCanvasWidth / virtualCanvasWidth,
            coord.y * actualCanvasHeight / virtualCanvasHeight);
}

function virtualToActualPos( coord ) {
    return virtualToActualScale( new THREE.Vector2( coord.x, coord.y - actualCanvasHeight) );
}

function virtualToPixelScale( dims ) {
    return new THREE.Vector2( dims.x * pixelImageWidth / virtualImageWidth,
            dims.y * pixelImageHeight / virtualImageHeight );
}

function virtualToPixelPos( coord ) {
    return virtualToPixelScale( new THREE.Vector2( coord.x, virtualImageHeight - coord.y ) );
}

function actualToPixelScale( dims ) {
    return virtualToPixelScale( actualToVirtualScale( dims ) );
}

function actualToPixelPos( coord ) {
    return virtualToPixelPos( actualToVirtualPos( coord ) );
}

function submit() {
    console.log('submitting in cropper.js submitting in cropper.js submitting in cropper.js');

    var geometry = new THREE.BoxGeometry( currentPreview.width, currentPreview.height, 10 );
    var material = new THREE.MeshBasicMaterial( {  color:0x9edb62, opacity: .5, transparent: true} );
    var currentPreview2 = new THREE.Mesh( geometry, material );
    currentPreview2.position.x = currentPreview.position.x; // + width / 2;
    currentPreview2.position.y = currentPreview.position.y; // - height/2;
    currentPreview2.position.z = currentPreview.position.z;
    scene.remove(currentPreview);
    var t = input[currentPicture].prev;
    var g = input[currentPicture].geo;

    var targetDim = virtualToPixelScale( new THREE.Vector2(
                    t.width,
                    t.height));
    var cropDim = virtualToPixelScale( new THREE.Vector2(
                    currentPreview.width,
                    currentPreview.height));

    var targetPos = virtualToPixelPos(new THREE.Vector2(t.position.x - t.width/2, t.position.y + t.height/2));

    var cropPos = virtualToPixelPos(new THREE.Vector2(currentPreview.position.x - currentPreview.width/2, currentPreview.position.y+ currentPreview.height/2));




    errors.push(error(cropPos.x - cropDim.x/2 ,cropPos.y + cropDim.y/2 ,cropDim.x,cropDim.y,targetPos.x - targetDim.x/2 ,targetPos.y +targetDim.y/2 ,targetDim.x,targetDim.y));
    console.log('---------------------------------');
    console.log('corner x:'+ (targetPos.x));
    console.log('corner y:'+(targetPos.y));
    console.log('width:'+targetDim.x);
    console.log('height:'+targetDim.y);
    console.log('---------------------------------');


    //scene.add(currentPreview2);
    //greenList.push(currentPreview2);
    //ws.publish('words', selectedItem.tagText, dataURL);
    nextPicture();
    
}
function placePicture(imageData) {
    console.log("in place picture");

    if (image)
        scene.remove(plane);
    image = new Image();
    image.src = imageData;

    var img = new THREE.MeshBasicMaterial({ //CHANGED to MeshBasicMaterial
        map: THREE.ImageUtils.loadTexture(imageData)
    });


    img.map.needsUpdate = true; //ADDED

    // plane
    planeG = new THREE.PlaneGeometry(virtualImageWidth, virtualImageHeight);
    plane = new THREE.Mesh(planeG, img);
    plane.position.x = virtualImageWidth / 2;
    plane.position.y = virtualImageHeight / 2;

    plane.overdraw = true;
    scene.add(plane);
}


function makeTextDataURL( text ) {

    textContext.font = 'normal 80px "Times New Roman"';  
   

   

    //textContext.clearRect( 0, 0, 500, 90 );
    textContext.fillStyle = "#bdbdbd";
    textContext.fillRect( 0, 0, textCanvasWidth, textCanvasHeight );
    //textContext.fillRect(0,0,500,90);
    textContext.fillStyle = "black";

    textContext.fillText( text, textCanvasPadding, 70, textCanvasWidth - 2 * textCanvasPadding );
    var durl = textCanvas.toDataURL( 'image/jpeg' );
    return durl;

}

function enterText(){
    console.log("in enter text");

    var textbox=document.getElementById("text_field");
    var textvalue=textbox.value;
    var textMessageURL = makeTextDataURL( textvalue );

    var text_img = new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture( textMessageURL )});
    var textmessage_mesh = new THREE.Mesh( textMessageGeometry, text_img );
    // var textmessage_mesh = new THREE.Mesh( textMessageGeometry, text_img );
    // textmessage_mesh.position.x = textmessage_Width / 2 ;
    textmessage_mesh.position.x = 0 ;
    textmessage_mesh.position.z = 40;

    // listItem.add(textmessage_mesh);
    list.add( textmessage_mesh );
    //selectedItem=textmessage_mesh;
    // selectedItem.add( textmessage_mesh);
    itemList.unshift( textmessage_mesh );
    fullListItemY.push(listItemY);

    
    for (var i=0; i<itemList.length; i++){
    console.log("itemList: "+itemList);
    itemList[i].position.y=fullListItemY[i];
    itemList[i].start=fullListItemY[i];
    console.log("i: "+i+" itemList[i].position.y: "+itemList[i].position.y+" fullListItemY[i]: "+fullListItemY[i]+" itemList[i].position.x: "+itemList[i].position.x);
    }

    listItemY = listItemY-listItemHeight;
    tagNum++;
    ws.publish('words', textvalue, textMessageURL);
}

function init() {

    console.log("initialize everything. test console output for android");
    var renderer = new THREE.WebGLRenderer();
    // dpr = window.devicePixelRatio;
    dpr = 1;
    renderer.setSize( actualCanvasWidth * dpr, actualCanvasHeight * dpr );
    document.body.appendChild( renderer.domElement );
    elem = renderer.domElement;
    boundingRect = elem.getBoundingClientRect();
    camera = new THREE.OrthographicCamera( 0, virtualCanvasWidth, virtualCanvasHeight, 0, 1, 5000 );

    camera.position.y = 0; 
    camera.position.z = cameraZ;
    camera.rotation.x = 0; 
    camera.rotation.y = 0;
    camera.position.x = 0;
    camera.rotation.z = 0;

    scene = new THREE.Scene();

    scene.add(camera); //ADDED

    renderer.setClearColorHex( 0xbdbdbd, 1 );

    c = document.getElementById("myCanvas");
    c.style.display = 'none';
    ctx = c.getContext("2d");

    textCanvas = document.getElementById("textCanvas");
    textCanvas.style.display = 'none';
  
    textCanvas.width = textCanvasWidth; //textWidth*2;
    textCanvas.height = textCanvasHeight; //thumbHeight*2;

    textContext = textCanvas.getContext("2d");


    // controls = new THREE.TrackballControls( camera );

    // controls.rotateSpeed = 0.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;

    // controls.noZoom = false;
    // controls.noPan = false;

    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;

    // controls.addEventListener( 'change', render );

    var listWidth  = virtualListWidth;

    var listGeometry = new THREE.BoxGeometry( listWidth, virtualCanvasHeight, 1 );
    var listMaterial = new THREE.MeshBasicMaterial( {  color:"#bdbdbd",transparent: true} );
    list = new THREE.Mesh( listGeometry, listMaterial );
    list.position.x = virtualImageWidth + virtualListWidth / 2;
    list.position.y = virtualListHeight / 2;
    listItemGeometry = new THREE.BoxGeometry( listWidth - 2 * listItemPadding,
                listItemHeight - listItemPadding, 1 );
    listItemMaterial = new THREE.MeshBasicMaterial( {  opacity: 0,transparent: true } );


    listItemY = ( virtualListHeight - listItemHeight ) / 2 - listItemPadding;
    console.log("in init (), listItemY: "+listItemY+" virtualListHeight: "+virtualListHeight+" listItemHeight: " +listItemHeight+ " listItemPadding: "+listItemPadding);

    // textMessageGeometry = new THREE.BoxGeometry( listWidth - 2 * listItemPadding, listItemHeight - listItemPadding, 1 );
    // textMessageGeometry = new THREE.BoxGeometry( (listItemHeight - listItemPadding)*(textCanvasWidth/textCanvasHeight), listItemHeight - listItemPadding, 1 );
    textMessageGeometry = new THREE.BoxGeometry( listWidth - 2 * listItemPadding, (listWidth - 2 * listItemPadding)*(textCanvasHeight/textCanvasWidth), 1 );

    scene.add( list );


    getReady();

    function instanceImage(filename,twidth,theight,tx,ty){

         var pic1 = new Object();

            var geometry = new THREE.BoxGeometry( twidth, theight, 10 );
            var material = new THREE.MeshBasicMaterial( {  color:0xff0000, wireframe:true,wireframeLinewidth: 3} );
            var target1 = new THREE.Mesh( geometry, material );
            target1.position.x = tx; // + width / 2;
            target1.position.y = ty ; // - height/2;
            target1.position.z = 1;
            target1.width = twidth;
            target1.height = theight;


            var pic1 = new Object();

            pic1.image = filename;
            pic1.prev = target1;
            pic1.geo = geometry;


            return pic1;

    }

    function getReady(){
        ready = false;
        placePicture('ready.jpg');
    }

    function startTest() {

        //'i3.jpg','i7.jpg','i10.jpg'
        

            start = new Date().getTime();

            var pic1 = instanceImage('i3.jpg',420.78580481622305,236.6920152091255,890.5259822560204,561.787072243346);
            var pic2 = instanceImage('i7.jpg',352.34474017743975,198.19391634980988,287.3891001267427,630.9410646387832);
            var pic3 = instanceImage('i1.jpg',564.7058823529412,317.6470588235294,669.9095022624434,165.90780542986425);
            var pic4 = instanceImage('i10.jpg',154.4494720965309,86.87782805429865 ,580.844645550528,171.71945701357467);
            var pic5 = instanceImage('i2.jpg',139.96983408748113,78.73303167420815 ,591.2518853695325,642.7601809954751);
            var pic6 = instanceImage('i4.jpg',465.761689291101,261.99095022624437 ,884.4645550527904,217.1945701357466);
            var pic7 = instanceImage('i5.jpg',533.3333333333333,300 ,270.7390648567119,591.8552036199095);
            var pic8 = instanceImage('i6.jpg',398.1900452488688,223.98190045248867 ,417.64705882352933,628.5067873303168);
            var pic9 = instanceImage('i8.jpg',361.9909502262443,203.61990950226243 ,265.158371040724,498.868778280543);
            var pic10 = instanceImage('i9.jpg',106.184012066365,59.72850678733032 ,145.3996983408748,287.10407239819006);


            input.push(pic1);
            input.push(pic2);
            input.push(pic3);
            input.push(pic4);
            input.push(pic5);
            input.push(pic6);
            input.push(pic7);
            input.push(pic8);
            input.push(pic9);
            input.push(pic10);



            placePicture(input[0].image);
            currentPictureTime =  new Date().getTime();
            //placePicture('i9.jpg');

            scene.add(input[0].prev);

            //setInterval(advance, 5000);


    }

   
    
    // placePicture('number.jpg');

    nextListPosition = virtualCanvasHeight / 2 - (virtualCanvasHeight * listItemProportion) - 10;
    
    function render() { 
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    } 
    render();
    function animate() {
        requestAnimationFrame( animate );
        //controls.update();
    }

// START TOUCH LISTENERS : MINA//

    renderer.domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
    renderer.domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );
    renderer.domElement.addEventListener( 'touchend', onDocumentTouchEnd, false );    

// END TOUCH LISTENERS : MINA//

    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    document.addEventListener('keydown',onDocumentKeyDown,false);
    document.addEventListener('keyup',onDocumentKeyUp,false);
    renderer.domElement.addEventListener('DOMMouseScroll', scrollTags, false);
    renderer.domElement.addEventListener('mousewheel', scrollTags, false);


    function scrollTags(event) {
        event.preventDefault();
        var delta;
        if (/Firefox/i.test(navigator.userAgent)){
             delta = event.detail;
        } else {
          delta = window.event.wheelDelta;
        }

       
        console.log(delta);


        if (delta>0 &&list.position.y+ delta > virtualListHeight/2 + ((listItemHeight+listItemPadding)*(tagNum)- virtualListHeight) - listItemPadding* (tagNum-1)){
            return;
        }
        if ((listItemHeight+listItemPadding)*tagNum < virtualListHeight){
            return;
        }

        if (delta <0 && list.position.y + delta <= virtualListHeight / 2){
            console.log('error');

            return;
        }
        else
            list.position.y += delta;

    }

    function onDocumentKeyUp(event){
        var keycode = event.which;
        if (keycode == 16){
            event.preventDefault();
            shiftPressed = false;
        } else if (keycode == 17) {
            event.preventDefault();
            ctrlPressed = false;
        }

        if (keycode == 13 && !ready){
            ready = true;
            startTest();
        }
    }

    function onDocumentKeyDown(event){
        var keycode = event.which;

         if (keycode == 16){
            console.log('shift');
            event.preventDefault();
            shiftPressed = true;
        } else if (keycode == 17) {
            console.log('space');
            event.preventDefault();
            ctrlPressed = true;
        }
       
        if (ctrlPressed &&  shiftPressed) {
            isTagging = false;
            for (var i =0; i< greenList.length ; i ++){
                scene.remove(greenList[i]);
            }

            scene.clear();
        }
    }

    function createTextForItem() {

        if ( selectedItem.tagTextMesh ) {
            selectedItem.remove( selectedItem.tagTextMesh );
        }

        if ( DBG ) console.log( "Found text: " + selectedItem.tagText );

     

        var textDataURL = makeTextDataURL( selectedItem.tagText );

        var img = new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture( textDataURL )
        });

        var textMesh = new THREE.Mesh( textGeometry, img );
        textMesh.position.x = ( textWidth - thumbWidth ) / 2 ;
        textMesh.position.z = 40;
        selectedItem.tagTextMesh = textMesh;
        selectedItem.add( textMesh );

    }

    // mouse events are in "actual" coordinates
    function onDocumentMouseUp(event) {

        if (event.clientX < actualImageWidth) {

  			if (actualTagWidth / actualTagHeight > glassAspectRatio) {
            	actualTagHeight = actualTagWidth / glassAspectRatio;
            } else {
            	actualTagWidth = actualTagHeight * glassAspectRatio;
            }

            var pixelTagDims = actualToPixelScale( new THREE.Vector2(
                    actualTagWidth,
                    actualTagHeight));

            if (DBG) console.log( "onDocumentMouseUp: Mouse down position was " + mouseDownPosition.x + ", "
                    + mouseDownPosition.y );
            if (DBG) console.log( "onDocumentMouseUp: Mouse up position is " + event.clientX + ", " + event.clientY );

            isClicked = false;

            c.width  = Math.abs(pixelTagDims.x);
            c.height = Math.abs(pixelTagDims.y);

            var cutPoint = actualToPixelPos( new THREE.Vector2( mouseDownPosition.x,
                    mouseDownPosition.y ) );

            console.log("In mouse up, cutPoint is "+cutPoint.x +" & y is "+ cutPoint.y);
            console.log("In mouse up, pixelTagDims is "+pixelTagDims.x +" & y is "+ pixelTagDims.y);
            // ctx.drawImage(image, cutPoint.x, cutPoint.y, pixelTagDims.x, pixelTagDims.y,
                   // 0, 0, pixelTagDims.x, pixelTagDims.y);

            if (DBG) console.log( "Grabbing region of size " + pixelTagDims.x + ", "
                    + pixelTagDims.y + " from location "  + cutPoint.x + ", " + cutPoint.y );

            var thumP = new Image();
            dataURL = c.toDataURL();
            thumP.src = dataURL;

            c.width = Math.abs(pixelTagDims.x);
            c.height = Math.abs(pixelTagDims.y);
            var tagX = cutPoint.x + ((1-1/glassAspectRatio)/2)*Math.abs(pixelTagDims.x) ;

            var startClippingX=cutPoint.x;//mouseDownPosition.x; //tagX;
            var startClippingY=cutPoint.y; //mouseDownPosition.y; //

            if(pixelTagDims.x<0){
                startClippingX +=pixelTagDims.x;
                console.log("negative x: "+startClippingX);
            }

            if(pixelTagDims.y<0){
                startClippingY +=pixelTagDims.y;
                console.log("negative y: "+startClippingY+" actualTagWidth: "+Math.abs(actualTagWidth)+ " actualTagHeight: "+Math.abs(actualTagHeight));
            }
            
            console.log("actualTagWidth: "+actualTagWidth+" actualTagHeight: "+actualTagHeight);
            console.log("mouseDownPosition.x: "+mouseDownPosition.x+" mouseDownPosition.y: "+mouseDownPosition.y);
            console.log("pixelTagDims.x: "+pixelTagDims.x+" pixelTagDims.y: "+pixelTagDims.y);
            console.log("cutPoint.x: "+cutPoint.x+" cutPoint.y: "+cutPoint.y);
            
            console.log("startClippingX: "+startClippingX+ " startClippingY: "+startClippingY+" pixelTagDims.x: "+Math.abs(pixelTagDims.x)+" pixelTagDims.y: "+Math.abs(pixelTagDims.y)+" pixelTagDims.x: "+ Math.abs(pixelTagDims.x)+" pixelTagDims.y: "+Math.abs(pixelTagDims.y));

            ctx.drawImage(image, startClippingX,startClippingY,Math.abs(pixelTagDims.x),Math.abs(pixelTagDims.y),0,0,Math.abs(pixelTagDims.x),Math.abs(pixelTagDims.y));
            
            console.log("In mouse up, mouseDownPosition is "+mouseDownPosition.x +" & y is "+ mouseDownPosition.y);

            var listWidth = .25 * window.innerWidth - 30;
            var listHeight = window.innerHeight / 6;
            // var listItem = new THREE.BoxGeometry( listWidth, listHeight,10);
            var listMaterial = new THREE.MeshBasicMaterial({opacity:.7,transparent:true, color: 0x000000});
 
            var listItem = new THREE.Mesh( listItemGeometry, listItemMaterial );

            itemList.unshift( listItem );
            fullListItemY.push(listItemY);

            for (var i=0; i<itemList.length; i++){
                itemList[i].position.y=fullListItemY[i];
                itemList[i].start=fullListItemY[i];
                console.log("i: "+i+" itemList[i].position.y: "+itemList[i].position.y+" fullListItemY[i]: "+fullListItemY[i]);

            }
            
            listItemY -= listItemHeight;

            // CHANGE TO CHECK VALUES- MINA
            // listItem.position.y = listItemY;
            // listItem.start = listItemY;
            // console.log("listItemY: "+listItemY+" virtualListHeight: "+virtualListHeight+" listItemHeight: " +listItemHeight);
            
            //actual line
            // console.log("SEE THE VALUES HERE");
            // console.log("listItemY: "+listItemY+" virtualListHeight: "+virtualListHeight+" listItemHeight: " +listItemHeight);

            listItem.selected = false;
            listItem.tagName = text+tagNum;
            
            tagNum++;


             if ((listItemHeight+listItemPadding)*tagNum > virtualListHeight){
                addTags++;
            }

            var thumbData = c.toDataURL();
            console.log( thumbData );

            var img = new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture( thumbData )
            });

            var thumb = new THREE.Mesh( thumbGeometry, img);
            thumb.position.x = ( thumbWidth - virtualListWidth ) / 2 + listItemPadding;
            thumb.position.z = 40;
            listItem.thumb = thumb;

            // itemList.unshift( listItem );
            console.log(itemList);

            listItem.add( thumb );
            list.add( listItem );

            selectedItem = listItem;


            $('#field').val('').focus().keyup(function() {
                var text = $('#field').val();
                console.log("text in textform: "+text);
                selectedItem.tagText = text;
                createTextForItem();
            });  

        }

    }

    function onDocumentTouchEnd(event) {
        event.preventDefault();
        console.log("in touch end, event is: " + event+ " touch[0] is: "+event.changedTouches[event.changedTouches.length-1].clientX);
        if (event.changedTouches[event.changedTouches.length-1].clientX < actualImageWidth) {

        if (touched){
            
            touched=false;
            console.log("touchend here here here");

            event.preventDefault();

            if (actualTagWidth / actualTagHeight > glassAspectRatio) {
                actualTagHeight = actualTagWidth / glassAspectRatio;
            } else {
                actualTagWidth = actualTagHeight * glassAspectRatio;
            }
            
            console.log("In touch end, actualTag is "+actualTagWidth +" & y is "+ actualTagHeight);

            var pixelTagDims = actualToPixelScale( new THREE.Vector2(
                    actualTagWidth,
                    actualTagHeight));

            if (DBG) console.log( "Touch down position was " + touchStartPosition.x + ", "
                    + touchStartPosition.y );
            if (DBG) console.log( "Touch up position is " + event.clientX + ", " + event.clientY );

            c.width  = Math.abs(pixelTagDims.x);
            c.height = Math.abs(pixelTagDims.y);

            var cutPoint = actualToPixelPos( new THREE.Vector2( touchStartPosition.x,
                    touchStartPosition.y ) );

            // console.log("In touch end, touchStartPosition is "+touchStartPosition.x +" & y is "+ touchStartPosition.y);
            // console.log("In touch end, cutPoint is "+cutPoint.x +" & y is "+ cutPoint.y);
            // console.log("In touch end, pixelTagDims is "+pixelTagDims.x +" & y is "+ pixelTagDims.y);            
            
            ctx.drawImage(image, cutPoint.x, cutPoint.y, pixelTagDims.x, pixelTagDims.y,
                   0, 0, pixelTagDims.x, pixelTagDims.y);

            if (DBG) console.log( "Grabbing region of size " + pixelTagDims.x + ", "
                    + pixelTagDims.y + " from location "  + cutPoint.x + ", " + cutPoint.y );

            var thumP = new Image();
            dataURL = c.toDataURL();
            thumP.src = dataURL;

            console.log( dataURL );
            c.width = Math.abs(pixelTagDims.y);
            c.height = Math.abs(pixelTagDims.y);
            var tagX = cutPoint.x + ((1-1/glassAspectRatio)/2)*pixelTagDims.x ;
            
            var startClippingX=tagX;
            var startClippingY=cutPoint.y;

            if(pixelTagDims.x<0){
                startClippingX +=pixelTagDims.x;
                console.log("negative x"+startClippingX);
            }

            if(pixelTagDims.y<0){
                startClippingY +=pixelTagDims.y;
                console.log("negative y: "+startClippingY+" actualTagWidth: "+Math.abs(actualTagWidth)+ " actualTagHeight: "+Math.abs(actualTagHeight));
            }
            
            console.log("startClippingX: "+startClippingX+ " startClippingY: "+startClippingY+" pixelTagDims.x: "+Math.abs(pixelTagDims.x)+" pixelTagDims.y: "+Math.abs(pixelTagDims.y)+" pixelTagDims.x: "+ Math.abs(pixelTagDims.x)+" pixelTagDims.y: "+Math.abs(pixelTagDims.y));

            ctx.drawImage(image, startClippingX,startClippingY,Math.abs(pixelTagDims.x),Math.abs(pixelTagDims.y),0,0,Math.abs(pixelTagDims.x),Math.abs(pixelTagDims.y));
            

            // ctx.drawImage(image, tagX,cutPoint.y,pixelTagDims.y,pixelTagDims.y,0,0,pixelTagDims.y,pixelTagDims.y);

            var listWidth = .25 * window.innerWidth - 30;
            var listHeight = window.innerHeight / 6;
            var listItem = new THREE.BoxGeometry( listWidth, listHeight,10);
            var listMaterial = new THREE.MeshBasicMaterial({opacity:.7,transparent:true, color: 0x000000});

            var listItem = new THREE.Mesh( listItemGeometry, listItemMaterial );
            itemList.unshift( listItem );
            fullListItemY.push(listItemY);

            for (var i=0; i<itemList.length; i++){
                console.log("in output");
                itemList[i].position.y=fullListItemY[i];
                itemList[i].start=fullListItemY[i];
                console.log("itemList[i].position.y: "+itemList[i].position.y+" ");
            }

            listItemY -= listItemHeight;

            listItem.selected = false;
            listItem.tagName = text+tagNum;
            
            tagNum++;


             if ((listItemHeight+listItemPadding)*tagNum > virtualListHeight){
                addTags++;
            }


            var thumbData = c.toDataURL();
            console.log( thumbData );


            var img = new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture( thumbData )
            });

            console.log("img selected in touch end is "+img);

            var thumb = new THREE.Mesh( thumbGeometry, img);
            thumb.position.x = ( thumbWidth - virtualListWidth ) / 2 + listItemPadding;
            thumb.position.z = 40;
            listItem.thumb = thumb;

            // itemList.unshift( listItem );
            console.log(itemList);

            listItem.add( thumb );
            list.add( listItem );

            selectedItem = listItem;

            $('#textform #field').val('').focus().keyup(function() {
                var text = $('field').val();
                selectedItem.tagText = text;
                // var vec = virtualToActualPos(new THREE.Vector2(selectedItem.position.x, selectedItem.position.y));
                // $('body').append('<div style="position: absolute; left: ' + vec.x + '; top: ' + vec.y + ';">' + text + '</div>');
                createTextForItem();
            });
        }
    }
    }    


    function onDocumentTouchStart(event) {
        console.log("touchstart here here here");

            event.preventDefault();

        isTagging = true;
        touchStartPosition.x = event.touches[0].clientX;
        touchStartPosition.y = event.touches[0].clientY;
        console.log("In touch start, touchStartPosition is "+touchStartPosition.x +" & y is "+ touchStartPosition.y);

        if (touchStartPosition.x < actualImageWidth) {

            touchStartPosition.x = event.touches[0].clientX;//(event.clientX - boundingRect.left) * (renderer.domElement.width / boundingRect.width);
            touchStartPosition.y = event.touches[0].clientY;//(boundingRect.top -window.innerHeight + event.clientY) * (renderer.domElement.height / boundingRect.height);

            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (window.innerWidth) ) * 2 - 1, - ( event.clientY / window.innerHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);
            //mouse3D.normalize();
            lastTouch.x = mouse3D.x;
            lastTouch.y = mouse3D.y;
        } else {
           
            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (virtualCanvasWidth) ) * 2 - 1, - ( event.clientY / virtualCanvasHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);

            var target;
            for (var i =0; i< itemList.length; i++) {
                
                console.log(itemList[i].start + virtualListHeight - listItemHeight);
                console.log(mouse3D.y);
                if (touchStartPosition.x >actualImageWidth + listItemPadding && mouse3D.y < itemList[i].start+virtualListHeight/2 && mouse3D.y > itemList[i].start -virtualListHeight/2 ){
                    console.log('touch touch touch touch touch');
                    target = itemList[i];
                    target.selected = true;

                } else {
                    itemList[i].selected = false;
                }
            }
            selectedItem = target;

            if (selectedItem) {

                var selectorGeo = new THREE.BoxGeometry (listWidth,listHeight);
                var selectorMaterial = new THREE.MeshBasicMaterial({ color:0xEDED25,opacity: .5,transparent: true});
                selector = THREE.Mesh(selectorGeo,selectorMaterial);

            }
        }

    }

    function onDocumentTouchMove(event) {
        if (touchStartPosition.x < actualImageWidth) {
        touched=true;
        console.log("touch move here here here");
        console.log("in onDocumentTouchMove, touchStartPosition is: "+touchStartPosition.x);
            event.preventDefault(event);

            if (currentPreview) {
            scene.remove(currentPreview);
            }

            var x = event.touches[0].pageX;
            var y = event.touches[0].pageY;

            // will need to handle different +/- cases
            actualTagWidth = x - touchStartPosition.x;
            actualTagHeight = y - touchStartPosition.y;
            
            var aspectWidth = actualTagWidth;
            var aspectHeight = actualTagHeight;
            
            if (actualTagWidth / actualTagHeight > glassAspectRatio) {
                actualTagHeight = actualTagWidth / glassAspectRatio;
            } else {
                actualTagWidth = actualTagHeight * glassAspectRatio;
            }
            
            var actualTagDims = new THREE.Vector2( actualTagWidth, actualTagHeight );
            var actual = new THREE.Vector2( aspectWidth, aspectHeight );

            var vactual = actualToVirtualScale(actual);
            var virtualTagDims = actualToVirtualScale( actualTagDims );

            var geometry = new THREE.BoxGeometry( virtualTagDims.x, virtualTagDims.y, 100 );
            var material = new THREE.MeshBasicMaterial( {  opacity: .5, transparent: true} );
            currentPreview = new THREE.Mesh( geometry, material );

            actualTagPos = new THREE.Vector2(  touchStartPosition.x + actualTagDims.x / 2,
                   touchStartPosition.y + actualTagDims.y/ 2 );
            virtualTagPos = actualToVirtualPos( actualTagPos );

            currentPreview.position.x = virtualTagPos.x;
            currentPreview.position.y = virtualTagPos.y;
            currentPreview.position.z = 0;
            currentPreview.width = virtualTagDims.x;
            currentPreview.height = virtualTagDims.y;

            scene.add(currentPreview);
        }

    }

    function onDocumentMouseMove(event) {

        if (isClicked) {
            if (currentPreview) {
                scene.remove(currentPreview);
            }

            var x = event.clientX;
            var y = event.clientY;

            // will need to handle different +/- cases
            actualTagWidth = x - mouseDownPosition.x;
            actualTagHeight = y - mouseDownPosition.y;
            
            var aspectWidth = actualTagWidth;
            var aspectHeight = actualTagHeight;
            
            if (actualTagWidth / actualTagHeight > glassAspectRatio) {
            	actualTagHeight = actualTagWidth / glassAspectRatio;
            } else {
            	actualTagWidth = actualTagHeight * glassAspectRatio;
            }
            
            var actualTagDims = new THREE.Vector2( actualTagWidth, actualTagHeight );
			var actual = new THREE.Vector2( aspectWidth, aspectHeight );

			var vactual = actualToVirtualScale(actual);
            var virtualTagDims = actualToVirtualScale( actualTagDims );

            var geometry = new THREE.BoxGeometry( virtualTagDims.x, virtualTagDims.y, 100 );
            var material = new THREE.MeshBasicMaterial( {  opacity: .5, transparent: true} );
            currentPreview = new THREE.Mesh( geometry, material );
            console.log("mouseDownPosition.x: "+mouseDownPosition.x+" actualTagDims.x: "+actualTagDims.x 
                +"mouseDownPosition.y: "+mouseDownPosition.y+" actualTagDims.y: "+actualTagDims.y);
            
            actualTagPos = new THREE.Vector2(  mouseDownPosition.x + actualTagDims.x / 2,
                   mouseDownPosition.y + actualTagDims.y/ 2 );
            virtualTagPos = actualToVirtualPos( actualTagPos );

            currentPreview.position.x = virtualTagPos.x;
            currentPreview.position.y = virtualTagPos.y;
            currentPreview.position.z = 0;
            console.log("currentPreview.position.x: "+currentPreview.position.x+" currentPreview.position.y: "+currentPreview.position.y);
            currentPreview.width = virtualTagDims.x;
            currentPreview.height = virtualTagDims.y;
            console.log("currentPreview.width: "+currentPreview.width+" currentPreview.height: "+currentPreview.height);
            scene.add(currentPreview);
        }
    }

    function onDocumentMouseDown(event) {
        isTagging = true;
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
        console.log("mouseDownPosition is: x= "+mouseDownPosition.x+ " & y: "+ mouseDownPosition.y);
        if (mouseDownPosition.x < actualImageWidth) {
            isClicked = true ;
            console.log("onDocumentMouseDown: mouseDownPosition.x < actualImageWidth");

            currentMousePosition.x = event.clientX;//(event.clientX - boundingRect.left) * (renderer.domElement.width / boundingRect.width);
            currentMousePosition.y = event.clientY;//(boundingRect.top -window.innerHeight + event.clientY) * (renderer.domElement.height / boundingRect.height);

            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (window.innerWidth) ) * 2 - 1, - ( event.clientY / window.innerHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);
            //mouse3D.normalize();
            lastX = mouse3D.x;
            lastY = mouse3D.y;
            // console.log("currentMousePosition.x: "+currentMousePosition.x +" currentMousePosition.y: "+currentMousePosition.y);
            // console.log("event.clientX: "+event.clientX +" event.clientY: "+event.clientY);

        } else {
            console.log("onDocumentMouseDown: mouseDownPosition.x >= actualImageWidth");           
            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (virtualCanvasWidth) ) * 2 - 1, - ( event.clientY / virtualCanvasHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);

            var target;
            for (var i =0; i< itemList.length; i++) {
				
				console.log(itemList[i].start + virtualListHeight - listItemHeight);
				console.log(mouse3D.y);
                if (mouseDownPosition.x >actualImageWidth + listItemPadding && mouse3D.y < itemList[i].start+virtualListHeight/2 && mouse3D.y > itemList[i].start -virtualListHeight/2 ){
                	console.log('click');
                    target = itemList[i];
                    target.selected = true;

                } else {
                    itemList[i].selected = false;
                }
            }
            selectedItem = target;

            if (selectedItem) {
                console.log("#####################selected item in onDocumentMouseDown");
                var selectorGeo = new THREE.BoxGeometry (listWidth,listHeight);
                var selectorMaterial = new THREE.MeshBasicMaterial({ color:0xEDED25,opacity: 0.5,transparent: true});
                selector = THREE.Mesh(selectorGeo,selectorMaterial);

            }
        }
    }




    $(document).ready(function() {
        $('#textform').submit(submit);
        console.log('set form submission function');
    })
    
}
