//(function(){
    //////////////////////////////////////////////
    /*          Hook up custom elements         */
    //////////////////////////////////////////////
    var globals = this,
        customElementPrototypes = {
            'tagalong-composer': defaultPrototypeFunction,
                'composer-tools': function(){
                    var superClass = HTMLElement,
                        prototype = Object.create(superClass.prototype);
                    prototype._selectedtool = null;
                    Object.defineProperty(prototype, "selectedtool", {
                        set: function(val){
                            this._selectedtool = val;
                            this.setAttribute('selectedtool', val);
                        },
                        get: function(){
                            return this.querySelector('composer-tool[type="'+this._selectedtool+'"]');
                        }
                    });
                    prototype.createdCallback = function(){

                    }
                    return { prototype: prototype };
                },
                    'composer-tool': function(){
                        var superClass = HTMLElement,
                            prototype = Object.create(superClass.prototype);

                        prototype._type = '';
                        Object.defineProperty(prototype, "selected", {
                            set: function(){
                                //debugger;
                            },
                            get: function(){
                                return this.hasAttribute('selected');
                            }
                        });
                        Object.defineProperty(prototype, "type", {
                            set: function(type){
                                this._type = type;
                                this.setAttribute('type', type);
                                this.checkIfSelected();
                            },
                            get: function(){
                                return this._type;
                            }
                        });
                        prototype.getComposerRoot = function(){
                            return this.parentNode && this.parentNode.parentNode;
                        };
                        prototype.checkIfSelected = function(){
                            var tools = this.parentNode,
                                isSelcted = this.hasAttribute('selected');
                            if(isSelcted){
                                tools.selectedtool = this._type;
                            }
                        }
                        prototype.bootstrap = function(){
                            var type = this.getAttribute('type');
                            this._type = type;
                            this.checkIfSelected();
                        };
                        prototype.commonInit = function() {
                            var root = this.getComposerRoot(),
                                tools = this.parentNode,
                                composer = root.querySelector('composer-canvas');
                            
                            this.addEventListener('click', function(ev){
                                console.log('tool clicked: ' + this.type);
                                var selected = tools.querySelector('composer-tool[selected]');

                                if(this != selected && !this.hasAttribute('unselectable')) {
                                    selected.removeAttribute('selected');
                                    this.setAttribute('selected', '');
                                    tools.selectedtool = this.type;
                                    composer.mode = this.type;
                                }
                            }, false);
                        };
                        prototype.createdCallback = function() {
                            this.bootstrap();
                            this.commonInit();
                        };
                        return { prototype: prototype };
                    },
                'composer-canvas': function() {
                    var superClass = HTMLElement,
                        prototype = Object.create(superClass.prototype);

                    // layerwidth and layerheight are the virtual
                    // width and height of each layer. The properties should be
                    // set by the image width and height of the image layer
                    prototype._layerwidth   = 0;
                    prototype._layerheight  = 0;
                    prototype._width   = 100;
                    prototype._height  = 100;
                    prototype._mode    = '';
                    prototype._moving  = false;
                    prototype._offsetX = 0;
                    prototype._offsetY = 0;
                    prototype._scale   = 1;
                    prototype.compositeCanvas = document.createElement('canvas');
                    prototype.compositeCtx = null;

                    Object.defineProperty(prototype, "layerwidth", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'layerwidth' must be a Number");
                            }
                            this._layerwidth = val;
                            this.setAttribute('layerwidth', val);
                            this.update();
                        },
                        get: function(){
                            return this._layerwidth;
                        }
                    });
                    Object.defineProperty(prototype, "layerheight", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'layerheight' must be a Number");
                            }
                            this._layerheight = val;
                            this.setAttribute('layerheight', val);
                            this.update();
                        },
                        get: function(){
                            return this._layerheight;
                        }
                    });
                    Object.defineProperty(prototype, "width", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'width' must be a Number");
                            }
                            this._width = val;
                            this.setAttribute('width', val);
                            this.style.width = val + 'px';
                        },
                        get: function(){
                            return this._width;
                        }
                    });
                    Object.defineProperty(prototype, "height", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'height' must be a Number");
                            }
                            this._height = val;
                            this.setAttribute('height', val);
                            this.style.height = val + 'px';
                        },
                        get: function(){
                            return this._height;
                        }
                    });
                    Object.defineProperty(prototype, "mode", {
                        set: function(mode){
                            console.log('composer mode set: ' + mode);
                            // if(mode === "pan") {

                            // } else if(mode === "doodle") {

                            // }
                            this._mode = mode;
                            this.setAttribute('mode', mode);
                        },
                        get: function(){
                            return this._mode;
                        }
                    });
                    Object.defineProperty(prototype, "moving", {
                        set: function(bool){
                            if(typeof bool !== 'boolean') {
                                throw new Error("Property 'moving' must be a Boolean");
                            }
                            this._moving = bool;
                            if(bool){
                                this.setAttribute('moving', '');
                            } else {
                                this.removeAttribute('moving');
                            }
                        },
                        get: function(){
                            return this._moving;
                        }
                    });
                    Object.defineProperty(prototype, "offsetX", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'offsetX' must be a Number");
                            }
                            this._offsetX = val;
                            this.setAttribute('offset-x', val);
                        },
                        get: function(){
                            return this._offsetX;
                        }
                    });
                    Object.defineProperty(prototype, "offsetY", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'offsetY' must be a Number");
                            }
                            this._offsetY = val;
                            this.setAttribute('offset-y', val);
                        },
                        get: function(){
                            return this._offsetY;
                        }
                    });
                    Object.defineProperty(prototype, "scale", {
                        set: function(val){
                            if(typeof val !== 'number') {
                                throw new Error("Property 'scale' must be a Number");
                            } else if(val > 0) {
                                this._scale = val;
                                this.setAttribute('scale', val);
                            }
                        },
                        get: function(){
                            return this._scale;
                        }
                    });

                    prototype.update = function(){


                        // Update layers
                        var layers = this.querySelectorAll('canvas[layer]');
                        for(var i = 0; i < layers.length; i++){
                            var layer = layers[i];
                            if(layer.update){
                                layer.update();
                            }
                        }
                    };
                    prototype.reset = function(){
                        this.resetOffsetAndScale();


                        // Reset layers
                        var layers = this.children;
                        for(var i = 0; i < layers.length; i++){
                            var layer = layers[i];
                            if(layer.reset){
                                layer.reset();
                            }
                        }
                    };
                    prototype.draw = function() {


                        // Draw layers
                        var layers = this.children;
                        for(var i = 0; i < layers.length; i++){
                            var layer = layers[i];
                            if(layer.draw){
                                layer.draw();
                            }
                        }
                    };
                    prototype.compileImage = function(callback) {
                        var layers = this.querySelectorAll('canvas[layer]'),
                            img = new Image(),
                            srcs = [],
                            srcsIndex = 0,
                            self = this;
                        this.compositeCanvas.width = this.width;
                        this.compositeCanvas.height = this.height;

                        var done = function(){
                            callback(self.compositeCanvas.toDataURL());
                        }
                        var helper = function (){
                            srcsIndex++;
                            if(srcsIndex >= srcs.length){
                                done();
                            } else {
                                self.compositeCtx.drawImage(this,
                                    0,0,
                                    self.compositeCanvas.width,
                                    self.compositeCanvas.height)
                                img.src = srcs[srcsIndex];
                            }
                        };

                        img.onload = helper;
                        for(var i = 0; i < layers.length; i++) {
                            srcs.push(layers[i].toDataURL());
                        }
                        img.src = srcs[srcsIndex];

                    };
                    prototype.resetOffsetAndScale = function() {
                        this.offsetX = 0;
                        this.offsetY = 0;
                        this.scale = 1;
                    };
                    prototype.registerEventListener = function(type, fn) {
                        this.addEventListener(type, fn, false);
                    };
                    prototype.getComposerRoot = function() {
                        return this.parentNode;
                    };

                    prototype.checkLayerScale = function() {

                    };
                    prototype.checkLayerPosition = function() {
                        var relativeWidth = this.layerwidth * this.scale,
                            relativeHeight = this.layerheight * this.scale,
                            check = true,
                            margin = 10;

                        if(this.offsetX + relativeWidth < 0 + margin) {
                            this.offsetX =  margin - relativeWidth;
                            check = false;
                        }

                        if(this.offsetY + relativeHeight < 0 + margin) {
                            this.offsetY = margin - relativeHeight;
                            check = false;
                        }

                        if(this.offsetX > this.width - margin) {
                            this.offsetX = this.width - margin;
                            check = false;
                        }
                        
                        if(this.offsetY > this.height - margin) {
                            this.offsetY = this.height - margin;
                            check = false;
                        }
                        return check;
                    }

                    //////////////////////////////////////
                    ////// Composer Canvas - EVENTS //////
                    //////////////////////////////////////
                    prototype.onMouseDown = function(ev){
                        this.moving = true;
                        this.update();
                    };
                    prototype.onMouseUp = function(ev){
                        this.moving = false;
                        this.update();
                    };
                    prototype.onMouseMove = function(ev){
                        if(this.mode === "pan" && this.layerwidth && this.layerheight) {
                            ev.stopPropagation();
                            if(this.moving){
                                this.offsetX += ev.movementX;
                                this.offsetY += ev.movementY;
                                //this.checkLayerPosition();
                            }
                            this.update();
                        }
                    };
                    prototype.onMouseWheel = function(ev){
                        if(this.mode === "pan" && this.layerwidth && this.layerheight) {
                            var relativeWidth = this.layerwidth * this.scale,
                                touchX = ev.layerX - this.offsetX,
                                percentXOffset = touchX / relativeWidth,

                                relativeHeight = this.layerheight * this.scale,
                                touchY = ev.layerY - this.offsetY,
                                percentYOffset = touchY / relativeHeight;

                            this.scale *= ev.wheelDelta > 0 ? 1 + .05 : 1 - 0.05;

                            this.checkLayerScale(mainCanvas, img);///// TODO: not implemented //////////

                            var newRelativeWidth = this.layerwidth * this.scale,
                                dx = (relativeWidth - newRelativeWidth) * percentXOffset,

                                newRelativeHeight = this.layerheight * this.scale,
                                dy = (relativeHeight - newRelativeHeight) * percentYOffset;

                            this.offsetX += dx;
                            this.offsetY += dy;

                            //this.checkLayerPosition();////////////

                            this.update();
                        }
                    };

                    prototype.createdCallback = function(){
                        var root = this.getComposerRoot(),
                            tools = root.querySelector('composer-tools'),
                            tool = tools.querySelector('composer-tool[selected]');

                        this.compositeCtx = this.compositeCanvas.getContext('2d');
                        this.mode = tool.type;
                        this.width = parseFloat(this.getAttribute('width')) || this._width;
                        this.height = parseFloat(this.getAttribute('height')) || this._height;
                        if(this.hasAttribute('mode'))
                            this.mode = this.getAttribute('mode');
                        if(this.hasAttribute('offset-x'))
                            this.offsetX = this.getAttribute('offset-x');
                        if(this.hasAttribute('offset-y'))
                            this.offsetY = this.getAttribute('offset-y');
                        if(this.hasAttribute('scale'))
                            this.scale = this.getAttribute('scale');
                        if(this.hasAttribute('layerwidth'))
                            this.layerwidth = this.getAttribute('layerwidth');
                        else
                            this.layerwidth = this.width;
                        if(this.hasAttribute('layerheight'))
                            this.layerheight = this.getAttribute('layerheight');
                        else
                            this.layerheight = this.height;

                        this.addEventListener('mousedown', this.onMouseDown.bind(this), false);
                        this.addEventListener('mouseup', this.onMouseUp.bind(this), false);
                        this.addEventListener('mousemove', this.onMouseMove.bind(this), false);
                        this.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);

                        document.addEventListener('mouseup', this.onMouseUp.bind(this), false);
                        document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
                    };


                    return { prototype: prototype };
                },
                    'composer-image-layer': function(){
                        var superClass = HTMLCanvasElement,
                            prototype = Object.create(superClass.prototype);

                        prototype.image = new Image();
                        Object.defineProperty(prototype, "src", {
                            set: function(src) {
                                var self = this;
                                this.image.src = src;
                                this.image.onload = function(){
                                    var composer = self.getComposerCanvas();
                                    // composer.layerwidth = self.image.width;
                                    // composer.layerheight = self.image.height;
                                    composer.update();
                                }
                                this.update();
                            },
                            get: function(){
                                return this.image.src;
                            }
                        });
                        prototype.getComposerCanvas = function(){
                            return this.parentNode;
                        };
                        prototype.checkLayerPosition = function(){
                            // This function manipulates the canvas-composer element.
                            
                            // It checks the edges of the image on this layer
                            // to the bounds of the composer dimensions.

                            var composer = this.getComposerCanvas(),
                                relativeWidth = this.image.width * composer.scale,
                                relativeHeight = this.image.height * composer.scale,
                                check = true,
                                margin = 10;

                            if(composer.offsetX + relativeWidth < 0 + margin) {
                                composer.offsetX =  margin - relativeWidth;
                                check = false;
                            }

                            if(composer.offsetY + relativeHeight < 0 + margin) {
                                composer.offsetY = margin - relativeHeight;
                                check = false;
                            }

                            if(composer.offsetX > composer.width - margin) {
                                composer.offsetX = composer.width - margin;
                                check = false;
                            }
                            
                            if(composer.offsetY > composer.height - margin) {
                                composer.offsetY = composer.height - margin;
                                check = false;
                            }
                            composer.update();
                            return check;
                        };
                        prototype.reset = function(){
                            this.image.src = '';
                            this.clear();
                        };
                        prototype.clear = function(){
                            this.width = this.width;
                        };

                        prototype.draw = function(){
                            var ctx = this.getContext('2d'),
                                composer = this.getComposerCanvas(),
                                relativeWidth = '',
                                relativeHeight = '';
                            if(this.image.width && this.image.height) {
                                ctx.drawImage(this.image,
                                    composer.offsetX, composer.offsetY,
                                    this.image.width * composer.scale,
                                    this.image.height * composer.scale);
                            }
                        };
                        prototype.update = function(){
                            this.clear();
                            this.draw();
                        }

                        prototype.createdCallback = function() {
                            // var composer = this.getComposerCanvas();
                        };
                        
                        return { prototype: prototype,
                                 extends: 'canvas' };
                    },
                    'composer-doodle-layer': function(){
                        var superClass = HTMLCanvasElement,
                            prototype = Object.create(superClass.prototype);

                        prototype.getComposerCanvas = function(){
                            return this.parentNode;
                        }
                        prototype.reset = function(){
                            this.clear();
                        };
                        prototype.clear = function(){
                            this.width = this.width;
                        };
                        prototype.draw = function(){
                            var ctx = this.getContext('2d'),
                                composer = this.getComposerCanvas(),
                                imageLayer = composer.querySelector('canvas[is="composer-image-layer"]');

                            /*
                                drawing formulae:
                                    x = c * scale + offsetx
                                    y = c * scale + offsety
                                    width = scale * layer width
                                    height = scale * layer height
                            */
                            // if(imageLayer.image.width){
                            //     ctx.fillStyle = "blue"
                            //     ctx.fillRect(
                            //         (25 * composer.scale) + composer.offsetX,
                            //         (25 * composer.scale) + composer.offsetY,
                            //         composer.scale * imageLayer.image.width,
                            //         composer.scale * imageLayer.image.height);
                            // }
                        };
                        prototype.update = function(){
                            this.clear();
                            this.draw();
                        }

                        prototype.onComposerMouseDown = function(ev) {
                            var composer = this.getComposerCanvas();
                            if(composer.mode === "pan") {
                            }
                        };
                        prototype.onComposerMouseUp = function(ev) {
                            var composer = this.getComposerCanvas();
                            if(composer.mode === "pan") {
                            }
                        };
                        prototype.onComposerMouseMove = function(ev) {
                            var composer = this.getComposerCanvas();
                            if(composer.mode === "pan") {
                            }
                        };
                        prototype.onComposerMouseWheel = function(ev) {
                            var composer = this.getComposerCanvas();
                            if(composer.mode === "pan") {
                            }
                        };

                        prototype.createdCallback = function() {
                            var composer = this.getComposerCanvas();
                            // composer.registerEventListener('mousedown', this.onComposerMouseDown.bind(this));
                            // composer.registerEventListener('mousemove', this.onComposerMouseMove.bind(this));
                            // composer.registerEventListener('mouseup', this.onComposerMouseUp.bind(this));
                            // composer.registerEventListener('mousewheel', this.onComposerMouseWheel.bind(this));

                            // // if the cursor is off of the canvas, this allows the user to continue
                            // // dragging the image around
                            // document.addEventListener('mouseup', this.onComposerMouseUp.bind(this));
                            // document.addEventListener('mousemove', this.onComposerMouseMove.bind(this));
                        };
                        
                        return { prototype: prototype,
                                 extends: 'canvas' };
                    },
            'incoming-images': function(){
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                prototype.addBinaryImage = function(binaryImageData){
                    //console.log(binaryImageData);
                    var dataURL = 'data:image/jpg;base64,' + btoa(binaryImageData),
                        incomingImage = new IncomingImage(),
                        self = this;
                    incomingImage.onload = function(){

                        self.appendChild(incomingImage);
                    };
                    incomingImage.src = dataURL;
                }
                return { prototype: prototype };
            },
                'incoming-image': function(){
                    var superClass = HTMLImageElement,
                        prototype = Object.create(superClass.prototype);
                    prototype.createdCallback = function() {
                        var composer = document.querySelector('composer-canvas'),
                            composerImageLayer = document.querySelector('canvas[is="composer-image-layer"]');
                        this.addEventListener('click', function(ev){
                            composer.reset();
                            composerImageLayer.src = this.src;
                            //composerImageLayer.update();
                        }, false);
                    };
                    Object.defineProperty(prototype, "bar", {value: 100});

                    return { prototype: prototype,
                             extends: 'img' };
                },
            'outgoing-image': function(){
                var superClass = HTMLImageElement,
                    prototype = Object.create(superClass.prototype);
                prototype.createdCallback = function() {
                    this.addEventListener('click', function(ev){
                        // TODO: what happens when you click an outgoing image?
                    }, false);
                };
                Object.defineProperty(prototype, "bar", {value: 100});


                return { prototype: prototype,
                         extends: 'img' };
            },
            'picture-container': function () {
                var superClass = HTMLElement,
                    prototype = Object.create(superClass.prototype);
                
                prototype.addPicture = function(src, caption) {
                    var newPicture = new PictureElement();
                    newPicture.src = src;
                    newPicture.caption = caption;
                    this.appendChild(newPicture);
                };

                return { prototype: prototype };
            },
                'picture-element': function () {
                    var superClass = HTMLElement,
                        prototype = Object.create(superClass.prototype);

                    prototype._src = "";
                    prototype._caption = "";
                    prototype._image = null;
                    Object.defineProperty(prototype, "src", {
                        set: function(src) {
                            var image;
                            if(this.querySelector('img')) {
                                image = this.querySelector('img');
                            } else {
                                image = new Image();
                                this.appendChild(image);
                            }
                            image.src = src;
                            this._src = src;
                        },
                        get: function(){
                            return this.image.src;
                        }
                    });
                    Object.defineProperty(prototype, "caption", {
                        set: function(str) {
                            this._caption = str;
                            var pictureCaption = this.querySelector('picture-caption');
                            if(!pictureCaption) {
                                pictureCaption = new PictureCaption();
                                this.appendChild(pictureCaption);
                            }
                            pictureCaption.textContent = str;
                        },
                        get: function(){
                            return this._caption;
                        }
                    });
                    console.log('defaultPrototypeFunction()')
                    prototype.createdCallback = function() {
                        if(this.hasAttribute('caption'))
                            this.caption = this.getAttribute('caption');
                    };
                    return { prototype: prototype };
                },
                    'picture-caption': function () {
                        var superClass = HTMLElement,
                            prototype = Object.create(superClass.prototype);

                        prototype.createdCallback = function() {

                        };
                        return { prototype: prototype };
                    }

        };

    function defaultPrototypeFunction() {
        var superClass = HTMLElement,
            prototype = Object.create(superClass.prototype);
        console.log('defaultPrototypeFunction()')
        prototype.createdCallback = function() {};
        return { prototype: prototype };
    }

    function tagNameToConstructorName(tag){
        // "x-custom-tag" -> "XCustomTag"
        var elementName = '',
            x = tag.split('-');
        for(var i = 0; i < x.length; i++){
            elementName += x[i].substr(0,1).toUpperCase() + x[i].substr(1);
        }
        return elementName;
    }

    for(key in customElementPrototypes){
        var customPrototype = customElementPrototypes[key](),
            elementName = tagNameToConstructorName(key);

        // customElements[key] =
        globals[elementName] =
            document.registerElement(key, customPrototype);
    }



    ////////////////////////////
    /*          Main          */
    ////////////////////////////
    var wearScriptConnection,
        composer = document.querySelector('composer-canvas'),
        imageLayer = composer.querySelector('canvas[is="composer-image-layer"]'),
        doodleLayer = composer.querySelector('canvas[is="composer-doodle-layer"]'),
        imageLayerEvents = {
            onComposerMouseDown: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "pan") {
                }
            },
            onComposerMouseUp: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "pan") {
                    ev.stopPropagation();
                }
            },
            onComposerMouseMove: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "pan") {
                    ev.stopPropagation();
                    if(composer.moving){
                        console.log(composer.moving)
                        this.checkLayerPosition();
                        this.update();
                    }
                }
            },
            onComposerMouseWheel: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "pan") {
                    this.checkLayerPosition();
                    this.update();
                }
            }
        },
        doodleLayerEvents = {
            onComposerMouseDown: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "doodle") {
                }
            },
            onComposerMouseUp: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "doodle") {
                    ev.stopPropagation();
                }
            },
            onComposerMouseMove: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "doodle") {
                    ev.stopPropagation();
                    if(composer.drawing){
                        this.update();
                    }
                }
            },
            onComposerMouseWheel: function (ev) {
                var composer = this.getComposerCanvas();
                if(composer.mode === "doodle") {
                }
            }
        },
        documentEvents = {
            onMouseMove: function(ev){
                var composer = this.getComposerCanvas();
                if(composer.mode === "pan") {
                    ev.stopPropagation();
                    if(composer.moving){
                        this.update();
                    }
                }
            }
        };

    
    
    
    composer.registerEventListener('mousedown', imageLayerEvents.onComposerMouseDown.bind(imageLayer), false);
    composer.registerEventListener('mousemove', imageLayerEvents.onComposerMouseMove.bind(imageLayer), false);
    composer.registerEventListener('mouseup', imageLayerEvents.onComposerMouseUp.bind(imageLayer), false);
    composer.registerEventListener('mousewheel', imageLayerEvents.onComposerMouseWheel.bind(imageLayer), false);
    
    composer.registerEventListener('mousedown', doodleLayerEvents.onComposerMouseDown.bind(doodleLayer), false);
    composer.registerEventListener('mousemove', doodleLayerEvents.onComposerMouseMove.bind(doodleLayer), false);
    composer.registerEventListener('mouseup', doodleLayerEvents.onComposerMouseUp.bind(doodleLayer), false);
    composer.registerEventListener('mousewheel', doodleLayerEvents.onComposerMouseWheel.bind(doodleLayer), false);

    // if the cursor is off of the canvas, this allows the user to continue
    // dragging the image around
    document.addEventListener('mouseup', imageLayerEvents.onComposerMouseUp.bind(imageLayer), false);
    document.addEventListener('mousemove', imageLayerEvents.onComposerMouseMove.bind(imageLayer), false);
    

    // imageLayer.oncomposermousedown = imageLayerEvents.onComposerMouseDown;
    // imageLayer.oncomposermouseup = imageLayerEvents.onComposerMouseUp;
    // imageLayer.oncomposermousemove = imageLayerEvents.onComposerMouseMove;
    // imageLayer.oncomposermousewheel = imageLayerEvents.onComposerMouseWheel;

    var sendButton = document.querySelector('composer-tool[type="send"]');
    sendButton.addEventListener('click', function(ev) {
        var tagalongComposer = this.getComposerRoot(),
            composer = tagalongComposer.querySelector('composer-canvas');

        composer.compileImage(function(imageDataURL){
            var src = imageDataURL,
                pictureContainer = document.querySelector('picture-container'),
                caption = tagalongComposer.querySelector('composer-caption-text').textContent;

            pictureContainer.addPicture(src, caption);
            if(wearScriptConnection){
                wearScriptConnection.send('picture', src, caption);
            }
        });
    });



















































































































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
        //window.on('resize', resizeHandler);
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


    makeGrid(backgroundCanvas, "#f9f9f9");
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

    //init();

    var img = new Image();
    img.onload = function() {
        console.log(this);
        img.posX = 0;
        img.posY = 0;
        img.scale = 1;
        //drawImage(mainCanvas, this);
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
    
    // mainCanvas.addEventListener('mousedown', onMouseDown);
    // mainCanvas.addEventListener('mousemove', onMouseMove);
    // mainCanvas.addEventListener('mouseup', onMouseUp);
    // mainCanvas.addEventListener('mousewheel', onMouseWheel);

    // // if the cursor is off of the canvas, this allows the user to continue
    // // dragging the image around
    // document.addEventListener('mouseup', onMouseUp);
    // document.addEventListener('mousemove', onMouseMove);

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

    










    //addNewPictureFromDataURL(mainCanvas.toDataURL());

    function addNewPictureFromDataURL(imageData){
        var image = new Image(),
            picture = document.createElement('picture-element'),
            pictures = document.querySelector('picture-container');
        image.onload = function() {
            picture.appendChild(image);
            prependElement(pictures, picture);
        }
        image.src = imageData;
    }

    function prependElement(parent, child){
        parent.insertBefore(child, parent.insertBefore);
    }







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


    function startWordConnect() {
        console.log('in startWordConnect');
        getWCEndpoint(main);
    }

    //$(document).ready(startWordConnect);

    var incomingImageHandler = undefined;

    function main(wc_endpoint) {
        console.log('in main');

        wearScriptConnection = new WearScriptConnection(
                new ReconnectingWebSocket(wc_endpoint),
                "wc-webapp",
                Math.floor(Math.random() * 100000),
                onopen
            );

        incomingImageHandler = new IncomingImageHandler(wearScriptConnection);

        //console.log(ws)

        function onopen() {
            var ws = wearScriptConnection;
            var incomingImages = document.querySelector('incoming-images');
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
                    //placePicture('data:image/jpg;base64,' + btoa(image));//, ws, 'image');
                    //console.log('in if (!isTagging)');
                incomingImages.addBinaryImage(image);

                //ws.publish('words',,)

            });
            ws.send('register', 'registered', 'worker:' + currentTimeString());
        }
    };

    function placePicture(imageDataURL, ws, channel) {
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
        image.src = imageDataURL;
    }

    function IncomingImageHandler(incomingImages){
        this.incomingImages = incomingImages | document.querySelector('incoming-images');
        this.images = [];
    }
    IncomingImageHandler.prototype.addImageFromDataURL = function(){

    }


//}());
