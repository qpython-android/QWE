// TODO 标签拖拽移动
// TODO 元素绑定效率优化
// TODO 让 del_alert_box() 衔接更自然，尤其是连续切换时（打开文件的切换按钮）
// TODO 用 replace() 的函数功能写一个高级的格式化函数用来格式化 alert_box() 的 row_html
// TODO 单独保存某个文件
// TODO 异步加载等宽字体用于编辑器显示
// TODO 让修改过的文件未保存前有个提示
// TODO 如果已经打开并锁定文件仍然双击了该文件了则标签闪两下？
// TODO bug 修复: 确认按钮绑定准确
// TODO 保存失败/无法保存后的方案
// TODO 由于定宽导致确认删除路径过长
// TODO 选中tap 文件树要有反应、变粗？
// TODO 标签overflow
// TODO 全局不折行
// TODO 标签量设置上限
// TODO 有修改但未保存前运行需要提示
// TODO 运行成功后的日志


//---------------------------------- 初始化开始 ----------------------------------

//初始化开始
//alert_box('<div class="msg" style="width: 180px;">正在初始化，请稍后...</div>');


var $body = $('body');
var $Wrapper = $('.Wrapper');
var $top_btn = $('.top-btn');
var $open = $('.open', $top_btn);
//var $new = $('.new', $top_btn);
var $main = $('.main', $Wrapper);
var $file_path = $('.file-path', $Wrapper);
var $file_tree = $('.file-tree', $Wrapper);
var $file_tap = $('.file-tap', $main);
//var $file_tap = $('span', $file_tap);
//var $file_tap_close = $('span', $file_tap);
var $textarea = $('textarea', $main);
var $bottom_btn = $('.bottom-btn', $Wrapper);
var $left = $('#left', $bottom_btn);
var $right = $('#right', $bottom_btn);
var $save = $('#save', $bottom_btn);
var $run = $('#run', $bottom_btn);


var ROOT_FILE_TREE;  //完整文件树
//var FILE_TREE = {};  //当前项目文件树 //应该用不上了
var PROJECT_NAME = '';   //当前项目名
var FILE_PATH;  //当前锁定的文件（编辑、高亮标签）
var CHANGE_FILE_LIST = [];
var SAVE_ERR_LIST = [];
var $POP_TARGET;    //邮件菜单的目标（记录在何处单击右键）
var RAW_HTML_FILE_TREE;     // TODO 清除此变量
var ALERT_BOX = '' +     //弹出盒子基本格式
        '<div style="width: {width}px">' +
            '<div class="box-title">{title}</div>' +
            '{content}' +
            '<div class="file-btn"><span class="btn ok">Ok</span><span class="btn" onclick="del_alert_box($(this));">Close</span></div>' +
        '</div>';
var ALERT_FILE_BOX = ALERT_BOX.replace('{width}', '380');

//单击打开按钮
$open.click(open_file_box);

//单击三角形展开/手机文件夹
$body.on('click', '.drop-btn', toggle_slid);

//双击展开/手机文件夹
$body.on('dblclick', '.file-tree-folder', function(){
    $(this).prev().click();
});

//双击打开文件
$body.on('dblclick', '.file-tree-file', function(){
    open_file($(this).attr('data-path'));
});

//右键文件菜单
$body.bind("contextmenu",function(){
    return false;
});
$body.on('mouseup', '[class^="file-tree-"]', pop_menu);
$body.on('mousedown', '*', function(){
    $('.pop-menu').remove();
    //forbid_bubble(); // 节省资源
});
$body.on('mousedown', '.pop-new-file', new_file_box);
$body.on('mousedown', '.pop-new-folder', new_folder_box);
$body.on('mousedown', '.pop-del-file', del_file_box);
$body.on('mousedown', '.pop-toggle-file', function(){
    $POP_TARGET.dblclick();
});

//点击切换标签
$file_tap.on('click', '>span', function(){
    switch_tap($(this));
});

//单击叉关闭标签
$file_tap.on('click', 'span>span', close_tap);

