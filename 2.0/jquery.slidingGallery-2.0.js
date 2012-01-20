/*
*       Developed by Justin Mead
*       ©2010 MeadMiracle
*		www.meadmiracle.com / meadmiracle@gmail.com
*       Version 2.0
*       Testing: IE7/Windows XP
*                Firefox/Windows XP
*       Licensed under the Creative Commons GPL http://creativecommons.org/licenses/GPL/2.0/
*
*       OPTIONS LISTING:
*           *Lheight, Lwidth            - the height and width to use for the center image (landscape)
*           *Lshrink                    - the function to use when shrinking an image to a smaller size.  must take in and return an integer value. (landscape)
*           *Lzoom                      - the function to use when enlarging an image for the zoom view.  must take in and return an integer value. (landscape)
*           *Pheight, Pwidth            - the height and width to use for the center image (portrait)
*           *Pshrink                    - the function to use when shrinking an image to a smaller size.  must take in and return an integer value. (portrait)
*           *Pzoom                      - the function to use when enlarging an image for the zoom view.  must take in and return an integer value. (portrait)
*           *defaultLayout              - the layout attribute to apply when the image has no layout attribute
*           *startClass                 - the class label of the image to place in the center slot at the start of the gallery
*           *slideSpeed                 - the animation speed of sliding. use jQuery animation speed values
*           *zoomSpeed                  - the animation speed of zooming. use jQuery animation speed values
*           *gutterWidth                - the horizontal distance between each of the images. use a pixel value
*           *captionUpPath              - the path of the image to use for the "caption up" button
*           *captionUpWidth             - the pixel width of the "caption up" image
*           *captionUpHeight            - the pixel height of the "caption up" image
*           *captionUpID                - the ID attribute to use for the "caption up" image
*           *captionDownPath            - the path of the image to use for the "caption down" button
*           *captionDownWidth           - the pixel width of the "caption down" image
*           *captionDownHeight          - the pixel height of the "caption down" image
*           *captionDownID              - the ID attribute to use for the "caption down" image
*           *captionHeight              - the function to use to determine the height of the caption. takes in an integer value (usually the height of the image to caption)
                                          and returns an integer value
*           *captionStyle               - the CSS style value to apply to the captions
*           *captionClass               - the CSS class to apply to the captions
*           *captionID                  - the ID attribute to apply to the currently active caption
*           *captionTextAttribute       - the attribute containing the text to use in captions
*           *useCaptions                - allow captions to be shown
*
*       All options have default values, and as such, are optional.  Check the 'options' JSON object below to see the defaults.
*/

