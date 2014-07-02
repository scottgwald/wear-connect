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
	init();
	var c;
	
	function submit() {
		console.log($("input[name=user]").val());
		c.width  = width; // in pixels
		c.height = height;
    	ctx.drawImage(image,mouseDownPosition.x,mouseDownPosition.y, width,height,0,0,width,height);
	    var dataURL = c.toDataURL();
	    console.log(dataURL);
	}
	function init() {
		image = new Image();
	image.src = 'kitchen.png'
	var renderer = new THREE.WebGLRenderer();
    renderer.setSize(image.width, image.height);
    var container = document.getElementById('cropper');
    container.appendChild(renderer.domElement);
    
    elem = renderer.domElement;
    boundingRect = elem.getBoundingClientRect();
    

    // camera 
    
	
	camera = new THREE.OrthographicCamera( image.width/ - 2, image.width / 2, image.height / 2, image.height / - 2, 1,1000 );   
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
    planeG = new THREE.PlaneGeometry(image.width, image.height);
    plane = new THREE.Mesh(planeG,img);
    plane.overdraw = true;
    scene.add(plane);


    
//     
	function render() { 
		requestAnimationFrame(render);
		 renderer.render(scene, camera);
	} 
	render();
   
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
   	renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    
    function onDocumentMouseUp(event) {
    	isClicked = false;
    	currentTag = JSON.parse(JSON.stringify(currentPreview));
    	currentPreview = undefined;
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
    		

    		var geometry = new THREE.BoxGeometry( width, height, 10 );
   			var material = new THREE.MeshBasicMaterial( {  opacity: .5,transparent: true} );
   			currentPreview = new THREE.Mesh( geometry, material );
   			currentPreview.position.x = lastX+width/2;
   			currentPreview.position.y = lastY-height/2;
   			
   			scene.add(currentPreview);
    	}
    }
    
    function onDocumentMouseDown(event) {
    	
    	isClicked = true ;
    	mouseDownPosition.x = event.clientX;//(event.clientX - boundingRect.left) * (elem.width / boundingRect.width);
    	mouseDownPosition.y = event.clientY;//(event.clientY - boundingRect.top) * (elem.height / boundingRect.height);
	
    	currentMousePosition.x = (event.clientX - boundingRect.left) * (renderer.domElement.width / boundingRect.width);
    	currentMousePosition.y = (boundingRect.top -window.innerHeight + event.clientY) * (renderer.domElement.height / boundingRect.height);
    	
    	
    	mouse3D = projector.unprojectVector( new THREE.Vector3( ( currentMousePosition.x / (renderer.domElement.width) ) * 2 - 1, - ( event.clientY / renderer.domElement.height) * 2 + 1, 1 ), camera );
    	console.log(event.clientY);
    	console.log(renderer.domElement.height);
    	console.log(container.offsetHeight);
    	console.log(boundingRect);
    	//mouse3D.normalize();
    	lastX = mouse3D.x;
    	lastY = mouse3D.y;
    	
    }
   }