/**
 * @author Christian Vazquez
 */
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


// SPATIAL DIMENSIONS
var glassAspectRatio = 16.0/9.0;

var virtualImageOffset = -200;
var virtualCanvasWidth = 1500;
var virtualCanvasHeight = 750;
var actualCanvasWidth = 1000; // later window.innerWidth?
var actualCanvasHeight = 500; // later window.innerHeight?
var pixelImageWidth = 416;
var pixelImageHeight = 304;

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
var c;
var textCanvas;
var textCanvasWidth = 500;
var textCanvasHeight = 90;
var textCanvasPadding = 8;
var nextListPosition;
var text = 'Tag';
var tagNum = 1;
var itemList = [];
var selectedItem;
var selector;
var isTagging = false;
var dataURL;
var list;

var listItemY;

init();


// GEOMETRY / MATERIAL / MESH

var listItemGeometry;
var listItemMaterial;

var thumbGeometry = new THREE.PlaneGeometry( thumbWidth, thumbHeight);
var textGeometry = new THREE.PlaneGeometry( textWidth, textWidth * textCanvasHeight / textCanvasWidth );
var textMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, overdraw: true } );

// COORDINATE MAPPINGS

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
    console.log('submitting');

    // c.width  = width; // in pixels
    // c.height = height;
    console.log(currentPreview);
    var geometry = new THREE.BoxGeometry( currentPreview.width, currentPreview.height, 10 );
    var material = new THREE.MeshBasicMaterial( {  color:0x78AB46, opacity: .5, transparent: true} );
    var currentPreview2 = new THREE.Mesh( geometry, material );
    currentPreview2.position.x = currentPreview.position.x ;//+ width / 2;
    currentPreview2.position.y = currentPreview.position.y;// - height/2;
    currentPreview2.position.z = currentPreview.position.z;
    scene.remove(currentPreview);
    scene.add(currentPreview2);


    ws.publish('words', selectedItem.tagText, dataURL);

    // var dataURL = c.toDataURL();
    // console.log(dataURL);
    // console.log('done');
    //
    
}
function placePicture(imageData) {

    if (image)
        scene.remove(plane);
    image = new Image();
    image.src = imageData;
    console.log("width, height of image is " + image.width + "," + image.height);

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
   

    console.log("String measurements: " + JSON.stringify( textContext.measureText( text )));
    console.log("text: " + text);

    //textContext.clearRect( 0, 0, 500, 90 );
    
    textContext.fillStyle = "#bdbdbd";
   	textContext.fillRect( 0, 0, textCanvasWidth, textCanvasHeight );
   	//textContext.fillRect(0,0,500,90);
   	textContext.fillStyle = "black";

    textContext.fillText( text, textCanvasPadding, 70, textCanvasWidth - 2 * textCanvasPadding );
    var durl = textCanvas.toDataURL( 'image/jpeg' );
    console.log(durl);
    return durl;

}

