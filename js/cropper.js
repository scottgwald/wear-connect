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

init();
var c;
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

// GEOMETRY / MATERIAL / MESH

var listItemGeometry;
var listItemMaterial;

var thumbGeometry = new THREE.PlaneGeometry( thumbWidth, thumbHeight);

function actualToVirtualScale( coord ) {
    return new THREE.Vector2( coord.x * virtualCanvasWidth / actualCanvasWidth,
            coord.y * virtualCanvasHeight / actualCanvasHeight);
}

function actualToVirtualPos( coord ) {
    return actualToVirtualScale( new THREE.Vector2( coord.x, actualCanvasHeight - coord.y ) );
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
    // c.width  = width; // in pixels
    // c.height = height;
    var geometry = new THREE.BoxGeometry( width, height, 10 );
    var material = new THREE.MeshBasicMaterial( {  color:0x78AB46, opacity: .5, transparent: true} );
    var currentPreview2 = new THREE.Mesh( geometry, material );
    currentPreview2.position.x = lastX + width / 2;
    currentPreview2.position.y = lastY - height/2;
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
    var listMaterial = new THREE.MeshBasicMaterial( {  opacity: .75,transparent: true} );
    list = new THREE.Mesh( listGeometry, listMaterial );
    list.position.x = virtualImageWidth + virtualListWidth / 2;
    list.position.y = virtualListHeight / 2;
    listItemGeometry = new THREE.BoxGeometry( listWidth - 2 * listItemPadding,
                listItemHeight - listItemPadding, 1 );
    listItemMaterial = new THREE.MeshBasicMaterial();

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

    document.addEventListener( 'keypress', onDocumentKeyPress, false );
    document.addEventListener( 'keydown', onDocumentKeyDown, false );

    function onDocumentKeyPress(event) {
        var keyCode = event.which;
        console.log(keyCode);
        // backspace
        if (keyCode == 47) {
            event.preventDefault();
        }
        if ( keyCode == 8 ) {
            event.preventDefault();
            if (selectedItem.tagText){
                if (selectedItem.tagText.length-1 >=0) {
                    selectedItem.tagText = selectedItem.tagText.substring(0, selectedItem.tagText.length-1);
                    createTextForItem();
                }
            }
        } else if (keyCode == 13) {
            console.log('Enter');
            submit();
        } else {
            if (selectedItem) {
                var ch = String.fromCharCode( keyCode );
                if (!selectedItem.tagText)
                    selectedItem.tagText='';
                selectedItem.tagText += ch;
                createTextForItem();
            }
        }
    //
    }

    function createTextForItem() {

        if(selectedItem.tagTextGeo)
            scene.remove(selectedItem.tagTextGeo);

        var textGeo = new THREE.TextGeometry( selectedItem.tagText, {
                size: 14,
                height: 100,
                font: "arial",
                weight: "normal",
                style: "normal"
        });

        var listWidth =.25 * window.innerWidth - 30;
        var itemPosX = 750 - ( .25 * window.innerWidth + 10) / 2;
        var thumbHeight = window.innerHeight / 6;
        var textMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, overdraw: true });
        var textMesh = new THREE.Mesh(textGeo,textMaterial);
        textMesh.position.y = selectedItem.start + thumbHeight / 6;
        textMesh.position.x = itemPosX - listWidth / 7;
        selectedItem.tagTextGeo= textMesh;
        scene.add(textMesh);
    }

    function onDocumentKeyDown(event) {

    }

    function generateListItem( index ) {

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

            ctx.drawImage(image, cutPoint.x, cutPoint.y, pixelTagDims.x, pixelTagDims.y,
                    0, 0, pixelTagDims.x, pixelTagDims.y);

            if (DBG) console.log( "Grabbing region of size " + pixelTagDims.x + ", "
                    + pixelTagDims.y + " from location "  + cutPoint.x + ", " + cutPoint.y );

            dataURL = c.toDataURL();

            var listWidth = .25 * window.innerWidth - 30;
            var listHeight = window.innerHeight / 6;
            var listItem = new THREE.BoxGeometry( listWidth, listHeight,10);
            var listMaterial = new THREE.MeshBasicMaterial({opacity:.7,transparent:true, color: 0x000000});

            var listItem = new THREE.Mesh( listItemGeometry, listItemMaterial );
            listItem.position.y = listItemY;
            listItemY -= listItemHeight;

            listItem.selected = false;
            listItem.start = nextListPosition;
            listItem.tagName = text+tagNum;

            tagNum++;

            //console.log(item.selected);


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
            var listWidth =.25 * window.innerWidth-30;
            var listHeight = window.innerHeight/6;
            mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (window.innerWidth) ) * 2 - 1, - ( event.clientY / window.innerHeight) * 2 + 1, 1 ), camera );
            mouse3D.sub(camera.position);

            var target;
            for (var i =0; i< itemList.length; i++) {


                if (mouseDownPosition.x >.75* window.innerWidth + 40 && mouse3D.y < itemList[i].start+listHeight/2 && mouse3D.y > itemList[i].start -listHeight/2 ){
                    target = itemList[i];
                    target.selected = true;

                    console.log('a box was clicked');
                    $('input').val('').focus().change(function() {
                        selectedItem.tagText = $('input').val();;
                        createTextForItem();
                    });
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
}
