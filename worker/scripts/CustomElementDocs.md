ComposerCanvas Element
    Properties
        layerwidth
            Default Value
                0
            
            Description
                Virtual width of highest level canvas layer.
            
        layerheight
            Default Value
                0
            
            Description
                Virtual width of highest level canvas layer.
            
        width
            Default Value
                100

            Description
                Width of the canvas and the inner canvases.

        height
            Default Value
                100
            
            Description
                Height of the canvas and the inner canvases.

        mode
            Default Value
                ''
            
            Description
                Current control tool being used.

        moving
            Default Value
                false
            
            Description
                Appears when the composer is in a moving state.

        offsetX
            Default Value
                0
            
            Description
                The delta that the user has moved the layers in the X direction.

        offsetY
            Default Value
                0
            
            Description
                The delta that the user has moved the layers in the Y direction.

        scale
            Default Value
                1
            
            Description
                The percentage that the user has scaled the layers.

    Methods
        update
            Description
                Call update on each canvas layer.

        reset
            Description
                Reset offsets and scale. Call reset on each canvas layer.

        draw
            Description
                Call draw on each canvas layer.

        resetOffsetAndScale
            Description
                Set offsetX, offsetY to 0 and scale to 1.

        registerEventListener
            Description
                Add an event listener to the composer canvas element.

        getComposerRoot
            Description
                Returns a reference to the tagalong-composer element.





Composer{{ layer name }}Layer Element

ComposerImageLayer Element
    Properties
        src
            Description
                URL for the image used in this layer

    Methods
        checkLayerPosition
            Description
                Check the location of the image on this layer relative to the dimentions of the parent composer-canvas element
                and prevent the composer-canvas fom drawing the image off of the screen.