//保存编辑内容 如果添加代码编辑器，这儿也要动态绑定。
$textarea.change(function(){
    set_content(FILE_PATH, $textarea.val());
});

//tab 控制缩进
$textarea.keydown(tab_shortcut);

$save.click(save_file_box);

$run.click(run_file_box);

$left.click(function(){
    indent_btn('', true);
});
$right.click(indent_btn);




open_project_box(true);



//初始化
//setTimeout(init,1000);
//init();
//function init(){
//
//    //生成文件树
//
//    //初始化完成
//    //setTimeout(del_alert_box, 1000);
//}


//弹出窗口
function alert_box(raw_html){
    $('body').append(
        "<div class='alert-box'>" +
                raw_html +
        "</div>");

    var $alert_box = $('.alert-box');
    var $alert_box_div = $('.alert-box>div');
    setTimeout(function(){
        $alert_box.css('background', 'rgba(0,0,0,0.2)');
        $alert_box_div.css({opacity:1, margin:'0 auto'});
    },100);
}

//收起弹出窗口
function del_alert_box($target){
    var $alert_box = $target && $target.parents('.alert-box') || $('.alert-box');
    var $alert_box_div = $('>div', $alert_box);
    $alert_box.css('background', 'rgba(0,0,0,0)');
    $alert_box_div.css({opacity:0, margin:'-26px auto 0'});
    setTimeout(function(){
        $alert_box.remove();
    },600);
}

//由文件路径取得文件内容
// TODO 由根目录找
function get_content(path, callback){
    var content = eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + '"]["content"]');
    if (content==undefined){
        $.get('/api/file-content', {'path':path}, function(data){
            eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + '"]["content"]=data');
            callback(data);
        });
    }
    return content;
}

//由文件路径设置文件内容
// TODO 由根目录找
function set_content(path, content){
    CHANGE_FILE_LIST.push(path);
    eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + '"]["content"]=content');
}

//由文件路径设置文件类型
function set_type(path, type){
    eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + '"]["type"]=type');
}

//由文件路径获取文件名
function get_name(path){
    return /(?:.*\/)?(.+?)\/?$/.exec(path)[1];    // 徒手写的正则：获取路径最后的文件(夹)名
}

//设置编辑内容
function set_textarea(data){
    $textarea.val(data);
}

//hack $.val()
$.valHooks.textarea = {
    get: function(elem) {
        return elem.value;
            // #1 不知为何 Jquery 要过滤掉回车 如有特殊情况可以还原 #1
            //.replace(/\r|\n/g, function(i){
            //    return i=='\n' && '<n>' || '<r>';
            //});
    }
};

//tab 快捷键控制缩进
function tab_shortcut(e){
    if(e.which === 9){
        var start = this.selectionStart;
        //var end = this.selectionEnd;
        var move_num = -4;
        $(this).val(function(i,o){
            var n_index = o.substr(0, start).lastIndexOf('\n') + 1;
            if (e.shiftKey){
                var head_char = o.substr(n_index, 4);
                var new_head_char = '';
                for (var char_i in head_char){
                    if (head_char.hasOwnProperty(char_i) && head_char[char_i]!=' '){
                        new_head_char = head_char.substr(~~char_i);
                        move_num = -1*(~~char_i);
                        break;
                    }
                }
                return o.substr(0,n_index) + new_head_char + o.substr(n_index+4);
            }else{
                move_num = 4;
                return o.substr(0,start)+'    '+o.substr(start);
            }
        });
        this.selectionStart = this.selectionEnd = start + move_num;
        e.preventDefault();
    }
}

//阻止冒泡事件
function forbid_bubble(){
    var e = arguments.callee.caller.arguments[0]||event;
    if (e.stopPropagation) {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }
}

//---------------------------------- 初始化结束 ----------------------------------


//---------------------------------- 顶部按钮开始 ----------------------------------

//------------------ 打开文件开始 ------------------

