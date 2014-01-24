/*
 * @Author      changbin.wangcb
 * @Date        2013-12-28
 * @Description 动画工具
 */	

(function($, Design){
	function pageOpen(){
		var search = decodeURIComponent(location.search),
			$setting = $('#settingDiv'),
			isNew = true;

		if( search && search.toUpperCase().indexOf('PAGEID') > -1 ){
			isNew = false;
			dialog();
		}else{
			dialog();
		}

		function dialog(){
			isNew || $setting.find('section div.pageid').show();

			$.use('ui-dialog', function(){
			    $setting.dialog({
			    	fixed: true,
			    	center: true
			    });
			});
		}

		$('header a.close, footer button.btn-cancel', $setting).click(function(e){
			e.preventDefault();

			$setting.dialog('close');
		});

		$('footer button.btn-submit').click(function(e){
			$setting.dialog('close');

			// 新建 or 修改
			if( isNew ){
				Design.add();
			}else{
				Design.edit(JSON.stringify(model));
			}
			
			fullScreen();
		});
	}	

	// 代码
	function snippet(){
		var $snippet = $('#snippet'),
			snippetCode = null;

		$('div.nav a.bar-a-code').one('click.codemirror', function(){
			snippetCode = CodeMirror.fromTextArea($('section textarea', $snippet)[0], {
				lineNumbers  : true,
				lineWrapping : true,
				mode         : "xml",
				theme        : 'rubyblue'
	        });

	        $.use('ui-flash-clipboard', function() {
                var styleObj = 'clipboard{text:复制代码;color:#fff;fontSize:12;font:12px/1.5 Tahoma,Arial,"宋体b8b\4f53",sans-serif;}';
                
                $snippet.find('footer a.submit').flash({
                    module : 'clipboard',
                    width: 68,
                    height: 26,
                    flashvars : {
                        style : encodeURIComponent(styleObj)
                    }
                }).on("swfReady.flash", function() {
                }).on("mouseDown.flash", function() {
                    $(this).flash("setText", snippetCode.getValue());
                }).on("complete.flash", function(e, data) {
                });
            });
		}).click(function(e){
			e.preventDefault();

			$snippet.addClass('md-show');
		});

		$('a.close', $snippet).click(function(e){
			e.preventDefault();

			$snippet.removeClass('md-show');
		});

		$('footer a.submit', $snippet).click(function(e){
			e.preventDefault();


		});
	}

	var toolbox = {
		init: function(){
			var key, item = null;

			this.container = $('#toolbox');

			for( key in this ){
				item = this[key];

				if( typeof item === 'function' && key !== 'init' ){
					this[key]();
				}
			}
		},
		tab: function(){
			var self = this;

			$.use('ui-tabs', function(){
            	self.container.tabs({
                    isAutoPlay:false, 
                    event:'click'
                });
            });  
		},
		bindEvent: function(){
			var self = this;

			if (window.location.host === 'dev.1688.com'){
              	FE.test['style.picman.url'] = 'http://picman-test.1688.com:40100';
            }

            $.use('ui-flash-uploader2', function(){
                $('.btnUpadte', self.container).flash({
                    module: 'uploader2'
                });
            });
		}
	};

	// 全屏
	function fullScreen(){
		var win = $(window),
			content = $('#content'),
			animateSet = $('#animate-set'),
			oHeight = 0,
			h = 0;

		content.height(win.height() - 40);
		oHeight = animateSet.outerHeight() + $('#toolbox div.header').height();
		h = (win.height() - 40 - oHeight) / 2;
		$('div.am-content:gt(0)', animateSet).height(h);
		animateSet.data('height', h);

		win.on('resize', function(){
			content.height(win.height() - 40);
			h = (win.height() - 40 - oHeight) / 2;
			$('div.am-content:gt(0)', animateSet).height(h);
			animateSet.data('height', h);
		});
	}

	function play(){
		var container = $('#content div.main-stage');

		$('div.nav a.bar-a-preview').click(function(e){
			e.preventDefault();

			container.addClass('md-modal md-effect-11');

			setTimeout(function(){
				container.addClass('md-show');
			}, 300);
		});
	}

	var model = {
				    "designBgImg": "http://img.china.alibaba.com/cms/upload/2013/678/875/1578876_1625054590.jpg",
				    "fixBgImg": "",
				    "contentBgImg": "",
				    "contentBg": "c0daf3",
				    "designHeight": "534",
				    "animates": [{
				        "name": "动画1",
				        "className": "img img-1",
				        "img": "http://img.china.alibaba.com/cms/upload/2013/868/875/1578868_1625054590.png",
				        "title": "",
				        "beginTime": 0.1,
				        "duration": 1,
				        "animateType": "bounceInDown",
				        "top": 230,
				        "left": 51,
				        "height": 0,
				        "width": 0,
				        "zIndex": 0,
				        "hasHoverEvent": "",
				        "hoverAnimateType": ""
				    }, {
				        "name": "动画2",
				        "className": "img img-2",
				        "img": "http://img.china.alibaba.com/cms/upload/2013/968/875/1578869_1625054590.png",
				        "title": "",
				        "beginTime": 1.1,
				        "duration": 1,
				        "animateType": "bounceInDown",
				        "top": 300,
				        "left": 178,
				        "height": 0,
				        "width": 0,
				        "hasHoverEvent": "",
				        "hoverAnimateType": ""
				    }],
				    "anchors": []
				};

	$(function(){
		fullScreen();
		pageOpen();
		toolbox.init();
		snippet();
		// play();
	});
})(jQuery, FE.tools.design);