(function($) {
    $.gf = {};      //gallery function
    $.c = {};       //center
    $.r = {};       //right
    $.l = {};       //left
    $.z = {};       //zoom
    $.gl = {};      //gallery
    $.ls = {};      //landscape
    $.pt = {};      //portrait
    $.sq = {};      //square
    $.cp = {};      //caption
    $.ap = {};      //autoplay

    $.opts = {
        container: null,
        defaultLayout: 'landscape',
        startClass: 'start',
        slideSpeed: 400,
        zoomSpeed: 200,
        gutterWidth: 20,
        showCount: 5,
        landscape: {
            height: 300,
            width: 400,
            shrink: function(dimension) { return dimension * 0.75; },
            zoom: function(dimension) { return dimension * 2; }
        },
        portrait: {
            height: 400,
            width: 300,
            shrink: function(dimension) { return dimension * 0.75; },
            zoom: function(dimension) { return dimension * 2; }
        },
        square: {
            height: 350,
            width: 350,
            shrink: function(dimension) { return dimension * 0.75; },
            zoom: function(dimension) { return dimension * 2; }
        },
        caption: {
            enabled: false,
            style: 'background-color:white; color:black; opacity: 0.6; filter: alpha(opacity = 60); font-size: 16px; text-align:center;',
            boxClass: 'mm-slider-caption-box',
            id: 'mm-slider-active-caption',
            attr: 'alt',
            height: function(zoomHeight) { return zoomHeight * 0.1; },
            location: 'top',
            hide: {
                imgsrc: 'Images/SlidingGallery/captionUpArrow.png',
                width: 24,
                height: 17,
                id: 'mm-slider-caption-hide'
            },
            show: {
                imgsrc: 'Images/SlidingGallery/captionDownArrow.png',
                width: 24,
                height: 17,
                id: 'mm-slider-caption-show'
            }
        },
        autoplay: {
            enabled: false,
            timeout: 2000,
            dir: 'right',
            handle: null
        }
    };

    $.fn.slidingGallery = function(options) {
        //global settings
        $.extend(true, $.opts, options);
        $.ls = $.opts.landscape;
        $.pt = $.opts.portrait;
        $.sq = $.opts.square;
        $.cp = $.opts.caption;
        $.ap = $.opts.autoplay;
        //round down showCount
        if ($.opts.showCount % 2 === 0) { $.opts.showCount--; }
        //turn slideSpeed into a number
        if (isNaN($.opts.slideSpeed)) {
            switch ($.opts.slideSpeed) {
                case 'normal':
                    $.opts.slideSpeed = 400;
                    break;
                case 'fast':
                    $.opts.slideSpeed = 200;
                    break;
                case 'slow':
                    $.opts.slideSpeed = 600;
                    break;
                default:
                    $.opts.slideSpeed = parseInt($.opts.slideSpeed, 10);
            }
        }
        //eliminate overflow
        $('body').css('overflow-x', 'hidden');

        //record container handle
        $.gl.c = $(this).css('position', 'relative');

        //record gallery handle
        $.gl.i = $(this).find('img').css('cursor', 'pointer');

        //set up image position data
        $.gf.definePositions();

        //configure captions
        if ($.cp.enabled) {
            $.gl.c.append('<img src="' + $.cp.hide.imgsrc + '" style="width: ' + $.cp.hide.width + '; display: none; border-width:0px;"' + 'id="' + $.cp.hide.id + '" />').append('<img src="' + $.cp.show.imgsrc + '" style="width: ' + $.cp.show.width + '; display: none; border-width:0px;"' + 'id="' + $.cp.show.id + '" />');
            $('#' + $.cp.hide.id + ',#' + $.cp.show.id).css('cursor', 'help');
        }

        //setup existing images
        var lastIndex = 0;
        $.gl.i.each(function(i) {
            $(this).data('index', i).data('prev', i - 1).data('next', i + 1).css('position', 'absolute');
            var layout = $(this).data('layout');
            if ((layout !== 'portrait') && (layout !== 'landscape') && (layout !== 'square')) {
                $(this).data('layout', $.opts.defaultLayout);
            }
            lastIndex = i;
        }).hide();

        //if there are fewer images than needed, double the gallery
        var needed = $.opts.showCount * 2 - 1;
        if ($.gl.i.size() < needed) {
            var $clones = $.gl.i.clone();
            $clones.each(function() {
                $(this).data('prev', lastIndex)
                       .data('index', ++lastIndex)
                       .data('next', lastIndex + 1)
                       .removeClass($.opts.startClass)
                       .appendTo($.gl.c);
            });
        }
        $.gl.i = $.gl.c.find('img').css({ padding: 0, margin: 0 });
        $.gl.i.filter(function() { return $.data(this, 'index') == lastIndex; }).data('next', 0);
        $.gl.i.filter(function() { return $.data(this, 'index') === 0; }).data('prev', lastIndex);

        //set images
        var $start = $('.' + $.opts.startClass);
        $.gf.setCenter($start.data('index'));
        $.gf.setLeft($start.data('prev'));
        $.gf.setRight($start.data('next'));

        //bind events
        $.gf.bindSlides();
        $(window).resize(function() {
            $.gf.definePositions();
            $start = $.c.i;
            $.gf.setCenter($start.data('index'));
            $.gf.setLeft($start.data('prev'));
            $.gf.setRight($start.data('next'));
        }).resize();

        if ($.ap.enabled) {
            var autoplayFunc = null;
            if ($.ap.dir === 'left') {
                autoplayFunc = function() {
                    $.gf.slideLeft(1);
                };
            } else {
                autoplayFunc = function() {
                    $.gf.slideRight(1);
                };
            }
            $.ap.handle = setInterval($.gf.autoPlayFunc, $.ap.timeout);
        }

        //return the objects (for chaining purposes)
        return $(this);
    };

    $.gf.bindSlides = function() {
        $.each($.l.i, function(i) { this.one('click', function() { $.gf.slideRight(i + 1); }); });
        $.each($.r.i, function(i) { this.one('click', function() { $.gf.slideLeft(i + 1); }); });
        $.c.i.one('click', $.gf.zoomIn).css('z-index', 0);
        if ($.ap.enabled) {
            $.gl.i.hover(function() {
                clearInterval($.ap.handle);
                $.ap.handle = null;
            }, function() {
                if ($.ap.handle !== null) { clearInterval($.ap.handle); }
                $.ap.handle = setInterval($.gf.autoPlayFunc, $.ap.timeout);
            });
        }
    };

    $.gf.autoPlayFunc = function() {
        if ($.ap.dir === 'left') {
            $.gf.slideLeft(1);
        } else {
            $.gf.slideRight(1);
        }
    };

    $.gf.slideRight = function(dist) {
        //unbind so that nothing else can happen while we're sliding
        $.gl.i.unbind();

        //set the speed (convenience var)
        var speed = $.opts.slideSpeed;

        //shift all array values to the right
        var offScreen = [];
        var toSet = [];
        for (var i = 0; i < dist; i++) {
            offScreen.push($.r.i.pop());
            $.r.i.unshift($.c.i);
            $.c.i = $.l.i.shift();
            var incoming = $.gl.i.filter(function() { return $.data(this, 'index') == $.l.i[$.l.i.length - 1].data('prev'); });
            $.l.i.push(incoming);
            toSet.push(incoming);
        }

        //make sure all incoming photos are in place to be moved
        for (var j = 0; j < toSet.length; j++) {
            var sIndex = $.gl.sl - 1;
            toSet[j].css({ 'top': $.l.l[sIndex].t,
                'left': $.l.l[sIndex].l($.c.i, $.gf.leftPrev($.c.i.data('index'), toSet[j].data('index'))),
                'height': $.l.l[sIndex].h,
                'width': $.l.l[sIndex].w
            });
        }

        //we'll use this to set up animation properties
        var props = {};
        //time to start animating! we'll start on the left. note that we don't animate the far left slot,
        //as it should just be "placed" in storage
        $.each($.l.i, function(j) {
            if (j + 1 < $.gl.sl) {
                //figure the new css properties
                props = $.gf.calcProps('left', this, j);
                //fade in if it's an incoming left image
                if (j + dist + 1 >= $.gl.sl) { props.opacity = 'show'; }
                this.animate(props, speed, 'linear');
            }
        });

        //and now for the center
        $.c.i.animate($.gf.calcProps('center', $.c.i), speed, 'linear');

        //the right
        $.each($.r.i, function(j) {
            //figure the new css properties
            props = $.gf.calcProps('right', this, j);

            //if this is the last image on the right, we want to animate to hidden
            if (j + 1 == $.gl.sl) { props.opacity = 'hide'; }

            //do the slide
            $.gf.crossCenterSlide(this, dist, speed, props, j);
        });

        //finally, any that got popped off the end, except the very last one (which is hidden anyways)
        for (j = 1; j < offScreen.length; j++) {
            props = $.gf.calcProps('rightStore', offScreen[j], j);
            props.opacity = 'hide';
            offScreen[j].animate(props, speed / (j + 1), 'linear');
        }

        //rebind events
        $.gf.bindSlides();
    };

    $.gf.slideLeft = function(dist) {
        //unbind so that nothing else can happen while we're sliding
        $.gl.i.unbind();

        //set the speed (convenience var)
        var speed = $.opts.slideSpeed;

        //shift all array values to the left
        var offScreen = [];
        var toSet = [];
        for (var i = 0; i < dist; i++) {
            offScreen.push($.l.i.pop());
            $.l.i.unshift($.c.i);
            $.c.i = $.r.i.shift();
            var incoming = $.gl.i.filter(function() { return $.data(this, 'index') == $.r.i[$.r.i.length - 1].data('next'); });
            $.r.i.push(incoming);
            toSet.push(incoming);
        }

        //make sure all incoming photos are in place to be moved
        for (var j = 0; j < toSet.length; j++) {
            var sIndex = $.gl.sl - 1;
            toSet[j].css({ 'top': $.r.l[sIndex].t,
                'left': $.r.l[sIndex].l($.c.i, $.gf.rightPrev($.c.i.data('index'), toSet[j].data('index'))),
                'height': $.r.l[sIndex].h,
                'width': $.r.l[sIndex].w
            });
        }

        //we'll use this to set up animation properties
        var props = {};
        //time to start animating! we'll start on the right. note that we don't animate the far right slot,
        //as it should just be "placed" in storage
        $.each($.r.i, function(j) {
            if (j + 1 < $.gl.sl) {
                props = $.gf.calcProps('right', this, j);
                //fade in if it's an incoming right image
                if (j + dist + 1 >= $.gl.sl) { props.opacity = 'show'; }
                this.animate(props, speed, 'linear');
            }
        });

        //and now for the center
        $.c.i.animate($.gf.calcProps('center', $.c.i), speed, 'linear');

        //the left
        $.each($.l.i, function(j) {
            //figure the new css properties
            props = $.gf.calcProps('left', this, j);
            //if this is the last image on the left, we want to animate to hidden
            if (j + 1 == $.gl.sl) { props.opacity = 'hide'; }

            //do the slide
            $.gf.crossCenterSlide(this, dist, speed, props, j);
        });

        //finally, any that got popped off the end, except the very last one (which is hidden anyways)
        for (j = 1; j < offScreen.length; j++) {
            props = $.gf.calcProps('leftStore', offScreen[j], j);
            props.opacity = 'hide';
            offScreen[j].animate(props, speed / (j + 1), 'linear');
        }

        //rebind events
        $.gf.bindSlides();
    };

    $.gf.crossCenterSlide = function(elem, dist, speed, props, j) {
        //if this image is crossing center, we need to animate to center first, then to the new position
        if (dist > 1 && j <= dist - 2) {
            var centerProps = $.gf.calcProps('center', elem);
            var speedAfterCenter = (speed / dist) * (j + 1);
            elem.data('afterProps', props);
            elem.animate(centerProps, speed - speedAfterCenter, function() {
                $(this).animate($(this).data('afterProps'), speedAfterCenter, 'linear');
                $(this).data('afterProps', '');
            });
        } else {
            elem.animate(props, speed, 'linear');
        }
    };

    $.gf.calcProps = function(dir, elem, j) {
        var left = 0;
        var pi = {};
        var li = {};
        var si = {};
        var index = 0;
        var leftFunc = null;
        switch (dir) {
            case 'left':
                leftFunc = $.gf.leftPrev;
                pi = $.l.p[j];
                li = $.l.l[j];
                si = $.l.s[j];
                index = $.l.i[j].data('index');
                break;
            case 'right':
                leftFunc = $.gf.rightPrev;
                pi = $.r.p[j];
                li = $.r.l[j];
                si = $.r.s[j];
                index = $.r.i[j].data('index');
                break;
            case 'leftStore':
                li = $.l.l[$.gl.sl - 1];
                pi = $.l.p[$.gl.sl - 1];
                si = $.l.s[$.gl.sl - 1];
                leftFunc = $.gf.leftPrev;
                index = $.l.i[$.gl.sl - 1].data('index');
                break;
            case 'rightStore':
                li = $.l.l[$.gl.sl - 1];
                pi = $.l.p[$.gl.sl - 1];
                si = $.l.s[$.gl.sl - 1];
                leftFunc = $.gf.leftPrev;
                index = $.l.i[$.gl.sl - 1].data('index');
                break;
            case 'center':
                pi = $.c.p;
                li = $.c.l;
                si = $.c.s;
                break;
            case 'zoom':
                pi = $.z.p;
                li = $.z.l;
                si = $.z.s;
                break;
        }
        if (dir !== 'center' && dir !== 'zoom') {
            left = li.l($.c.i, leftFunc($.c.i.data('index'), index));
        } else {
            switch (elem.data('layout')) {
                case 'landscape':
                    left = li.l;
                    break;
                case 'portrait':
                    left = pi.l;
                    break;
                case 'square':
                    left = si.l;
                    break;
            }
        }
        switch (elem.data('layout')) {
            case 'landscape':
                return { 'top': li.t,
                    'left': left,
                    'height': li.h,
                    'width': li.w
                };
            case 'portrait':
                return { 'top': pi.t,
                    'left': left,
                    'height': pi.h,
                    'width': pi.w
                };
            case 'square':
                return { 'top': si.t,
                    'left': left,
                    'height': si.h,
                    'width': si.w
                };
        }
    };

    $.gf.zoomIn = function() {
        //unbind everything while we're zoomed
        $.gl.i.unbind();

        var zi = null;
        switch ($.c.i.data('layout')) {
            case 'landscape':
                zi = $.z.l;
                break;
            case 'portrait':
                zi = $.z.p;
                break;
            case 'square':
                zi = $.z.s;
                break;
        }

        var props = $.gf.calcProps('zoom', $.c.i);
        var layout = $.c.i.data('layout');
        $.c.i.css('z-index', '99').animate(props, $.opts.zoomSpeed, 'linear', function() {
            $.c.i.one('click', $.gf.zoomOut);
            if ($.cp.enabled) {
                var pos = $.gf.capCss(layout, 'capShowImg');
                if ($.cp.location === 'bottom') { pos.top += $.cp.show.height; }
                $('#' + $.cp.show.id).css(pos).show().animate($.gf.capCss(layout, 'capShowImgFirstReveal'), 'fast', 'linear', function() {
                    $('#' + $.cp.show.id).one('click', $.gf.capReveal);
                });
            }
        });
    };

    $.gf.zoomOut = function() {
        if ($.cp.enabled) {
            $('#' + $.cp.show.id).animate({ 'height': 0 }, 50, 'linear', $.gf.zoomOutBody).unbind();
        } else {
            $.gf.zoomOutBody();
        }
        if ($.ap.enabled) {
            if ($.ap.handle !== null) { clearInterval($.ap.handle); }
            $.ap.handle = setInterval($.gf.autoPlayFunc, $.ap.timeout);
        }
    };

    $.gf.zoomOutBody = function() {
        var props = $.gf.calcProps('center', $.c.i);
        $.c.i.animate(props, $.opts.zoomSpeed, 'linear', $.gf.bindSlides);
    };

    $.gf.capReveal = function() {
        //unbind the image
        $.c.i.unbind();

        //conveniece var for layout
        var layout = $.c.i.data('layout');

        //create the caption box
        $.gl.c.append($.gf.capBox($.c.i.attr($.cp.attr)));

        //place the box and animate it to shown
        $('#' + $.cp.id).css($.gf.capCss(layout, 'boxLocation'))
                                        .animate($.gf.capCss(layout, 'boxReveal'), 'normal', 'linear');
        //animate the capShowImg to hidden
        $('#' + $.cp.show.id).animate($.gf.capCss(layout, 'capShowImgHide'), 'normal', 'linear', function() { $('#' + $.cp.show.id).hide(); });

        //animate the capHideImg to shown
        $('#' + $.cp.hide.id).css($.gf.capCss(layout, 'capHideImg')).show().animate($.gf.capCss(layout, 'capHideImgReveal'), 'normal', 'linear', function() {
            $('#' + $.cp.hide.id).one('click', function() {
                $.gf.capHide(false);
            });
            $.c.i.one('click', function() {
                $.gf.capHide(true);
            });
        });
    };

    $.gf.capHide = function(unzoom) {
        //conveniece var for layout
        var layout = $.c.i.data('layout');

        //hide the caption box
        $('#' + $.cp.id).animate($.gf.capCss(layout, 'boxHide'), 'normal', 'linear', function() { $('#' + $.cp.id).remove(); });

        //hide the "hide" img
        $('#' + $.cp.hide.id).animate($.gf.capCss(layout, 'capHideImgHide'), 'normal', 'linear', function() {
            $('#' + $.cp.hide.id).hide();
        });

        //show the cap reveal img
        $('#' + $.cp.show.id).show().animate($.gf.capCss(layout, 'capShowImgReveal'), 'normal', 'linear', function() {
            if (unzoom) {
                $('#' + $.cp.hide.id).unbind();
                $.gf.zoomOut();
            } else {
                $('#' + $.cp.show.id).one('click', $.gf.capReveal);
                $.c.i.one('click', $.gf.zoomOut);
            }
        });
    };

    $.gf.capBox = function(cap) {
        return '<span id="' + $.cp.id + '" style="' + $.cp.style + '" class="' + $.cp.boxClass + '">' + cap + '</span>';
    };

    $.gf.capCss = function(layout, type) {
        var zi = null;
        switch (layout) {
            case 'landscape':
                zi = $.z.l;
                break;
            case 'portrait':
                zi = $.z.p;
                break;
            case 'square':
                zi = $.z.s;
                break;
        }
        switch (type) {
            case 'boxLocation':
                var top = zi.t + parseInt($.c.i.css('borderTopWidth'), 10);
                if ($.cp.location === 'bottom') { top += zi.h; }
                return {
                    'top': top,
                    'left': zi.l + parseInt($.c.i.css('borderLeftWidth'), 10),
                    'width': zi.w,
                    'height': 0,
                    'position': 'absolute',
                    'z-index': '100'
                };
            case 'boxReveal':
                var toReturn = { height: Math.round($.cp.height(zi.h)) };
                if ($.cp.location === 'bottom') {
                    toReturn.top = zi.t + parseInt($.c.i.css('borderTopWidth'), 10) + zi.h - toReturn.height;
                }
                return toReturn;
            case 'boxHide':
                var toReturn = { height: 0 };
                if ($.cp.location === 'bottom') {
                    toReturn.top = zi.t + parseInt($.c.i.css('borderTopWidth'), 10) + zi.h;
                }
                return toReturn;
            case 'capShowImg':
                var top = zi.t + parseInt($.c.i.css('borderTopWidth'), 10);
                if ($.cp.location === 'bottom') { top += zi.h - $.cp.show.height; }
                return {
                    'height': 0,
                    'top': top,
                    'left': zi.l + (zi.w - $.cp.show.width) + parseInt($.c.i.css('borderLeftWidth'), 10),
                    'z-index': 100,
                    'position': 'absolute'
                };
            case 'capHideImg':
                var top = zi.t + $.cp.show.height + parseInt($.c.i.css('borderTopWidth'), 10);
                if ($.cp.location === 'bottom') { top += zi.h - $.cp.show.height; }
                return {
                    'top': top,
                    'left': zi.l + (zi.w - $.cp.hide.width) + parseInt($.c.i.css('borderLeftWidth'), 10),
                    'height': 0,
                    'position': 'absolute',
                    'z-index': '100'
                };
            case 'capShowImgFirstReveal':
                var toReturn = { height: $.cp.show.height };
                if ($.cp.location === 'bottom') {
                    toReturn.top = zi.t + parseInt($.c.i.css('borderTopWidth'), 10) + zi.h - toReturn.height;
                }
                return toReturn;
            case 'capShowImgReveal':
                var toReturn = {
                    'height': $.cp.show.height,
                    'top': zi.t + parseInt($.c.i.css('borderTopWidth'), 10)
                };
                if ($.cp.location === 'bottom') {
                    toReturn.top += zi.h - $.cp.hide.height;
                }
                return toReturn;
            case 'capHideImgReveal':
                var toReturn = {
                    'top': zi.t + (Math.round($.cp.height(zi.h))) + parseInt($.c.i.css('borderTopWidth'), 10),
                    'height': $.cp.hide.height
                };
                if ($.cp.location === 'bottom') {
                    toReturn.top += zi.h - (2 * (Math.round($.cp.height(zi.h)))) - $.cp.hide.height;
                }
                return toReturn;
            case 'capShowImgHide':
                var toReturn = {
                    'height': 0,
                    'top': zi.t + (Math.round($.cp.height(zi.h))) + parseInt($.c.i.css('borderTopWidth'), 10)
                };
                if ($.cp.location === 'bottom') {
                    toReturn.top += zi.h - (2 * (Math.round($.cp.height(zi.h))));
                }
                return toReturn;
            case 'capHideImgHide':
                var toReturn = {
                    'top': zi.t + $.cp.show.height + parseInt($.c.i.css('borderTopWidth'), 10),
                    'height': 0
                };
                if ($.cp.location === 'bottom') {
                    toReturn.top += zi.h - $.cp.show.height;
                }
                return toReturn;
        }
    };

    //initial set up for center image positioning
    $.gf.setCenter = function(index) {
        $.c.i = $.gl.i.filter(function() { return $.data(this, 'index') == index; });
        switch ($.c.i.data('layout')) {
            case 'landscape':
                $.c.i.css({
                    'top': $.c.l.t,
                    'left': $.c.l.l,
                    'height': $.c.l.h,
                    'width': $.c.l.w
                });
                break;
            case 'portrait':
                $.c.i.css({
                    'top': $.c.p.t,
                    'left': $.c.p.l,
                    'height': $.c.p.h,
                    'width': $.c.p.w
                });
                break;
            case 'square':
                $.c.i.css({
                    'top': $.c.s.t,
                    'left': $.c.s.l,
                    'height': $.c.s.h,
                    'width': $.c.s.w
                });
                break;
        }
        $.c.i.show();
    };

    $.gf.setRight = function(index) {
        $.r.i = [];
        for (var i = 0; i < $.gl.sl; i++) {
            var temp = $.gl.i.filter(function() { return $.data(this, 'index') == index; });
            $.r.i.push(temp);
            index = temp.data('next');
        }
        for (i = 0; i < $.gl.sl; i++) {
            var $prev = $.gf.rightPrev($.c.i.data('index'), $.r.i[i].data('index'));
            switch ($.r.i[i].data('layout')) {
                case 'landscape':
                    $.r.i[i].css({
                        'top': $.r.l[i].t,
                        'height': $.r.l[i].h,
                        'width': $.r.l[i].w,
                        'left': $.r.l[i].l($.c.i, $prev)
                    });
                    break;
                case 'portrait':
                    $.r.i[i].css({
                        'top': $.r.p[i].t,
                        'height': $.r.p[i].h,
                        'width': $.r.p[i].w,
                        'left': $.r.p[i].l($.c.i, $prev)
                    });
                    break;
                case 'square':
                    $.r.i[i].css({
                        'top': $.r.s[i].t,
                        'height': $.r.s[i].h,
                        'width': $.r.s[i].w,
                        'left': $.r.s[i].l($.c.i, $prev)
                    });
                    break;
            }
            if (i + 1 != $.gl.sl) { $.r.i[i].show(); }
        }
    };

    $.gf.setLeft = function(index) {
        $.l.i = [];
        for (var i = 0; i < $.gl.sl; i++) {
            var temp = $.gl.i.filter(function() { return $.data(this, 'index') == index; });
            $.l.i.push(temp);
            index = temp.data('prev');
        }
        for (i = 0; i < $.gl.sl; i++) {
            var $prev = $.gf.leftPrev($.c.i.data('index'), $.l.i[i].data('index'));
            switch ($.l.i[i].data('layout')) {
                case 'landscape':
                    $.l.i[i].css({
                        'top': $.l.l[i].t,
                        'height': $.l.l[i].h,
                        'width': $.l.l[i].w,
                        'left': $.l.l[i].l($.c.i, $prev)
                    });
                    break;
                case 'portrait':
                    $.l.i[i].css({
                        'top': $.l.p[i].t,
                        'height': $.l.p[i].h,
                        'width': $.l.p[i].w,
                        'left': $.l.p[i].l($.c.i, $prev)
                    });
                    break;
                case 'square':
                    $.l.i[i].css({
                        'top': $.l.s[i].t,
                        'height': $.l.s[i].h,
                        'width': $.l.s[i].w,
                        'left': $.l.s[i].l($.c.i, $prev)
                    });
                    break;
            }
            if (i + 1 != $.gl.sl) { $.l.i[i].show(); }
        }
    };

    $.gf.definePositions = function() {
        //determine container dimensions
        var container = $.gl.c;
        if (container[0].tagName == 'BODY') {
            container = $(window);
        }
        var Gheight = container.height();
        var Gwidth = container.width();

        $.l.l = [];
        $.l.p = [];
        $.l.s = [];
        $.r.l = [];
        $.r.p = [];
        $.r.s = [];

        //determine center dimensions and positions
        $.c.l = {
            h: Math.round($.ls.height),
            w: Math.round($.ls.width),
            t: Math.round(Gheight / 2) - ($.ls.height / 2),
            l: Math.round(Gwidth / 2) - ($.ls.width / 2)
        };
        $.c.p = {
            h: Math.round($.pt.height),
            w: Math.round($.pt.width),
            t: Math.round(Gheight / 2) - ($.pt.height / 2),
            l: Math.round(Gwidth / 2) - ($.pt.width / 2)
        };
        $.c.s = {
            h: Math.round($.sq.height),
            w: Math.round($.sq.width),
            t: Math.round(Gheight / 2) - ($.sq.height / 2),
            l: Math.round(Gwidth / 2) - ($.sq.width / 2)
        };

        //determine center zoom dimensions and positions
        $.z.l = {
            h: Math.round($.ls.zoom($.c.l.h)),
            w: Math.round($.ls.zoom($.c.l.w)),
            t: Math.round((Gheight / 2) - (Math.round($.ls.zoom($.c.l.h)) / 2)),
            l: Math.round((Gwidth / 2) - (Math.round($.ls.zoom($.c.l.w)) / 2))
        };
        $.z.p = {
            h: Math.round($.pt.zoom($.c.p.h)),
            w: Math.round($.pt.zoom($.c.p.w)),
            t: Math.round((Gheight / 2) - (Math.round($.pt.zoom($.c.p.h)) / 2)),
            l: Math.round((Gwidth / 2) - (Math.round($.pt.zoom($.c.p.w)) / 2))
        };
        $.z.s = {
            h: Math.round($.sq.zoom($.c.s.h)),
            w: Math.round($.sq.zoom($.c.s.w)),
            t: Math.round((Gheight / 2) - (Math.round($.sq.zoom($.c.s.h)) / 2)),
            l: Math.round((Gwidth / 2) - (Math.round($.sq.zoom($.c.s.w)) / 2))
        };

        //convenience var giving how many position slots we need on either side of center
        $.gl.sl = ($.opts.showCount + 1) / 2;

        //base landscape image pos/dim object that we'll use to make the rest
        var trueL = {
            h: Math.round($.ls.shrink($.ls.height)),
            w: Math.round($.ls.shrink($.ls.width)),
            t: Math.round($.c.l.t + (($.ls.height - $.ls.shrink($.ls.height)) / 2)),
            l: $.gf.leftMovingLeft
        };

        //base portrait image pos/dim object that we'll use to make the rest
        var trueP = {
            h: Math.round($.pt.shrink($.pt.height)),
            w: Math.round($.pt.shrink($.pt.width)),
            t: Math.round($.c.p.t + (($.pt.height - $.pt.shrink($.pt.height)) / 2)),
            l: $.gf.leftMovingLeft
        };

        //base square image pos/dim object that we'll use to make the rest
        var trueS = {
            h: Math.round($.sq.shrink($.sq.height)),
            w: Math.round($.sq.shrink($.sq.width)),
            t: Math.round($.c.s.t + (($.sq.height - $.sq.shrink($.sq.height)) / 2)),
            l: $.gf.leftMovingLeft
        };

        //turn the trues into something we can modify
        var l = $.extend(true, {}, trueL);
        var p = $.extend(true, {}, trueP);
        var s = $.extend(true, {}, trueS);

        //add the first slots to the left
        $.l.l.push($.extend(true, {}, l));
        $.l.p.push($.extend(true, {}, p));
        $.l.s.push($.extend(true, {}, s));

        //add additional slots to the left until we're full
        var newH = 0;
        for (var i = 1; i < $.gl.sl; i++) {
            //landscape
            newH = Math.round($.ls.shrink(l.h));
            l.t = Math.round(l.t + ((l.h - newH) / 2));
            l.w = Math.round($.ls.shrink(l.w));
            l.h = newH;
            $.l.l.push($.extend(true, {}, l));

            //portrait
            newH = Math.round($.pt.shrink(p.h));
            p.t = Math.round(p.t + ((p.h - newH) / 2));
            p.w = Math.round($.pt.shrink(p.w));
            p.h = newH;
            $.l.p.push($.extend(true, {}, p));

            //square
            newH = Math.round($.sq.shrink(s.h));
            s.t = Math.round(s.t + ((s.h - newH) / 2));
            s.w = Math.round($.sq.shrink(s.w));
            s.h = newH;
            $.l.s.push($.extend(true, {}, s));
        }

        //reset the mod objects to the trues
        l = $.extend(true, {}, trueL);
        p = $.extend(true, {}, trueP);
        s = $.extend(true, {}, trueS);
        //redefine the left calc function - we're moving to the right now
        l.l = $.gf.leftMovingRight;
        p.l = $.gf.leftMovingRight;
        s.l = $.gf.leftMovingRight;

        //add the first slots to the right
        $.r.l.push($.extend(true, {}, l));
        $.r.p.push($.extend(true, {}, p));
        $.r.s.push($.extend(true, {}, s));

        //add additional slots to the right until we're full
        for (i = 1; i < $.gl.sl; i++) {
            //landscape
            newH = Math.round($.ls.shrink(l.h));
            l.t = Math.round(l.t + ((l.h - newH) / 2));
            l.w = Math.round($.ls.shrink(l.w));
            l.h = newH;
            $.r.l.push($.extend(true, {}, l));

            //portrait
            newH = Math.round($.pt.shrink(p.h));
            p.t = Math.round(p.t + ((p.h - newH) / 2));
            p.w = Math.round($.pt.shrink(p.w));
            p.h = newH;
            $.r.p.push($.extend(true, {}, p));

            //square
            newH = Math.round($.sq.shrink(s.h));
            s.t = Math.round(s.t + ((s.h - newH) / 2));
            s.w = Math.round($.sq.shrink(s.w));
            s.h = newH;
            $.r.s.push($.extend(true, {}, s));
        }
    };

    $.gf.leftMovingLeft = function(center, prevAndSelf) {
        var left = 0;
        switch (center.data('layout')) {
            case 'landscape':
                left = $.c.l.l;
                break;
            case 'portrait':
                left = $.c.p.l;
                break;
            case 'square':
                left = $.c.s.l;
                break;
            default:
                left = $.c.l.l;
                break;
        }
        $.each(prevAndSelf.get().reverse(), function(i) {
            switch ($(this).data('layout')) {
                case 'landscape':
                    left = left - ($.l.l[i].w + $.opts.gutterWidth);
                    break;
                case 'portrait':
                    left = left - ($.l.p[i].w + $.opts.gutterWidth);
                    break;
                case 'square':
                    left = left - ($.l.s[i].w + $.opts.gutterWidth);
                    break;
            }
        });
        return left;
    };

    $.gf.leftMovingRight = function(center, prev) {
        var left = 0;
        switch (center.data('layout')) {
            case 'landscape':
                left = $.c.l.l + $.c.l.w + $.opts.gutterWidth;
                break;
            case 'portrait':
                left = $.c.p.l + $.c.p.w + $.opts.gutterWidth;
                break;
            case 'square':
                left = $.c.s.l + $.c.s.w + $.opts.gutterWidth;
                break;
        }
        prev.each(function(i) {
            switch ($(this).data('layout')) {
                case 'landscape':
                    left = left + ($.r.l[i].w + $.opts.gutterWidth);
                    break;
                case 'portrait':
                    left = left + ($.r.p[i].w + $.opts.gutterWidth);
                    break;
                case 'square':
                    left = left + ($.r.s[i].w + $.opts.gutterWidth);
                    break;
            }
        });
        return left;
    };

    $.gf.leftPrev = function(centerIndex, index) {
        var wrap = centerIndex < index;
        return $.gl.i.filter(function() {
            var currIndex = $.data(this, 'index');
            if (wrap) {
                return currIndex >= index || (currIndex < index && currIndex < centerIndex);
            } else {
                return currIndex >= index && currIndex < centerIndex;
            }
        });
    };

    $.gf.rightPrev = function(centerIndex, index) {
        var wrap = centerIndex > index;
        return $.gl.i.filter(function() {
            var currIndex = $.data(this, 'index');
            if (wrap) {
                return currIndex < index || (currIndex > index && currIndex > centerIndex);
            } else {
                return currIndex < index && currIndex > centerIndex;
            }
        });
    };
})(jQuery);