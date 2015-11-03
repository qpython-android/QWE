# -*-coding:utf-8-*-
#qpy:webapp:QPython Web Editor
#qpy://127.0.0.1:10000/hello

"""
QPython Editor sourcecode
@Author sciooga
"""

from bottle import Bottle, ServerAdapter, static_file, view, request, template
# from bottle import run, debug, route, error, template, redirect, response

import os
import shutil
import socket
# import json
# import urllib2

# ---- INIT ----


# ASSETS = "/assets/"
# TODO minify 时路径需删掉一层
PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# FOR MAIN.PY WILL BE DILL
ROOT = os.path.dirname(os.path.abspath(__file__))

# ---- QPYTHON WEB SERVER ----


class MyWSGIRefServer(ServerAdapter):
    server = None

    def run(self, handler):
        from wsgiref.simple_server import make_server, WSGIRequestHandler
        if self.quiet:
            class QuietHandler(WSGIRequestHandler):
                def log_request(*args, **kw):
                    pass
            self.options['handler_class'] = QuietHandler
        self.server = make_server(self.host, self.port, handler, **self.options)
        self.server.serve_forever()

    def stop(self):
        # sys.stderr.close()
        import threading
        threading.Thread(target=self.server.shutdown).start()
        # self.server.shutdown()
        self.server.server_close()
        print "# QWEBAPPEND"


# ---- BUILT-IN ROUTERS ----

def __exit():
    global server
    server.stop()


def __ping():
    return "ok"


def server_static(file_path):
    return static_file(file_path, root=ROOT+'/static')

if os.name != "nt":
    import fcntl
    import struct

    def get_interface_ip(ifname):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        return socket.inet_ntoa(fcntl.ioctl(s.fileno(), 0x8915, struct.pack('256s',
                                ifname[:15]))[20:24])


def get_lan_ip():
    ip = socket.gethostbyname(socket.gethostname())
    if ip.startswith("127.") and os.name != "nt":
        interfaces = [
            "eth0",
            "eth1",
            "eth2",
            "wlan0",
            "wlan1",
            "wifi0",
            "ath0",
            "ath1",
            "ppp0",
            ]
        for ifname in interfaces:
            try:
                ip = get_interface_ip(ifname)
                break
            except IOError:
                pass
    return ip


def hello():
    return "You are running QWE ...<br/>Please open http://" + get_lan_ip() + ":10000 on your PC browser"

# @view('edt')
def index():
    # return {}
    return template(ROOT+'/edt.html',{})


def api_file_tree():
    file_tree = file_tree_packer(PROJ_ROOT)
    # response.content_type = 'application/json'
    # return json.dumps(file_tree)
    return file_tree


def file_tree_packer(path):
    this_step_folder = ''
    this_step_file = ''
    name_list = os.listdir(path)
    for name in name_list:
        file_path = os.path.join(path, name)
        if not name[0] == '.':
            if os.path.isdir(file_path) and not name[0] == '.':
                this_step_folder += '"' + name+'":{"type":"folder","content":{' + file_tree_packer(file_path) + '}},'
            else:
                this_step_file += '"' + name+'":{"type":"file"},'
    return this_step_folder + this_step_file


def api_file_content():
    path = PROJ_ROOT+'/'+request.GET.get('path')
    file_object = open(path)
    try:
        all_the_text = file_object.read()
    except:
        all_the_text = u'不支持编辑此文件'
    finally:
        file_object.close()
    return all_the_text


def api_img_pre(file_path):
    return static_file(file_path, root=PROJ_ROOT)


def api_new_folder():
    path = PROJ_ROOT+'/'+request.POST.get('path')
    try:
        os.mkdir(path)
    except:
        return 'err'
    return 'ok'


def api_del_file():
    path = PROJ_ROOT+'/'+request.POST.get('path')
    try:
        if os.path.isdir(path):
            shutil.rmtree(path[:-1])
        else:
            os.remove(path)
    except:
        return 'err'
    return 'ok'


def api_save():
    path = PROJ_ROOT+'/'+request.POST.get('path')
    content = request.POST.get('content')
    file_object = open(path, 'w')
    try:
        file_object.write(content)
    except:
        return u'err'
    finally:
        file_object.close()
    return u'ok'


def api_run():
    path = PROJ_ROOT+'/'+request.POST.get('path')
    try:
        import androidhelper
        droid = androidhelper.Android()
        droid.executeQPy(path)
    except:
        return 'err'
    return 'ok'



# ---- WEBAPP ROUTERS ----


app = Bottle()
app.route('/', method='GET')(index)
app.route('/hello', method='GET')(hello)
app.route('/__exit', method=['GET', 'HEAD'])(__exit)
app.route('/__ping', method=['GET', 'HEAD'])(__ping)
app.route('/static/<file_path:path>', method='GET')(server_static)
app.route('/api/file-tree', method='GET')(api_file_tree)
app.route('/api/file-content', method='GET')(api_file_content)
app.route('/api/img-pre/<file_path:path>', method='GET')(api_img_pre)
app.route('/api/new-folder', method='POST')(api_new_folder)
app.route('/api/del-file', method='POST')(api_del_file)
app.route('/api/save', method='POST')(api_save)
app.route('/api/run', method='POST')(api_run)

try:
    server = MyWSGIRefServer(host="0.0.0.0", port="10000")
    app.run(server=server, reloader=False)
except Exception, ex:
    print "Exception: %s" % repr(ex)
