QPython Editor 源文件

如何生成 qwe.min.py

手动方法：
>* 修改完毕后（注意根路径应该去掉一层，server_static 函数及其绑定 url 需删除），去掉 main.py 内多余的空行、注释。
>* 使用 [HTML压缩工具](http://tool.oschina.net/jscompress?type=2) 压缩 HTML。
>* 使用 [JS压缩工具](http://tool.oschina.net/jscompress) 压缩 JS，请确保代码格式符合标准，使用 eval() 压缩可以获得更高的压缩率。
>* 将压缩后的 JS 替换进 HTML <scrpt></scrpt> 内。
>* CSS方法同JS，工具为：[CSS压缩工具](http://tool.oschina.net/jscompress)。

其他压缩方法类同，关键词：minify

过后有空会写一个 Python 脚本，一键生成。