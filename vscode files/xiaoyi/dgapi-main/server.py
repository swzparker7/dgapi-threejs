import flask
from lib.api import audioApi
from flask_cors import CORS

app = flask.Flask(__name__)
CORS(app, resources=r"/*")
# app = flask.Flask(__name__, static_url_path='/static')
app.register_blueprint(audioApi, url_prefix="")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8880, debug=False)
