/*
 * @Author      changbin.wangcb
 * @Date        2013-12-28
 * @Description 动画工具
 */	

(function($, Design){
	function pageOpen(){
		var search = decodeURIComponent(location.search),
			$setting = $('#settingDiv'),
			status = 'new';

		if( search && search.toUpperCase().indexOf('PAGEID') > -1 ){
			status = 'edit';
			dialog();
		}else{
			status = 'new';
			dialog('new');
		}

		function dialog(){
			if( status !== 'new' ){
				$setting.find('input').prop('disabled', true);
				$setting.find('section div.pageid').show();

				if( status === 'edit' ){
					$setting.find('header h5').text('修改');
				}else{
					$setting.find('header h5').text('属性');
				}
			}

			$.use('ui-dialog', function(){
			    $setting.dialog({
			    	fixed: true,
			    	center: true
			    });
			});
		}

		/*$('header a.close, footer button.btn-cancel', $setting).click(function(e){
			e.preventDefault();

			$setting.dialog('close');
		});*/

		$('footer button.btn-submit').click(function(e){
			$setting.dialog('close');

			// 新建 or 修改
			if( status === 'new' ){
				Design.add();
			}else if( status === 'edit' ){
				Design.edit(JSON.stringify(model));
			}
		});

		$('div.nav a.bar-a-property').click(function(e){
			e.preventDefault();

			status = 'property';
			dialog();
		});
	}	

	// 代码
	function snippet(){
		var $snippet = $('#snippet'),
			snippetCode = null;

		$('div.nav a.bar-a-code').one('click.codemirror', function(){
			var textarea = $('section textarea', $snippet);

			textarea.val(Design.getHTML());

			snippetCode = CodeMirror.fromTextArea(textarea[0], {
				lineNumbers  : true,
				lineWrapping : true,
				mode         : "xml",
				theme        : 'rubyblue'
	        });

	        $.use('ui-flash-clipboard', function() {
                var styleObj = 'clipboard{text:拷贝代码;color:#ffffff;fontWeight:700;fontSize:13;font-weight:bold;font: 12px/1.5 Tahoma,Arial,"宋体b8b\4f53",sans-serif;}';
                
                $snippet.find('header a.submit').flash({
                    module : 'clipboard',
                    width: 164,
                    height: 50,
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
			snippetCode.setValue(Design.getHTML());
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
				        "zIndex": 1,
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
				        "zIndex": 2,
				        "hoverAnimateType": ""
				    }],
				    "anchors": []
				};

	$(function(){
		pageOpen();
		toolbox.init();
		snippet();
	});
})(jQuery, FE.tools.design);