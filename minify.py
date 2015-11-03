# -*-coding:utf-8-*-
''' 生成 base.min.js 文件'''
__author__ = 'huguotao'

print u'目前只能生成压缩后的 js 文件，还需手动合并到 qwe.min.py 中 index() return r""中最后一个<script>标签内'

try:
    from slimit import minify
except:
    print u'少了一个库，[sudo] pip install slimit'
    print u'或者使用 https://github.com/juancarlospaco/css-html-js-minify 能压缩 html、js、css'


import os

ROOT = os.path.dirname(os.path.abspath(__file__))

file_object = open(ROOT+'/src/static/js/base.js')
try:
    all_the_text = file_object.read()
except:
    all_the_text = u'不支持编辑此文件'
finally:
    file_object.close()

minified =  minify(all_the_text, mangle=True, mangle_toplevel=True)
print minified

file_object = open(ROOT+'/base.min.js', 'w')

try:
    file_object.write(minified)
except:
    print u'err'
finally:
    file_object.close()