//打开文件弹出盒子
function open_file_box(){
    alert_box(ALERT_FILE_BOX.replace('{title}','<span class="focus">File</span><span class="switch">Project</span><hr/>')
                            .replace('{content}',   '<div class="file-path">Choose file</div>' +
                                                    '<div class="file-tree">Loading ...</div>'));

    var $choose_file = $('.alert-box>div');
    var $c_file_tree = $('.file-tree', $choose_file);
    var $switch = $('.switch', $choose_file);
    var $c_file_path = $('.file-path', $choose_file);
    var choose_file_path;

    setTimeout(function() {
        $.get('/api/file-tree', function (data) {
            //生成文件树
            $c_file_tree.html(file_tree_packer(eval('({' + data + '})'), ''));

            //双击打开文件
            $('.file-tree-file', $choose_file).dblclick(function () {
                del_alert_box($(this));
            });

            //单击改变path
            $('.file-tree-file', $choose_file).click(function () {
                choose_file_path = $(this).attr('data-path');
                set_path(choose_file_path, $c_file_path, 3);
            });

            //确认功能
            $('.ok', $choose_file).click(function () {
                if (choose_file_path) {
                    open_file(choose_file_path);
                    del_alert_box($(this));
                } else {
                    alert('Please choose some file');
                }
            });


            //切换功能
            $switch.click(function () {
                del_alert_box($(this));
                setTimeout(open_project_box, 560);
            });
        });
    }, 1000);
}


//打开项目弹出盒子
function open_project_box(init){
    init || alert_box(ALERT_FILE_BOX.replace('{title}','<span class="switch">File</span><span class="focus">Project</span><hr/>')
        .replace('{content}',   '<div class="project-path">Choose project</div>' +
        '<div class="file-tree">Loading ...</div>'));

    var $choose_file = $('.alert-box>div');
    var $c_file_tree = $('.file-tree', $choose_file);
    var $switch = $('.switch', $choose_file);
    var $c_project_path = $('.project-path', $choose_file);
    var choose_file_path;

    setTimeout(function(){
        $.get('/api/file-tree', function(data){
            //注：由于 python 字典乱序的问题只能以字符串的方式返回 json
            ROOT_FILE_TREE = eval('({'+ data +'})');

            $c_file_tree.html(function(){
                var raw_html = '';
                for (var project_name in ROOT_FILE_TREE['projects']['content']){
                    if (ROOT_FILE_TREE['projects']['content'].hasOwnProperty(project_name) && ROOT_FILE_TREE['projects']['content'][project_name]['type']=='folder'){
                        raw_html += '<div><span class="file-tree-folder" data-path="' + project_name + '">' + project_name + '</span></div>';
                    }
                }
                return raw_html;
            });


            //双击打开项目
            $('.file-tree-folder', $choose_file).dblclick(function(){
                $('.ok', $choose_file).click();
                del_alert_box($(this));
            });

            //单击path
            $('.file-tree-folder', $choose_file).click(function(){
                choose_file_path = $(this).attr('data-path');
                $c_project_path.html('<span><span>&#xe606;</span>' + choose_file_path +'</span>');
            });

            //确认功能
            $('.ok', $choose_file).click(function(){
                if (choose_file_path){
                    var FILE_TREE = {};
                    FILE_TREE[choose_file_path] = ROOT_FILE_TREE['projects']['content'][choose_file_path];
                    RAW_HTML_FILE_TREE = file_tree_packer(FILE_TREE, 'projects/');
                    $file_tree.html(RAW_HTML_FILE_TREE);
                    PROJECT_NAME = choose_file_path;
                    del_alert_box($(this));
                }else{
                    alert('Please choose some file');
                }
            });

            //切换功能
            $switch.click(function(){
                del_alert_box($(this));
                setTimeout(open_file_box, 560);
            });
        });
    }, 1000);
}

//------------------ 打开文件开始 ------------------

//---------------------------------- 顶部按钮结束 ----------------------------------


//---------------------------------- 顶部路径开始 ----------------------------------

