/*
 * @Author      changbin.wangcb
 * @Date        2013.08.08
 * @Description design
 */

jQuery.namespace('FE.tools.design');
(function($, Design){
    var jq          = $,                // ����ʹ��jq������$,��ΪVM��$�ǹؼ���
        animateIdx  = 1,                // ����Ԫ��index
        anchorIdx   = 1,                // ê��index
        currentTime = 0.1,              // ��ǰʱ��
        vm          = null,
        emptyam     = {
            name             : '����' + animateIdx,
            className        : 'img img-' + animateIdx,
            img              : 'http://img.f2e.taobao.net/img.png?x=100x100',
            title            : '',
            beginTime        : currentTime,
            duration         : 1,
            animateType      : '',
            top              : 0,
            left             : 0,
            height           : 0,
            width            : 0,
            zIndex           : 0,
            hasHoverEvent    : false,
            hoverAnimateType : ''
        },
        currentAm = null,
        $amMask = null,
        emptyac = {
            className : 'anchor anchor-' + anchorIdx,
            title     : '',
            height    : 100,
            width     : 100,
            href      : '#',
            top       : 0,
            left      : 0
        },
        doc = $(document),
        win = $(window),
        currentAc = null,
        $acMask = null,
        $container = null,
        $titu = null,
        $mainStage = null,
        $background = null,
        $animateSet = null,
        $anchorSet = null;

    /* ��ͼ������ʼ������ */
    var inDesign = {
        init: function () {
            var supportTrans = Modernizr.csstransitions;

            if( jq.util.ua.ie6 ) return;

            if( supportTrans ){
                for ( var i in this ) {
                    if (i !== 'init') {
                        this[i]();
                    }
                }
            }else{ 
                jq('img.img').css('opacity', 1);
            }
        }
    };

    // ��ͼ����ģ��
    function designModel () {
        this['designBgImg']  = ko.observable('http://img.china.alibaba.com/cms/upload/2013/776/368/1863677_495534923.jpg');        // ��ͼ����
        this['fixBgImg']     = ko.observable('');        // ie6 fix jpg����
        this['contentBgImg'] = ko.observable('');        // ������ͼ�Ľ��䱳��
        this['contentBg']    = ko.observable('#fff');     // ����ɫ
        this['designHeight'] = ko.observable(300);       // ��ͼ�߶�
        this['designStyle']  = ko.computed({             // ��ͼ��ʽ
            read: function(){
                var style = '';

                style = '#in-design .mod-titu { height: ' + this.designHeight() + 'px; }';

                if ( this.designBgImg() !== '' ){
                    style += '#in-design { background-color: ' + this.contentBg() + '; background-image: url(' + this.designBgImg() + ');';

                    if( this.fixBgImg() !== '' ){
                        style += ' _background-image: url(' + this.fixBgImg() + ');';
                    }

                    style += ' }'
                }

                return style;
            },
            owner: this
        });
        this['contentStyle'] = ko.computed({            // �󱳾���ʽ
            read: function(){
                var style = '';

                style = '.cell-page-main { background-color: ' + this.contentBg() + ';';

                if( this.contentBgImg() !== '' ){
                    style += ' background-image: url(' + this.contentBgImg() + ')';
                }

                style += ' }';

                return style;
            },
            owner: this
        });
        this['animates']     = ko.observableArray([  // �����б���̬��ӣ�
            
        ]);
        this['anchors']      = ko.observableArray([  // ê���б���̬��ӣ�

        ]);
        this['style']        = ko.computed({         // ��ͼ������ʽ
            read: function(){
                var style = '',
                    animates = this.animates(),
                    anchors = this.anchors();

                style = this.designStyle() + '\n' + this.contentStyle() + '\n';
                
                if( animates.length > 0 ){
                    for( var i = 0, l = animates.length; i < l; i++ ){
                        style += animates[i].style() + '\n';
                    }
                }

                if( anchors.length > 0 ){
                    for( var i = 0, l = anchors.length; i < l; i++ ){
                        style += anchors[i].style() + '\n';
                    }
                }

                return style;
            },
            owner: this
        });
    }

    // ��ͼ����Ԫ������ģ��
    function animateModel (obj) {
        if( typeof obj !== 'undefined' ){   // set
            this['name']             = ko.observable(obj.name);
            this['className']        = ko.observable(obj.className);        // ����img class
            this['img']              = ko.observable(obj.img);              // ����img png24
            this['title']            = ko.observable(obj.title);            // alt
            this['beginTime']        = ko.observable(obj.beginTime);        // ��ʼʱ��
            this['duration']         = ko.observable(obj.duration);         // ����ʱ��
            this['animateType']      = ko.observable(obj.animateType);      // ��������
            this['top']              = ko.observable(obj.top);              // top
            this['left']             = ko.observable(obj.left);             // left
            this['height']           = ko.observable(obj.height);          
            this['width']            = ko.observable(obj.width);
            this['zIndex']           = ko.observable(obj.zIndex);
            this['hasHoverEvent']    = ko.observable(obj.hasHoverEvent);    // �Ƿ���hoverЧ��
            this['hoverAnimateType'] = ko.observable(obj.hoverAnimateType); // hover��������
        }else{  // get
            this['name']             = ko.observable('����' + animateIdx);
            this['className']        = ko.observable('img img-' + animateIdx);      // ����img class
            this['img']              = ko.observable('');                           // ����img png24
            this['title']            = ko.observable('');                           // alt
            this['beginTime']        = ko.observable(currentTime);                  // ��ʼʱ��
            this['duration']         = ko.observable(1);                            // ����ʱ��
            this['animateType']      = ko.observable('');                           // ��������
            this['top']              = ko.observable(0);                            // top
            this['left']             = ko.observable(0);                            // left
            this['height']           = ko.observable(0);          
            this['width']            = ko.observable(0);
            this['zIndex']           = ko.observable(0);
            this['hasHoverEvent']    = ko.observable(false);                        // �Ƿ���hoverЧ��
            this['hoverAnimateType'] = ko.observable('');                           // hover��������
        }
        
        // ��ͼ����Ԫ����ʽ
        this['style']            = ko.computed({
            read: function(){
                var style = '';

                style = '#in-design .mod-titu .' + this.className().split(' ')[1] + ' { top: ' + this.top() + 'px; left: ' + this.left() + 'px; ';

                if( this.zIndex() !== 0 ){
                    style = style + 'z-index: ' + this.zIndex() +';';
                }

                if( this.duration() !== 1 ){
                    style = style + '-webkit-animation-duration: ' + this.duration() + 's;'
                          + '-moz-animation-duration: ' + this.duration() + 's;'
                          + '-o-animation-duration: ' + this.duration() + 's;'
                          + '-ms-animation-duration: ' + this.duration() + 's;'
                          + 'animation-duration: ' + this.duration() + 's;';
                }

                style = style + '}';

                return style;
            },
            owner: this
        });

        // ��ͼ����js
        this.animateFn           = ko.computed({
            read: function(){
                if( this.animateType() !== '' ){
                    var className = this.className().split(' ')[1],
                        fnStr = '',
                        _this = $('#in-design div.mod-titu img.' + className);

                    _this.removeClass().addClass('img ' + className + ' animated ' + this.animateType() );

                    fnStr = "var _this = jQuery('#in-design div.mod-titu img." + className + "');";
                    // fnStr = fnStr + "_this.css('opacity', 0);";
                    fnStr = fnStr + "setTimeout(function(){ _this.css({ 'opacity': 1 }).addClass('animated " + this.animateType() + "');";
                    fnStr = fnStr + "}, " + this.beginTime() * 1000 + ");";

                    // hover����
                    // TODO hover��ʱ��д��̫���ˣ�����ڱ༭��ʱ����ֹ����¼�
                    if( this.hasHoverEvent() && this.hoverAnimateType() !== '' ){
                        fnStr = fnStr + "setTimeout(function(){ _this.removeClass('animated " + this.animateType() + "');"
                              + "jQuery('#in-design').on('mouseenter.design', function(){ _this.addClass('animated " + this.hoverAnimateType() + "'); });"
                              + "jQuery('#in-design').on('mouseleave.design', function(){ _this.removeClass('animated " + this.hoverAnimateType() + "'); });"
                              + "}, 6000);"; 
                    }

                    inDesign[className] = new Function(fnStr);

                    inDesign[className]();
                }
            },
            owner: this
        });
    }

    // ê������ģ��
    function anchorModel (obj) {
        if( typeof obj !== 'undefined' ){
            this['className'] = ko.observable(obj.className);
            this['title']     = ko.observable(obj.title);
            this['height']    = ko.observable(obj.height);
            this['width']     = ko.observable(obj.width);
            this['href']      = ko.observable(obj.href);
            this['top']       = ko.observable(obj.top);          // top
            this['left']      = ko.observable(obj.left);         // left
        }else{
            this['className'] = ko.observable('anchor anchor-' + anchorIdx);
            this['title']     = ko.observable('');
            this['height']    = ko.observable(100);
            this['width']     = ko.observable(100);
            this['href']      = ko.observable('#');
            this['top']       = ko.observable(0);         // top
            this['left']      = ko.observable(0);         // left
        }
        
        // ê����ʽ
        this['style']     = ko.computed({
            read: function(){
                var style = '';

                // ie9���£����ӻᱻpng24��ͼƬĪ������
                style = '#in-design .mod-titu .' + this.className().split(' ')[1] + ' { top: ' + this.top() + 'px; left: ' + this.left() + 'px;' 
                      + 'height: ' + this.height() + 'px; width: ' + this.width() + 'px; background-color: #fff; opacity: 0; filter:alpha(opacity=0); }';

                return style;
            },
            owner: this
        });
    }

    // �򵥵Ķ���ת����string
    function objectToString( obj ) {
        var str = '';

        function nativeToString( value ) {
            var result = {};

            // ������ֵΪobject��ת����string
            for( var i in value ){
                if( value.hasOwnProperty(i) ){
                    if( value[i] !== null ){
                        result[i] = value[i].toString().replace(/[\n\r]/g, '');
                    }
                }
            }

            result = JSON.stringify(result, null, 4);

            return result;
        }

        str = nativeToString(obj);

        return str;
    }

    // ��ȡ��ͼhtml
    function getHTML(){
        var style = '',
            html = '',
            js = '',
            code = '';

        // ������Ԫ����Ԥ��ʱ�����Ĵ���
        $('img.img', $titu).css('opacity', 0).each(function(idx, el){
            var _this = $(el),
                className = _this.attr('class');

            className = className.replace(/(img img-(\d)+).*/g, '$1');
            _this.removeClass().addClass(className);
        });
        
        // style
        style = $('.const-style').html() + $('.var-style').html();
        style = cssbeautify(style, {    // ��ʽ��css
            indent        : '    ',
            autosemicolon : true
        });
        style = '<style type="text/css">' + '\n' + style + '</style>';
        style = '<link rel="stylesheet" type="text/css" href="http://static.c.aliimg.com/css/app/operation/module/third/animate.css" />' + '\n' + style;

        // html
        html = $('#in-design').html();
        // ȥ��knouckout�İ����
        html = html.replace(/data-bind=\".*?\"/gi, '');
        html = html.replace(/<!-- \/?ko.*-->/gi, '');
        html = html.replace(/<img(.*?)>/gi, '<img$1/>');    // �պ�img��ǩ
        html = html.replace(/style=\".*?\"/gi, '');         // ȥ������style
        html = '<div id="in-design">' + '\n' + html + '</div>';    

        // �������ͼ����Ԫ�أ����js
        if( vm.animates().length > 0 ){
            js = objectToString(inDesign);    
            js = '(function(jq){ var inDesign = ' + js + '; jq(function(){ inDesign.init(); }); })(jQuery);';
            js = js_beautify(js.replace(/\"(function(.*)\(\)\s*{.*})\"/g, '$1'));   // ��֮ǰת��Ϊ�ַ�����function���Ȱ�˫����ȥ��
            js = '<script type="text/javascript" src="http://static.c.aliimg.com/js/app/operation/module/third/modernizr.min.js"></script>'
               + '<script type="text/javascript">' + '\n'
               // + 'if( typeof jQuery === "undefined" ){ alert("��ͼ����������jQuery������ϵǰ�˽�fdev-min.js����header�"); }' + '\n'
               + js + '\n' + '</script>';
        }

        code = style + '\n' + html + '\n' + js;

        return code;
    }

    // ��ȡ��ͼ����ģ��
    function getModel(){
        var vmObj      = ko.mapping.toJS(vm),
            temp       = '',
            anchorTemp = '',
            model      = null;

        // ��style������Ϊnull����Ϊ����ģ���ﲻ��Ҫ��Щ��������Ϊnull������toString��ʱ����˵�
        vmObj['contentStyle'] = null;
        vmObj['designStyle']  = null;
        vmObj['style']        = null;
        temp                  = '[';
        anchorTemp            = '[';

        for( var i = 0, l = vmObj['animates'].length; i < l; i++ ){
            delete vmObj['animates'][i]['style'];
            temp = temp + (i > 0 ? ',' : '') + JSON.stringify(vmObj['animates'][i], null, 4);
        }

        temp += ']';

        for( var i = 0, l = vmObj['anchors'].length; i < l; i++ ){
            delete vmObj['anchors'][i]['style'];
            anchorTemp = anchorTemp + (i > 0 ? ',' : '') + JSON.stringify(vmObj['anchors'][i], null, 4);
        }

        anchorTemp += ']';

        model = objectToString(vmObj);
        model = model.replace(/\"animates\": \"(\[object Object\](,)?)*\"/gi, '"animates": ' + temp);
        model = model.replace(/\"anchors\": \"(\[object Object\](,)?)*\"/gi, '"anchors": ' + anchorTemp);
        model = js_beautify(model);

        return model;
    }

    // �½�
    function add(){
        var am = null,
            cm = null;

        vm = new designModel();
        am = new animateModel($.extend({}, emptyam));
        cm = new anchorModel($.extend({}, emptyac));

        ko.applyBindings(vm, $mainStage[0]);
        ko.applyBindings(vm, $background[0]);
        ko.applyBindings(am, $animateSet[0]);
        ko.applyBindings(cm, $anchorSet[0]);
        
        bindEvent();
    }

    /**
     * �޸�
     * @param  {Json} obj ����ģ��
     * @return {Boolean}
     */
    function edit(obj){
        var vmObj = null,
            amL = 0,
            anL = 0,
            am = null,
            cm = null;

        vm = new designModel();

        try{
            vmObj = JSON.parse(obj);
        }catch(ex){
            alert('��������ȷ����ģ��!');
            return;
        }
        
        for( var i in vmObj ){
            if( !(vmObj[i] instanceof Array) ){
                vm[i](vmObj[i]);
            }else{
                for( var j = 0, l = vmObj[i].length; j < l; j++ ){
                    if( i === 'animates' ){
                        vm.animates.push(new animateModel(vmObj[i][j]));
                    }else{
                        vm.anchors.push(new anchorModel(vmObj[i][j]));
                    }
                }
            }
        }

        amL = vmObj['animates'].length;
        anL = vmObj['anchors'].length;

        if( amL > 0 ){
            animateIdx = parseInt(vmObj['animates'][amL - 1].className.slice(8)) + 1;
        }

        if( anL > 0 ){
            anchorIdx = parseInt(vmObj['anchors'][anL - 1].className.slice(14)) + 1;
        }

        ko.applyBindings(vm, $mainStage[0]);
        ko.applyBindings(vm, $background[0]);
        
        currentAm = vm.animates()[0];
        if( currentAm ){
            ko.applyBindings(currentAm, $animateSet[0]);
        }else{
            am = new animateModel($.extend({}, emptyam));
            ko.applyBindings(am, $animateSet[0]);
        }

        currentAc = vm.anchors()[0];
        if( currentAc ){
            ko.applyBindings(currentAc, $anchorSet[0]);
        }else{
            cm = new anchorModel($.extend({}, emptyac));
            ko.applyBindings(cm, $anchorSet[0]);
        }

        bindEvent();

        return true;
    }

    // ����ͼ�㹤���¼�
    function animateSetEvent(){
        // ��Ӷ���ͼ��
        $('div.action button', $animateSet).click(function(e){
            var am = null,
                amObj = {
                    name      : '����' + animateIdx,
                    className : 'img img-' + animateIdx,
                    beginTime : currentTime
                };

            e.preventDefault();

            amObj = $.extend(emptyam, amObj);
            am = new animateModel(amObj);
            currentAm = am;

            vm.animates.push(am);
            ko.applyBindings(am, $animateSet[0]);

            // ����Ч���б�߶�������Ӧ�ģ�����Ҫ��һ��
            $('div.am-content:gt(0)', $animateSet).height($animateSet.data('height'));

            // ����ק�¼�
            $.use("ui-draggable", function(){
                var elem = $('img.' + am.className().split(' ')[1], $titu);

                elem.draggable({
                    disable: true,
                    cursor: 'move',
                    start :function(){
                        tool.container.hide();
                    },       
                    stop: function(){
                        var _this = $(this),
                            idx = $('img', $titu).index(_this);

                        vm.animates()[idx].left(parseInt(_this.css('left')));
                        vm.animates()[idx].top(parseInt(_this.css('top')));     
                        _this.attr('style', 'opacity: 1;');     // ȥ��left��top��������ʽ��������������¼���ʧЧ����Ϊ�������Ҹĵ�Ҳ��style�ļ�����ʽ�Ḳ�ǣ�
                        tool.pos();
                    }
                });

                tool.show(elem);
            });
            
            animateIdx++;
            // TODO: ����Ӧ�üӵ���duration�űȽϺ�
            currentTime += 1;

            $amMask.hide();
        });

        // ���ö���Ч��
        $animateSet.on('click', 'div.am-normal dl.am-list a', function(e){
            e.preventDefault();

            currentAm.animateType($(this).data('value'));
            tool.current && tool.current.addClass('selected');
        });

        // ����hover����Ч��
        $animateSet.on('click', 'div.am-hover dl.am-list a', function(e){
            e.preventDefault();

            currentAm.hoverAnimateType($(this).data('value'));
            currentAm.hasHoverEvent(true);
        });

        // ����Ч��Ԥ��
        $animateSet.on('click', 'a.play', function(e){
            var parent,
                className = currentAm.className(),
                elem;

            e.preventDefault();

            className = className.split(' ')[1];
            elem = $('img.' + className, $titu);
            elem.removeClass().addClass('img ' + className);

            parent = $(this).closest('div.am-content');

            if( parent.hasClass('am-normal') ){
                inDesign[className] && inDesign[className]();
            }else{
                $titu.trigger('mouseenter.design');
            }

            elem.addClass('selected');
        });
    }

    function bindEvent(){
        // δѡ��״̬���������
        $amMask.show();
        $acMask.show();

        animateSetEvent();
        tool.init();

        // focus
        $titu.on('click', 'img.img', function(){
            tool.show($(this));
        }).on('click', 'a.anchor', function(e){
            e.preventDefault();

            tool.show($(this));
        });

        // ȡ��ѡ��
        $titu.on('click', function(e){
            var _this = $(e.target);
            
            if( !_this.hasClass('img') && !_this.hasClass('anchor') ){
                tool.hide();
            }
        });

        // ����չ��
        $('#toolbox').on('click', 'div.am-header', function(){
            $(this).next('div.am-content').slideToggle();
        });

        // �������
        $('div.action button', $anchorSet).click(function(e){
            var ac = null,
                acObj = {
                    className : 'anchor anchor-' + anchorIdx,
                };

            e.preventDefault();

            acObj = $.extend(emptyac, acObj);
            ac = new anchorModel(acObj);
            currentAc = ac;

            vm.anchors.push(ac);
            ko.applyBindings(ac, $anchorSet[0]);

            // ����ק�¼�
            $.use("ui-draggable",function(){
                var elem = $('a.' + ac.className().split(' ')[1], $titu);

                elem.draggable({
                    disable: true,
                    cursor: 'move',
                    start: function(){
                        tool.container.hide();
                    },
                    stop: function(){
                        var _this = $(this),
                            idx = $('a', $titu).index(_this);

                        vm.anchors()[idx].left(parseInt(_this.css('left')));
                        vm.anchors()[idx].top(parseInt(_this.css('top')));

                        _this.attr('style', '');
                        tool.pos();
                    }
                });

                tool.show(elem);
            });
            
            anchorIdx++;

            $acMask.hide();
        });

        // Ԥ����ͼ���嶯��
        $('#content div.main-stage a.play').on('click', function(e){
            e.preventDefault();

            getHTML();
            tool.hide();            
            inDesign.init();    // Ԥ����ͼ����Ч��
        });

        // �����ز���ק
        $.use("ui-draggable, ui-droppable", function(){
            $('img', $titu).draggable({
                disable: true,
                cursor: 'move',
                start: function(){
                    tool.container.hide();
                },
                stop: function(){
                    var _this = $(this),
                        idx = $('img', $titu).index(_this);

                    vm.animates()[idx].left(parseInt(_this.css('left')));
                    vm.animates()[idx].top(parseInt(_this.css('top')));
                    _this.attr('style', 'opacity: 1;');
                    tool.pos();
                }
            });

            $('a.anchor', $titu).draggable({
                disable: true,
                cursor: 'move',
                start: function(){
                    tool.container.hide();
                },
                stop: function(){
                    var _this = $(this),
                        idx = $('a', $titu).index(_this);

                    vm.anchors()[idx].left(parseInt(_this.css('left')));
                    vm.anchors()[idx].top(parseInt(_this.css('top')));

                    _this.attr('style', '');
                    tool.pos();
                }
            });
        });

        // ����ͼƬ�޸�����Ӧ�߶�
        $('#design-bg').on('change', function(){
            var _this = $('img.img-hid');

            _this.on('load', function(){
                vm.designHeight(_this.height());
            });
        });
    }

    // tool �ز�С����
    var tool = {
        init: function(){
            this.render();
            this.bindEvent();
            this.current = null;
            this.type = null;
        },
        render: function(){
            var html = '';

            html = '<div class="tool-panel">'
                 +      '<span class="fn-panel del" title="ɾ��"></span>'
                 +      '<span class="fn-panel setUp" title="����ͼ��"></span>'
                 +      '<span class="fn-panel setBottom" title="����ͼ��"></span>'
                 + '</div>';

            this.container = $(html).appendTo($titu);
            /*this.$del = this.container.find('span.del');
            this.$setUp = this.container.find('span.setUp');
            this.$setBottom = this.container.find('span.setBottom');*/
        },
        show: function(elem){
            var className,
                am = null,
                ac = null,
                idx = 0,
                pos;

            if( this.current && this.current[0] == elem[0] ){
                return;
            }

            this.current && this.current.removeClass('selected');
            this.container.hide();
            $amMask.show();
            $acMask.show();

            className = elem.attr('class').split(' ');
            this.type = className[0];
            elem.addClass('selected').draggable("enable");

            this.current = elem;
            this.pos();

            if( this.type === 'img' ){
                idx = $titu.find('img.img').index(elem);
                am = vm.animates()[idx];
                ko.applyBindings(am, $animateSet[0]);
                currentAm = am;

                // ����Ч���б�߶�������Ӧ�ģ�����Ҫ��һ��
                $('div.am-content:gt(0)', $animateSet).height($animateSet.data('height'));
                $amMask.hide();
            }else{
                idx = $titu.find('a.anchor').index(elem);
                ac = vm.anchors()[idx];
                ko.applyBindings(ac, $anchorSet[0]);
                currentAc = ac;
                $acMask.hide();
            } 

            if( !$titu.data('events')['keydown'] ){
                doc.on('keydown.inDesign', keydownIndesign);
            }
        },
        hide: function(){
            if( !this.current ){
                return;
            }

            this.current.draggable("disable");
            this.current.removeClass('selected');
            this.container.hide();
            this.current = null;
            currentAm = null;
            currentAc = null;
            $amMask.show();
            $acMask.show();
            doc.off('keydown.inDesign');
        },
        pos: function(){
            var pos;

            pos = this.current.position();

            this.container.show().css({
                'left': pos.left - 22,
                'top': pos.top - 2
            });
        },
        bindEvent: function(){
            var self = this;

            // ɾ��
            self.container.find('span.del').click(function(){
                var classNameArr = self.current.attr('class').split(' '),
                    className;

                self.container.hide();

                classNameArr.length = 2;
                className = classNameArr.join(' ');

                if( self.type === 'img' ){
                    vm.animates.remove(function(item) {
                        return item.className() === className;
                    });

                    delete inDesign[classNameArr[1]];
                }else{
                    vm.anchors.remove(function(item) {
                        return item.className() === className;
                    });
                }
            });

            // ����
            self.container.find('span.setUp').click(function(){

            });

            // ����
            self.container.find('span.setBottom').click(function(){

            });
        }
    };

    // ��������΢��
    function keydownIndesign(e){
        var _this = $('#in-design .selected'),
            idx = 0,
            left,
            top;

        e.preventDefault();

        if( _this.length > 0 ){
            if( _this[0].tagName.toLowerCase() === 'img' ){
                idx = $('img', $titu).index(_this);

                left = vm.animates()[idx].left();
                top = vm.animates()[idx].top();

                switch(e.keyCode){
                    case $.ui.keyCode.LEFT:
                        vm.animates()[idx].left(left - 1);
                        break;
                    case $.ui.keyCode.UP:
                        vm.animates()[idx].top(top - 1);
                        break;
                    case $.ui.keyCode.RIGHT:
                        vm.animates()[idx].left(left + 1);
                        break;
                    case $.ui.keyCode.DOWN:
                        vm.animates()[idx].top(top + 1);
                        break;
                    // ����Ҫdefault
                }
            }else{
                idx = $('a.anchor', $titu).index(_this);

                left = vm.anchors()[idx].left();
                top = vm.anchors()[idx].top();

                switch(e.keyCode){
                    case $.ui.keyCode.LEFT:
                        vm.anchors()[idx].left(left - 1);
                        break;
                    case $.ui.keyCode.UP:
                        vm.anchors()[idx].top(top - 1);
                        break;
                    case $.ui.keyCode.RIGHT:
                        vm.anchors()[idx].left(left + 1);
                        break;
                    case $.ui.keyCode.DOWN:
                        vm.anchors()[idx].top(top + 1);
                        break;
                    // ����Ҫdefault
                }
            }
        }
    }

    Design.getHTML = getHTML;
    Design.getModel = getModel;
    Design.add = add;
    Design.edit =edit;

    $(function(){
         $.use('ui-colorbox', function(){
            $('.colorBox').colorbox({
                update: true,
                triggerType: 'focus',
                select:function(e,ui){
                    $(this).trigger('change')
                }
            });
        });

        $amMask     = $('#animate-set div.mask');
        $acMask     = $('#anchor-set div.mask');
        $container  = $('#in-design');
        $titu       = $('div.mod-titu', $container);
        $mainStage  = $('#content div.main-stage');
        $background = $('#content div.background');
        $animateSet = $('#animate-set');
        $anchorSet  = $('#anchor-set');
    });

})(jQuery, FE.tools.design);