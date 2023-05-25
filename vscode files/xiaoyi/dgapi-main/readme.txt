环境安装
Python=3.11

安装步骤
cd ChatGPT-4.2.4
pip install -e .
pip install websocket==0.2.1
pip install websocket-client==0.57.0
pip install eyed3==0.9.7
pip install flask
pip install flask_cors
pip install pandas
cd ..
pip install zerorpc

服务启动：
python server.py