//设置路径（路径, 目标, 最大路径显示值）
function set_path(path, $target, max_num){
    if (path.indexOf('projects/'+PROJECT_NAME)==0){
        path = path.substr(9);
    }
    $target = $target || $file_path;
    max_num = max_num || 5;
    var patt = new RegExp('(?:[^/]+/){max_num}(?:[^/]+?)$'.replace('max_num', ''+(max_num-1)));
    patt = patt.exec(path);
    if (patt && path!=patt[0]){
        path = '.../' + patt[0];
    }
    var path_dom = path && ('<span>' + path.replace(/\//g, '</span><span>') + '</span>') || '';
    $target.html(path_dom);
}

//---------------------------------- 顶部路径结束 ----------------------------------


//---------------------------------- 文件树开始 ----------------------------------

//递归的方式将文件树 json 打包成 DOM 字符串
function file_tree_packer(json_file_tree, parents_path){
    var this_step = '';
    for (var file_name in json_file_tree){
        // 编辑器会提示先使用 hasOwnProperty() 判断是否存在该对象以免出错，但只需严格按照格式即可不验证
        if (json_file_tree.hasOwnProperty(file_name)){
            if (json_file_tree[file_name]['type']=='folder'){
                this_step  +=  "" +
                    "<div>" +
                        "<span class='drop-btn'>&#xe607;</span>" +
                        "<span class='file-tree-folder' data-path='"+ parents_path+file_name+'/' +"'>"+ file_name +"</span>" +
                    "</div>" +
                    "<div class='child-tree'>"+ file_tree_packer(json_file_tree[file_name]['content'], parents_path+file_name+'/') +"</div>";
            }else if(json_file_tree[file_name]['type']=='file'){
                this_step  +=   "<div><span class='file-tree-file' data-path='"+ parents_path+file_name +"'>"+ file_name +"</span></div>";
            }
        }
    }
    return this_step;
}

//文件树的展开与收起
function toggle_slid(){
    var $this = $(this);
    if ($this.data("rotate")){
        $this.css('transform','rotate(0deg)')
            .removeData("rotate")
            .parent().next().css('display','none');
    }else{
        $this.css('transform','rotate(90deg)')
            .data("rotate", "t")
            .parent().next().css('display','block');
    }
}

//打开文件
function open_file(path){
    if (/\.(bmp|jpg|png|jpeg|tiff|gif|pcx|tga|exif|fpx|svg|psd|cdr|pcd|dxf|ufo|eps|ai|raw)$/i.test(get_name(path))) {
        alert_box(
            ALERT_BOX
            .replace('{width}', '360')
            .replace('{title}', 'Preview')
            .replace('{content}', '<div class="alert-msg"><img style="max-width: 280px;" src="/api/img-pre/'+path+'" /></div>')
        );

        //确认功能
        $('.ok').click(function(){
            del_alert_box($(this));
        });
    }else{
        var tap = is_open(path);
        if (tap){
            FILE_PATH != path && switch_tap(tap);
        }else{
            new_tap(path);
        }
    }
}

//判断文件是否已经打开
function is_open(path){
    var taps = $file_tap.find('>span');
    var result = '';
    if (taps.length != 0){
        taps.each(function(){
            var $tap = $(this);
            if ($tap.attr('data-path') == path){
                result =  $tap;
                return '';
            }
        });
    }
    return result || false;
}

//---------------------------------- 文件树结束 ----------------------------------


//---------------------------------- 文件标签开始 ----------------------------------

//关闭标签
function close_tap(){
    var $this = $(this);
    var $this_tap = $this.parent();
    if ($this_tap.attr('data-path')==FILE_PATH){
        var $target;
        if ($this_tap.prev().length==0){
            $target = $this_tap.next();
        }else{
            $target = $this_tap.prev();
        }
        if ($target.length == 0){
            set_path('');
            $textarea.val('');
        }else{
            switch_tap($target);
        }
    }
    $this_tap.remove();
    forbid_bubble();    //阻止冒泡事件
}

//新建一个标签
function new_tap(path){
    var file_name = get_name(path);
    $file_tap.append("<span class='new-tap' data-path='"+ path +"'>"+ file_name +"<span>&#xe600</span></span>");
    var $new_tap = $('.new-tap');
    switch_tap($new_tap);
    $new_tap.removeClass('new-tap');
}

//标签切换
function switch_tap($target){
    $('.tap-focus').removeClass('tap-focus');
    $target.addClass('tap-focus');
    var path = $target.attr('data-path');
    if (path.indexOf('projects/'+PROJECT_NAME)!=0){
        $file_tree.find('>div>.drop-btn')
            .data('rotate', 't').click();
    }
    set_textarea(get_content(path,set_textarea));
    // #1 前后备注绑定
    //$textarea.val(get_content(path, function(data){
    //    $textarea.val(data.replace(/<r>|<n>/g, function(i){return i=='<r>' && '\r' || '\n';}));
    //}).replace(/<r>|<n>/g, function(i){
    //    return i=='<r>' && '\r' || '\n';
    //}));
    FILE_PATH = path;
    $textarea.focus();
    set_path(path);
}
//---------------------------------- 文件标签结束 ----------------------------------


//---------------------------------- 底部按钮开始 ----------------------------------

//底部按钮控制缩进
function indent_btn(empty, shift){
    var e = $.Event("keydown");
    e.which = 9;
    e.shiftKey = shift;
    $textarea.trigger(e).focus();
}

//保存文件弹出盒子
function save_file_box(){
    alert_box('<div class="msg" style="width: 180px;">Saving ...</div>');
    save_file(0);
}


//保存文件
function save_file(i) {
    if (i == CHANGE_FILE_LIST.length){
        if (SAVE_ERR_LIST[0]){
            alert('Error when saving:\n'+SAVE_ERR_LIST);
            SAVE_ERR_LIST = [];
        }
        return del_alert_box();
    }
    $.post('/api/save', {'path':CHANGE_FILE_LIST[i], 'content':get_content(CHANGE_FILE_LIST[i])}, function(data){
        if (data=='err'){
            SAVE_ERR_LIST.push(CHANGE_FILE_LIST[i]);
        }
        save_file(i+1);
    });
}


//运行项目弹出盒子
function run_file_box(){
    alert_box('<div class="msg" style="width: 180px;">Launching ...</div>');
    setTimeout(run_file, 460);
}

//运行项目
// TODO 前端排除非 .py 文件
function run_file(){
    del_alert_box();
    if (!/\.py$/i.test(get_name(FILE_PATH))) {
        alert('QPython could not run non-py script');
    }else if(!FILE_PATH){
        alert('Please switch to the script you want to run');
    }else{
        $.post('/api/run',{'path': FILE_PATH}, function(data){
            setTimeout(function(){
                if (data=='ok'){
                    alert_box(
                        ALERT_BOX
                        .replace('{width}', '280')
                        .replace('{title}', 'Launch successfully')
                        .replace('{content}', '<div class="alert-msg">'+ get_name(FILE_PATH) +' was launched successfully on mobile</div>')
                    );
                }else{
                    alert_box(
                        ALERT_BOX
                        .replace('{width}', '280')
                        .replace('{title}', 'Fail to launch')
                        .replace('{content}', '<div class="alert-msg">'+ get_name(FILE_PATH) +' was failed to launch on mobile</div>')
                    );
                }

                //确认功能
                $('.ok').click(function(){
                    del_alert_box($(this));
                });
            }, 460);
        });
    }
}


//---------------------------------- 底部按钮结束 ----------------------------------


//---------------------------------- 右键菜单开始 ----------------------------------

//右键弹出菜单
function pop_menu(e){
    if(3 == e.which){
        var $this = $(this);
        var folder = $this.attr('class') == 'file-tree-folder';
        var slid = $this.parent().next().css('display') == 'block';
        $('.pop-menu').remove();
        $body.append(
            '<div class="pop-menu" style="top:'+ (e.pageY+2) +'px;left:'+ (e.pageX+2) +'px;">' +
                '<dl>' +
                    '<dt class="pop-toggle-file">' + (folder && (slid && 'Close' || 'Expand') || (is_open($this.attr('data-path')) && 'Switch' || 'Open')) + '</dt>' +
                    //'<dt>Rename</dt>' +
                    (folder && '<dt class="pop-new-file">New file</dt><dt class="pop-new-folder">New folder</dt>' || '') +
                    '<dt class="pop-del-file">Del</dt>' +
                    //'<dt>Copy</dt>' +
                    //'<dt>Paste</dt>' +
                '</dl>' +
            '</div>');
        $POP_TARGET = $this;
    }
}


//新建文件弹出盒子
function new_file_box(){
    var path = $POP_TARGET.attr('data-path');
    alert_box(
        ALERT_BOX
        .replace('{width}', '360')
        .replace('{title}', 'New file')
        .replace('{content}', '<div style="text-align: center;"><input type="text" class="new-file-name"/></div>')
    );
    $('.pop-menu').remove();
    $('.new-file-name').focus();

    //确认功能
    $('.ok').click(function(){
        var name = $('.new-file-name').val();
        if (eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + name +'"]')) {
            alert('File exist already');
        }else if(!name){
            alert('Please input the file name');
        }else{
            new_file(path, name);
            new_tap(path+name);
            del_alert_box($(this));
        }
    });
}

//新建文件
function new_file(path, name){
    eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + name +'"]={"type": "file", "content": ""}');
    $POP_TARGET.parent().next().append('<div><span class="file-tree-file" data-path="'+ path+name +'">'+ name +'</span></div>');
}


