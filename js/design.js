/*
 * @Author      changbin.wangcb
 * @Date        2013.08.08
 * @Description design
 */

jQuery.namespace('FE.tools.design');
(function($, Design){
    var jq          = $,                // 这里使用jq而不是$,因为VM里$是关键字
        doc = $(document),
        win = $(window),
        animateIdx  = 1,                // 动画元素index
        anchorIdx   = 1,                // 锚点index
        currentTime = 0.1,              // 当前时间
        currentZIndex = 1,              // 最大的zIndex
        vm          = null,
        emptyam     = {
            name             : '动画' + animateIdx,
            className        : 'img img-' + animateIdx,
            img              : 'http://img.f2e.taobao.net/img.png?x=100x100',
            title            : '',
            beginTime        : currentTime,
            duration         : 1,
            animateCount     : false,
            animateType      : '',
            top              : 0,
            left             : 0,
            height           : 0,
            width            : 0,
            zIndex           : currentZIndex,
            // hasHoverEvent    : false,
            hoverAnimateType : ''
        },
        currentAm = null,               // 当前选中的动画图层
        $amMask = null,                 // 动画图层设置区遮罩
        emptyac = {
            className : 'anchor anchor-' + anchorIdx,
            title     : '',
            height    : 100,
            width     : 100,
            href      : '#',
            top       : 0,
            left      : 0,
            action    : false
        },
        currentAc = null,               // 当前选中的热区
        $acMask = null,                 // 热区设置区遮罩
        $container = null,              // 题图动画容器
        $titu = null,                   // 题图动画990部分
        $mainStage = null,              // 动画画布，ko绑定节点
        $background = null,             // 背景设置区
        $animateSet = null,             // 动画图层设置区
        $anchorSet = null,              // 热区设置区
        playing = false,                // 是否在播放
        newAM = null,
        newCM = null,
        hLen = 21,                      // 历史记录的长度
        historys = [],                  // 历史记录
        rHistorys = [];                 // 撤销历史记录

    /* 题图动画初始化函数 */
    var inDesign = {
        init: function () {
            var supportTrans = Modernizr.csstransitions;

            if( jq.util.ua.ie6 ) return;

            if( supportTrans ){
                for ( var i in this ) {
                    if (i !== 'init' ) {
                        this[i]();
                    }
                }
            }else{ 
                jq('#in-design div.mod-titu img.img').css('opacity', 1);
            }
        },
        bookmark: function(){
            jq.add('web-browser', {
                js: ['http://style.c.aliimg.com/fdevlib/js/fdev-v4/widget/web/browser-min.js'],
                ver: '1.0'
            });

            jq('#in-design div.mod-titu a.bookmark').click(function(e){
                if( !playing ) return;
                e.preventDefault();

                jq.use('web-browser', function(){
                    FE.util.addBookmark();
                });
            });
        }
    };

    // 动画预览开始
    // 编辑的时候添加editing class，保证无限循环的动画只播放一次
    function start(){
        $('#content').removeClass('editing');
        $('#play-wrap header a.play').addClass('paused').attr('title', '暂停');
    }

    // 动画预览结束
    // 播放结束时，添加paused class，设置animation-play-state: paused;暂停动画
    function end(){
        $('#content').addClass('editing').addClass('paused');
        $('#play-wrap header a.play').removeClass('paused', '播放');

        setTimeout(function(){
            $('#content').removeClass('paused');
        }, 100);
    }

    // 题图数据模型
    function designModel () {
        this['designBgImg']  = ko.observable('http://img.china.alibaba.com/cms/upload/2013/776/368/1863677_495534923.jpg');        // 题图背景
        this['fixBgImg']     = ko.observable('');        // ie6 fix jpg背景
        this['contentBgImg'] = ko.observable('');        // 超出题图的渐变背景
        this['contentBg']    = ko.observable('#fff');     // 背景色
        this['designHeight'] = ko.observable(300);       // 题图高度
        this['designStyle']  = ko.computed({             // 题图样式
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
        this['contentStyle'] = ko.computed({            // 大背景样式
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
        this['animates']     = ko.observableArray([  // 动画列表（动态添加）
            
        ]);
        this['anchors']      = ko.observableArray([  // 锚点列表（动态添加）

        ]);
        this['style']        = ko.computed({         // 题图整体样式
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

    // 题图动画元素数据模型
    function animateModel (obj) {
        if( typeof obj !== 'undefined' ){   // set
            this['name']             = ko.observable(obj.name);
            this['className']        = ko.observable(obj.className);        // 动画img class
            this['img']              = ko.observable(obj.img);              // 动画img png24
            this['title']            = ko.observable(obj.title);            // alt
            this['beginTime']        = ko.observable(obj.beginTime);        // 开始时间
            this['duration']         = ko.observable(obj.duration);         // 持续时间
            this['animateCount']     = ko.observable(obj.animateCount);     // 动画播放次数
            this['animateType']      = ko.observable(obj.animateType);      // 动画类型
            this['top']              = ko.observable(obj.top);              // top
            this['left']             = ko.observable(obj.left);             // left
            this['height']           = ko.observable(obj.height);          
            this['width']            = ko.observable(obj.width);
            this['zIndex']           = ko.observable(obj.zIndex);
            // this['hasHoverEvent']    = ko.observable(obj.hasHoverEvent);    // 是否有hover效果
            this['hoverAnimateType'] = ko.observable(obj.hoverAnimateType); // hover动画类型
            this['disable']          = ko.observable(false);                // 编辑时删除的标识，实际数据中会删除
        }else{  // get
            this['name']             = ko.observable('动画' + animateIdx);
            this['className']        = ko.observable('img img-' + animateIdx);      // 动画img class
            this['img']              = ko.observable('');                           // 动画img png24
            this['title']            = ko.observable('');                           // alt
            this['beginTime']        = ko.observable(currentTime);                  // 开始时间
            this['duration']         = ko.observable(1);                            // 持续时间
            this['animateCount']     = ko.observable(false);                        // 动画播放次数
            this['animateType']      = ko.observable('');                           // 动画类型
            this['top']              = ko.observable(0);                            // top
            this['left']             = ko.observable(0);                            // left
            this['height']           = ko.observable(0);          
            this['width']            = ko.observable(0);
            this['zIndex']           = ko.observable(currentZIndex);
            // this['hasHoverEvent']    = ko.observable(false);                        // 是否有hover效果
            this['hoverAnimateType'] = ko.observable('');                           // hover动画类型
            this['disable']          = ko.observable(false);
        }
        
        // 题图动画元素样式
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

                if( this.animateCount() ){
                    style = style + '-webkit-animation-iteration-count: infinite;'
                          + '-moz-animation-iteration-count: infinite;'
                          + '-o-animation-iteration-count: infinite;'
                          + '-ms-animation-iteration-count: infinite;'
                          + 'animation-iteration-count: infinite';
                }

                style = style + '}';

                return style;
            },
            owner: this
        });

        // 题图动画js
        this.animateFn           = ko.computed({
            read: function(){
                if( !this.disable() ){
                    var className = this.className().split(' ')[1],
                        fnStr = '',
                        _this = $('#in-design div.mod-titu img.' + className);

                    if( this.animateType() !== '' && this.animateType() !== 'none' ){
                        _this.removeClass().addClass('img ' + className + ' animated ' + this.animateType() );

                        fnStr = "var _this = jQuery('#in-design div.mod-titu img." + className + "');";
                        // fnStr = fnStr + "_this.css('opacity', 0);";
                        fnStr = fnStr + "setTimeout(function(){ _this.css({ 'opacity': 1 }).addClass('animated " + this.animateType() + "');";
                        fnStr = fnStr + "}, " + this.beginTime() * 1000 + ");";

                        // hover动画
                        // TODO hover的时间写的太死了，如何在编辑的时候阻止这个事件
                        if( /*this.hasHoverEvent() && */this.hoverAnimateType() !== '' ){
                            fnStr = fnStr + "setTimeout(function(){ _this.removeClass('animated " + this.animateType() + "');"
                                  + "jQuery('#in-design').on('mouseenter.design', function(){ _this.addClass('animated " + this.hoverAnimateType() + "'); });"
                                  + "jQuery('#in-design').on('mouseleave.design', function(){ _this.removeClass('animated " + this.hoverAnimateType() + "'); });"
                                  + "}, 6000);"; 
                        }

                        inDesign[className] = new Function(fnStr);

                        // inDesign[className]();
                    }else{
                        _this.hasClass('selected') ? _this.removeClass().addClass('img ' + className + ' selected') : _this.removeClass().addClass('img ' + className);

                        inDesign[className] && delete inDesign[className];
                    }
                }
            },
            owner: this
        }); 
    }

    // 锚点数据模型
    function anchorModel (obj) {
        if( typeof obj !== 'undefined' ){
            this['className'] = ko.observable(obj.className);
            this['title']     = ko.observable(obj.title);
            this['height']    = ko.observable(obj.height);
            this['width']     = ko.observable(obj.width);
            this['href']      = ko.observable(obj.href);
            this['top']       = ko.observable(obj.top);          // top
            this['left']      = ko.observable(obj.left);         // left
            this['disable']   = ko.observable(false);
            this['action']    = ko.observable(obj.action);       // 预设功能（现在只支持收藏页面）
        }else{
            this['className'] = ko.observable('anchor anchor-' + anchorIdx);
            this['title']     = ko.observable('');
            this['height']    = ko.observable(100);
            this['width']     = ko.observable(100);
            this['href']      = ko.observable('#');
            this['top']       = ko.observable(0);         // top
            this['left']      = ko.observable(0);         // left
            this['disable']   = ko.observable(false);
            this['action']    = ko.observable(false);
        }
        
        // 锚点样式
        this['style']     = ko.computed({
            read: function(){
                var style = '',
                    className = '',
                    id = '',
                    _this = null;

                className = this.className();
                id = this.className().split(' ')[1];
                _this = $('a.' + id, $titu);

                // 通过添加class的方式添加收藏功能
                if( this.action() ){
                    if( className.indexOf('bookmark') === -1 ){
                        this.className(className + ' ' + 'bookmark');
                        _this.addClass('selected');
                    }
                }else{
                    if( className.indexOf('bookmark') > -1 ){
                        this.className(className.replace(' bookmark', ''));
                        _this.addClass('selected');
                    }
                }

                // ie9以下，链接会被png24的图片莫名覆盖
                style = '#in-design .mod-titu .' + id + ' { top: ' + this.top() + 'px; left: ' + this.left() + 'px;' 
                      + 'height: ' + this.height() + 'px; width: ' + this.width() + 'px; background-color: #fff; opacity: 0; filter:alpha(opacity=0); }';

                return style;
            },
            owner: this
        });
    }

    // 简单的对象转换成string
    function objectToString( obj ) {
        var str = '';

        function nativeToString( value ) {
            var result = {};

            // 将属性值为object的转换成string
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

    // 获取题图html
    function getHTML(){
        var style = '',
            html = '',
            js = '',
            code = '',
            isAnimate = false,
            isBookmark = false,
            fnObj = null,
            i, len;

        tool.hide();
        // getModel();

        // 清理动画元素上预览时产生的代码
        $('img.img', $titu).each(function(idx, el){
            var _this = $(el),
                className = _this.attr('class');

            className = className.replace(/(img img-(\d)+ (disable)?).*/g, '$1');
            _this.removeClass().addClass(className);
        });
        
        // style
        style = $('.const-style').html() + $('.var-style').html();

        // 去掉已删除标记为disable的元素style
        $('img.img, a.anchor', $titu).each(function(idx, el){
            var _this = $(el),
                className = _this.attr('class').split(' ')[1],
                reg;

            if( _this.hasClass('disable') ){
                reg = new RegExp('\\#in-design \\.mod-titu \\.' + className + ' \\{[\\s\\S]*?\\}', 'gi');
                style = style.replace(reg, '');
            }
        });

        style = cssbeautify(style, {    // 格式化css
            indent        : '    ',
            autosemicolon : true
        });
        style = '<style type="text/css">' + '\n' + style + '</style>';
        style = '<link rel="stylesheet" type="text/css" href="http://style.c.aliimg.com/fdevlib/css/gallery/animate/animate-min.css" />' + '\n' + style;

        // html
        html = $('#in-design').html();
        // 去掉knouckout的绑定语句
        html = html.replace(/data-bind=\".*?\"/gi, '');
        html = html.replace(/<!-- \/?ko.*-->/gi, '');
        html = html.replace(/<img(.*?)>/gi, '<img$1 />');    // 闭合img标签
        html = html.replace(/style=\".*?\"/gi, '');         // 去掉内联style
        html = html.replace(/aria-disabled=\".*?\"/gi, '');     // 去掉dragable添加的标识
        html = html.replace(/<div class=\"tool-panel.*?<\/div>/gi, '');    // 去掉toolPannel
        html = html.replace(/<img .*?disable.*? \/>/gi, '');               // 去掉已删除标记为disable的元素
        html = html.replace(/<a .*?disable.*?>.*?<\/a>/gi, '');
        html = '<div id="in-design">' + '\n' + html + '</div>';

        // extend，因为不希望编辑中的收藏方法去掉
        fnObj = $.extend(true, {}, inDesign);

        // 判断是否有动画
        for( i = 0, len = vm.animates().length; i < len; i++ ){
            if( vm.animates()[i].animateType() !== '' && vm.animates()[i].animateType() !== 'none' ){
                isAnimate = true;
            }
        }

        // 判断是否有收藏页面热区，没有的话就删掉收藏方法
        for( i = 0, len = vm.anchors().length; i < len; i++ ){
            if( vm.anchors()[i].action() ){
                isBookmark = true;
            }
        }  

        if( !isBookmark ){
            delete fnObj['bookmark'];
        }

        // 如果有题图动画元素，添加js
        if( isAnimate || isBookmark ){
            js = objectToString(fnObj);    
            js = '(function(jq){ var inDesign = ' + js + '; jq(function(){ inDesign.init(); }); })(jQuery);';
            js = js_beautify(js.replace(/\"(function(.*)\(\)\s*{.*})\"/g, '$1'));   // 将之前转换为字符串的function，先把双引号去掉
            js = '<script type="text/javascript" src="http://static.c.aliimg.com/js/app/operation/module/third/modernizr.min.js"></script>'
               + '<script type="text/javascript">' + '\n'
               // + 'if( typeof jQuery === "undefined" ){ alert("题图动画依赖于jQuery，请联系前端将fdev-min.js置于header里！"); }' + '\n'
               + js + '\n' + '</script>';
        }

        js = js.replace('if (!playing) return;', '');

        code = style + '\n' + html + '\n' + js;

        return code;
    }

    // 获取题图数据模型
    function getModel(){
        var vmObj      = ko.mapping.toJS(vm),
            temp       = '',
            anchorTemp = '',
            model      = null;

        // 将style部分置为null，因为数据模型里不需要这些，所以设为null，待会toString的时候过滤掉
        vmObj['contentStyle'] = null;
        vmObj['designStyle']  = null;
        vmObj['style']        = null;
        temp                  = '[';
        anchorTemp            = '[';

        for( var i = 0, l = vmObj['animates'].length; i < l; i++ ){
            if( vmObj['animates'][i]['disable'] ){
                vmObj['animates'][i]['disable'] = null;
                continue;
            }

            delete vmObj['animates'][i]['style'];
            delete vmObj['animates'][i]['disable'];
            temp = temp + (i > 0 ? ',' : '') + JSON.stringify(vmObj['animates'][i], null, 4);
        }

        temp += ']';

        for( var i = 0, l = vmObj['anchors'].length; i < l; i++ ){
            if( vmObj['anchors'][i]['disable'] ){
                vmObj['animates'][i]['disable'] = null;
                continue;
            }

            delete vmObj['anchors'][i]['style'];
            delete vmObj['anchors'][i]['disable'];
            anchorTemp = anchorTemp + (i > 0 ? ',' : '') + JSON.stringify(vmObj['anchors'][i], null, 4);
        }

        anchorTemp += ']';

        model = objectToString(vmObj);
        model = model.replace(/\"animates\": \"(\[object Object\](,)?)*\"/gi, '"animates": ' + temp);
        model = model.replace(/\"anchors\": \"(\[object Object\](,)?)*\"/gi, '"anchors": ' + anchorTemp);
        model = js_beautify(model);

        return model;
    }

    // 新建
    function add(){
        vm = new designModel();
        newAM = new animateModel($.extend({}, emptyam));
        newCM = new anchorModel($.extend({}, emptyac));
        setHistory('new');

        ko.applyBindings(vm, $mainStage[0]);
        ko.applyBindings(vm, $background[0]);
        ko.applyBindings(newAM, $animateSet[0]);
        ko.applyBindings(newCM, $anchorSet[0]);

        fullScreen();
        autoHeight();
        bindEvent();
    }

    /**
     * 修改
     * @param  {Json} obj 数据模型
     * @return {Boolean}
     */
    function edit(obj){
        var vmObj = null,
            amL = 0,
            anL = 0,
            am = null,
            cm = null;

        vm = new designModel();
        newAM = new animateModel($.extend({}, emptyam));
        newCM = new anchorModel($.extend({}, emptyac));

        try{
            vmObj = JSON.parse(obj);
        }catch(ex){
            alert('请输入正确数据模型!');

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

        currentZIndex = vm.animates().length + 1;

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
        
        currentAm = vm.animates()[0] || null;

        if( currentAm ){
            ko.applyBindings(currentAm, $animateSet[0]);
        }else{
            ko.applyBindings(newAM, $animateSet[0]);
        }

        currentAc = vm.anchors()[0] || null;

        if( currentAc ){
            ko.applyBindings(currentAc, $anchorSet[0]);
        }else{
            ko.applyBindings(newCM, $anchorSet[0]);
        }

        fullScreen();
        autoHeight();
        setHistory('edit');
        bindEvent();

        return true;
    }

    // 动画图层工具事件
    function animateSetEvent(){
        // 添加动画图层
        $('div.action button', $animateSet).click(function(e){
            var am = null,
                elem = null,
                amObj = {
                    name      : '动画' + animateIdx,
                    className : 'img img-' + animateIdx,
                    beginTime : currentTime,
                    zIndex    : currentZIndex
                };

            e.preventDefault();

            amObj = $.extend(emptyam, amObj);
            am = new animateModel(amObj);
            currentAm = am;

            vm.animates.push(am);
            ko.applyBindings(am, $animateSet[0]);

            // 动画效果列表高度是自适应的，所以要算一下
            autoHeight();

            // 绑定拖拽事件
            elem = $('img.' + am.className().split(' ')[1], $titu);

            elem.zoomAndMove({
                isMove: true,
                isZoom: false,
                moveStart: function(info) {
                    tool.container.hide();
                },
                moveEnd: function(info) {
                    var _this = info.obj,
                        ops = {};

                    currentAm = am;     // 临时方案

                    ops.oLeft = am.left();
                    ops.oTop = am.top();
                    am.left(info.left);
                    am.top(info.top); 
                    ops.left = info.left;
                    ops.top = info.top; 

                    _this.attr('style', 'opacity: 1;');     // 去掉left、top的内联样式，否则键盘左右事件会失效（因为键盘左右改的也是style文件，样式会覆盖）
                    tool.pos();
                    setHistory('AMmove', ops);
                },
                always: function(){
                    tool.container.show();
                }
            });
            
            tool.show(elem);

            animateIdx++;
            // TODO: 这里应该加的是duration才比较好
            currentTime += 1;
            currentZIndex += 1;
            setHistory('add');

            $amMask.hide();
        });

        // 设置动画效果
        $animateSet.on('click', 'div.am-normal dl.am-list a', function(e){
            var type = {};

            e.preventDefault();

            $animateSet.find('div.am-normal dl.am-list a').removeClass('selected');
            $(this).addClass('selected');
            
            type.oType = currentAm.animateType();
            type.type = $(this).data('value');
            currentAm.animateType(type.type);
            setHistory('amType', type);

            tool.current && tool.current.addClass('selected');
        });

        // 设置hover动画效果
        $animateSet.on('click', 'div.am-hover dl.am-list a', function(e){
            var type = {};

            e.preventDefault();

            $animateSet.find('div.am-hover dl.am-list a').removeClass('selected');
            $(this).addClass('selected');

            type.oType = currentAm.hoverAnimateType();
            type.type = $(this).data('value');
            currentAm.hoverAnimateType(type.type);
            // currentAm.hasHoverEvent(true);

            setHistory('hoverType', type);
        });

        // 动画效果预览
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
                // inDesign[className] && inDesign[className]();
                setTimeout(function(){
                    elem.addClass(' animated ' + currentAm.animateType());
                }, 100);
                
            }else{
                $titu.trigger('mouseenter.design');
            }

            elem.addClass('selected');
        });
    }

    // nav事件
    function navEvent(){
        var nav = $('div.nav ul.options'),
            preview = $('#play-wrap'),
            previewContent = $('div.default-area', preview);

        $('a.bar-a-repeal', nav).on('click', repeal);

        $('a.bar-a-recover', nav).on('click', recover);

        $('a.bar-a-preview', nav).on('click', function(e){
            e.preventDefault();

            preview.addClass('md-modal');
            previewContent.addClass('md-content');
            
            setTimeout(function(){
                preview.addClass('md-show');

                playing = true;
                $('header a.play', preview).trigger('click');
            }, 100);
        });

        $('header a.close', preview).click(function(e){
            e.preventDefault();

            preview.removeClass('md-show');

            setTimeout(function(){
                previewContent.removeClass('md-content');
                preview.removeClass('md-modal');

                playing = false;
                end();
            }, 100);
        });

        // 点击任何区域，结束播放
        doc.on('click', function(e){
            var _this = $(e.target);

            if( $('#content').hasClass('editing') ){
                return;
            }

            // 预览的时候不结束动画
            if( preview.hasClass('md-modal') ){
                return;
            }

            if( !_this.hasClass('play') && !_this.hasClass('bar-a-preview') ){
                end();
            }
        });
    }

    function bindEvent(e){
        // 未选中状态，添加遮罩
        $amMask.show();
        $acMask.show();

        animateSetEvent();
        navEvent();
        tool.init();

        getLength();
        getRLength();

        // focus
        $titu.on('click', 'img.img', function(){
            tool.show($(this));
        }).on('click', 'a.anchor', function(e){
            e.preventDefault();

            tool.show($(this));
        });

        // 取消选中
        $titu.on('click', function(e){
            var _this = $(e.target);
            
            if( !_this.hasClass('img') && !_this.hasClass('anchor') && !_this.closest('div.tool-panel').length && !_this.closest('a').hasClass('anchor') ){
                tool.hide();
            }
        });

        // 收缩展开
        $('#toolbox').on('click', 'div.am-header', function(){
            $(this).toggleClass('expand').next('div.am-content').toggle(0, function(){
                autoHeight(true);
            });
        });

        $animateSet.on('click', 'dl.am-list dt', function(){
            $(this).toggleClass('expand').next('dd').slideToggle();
        });

        // 添加热区
        $('div.action button', $anchorSet).click(function(e){
            var ac = null,
                elem = null,
                acObj = {
                    className : 'anchor anchor-' + anchorIdx,
                };

            e.preventDefault();

            acObj = $.extend(emptyac, acObj);
            ac = new anchorModel(acObj);
            currentAc = ac;

            vm.anchors.push(ac);
            ko.applyBindings(ac, $anchorSet[0]);

            // 绑定拖拽事件
            elem = $('a.' + ac.className().split(' ')[1], $titu);

            // 绑定拖拽事件
            elem.zoomAndMove({
                isMove: true,
                isZoom: true,
                moveStart: function(info) {
                    tool.container.hide();
                },
                moveEnd: function(info) {
                    var _this = info.obj,
                        ops = {};

                    currentAc = ac; // 临时方案

                    ops.oLeft = ac.left();
                    ops.oTop = ac.top();
                    ac.left(info.left);
                    ac.top(info.top);
                    ops.left = info.left;
                    ops.top = info.top;

                    _this.attr('style', '');
                    tool.pos();
                    setHistory('ACmove', ops);
                },
                zoomStart: function() {
                    tool.container.hide();
                },
                zoomEnd: function(info) {
                    var _this = info.obj,
                        ops = {};

                    currentAc = ac;     // 临时方案

                    ops.oWidth = ac.width();
                    ops.oHeight = ac.height();
                    ac.width(info.width);
                    ac.height(info.height);
                    ops.width = info.width;
                    ops.height = info.height;

                    // zoom的时候可能既做zoom操作，又做了move的操作
                    ops.oLeft = ac.left();
                    ops.oTop = ac.top();
                    ac.left(info.left);
                    ac.top(info.top);
                    ops.left = info.left;
                    ops.top = info.top;

                    _this.attr('style', '');
                    tool.pos();
                    setHistory('ACzoom', ops);
                },
                always: function(){
                    tool.container.show();
                }
            });

            tool.show(elem);
            
            anchorIdx++;
            setHistory('add');

            $acMask.hide();
        });

        // 预览题图整体动画
        $('#content div.main-stage a.play').on('click', function(e){
            e.preventDefault();

            if( $(this).hasClass('paused') ){
                end();
            }else{
                start();

                getHTML();
                tool.hide();            
                inDesign.init();    // 预览题图动画效果
            }
        });

        // 动画素材拖拽
        $('img', $titu).zoomAndMove({
            isMove: true,
            isZoom: false,
            moveStart: function(info) {
                tool.container.hide();
            },
            moveEnd: function(info) {
                var _this = info.obj,
                    idx = $('img', $titu).index(_this),
                    am = vm.animates()[idx];
                    ops = {};

                currentAm = am;     // 临时方案

                ops.oLeft = am.left();
                ops.oTop = am.top();
                am.left(info.left);
                am.top(info.top); 
                ops.left = info.left;
                ops.top = info.top;    

                _this.attr('style', 'opacity: 1;');     // 去掉left、top的内联样式，否则键盘左右事件会失效（因为键盘左右改的也是style文件，样式会覆盖）
                tool.pos();
                setHistory('AMmove', ops);
            },
            always: function(){
                tool.container.show();
            }
        });

        $('a.anchor', $titu).zoomAndMove({
            isMove: true,
            isZoom: true,
            moveStart: function(info) {
                tool.container.hide();
            },
            moveEnd: function(info) {
                var _this = info.obj,
                    idx = $('a', $titu).index(_this),
                    ac = vm.anchors()[idx],
                    ops = {};

                currentAc = ac;     // 临时方案

                ops.oLeft = ac.left();
                ops.oTop = ac.top();
                ac.left(info.left);
                ac.top(info.top);
                ops.left = info.left;
                ops.top = info.top;

                _this.attr('style', '');
                tool.pos();
                setHistory('ACmove', ops);
            },
            zoomStart: function() {
                tool.container.hide();
            },
            zoomEnd: function(info) {
                var _this = info.obj,
                    idx = $('a', $titu).index(_this),
                    ac = vm.anchors()[idx],
                    ops = {};

                currentAc = ac;     // 临时方案

                ops.oWidth = ac.width();
                ops.oHeight = ac.height();
                ac.width(info.width);
                ac.height(info.height);
                ops.width = info.width;
                ops.height = info.height;

                // zoom的时候可能既做zoom操作，又做了move的操作
                ops.oLeft = ac.left();
                ops.oTop = ac.top();
                ac.left(info.left);
                ac.top(info.top);
                ops.left = info.left;
                ops.top = info.top;

                _this.attr('style', '');
                tool.pos();
                setHistory('ACzoom', ops);
            },
            always: function(){
                tool.container.show();
            }
        });

        // 背景图片修改自适应高度
        $('#design-bg').on('change', function(){
            var _this = $('img.img-hid');

            _this.on('load', function(){
                vm.designHeight(_this.height());
                setHistory('height');
            });
        });
    }

    // 撤销
    function repeal(e){
        var obj = null,
            current = null,
            idx,
            len;

        e.preventDefault();

        if( historys.length <= 1 ){
            return;
        }

        rHistorys.length >= hLen && rHistorys.shift();
        obj = historys.pop();
        current = historys.length && historys[historys.length - 1];
        rHistorys.push(obj);
        vm = current && current.viewModel;

        switch(obj.operation){
            case 'add':     // 添加
                if( obj.am ){
                    obj.am.disable(true);
                    obj.am.className(obj.am.className() + ' disable');
                }

                if( obj.cm ){
                    obj.cm.disable(true);
                    obj.cm.className(obj.cm.className() + ' disable');
                }

                tool.hide();
                swap(current);
                break;
            case 'delete':  // 删除
                if( obj.am ){
                    obj.am.disable(false);
                    obj.am.className(obj.am.className().replace(' disable', ''));
                }

                if( obj.cm ){
                    obj.cm.disable(false);
                    obj.cm.className(obj.cm.className().replace(' disable', ''));
                }

                tool.hide();
                swap(current);
                obj.extra.am && zIndex('deleteR', obj.am);
                break;
            case 'AMmove':  // 移动动画图层
                obj.am.left(obj.extra.oLeft);
                obj.am.top(obj.extra.oTop);
                swap(current);
                tool.pos();
                break;
            case 'ACmove':  // 移动热区
                obj.cm.left(obj.extra.oLeft);
                obj.cm.top(obj.extra.oTop);
                swap(current);
                tool.pos();
                break;
            case 'zIndex':  // 上移下移图层
                obj.am.zIndex(obj.extra.oIndex);
                obj.extra.oIndex > obj.extra.index ? zIndex('downR', obj.am) : zIndex('upR', obj.am);
                swap(current);
                tool.pos();
                break;
            case 'ACzoom':  // 缩放热区
                obj.cm.left(obj.extra.oLeft);
                obj.cm.top(obj.extra.oTop);
                obj.cm.width(obj.extra.oWidth);
                obj.cm.height(obj.extra.oHeight);
                swap(current);
                tool.pos();
                break;
            case 'amType':  // 动画类型
                obj.am.animateType(obj.extra.oType);
                swap(current);
                break;
            case 'hoverType':   // hover动画类型
                obj.am.hoverAnimateType(obj.extra.oType);
                swap(current);
                break;
        }

        getLength();
        getRLength();
    }

    // 恢复
    function recover(e){
        var obj = null,
            current = null;

        e.preventDefault();

        if( rHistorys.length < 1 ){
            return;
        }

        // rHistorys.length >= hLen && rHistorys.shift();
        current = rHistorys.pop();
        obj = historys.length && historys[historys.length - 1];
        historys.push(current);
        vm = current && current.viewModel;

        switch(current.operation){
            case 'add':
                if( current.am ){
                    current.am.disable(false);
                    current.am.className(current.am.className().replace(' disable', ''));
                }

                if( current.cm ){
                    current.cm.disable(false);
                    current.cm.className(current.cm.className().replace(' disable', ''));
                }

                tool.hide();
                swap(current);
                break;
            case 'delete':
                if( current.am ){
                    current.am.disable(true);
                    current.am.className(current.am.className() + ' disable');
                }

                if( current.cm ){
                    current.cm.disable(true);
                    current.cm.className(current.cm.className() + ' disable');
                }

                tool.hide();
                swap(current);
                current.extra.am && zIndex('delete', current.am);
                break;
            case 'AMmove':
                current.am.left(current.extra.left);
                current.am.top(current.extra.top);
                swap(current);
                tool.pos();
                break;
            case 'ACmove':
                current.cm.left(current.extra.left);
                current.cm.top(current.extra.top);
                swap(current);
                tool.pos();
                break;
            case 'zIndex':
                current.am.zIndex(current.extra.index);
                obj.extra.oIndex > obj.extra.index ? zIndex('down', current.am) : zIndex('up', current.am);
                swap(current);
                break;
            case 'ACzoom':
                current.cm.left(current.extra.left);
                current.cm.top(current.extra.top);
                current.cm.width(current.extra.width);
                current.cm.height(current.extra.height);
                swap(current);
                tool.pos();
                break;
            case 'amType':
                current.am.animateType(current.extra.type);
                swap(current);
                break;
            case 'hoverType':
                current.am.hoverAnimateType(current.extra.type);
                swap(current);
                break;
        }

        getLength();
        getRLength();
    }

    // 增加或者删除的时候替换当前选中的状态
    function swap(current){
        if( !current ){
            return;
        }

        if( current.am ){
            current.am.disable() || tool.show($('img.' + current.am.className().split(' ')[1], $titu));
            ko.applyBindings(current.am, $animateSet[0]);
        }else{
            ko.applyBindings(newAM, $animateSet[0]);
        }

        // 动画效果列表高度是自适应的，所以要算一下
        // $('div.am-content:gt(0)', $animateSet).height($animateSet.data('height'));
        autoHeight();

        if( current.cm ){
            current.cm.disable() || tool.show($('a.' + current.cm.className().split(' ')[1], $titu));   
            ko.applyBindings(current.cm, $anchorSet[0]);
        }else{
            ko.applyBindings(newCM, $anchorSet[0]);
        }
    }

    // 历史记录
    function setHistory(op, ex){
        historys.length >= hLen && historys.shift();
        historys.push({
            viewModel : $.extend(true, {}, vm),
            am        : currentAm,
            cm        : currentAc,
            operation : op,
            extra     : ex
        });
        rHistorys.length = 0;
        
        getLength();
        getRLength();
    }

    // 控制撤销按钮的disable
    function getLength(){
        var len = historys.length,
            repeal = $('div.nav ul.options a.bar-a-repeal');

        if( len > 1 ){
            repeal.removeClass('btn-disabled');
        }else{
            repeal.addClass('btn-disabled');
        }
    }

    // 控制恢复按钮的disable
    function getRLength(){
        var len = rHistorys.length,
            recover = $('div.nav ul.options a.bar-a-recover');

        if( len > 0 ){
            recover.removeClass('btn-disabled');

            return true;
        }else{
            recover.addClass('btn-disabled');

            return false;
        }
    }

    // tool 素材小工具
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
                 +      '<span class="fn-panel del" title="删除"></span>'
                 +      '<span class="fn-panel setUp" title="上移图层"></span>'
                 +      '<span class="fn-panel setBottom" title="下移图层"></span>'
                 + '</div>';

            this.container = $(html).appendTo($titu);
        },
        show: function(elem){
            var className,
                lists = null,
                am = null,
                ac = null,
                idx = 0,
                pos;
            
            this.container.css('zIndex', elem.css('zIndex')); 

            if( this.current && this.current[0] == elem[0] ){
                return;
            }

            this.current && this.current.removeClass('selected')/*.draggable("disable")*/;
            this.container.removeClass('tool-panel-swap').hide();
            $amMask.show();
            $acMask.show();

            className = elem.attr('class').split(' ');
            this.type = className[0];
            elem.addClass('selected')/*.draggable("enable")*/;

            this.current = elem;
            this.pos();

            if( this.type === 'img' ){
                lists = $titu.find('img.img');
                idx = lists.index(elem);
                am = vm.animates()[idx];
                ko.applyBindings(am, $animateSet[0]);
                currentAm = am;

                if( $titu.find('img.img:not(.disable)').length > 1 ){
                    this.container.addClass('tool-panel-swap');
                }

                // 动画效果列表高度是自适应的，所以要算一下
                // $('div.am-content:gt(0)', $animateSet).height($animateSet.data('height'));
                autoHeight();
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

            // this.current.draggable("disable");
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

            if( !this.current ){
                return;
            }

            pos = this.current.position();
            this.container.show().css({
                'left': pos.left - 22,
                'top': pos.top - 2
            });
        },
        bindEvent: function(){
            var self = this;

            // 删除
            self.container.find('span.del').click(function(){
                var classNameArr = self.current.attr('class').split(' '),
                    className,
                    current;

                self.container.hide();

                classNameArr.length = 2;
                className = classNameArr.join(' ');

                if( self.type === 'img' ){
                    currentAm.disable(true);
                    currentAm.className(currentAm.className() + ' disable');

                    current = $.extend(true, {}, currentAm);
                    zIndex('delete', currentAm);
                    setHistory('delete', {am: current});
                    currentAm = null;
                    ko.applyBindings(newAM, $animateSet[0]);

                    // $('div.am-content:gt(0)', $animateSet).height($animateSet.data('height'));
                    autoHeight();
                }else{
                    currentAc.disable(true);
                    currentAc.className(currentAc.className() + ' disable');

                    current = $.extend(true, {}, currentAc);
                    setHistory('delete', {cm: current});
                    currentAc = null;
                    ko.applyBindings(newCM, $anchorSet[0]);
                }
            });

            // 上移
            self.container.on('click', 'span.setUp', function(){
                var _this = null,
                    index = {};

                if( !currentAm ){
                    return;
                }

                _this = $('img.' + currentAm.className().split(' ')[1], $titu);

                index.oIndex = currentAm.zIndex();
                if( !zIndex('up', currentAm) ) return;
                index.index = currentAm.zIndex();

                // tool.show(_this);
                setHistory('zIndex', index);
            });

            // 下移
            self.container.find('span.setBottom').click(function(){
                var _this = null,
                    index = {};

                if( !currentAm ){
                    return;
                }

                index.oIndex = currentAm.zIndex();
                if( !zIndex('down', currentAm) ) return;
                index.index = currentAm.zIndex();

                // tool.show(_this);
                setHistory('zIndex', index);
            });
        }
    };

    // 动画图层zIndex排序
    function zIndex(op, am){
        var idx = am.zIndex(),
            i = 0,
            len = vm.animates().length,
            item = null,
            current = vm.animates().indexOf(am),
            itemIdx;

        switch( op ){
            case 'delete':
                // 删除，比删除的zIndex大的都减1
                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx > idx ){
                        item.zIndex(itemIdx - 1);
                    }
                }

                currentZIndex--;
                break;
            case 'deleteR':
                // 删除撤销，比删除的zIndex大的都加1
                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx >= idx ){
                        item.zIndex(itemIdx + 1);
                    }
                }

                currentZIndex++;
                break;
            case 'up':
                // 上移，比我上层的减1
                if( idx === currentZIndex - 1 ){
                    return;
                }

                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx > idx ){
                        item.zIndex(itemIdx - 1);
                    }
                }

                am.zIndex(currentZIndex - 1);
                break;
            case 'upR':
                // 上移撤销，比我上层的加1
                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx >= idx ){
                        item.zIndex(itemIdx + 1);
                    }
                }

                break;
            case 'down':
                // 下移，比我下层的加1
                if( idx === 1 ){
                    return;
                }

                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx < idx ){
                        item.zIndex(itemIdx + 1);
                    }
                }

                am.zIndex(1);
                break;
            case 'downR':
                // 下移撤销，比我下层的减1
                for( ; i < len; i++ ){
                    if( i === current ){
                        continue;
                    }

                    item = vm.animates()[i];
                    if( item.disable() ) continue;
                    itemIdx = item.zIndex();

                    if( itemIdx <= idx ){
                        item.zIndex(itemIdx - 1);
                    }
                }

                break;
        }

        return true;
    }

    // 全屏
    function fullScreen(){
        var content = $('#content'),
            oHeight = 0,
            h = 0;

        content.height(win.height() - 40);
        oHeight = $animateSet.outerHeight() + $('#toolbox div.header').height();
        h = (win.height() - 40 - oHeight);
        // $('div.am-content:gt(0)', animateSet).height(h);
        $animateSet.data('height', h);
        autoHeight();

        win.on('resize', function(){
            content.height(win.height() - 40);
            h = (win.height() - 40 - oHeight);
            // $('div.am-content:gt(0)', animateSet).height(h);
            $animateSet.data('height', h);
            autoHeight();
        });
    }

    // 动画图层高度自适应
    function autoHeight(isToggle){
        var height = $animateSet.data('height'),
            amContent = $('div.am-content', $animateSet),
            amContentGt0 = amContent.filter(':gt(0):visible'),
            length = amContentGt0.length;

        isToggle && amContent.addClass('toggle');

        if( amContent.eq(0).is(':visible') ){
            amContentGt0.height(height / length);
        }else{
            amContentGt0.height((height + 46) / length);
        }

        setTimeout(function(){
            amContent.removeClass('toggle');
        }, 300);
    }

    // 上下左右微调
    function keydownIndesign(e){
        var _this = $('#in-design .selected'),
            idx = 0,
            current = null,  
            ops = {},
            left,
            top;

        // e.preventDefault();
        if( _this.length > 0 ){
            if( _this[0].tagName.toLowerCase() === 'img' ){
                idx = $('img', $titu).index(_this);
                current = vm.animates()[idx];

                ops.oLeft = left = current.left();
                ops.oTop = top = current.top();

                switch(e.keyCode){
                    case $.ui.keyCode.LEFT:
                        tool.hide();
                        current.left(left - 1);
                        ops.left = current.left();
                        ops.top = ops.oTop;
                        tool.pos();
                        tool.show(_this);
                        setHistory('AMmove', ops);
                        break;
                    case $.ui.keyCode.UP:
                        tool.hide();
                        current.top(top - 1);
                        ops.left = ops.oLeft;
                        ops.top = current.top();
                        tool.pos();
                        tool.show(_this);
                        setHistory('AMmove', ops);
                        break;
                    case $.ui.keyCode.RIGHT:
                        tool.hide();
                        current.left(left + 1);
                        ops.left = current.left();
                        ops.top = ops.oTop;
                        tool.pos();
                        tool.show(_this);
                        setHistory('AMmove', ops);
                        break;
                    case $.ui.keyCode.DOWN:
                        tool.hide();
                        current.top(top + 1);
                        ops.left = ops.oLeft;
                        ops.top = current.top();
                        tool.pos();
                        tool.show(_this);
                        setHistory('AMmove', ops);
                        break;
                    // 不需要default
                }
            }else{
                idx = $('a.anchor', $titu).index(_this);
                current = vm.anchors()[idx];

                ops.oLeft = left = current.left();
                ops.oTop = top = current.top();

                switch(e.keyCode){
                    case $.ui.keyCode.LEFT:
                        tool.hide();
                        current.left(left - 1);
                        ops.left = current.left();
                        ops.top = ops.oTop;
                        tool.pos();
                        tool.show(_this);
                        setHistory('ACmove', ops);
                        break;
                    case $.ui.keyCode.UP:
                        tool.hide();
                        current.top(top - 1);
                        ops.left = ops.oLeft;
                        ops.top = current.top();
                        tool.pos();
                        tool.show(_this);
                        setHistory('ACmove', ops);
                        break;
                    case $.ui.keyCode.RIGHT:
                        tool.hide();
                        current.left(left + 1);
                        ops.left = current.left();
                        ops.top = ops.oTop();
                        tool.pos();
                        tool.show(_this);
                        setHistory('ACmove', ops);
                        break;
                    case $.ui.keyCode.DOWN:
                        tool.hide();
                        current.top(top + 1);
                        ops.top = current.top();
                        ops.left = ops.oLeft;
                        tool.pos();
                        tool.show(_this);
                        setHistory('ACmove', ops);
                        break;
                    // 不需要default
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
                    $(this).trigger('change');
                    setHistory('color');
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

        fullScreen();
    });

})(jQuery, FE.tools.design);