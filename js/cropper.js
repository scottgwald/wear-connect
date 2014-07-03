/**
 * @author Christian Vazquez
 */

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
	init();
	var c;
	var nextListPosition;
	var text = 'Tag';
	var tagNum = 1;
	var itemList = [];
	
	function submit() {
		console.log($("input[name=user]").val());
		c.width  = width; // in pixels
		c.height = height;
		var geometry = new THREE.BoxGeometry( width, height, 10 );
   		var material = new THREE.MeshBasicMaterial( {  color:0x78AB46,opacity: .5,transparent: true} );
   		var currentPreview2 = new THREE.Mesh( geometry, material );
   		currentPreview2.position.x = lastX+width/2;
   		currentPreview2.position.y = lastY-height/2;
   		scene.remove(currentPreview);
   		scene.add(currentPreview2);
   		
    	ctx.drawImage(image,currentMousePosition.x,mouseDownPosition.y, width,height,0,0,width,height);
	    var dataURL = c.toDataURL();
	    console.log(dataURL);
	    console.log('done');
	    
	    
	}
	function init() {
	image = new Image();
	image.src = 'kitchen.png'
	var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
   // var container = document.getElementById('cropper');
    //container.appendChild(renderer.domElement);
    document.body.appendChild( renderer.domElement );
    elem = renderer.domElement;
    boundingRect = elem.getBoundingClientRect();
    

    // camera 
    
	
	
	camera = new THREE.OrthographicCamera( -750, 750, window.innerHeight / 2, window.innerHeight / - 2, 1,5000 );
	//camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000 );   
	 camera.position.y = 0; 
    camera.position.z = 400; 
    camera.rotation.x = 0; 
    camera.rotation.y =0;
    camera.position.x =0;
    camera.rotation.z = 0;

    // scene 
     scene = new THREE.Scene();

    scene.add(camera); //ADDED


	
	
	c=document.getElementById("myCanvas");
	c.style.display = 'none';
	ctx=c.getContext("2d");

    var img = new THREE.MeshBasicMaterial({ //CHANGED to MeshBasicMaterial
        map:THREE.ImageUtils.loadTexture('kitchen.png')
    });
    
 
    img.map.needsUpdate = true; //ADDED

    // plane
    planeG = new THREE.PlaneGeometry(640, 480);
    plane = new THREE.Mesh(planeG,img);
    plane.position.x = 0- 200;
   
    plane.overdraw = true;
    scene.add(plane);
    
    controls = new THREE.TrackballControls( camera );

	controls.rotateSpeed = 0.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.addEventListener( 'change', render );
	
			var menuWidth  = .25 * window.innerWidth;
			
   			var menuGeometry = new THREE.BoxGeometry( menuWidth, window.innerHeight, 1 );
   			
   			var menuMaterial = new THREE.MeshBasicMaterial( {  opacity: .75,transparent: true} );
   			var menu = new THREE.Mesh( menuGeometry, menuMaterial );
   			menu.position.x = 750 -menuWidth/2;
   			
   			
   			scene.add(menu);
   			
   			nextListPosition = window.innerHeight/2 - (window.innerHeight/12) - 10; 
   			console.log(nextListPosition);//some padding here
   			
   			


    
//     
	function render() { 
		requestAnimationFrame(render);
		 renderer.render(scene, camera);
	} 
	//render();
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

				// backspace
				if ( keyCode == 8 ) {
					event.preventDefault();
				} else {
					var ch = String.fromCharCode( keyCode );
					text += ch;
					refreshText();
				}
		
	}
	function onDocumentKeyDown(event) {
		
	}
    
    function onDocumentMouseUp(event) {
    	isClicked = false;
    	
    	c.width  = width; // in pixels
		c.height = height;
		var cutX= (currentMousePosition.x-200-20)
		var cutY = (currentMousePosition.y+(480-window.innerHeight)/2);
		console.log(cutX);
		console.log(cutY);
		//var cutXF = cutX*(image.width/640);
		//var cutYF = cutY*(image.height/480);
		

    	ctx.drawImage(image,cutX,cutY,width,height,0,0,width,height);
	    var dataURL = c.toDataURL();
    	
    	var listWidth =.25 * window.innerWidth-30;
    	var listHeight = window.innerHeight/6;
    	var listItem = new THREE.BoxGeometry( listWidth, listHeight,10);
    	var listMaterial = new THREE.MeshBasicMaterial({opacity:.7,transparent:true, color: 0x000000});
    	var item = new THREE.Mesh(listItem,listMaterial);
    	var itemPosX = 750 - (.25 * window.innerWidth+10)/2;
    	item.position.x = itemPosX;
    	item.position.y = nextListPosition;
    	item.position.z =0;
    	scene.add(item);
    	item.selected = false;
    	itemList.push(item);
    	
    	var thumbWidth = .33 * listWidth;
    	var thumbHeight = listHeight;
    	
    	
    	var img = new THREE.MeshBasicMaterial({ 
        map:THREE.ImageUtils.loadTexture(dataURL) });
    	
    	

    	var thumbGeometry = new THREE.PlaneGeometry(thumbWidth,thumbHeight);
    	var thumb = new THREE.Mesh(thumbGeometry,img);
    	thumb.position.x = itemPosX - thumbWidth;
    	thumb.position.y = nextListPosition;
    	thumb.position.z =40;
    	
    	scene.add(thumb);

    	
    	
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
    	tagNum++;
    	
    	
    	
    	nextListPosition = nextListPosition - window.innerHeight/6 -10;
    	
    	
    	
	  
    	
    	
    	//currentPreview = undefined;
    }
    
    function onDocumentMouseMove(event) {
    	if(isClicked) {
    		if (currentPreview) {
    			scene.remove(currentPreview);
    		}
    		
    		var x = event.clientX;//(event.clientX - boundingRect.left) * (elem.width / boundingRect.width);
       		var y = event.clientY;//(event.clientY - boundingRect.top) * (elem.height / boundingRect.height);
       		
       		width = x - mouseDownPosition.x;
    		height = y - mouseDownPosition.y ;
    		

    		var geometry = new THREE.BoxGeometry( width, height, 100 );
   			var material = new THREE.MeshBasicMaterial( {  opacity: .5,transparent: true} );
   			currentPreview = new THREE.Mesh( geometry, material );
   			currentPreview.position.x = lastX+width/2;
   			currentPreview.position.y = lastY-height/2;
   			currentPreview.position.z = 0;
   	
   			
   			scene.add(currentPreview);
   			
   			
    	}
    }
    
    function onDocumentMouseDown(event) {
    	
    	mouseDownPosition.x = event.clientX;//(event.clientX - boundingRect.left) * (elem.width / boundingRect.width);
    	mouseDownPosition.y = event.clientY;//(event.clientY - boundingRect.top) * (elem.height / boundingRect.height);
    	console.log(mouseDownPosition.x);
    	
    	if (mouseDownPosition.x < .75* window.innerWidth) {
    	isClicked = true ;
    	
	
    	currentMousePosition.x = event.clientX;//(event.clientX - boundingRect.left) * (renderer.domElement.width / boundingRect.width);
    	currentMousePosition.y = event.clientY;//(boundingRect.top -window.innerHeight + event.clientY) * (renderer.domElement.height / boundingRect.height);
    
    	mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / (window.innerWidth) ) * 2 - 1, - ( event.clientY / window.innerHeight) * 2 + 1, 1 ), camera );
    	mouse3D.sub(camera.position);
    	//mouse3D.normalize();
    	lastX = mouse3D.x;
    	lastY = mouse3D.y;
    	} else {
    		var mouse = new THREE.Vector2();
    		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
			var vector = new THREE.Vector3( mouse.x, mouse.y, .5);
			
   			projector.unprojectVector( vector, camera );
   			var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
   			var intersects = ray.intersectObjects( scene.children );
   			console.log(intersects[0].object);
			
    	}
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    }
   }