//新建文件夹弹出盒子
function new_folder_box(){
    var path = $POP_TARGET.attr('data-path');
    alert_box(
        ALERT_BOX
        .replace('{width}', '360')
        .replace('{title}', 'New file')
        .replace('{content}', '<div style="text-align: center;"><input type="text" class="new-folder-name"/></div>')
    );
    $('.pop-menu').remove();
    $('.new-folder-name').focus();

    //确认功能
    $('.ok').click(function(){
        var name = $('.new-folder-name').val();
        if (eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + name +'"]')) {
            alert('Folder exists already');
        }else if(!name){
            alert('Please input the folder name');
        }else{
            new_folder(path, name);
            del_alert_box($(this));
        }
    });
}

//新建文件夹
function new_folder(path, name){
    $.post('/api/new-folder',{'path': path+name}, function(data){
        if (data=='ok'){
            eval('ROOT_FILE_TREE["' + path.replace(/\//g, '"]["content"]["') + name +'"]={"type": "folder", "content": {}}');
            $POP_TARGET.parent().next().append(
                '<div>' +
                    '<span class="drop-btn">&#xe607;</span>' +
                    '<span class="file-tree-folder" data-path="'+ path+name +'/">'+ name +'</span>' +
                '</div>' +
                '<div class="child-tree"></div>'
            );
        }else{
            alert('Fail to new folder, please retry.\n' + get_name(path));
        }
    });
}


//删除文件弹出盒子
function del_file_box(){
    var path = $POP_TARGET.attr('data-path');
    alert_box(
        ALERT_BOX
        .replace('{width}', '280')
        .replace('{title}', 'Del file')
        .replace('{content}', '<div class="alert-msg">Confirm to delete '+ get_name(path) +' ?</div>')
    );

    //确认功能
    $('.ok').click(function(){
        del_file(path);
        del_alert_box($(this));
    });
}

//删除文件
function del_file(path){
    $.post('/api/del-file', {'path': path}, function(data){
        if (data=='ok'){
            var patt = /(.*)\/$/.exec(path);
            if (patt){
                path = patt[1];
                $POP_TARGET.parent().next().remove();
            }
            $POP_TARGET.parent().remove();
            set_type(path, 'del');
        }else{
            alert('Fail to delet file, please retry.\n' + get_name(path));
        }
    });
}

//---------------------------------- 右键菜单结束 ----------------------------------