function init() {

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




    c = document.getElementById("myCanvas");
    c.style.display = 'none';
    ctx = c.getContext("2d");

    textCanvas = document.getElementById("textCanvas");
    textCanvas.style.display = 'none';
  
    textCanvas.width = textCanvasWidth; //textWidth*2;
    textCanvas.height = textCanvasHeight; //thumbHeight*2;
    //textCanvas.width = 500;
    //textCanvas.height = 90;
    textContext = textCanvas.getContext("2d");

    controls = new THREE.TrackballControls( camera );

    controls.rotateSpeed = 0.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.addEventListener( 'change', render );

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
    scene.add( list );
    
    nextListPosition = virtualCanvasHeight / 2 - (virtualCanvasHeight * listItemProportion) - 10;

    function render() { 
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    } 
    animate();

    function animate() {
        requestAnimationFrame( animate );
        controls.update();
    }

    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);

    function createTextForItem() {

        if ( selectedItem.tagTextMesh ) {
            selectedItem.remove( selectedItem.tagTextMesh );
        }

        if ( DBG ) console.log( "Found text: " + selectedItem.tagText );

        // var textGeo = new THREE.TextGeometry( selectedItem.tagText, {
        //         size: 32,
        //         height: 100,
        //         font: "ms pgothic",
        //         //weight: "normal",
        //         //style: "normal"
        // });

        // var textMesh = new THREE.Mesh( textGeo, textMaterial );

        // textMesh.position.y = 0;
        // textMesh.position.x = 0;
        // textMesh.position.z = 50;

        // selectedItem.tagTextMesh = textMesh;
        // selectedItem.add( textMesh );

        var textDataURL = makeTextDataURL( selectedItem.tagText );

        //console.log(item.selected)
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

            var pixelTagDims = actualToPixelScale( new THREE.Vector2(
                    Math.abs( mouseDownPosition.x - event.clientX ),
                    Math.abs( mouseDownPosition.y - event.clientY )
            ));

            if (DBG) console.log( "Mouse down position was " + mouseDownPosition.x + ", "
                    + mouseDownPosition.y );
            if (DBG) console.log( "Mouse up position is " + event.clientX + ", " + event.clientY );

            isClicked = false;

            c.width  = pixelTagDims.x;
            c.height = pixelTagDims.y;

            var cutPoint = actualToPixelPos( new THREE.Vector2( mouseDownPosition.x,
                    mouseDownPosition.y ) );

 			//ctx.fillStyle   = '#000000'; // set canvas background color
   			//ctx.fillRect  (0,   0, 100, 100);  // now fill the canvas 
            ctx.drawImage(image, cutPoint.x, cutPoint.y, pixelTagDims.x, pixelTagDims.y,
                   0, 0, pixelTagDims.x, pixelTagDims.y);

            if (DBG) console.log( "Grabbing region of size " + pixelTagDims.x + ", "
                    + pixelTagDims.y + " from location "  + cutPoint.x + ", " + cutPoint.y );

            dataURL = c.toDataURL();
            console.log( "dataURL " + dataURL );

            var listWidth = .25 * window.innerWidth - 30;
            var listHeight = window.innerHeight / 6;
            var listItem = new THREE.BoxGeometry( listWidth, listHeight,10);
            var listMaterial = new THREE.MeshBasicMaterial({opacity:.7,transparent:true, color: 0x000000});

            var listItem = new THREE.Mesh( listItemGeometry, listItemMaterial );
            listItem.position.y = listItemY;
            listItem.start = listItemY;

            listItemY -= listItemHeight;

            listItem.selected = false;
            listItem.tagName = text+tagNum;

            tagNum++;

            //console.log(item.selected)
            var img = new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture( dataURL )
            });

            var thumb = new THREE.Mesh( thumbGeometry, img);
            thumb.position.x = ( thumbWidth - virtualListWidth ) / 2 + listItemPadding;
            thumb.position.z = 40;
            listItem.thumb = thumb;

            itemList.push( listItem );

            listItem.add( thumb );
            list.add( listItem );

            selectedItem = listItem;

            $('#textform #field').val('').focus().keyup(function() {
                var text = $('input').val();
                selectedItem.tagText = text;
                // var vec = virtualToActualPos(new THREE.Vector2(selectedItem.position.x, selectedItem.position.y));
                // $('body').append('<div style="position: absolute; left: ' + vec.x + '; top: ' + vec.y + ';">' + text + '</div>');
                createTextForItem();
            });

            // var currentTagText = text + ' ' + tagNum;
            // var textGeo = new THREE.TextGeometry( currentTagText, {
                        // size: 14,
                        // height: 100,
                        // font: "optimer",
                        // weight: "normal",
                        // style: "normal"
                    // });
            // var textMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, overdraw: true });
            // var textMesh = new THREE.Mesh(textGeo,textMaterial);
            // textGeo.computeBoundingBox();
            // textGeo.computeVertexNormals();
            // textMesh.position.y = nextListPosition + thumbHeight/6;
            // textMesh.position.x = itemPosX - listWidth/7;

            //scene.add(textMesh);

        }

        //currentPreview = undefined;
    }

    function onDocumentMouseMove(event) {

        if (isClicked) {
            if (currentPreview) {
                scene.remove(currentPreview);
            }

            var x = event.clientX;
            var y = event.clientY;

            // will need to handle different +/- cases
            var actualTagWidth = x - mouseDownPosition.x;
            var actualTagHeight = y - mouseDownPosition.y;
            var actualTagDims = new THREE.Vector2( actualTagWidth, actualTagHeight );

            var virtualTagDims = actualToVirtualScale( actualTagDims );

            var geometry = new THREE.BoxGeometry( virtualTagDims.x, virtualTagDims.y, 100 );
            var material = new THREE.MeshBasicMaterial( {  opacity: .5, transparent: true} );
            currentPreview = new THREE.Mesh( geometry, material );

            actualTagPos = new THREE.Vector2( ( x + mouseDownPosition.x ) / 2,
                    ( y + mouseDownPosition.y ) / 2 );
            virtualTagPos = actualToVirtualPos( actualTagPos );

            currentPreview.position.x = virtualTagPos.x;
            currentPreview.position.y = virtualTagPos.y;
            currentPreview.position.z = 0;
            currentPreview.width = virtualTagDims.x;
            currentPreview.height = virtualTagDims.y;

            scene.add(currentPreview);
        }
    }

    function onDocumentMouseDown(event) {
        isTagging = true;
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
        
        if (mouseDownPosition.x < actualImageWidth) {
            isClicked = true ;

            currentMousePosition.x = event.clientX;//(event.clientX - boundingRect.left) * (renderer.domElement.width / boundingRect.width);
            currentMousePosition.y = event.clientY;//(boundingRect.top -window.innerHeight + event.clientY) * (renderer.domElement.height / boundingRect.height);

            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (window.innerWidth) ) * 2 - 1, - ( event.clientY / window.innerHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);
            //mouse3D.normalize();
            lastX = mouse3D.x;
            lastY = mouse3D.y;
        } else {
           
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

                var selectorGeo = new THREE.BoxGeometry (listWidth,listHeight);
                var selectorMaterial = new THREE.MeshBasicMaterial({ color:0xEDED25,opacity: .5,transparent: true});
                selector = THREE.Mesh(selectorGeo,selectorMaterial);

            }
        }
    }

    $(document).ready(function() {
        $('#textform').submit(submit);
        console.log('set form submission function');
    })
    
}
