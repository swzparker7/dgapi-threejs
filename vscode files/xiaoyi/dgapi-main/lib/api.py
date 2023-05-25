import os
import eyed3
from datetime import datetime
import flask
from flask import Blueprint
from lib.asr import ASR
from lib.tts import TTS
import lib.tts_new as TTS_N

import zerorpc
import numpy as np
from contextlib import contextmanager

from lib.flow_asr import flow_asr_process
from QA import get_our_answer

from flask_cors import cross_origin


audioApi = Blueprint("audioApi", __name__)

from revChatGPT.V3 import Chatbot

chatbot = Chatbot(
    api_key="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",
    engine="gpt-3.5-turbo",
)


@contextmanager
def get_client():
    try:
        client = zerorpc.Client(heartbeat=60)
        client.connect("tcp://59.77.13.250:10003")  # connect to server
        yield client
    except Exception as e:
        import traceback

        raise Exception(traceback.format_exc())
    finally:
        client.close()


def tid_maker():
    return "{0:%Y%m%d%H%M%S}".format(datetime.now())


def change_model(model_name):
    global Tacotron, Vocoder, model
    model = models[model_name]
    Tacotron = load_and_setup_tacotron(
        model["tacotron_path"], model["speaker_num"], parser, args
    )
    Vocoder = load_and_setup_wavernn(model["vocoder_path"])


@audioApi.route("/")
def index():
    return "<h1>Hello, this is audioApi blueprint</h1>"


import shutil
import json
from flask import request, Response

import lib.asr_new as ASR_N


@audioApi.route("/stream", methods=["POST"])
def stream():
    accentid = request.args.get("accentid")
    print(f"py and js connect {accentid}")
    # 清除上一次的答案音频
    if os.path.exists("static/tts/"):
        shutil.rmtree("static/tts/")
    os.makedirs("static/tts/")
    result = {"code": -1}
    # 获取问题音频文件
    file = flask.request.files["upfile"]
    file_name = file.filename
    file_path = os.path.join("static", file_name)
    file.save(file_path)
    url = flask.url_for("static", _external=True, filename=file_path)

    # accentid = 0
    # print(f"语音+++++++++={accentid}")

    # 语音转文字 普通话0，贵州话1
    if accentid == "0":
        ASR_text = ASR_N.ASR(0)
        # ASR_text = ASR()
    else:
        ASR_text = ASR_N.ASR(1)

    # ASR_text = "请以我的农民父亲为题写一篇150字的作文。"
    # ASR_text = '有多子女的父母，可以对不同的子女选择不同的扣除方式吗?'
    # 逐条生成回答音频，并返回结果
    def generate():
        # 判断问题是否在我们的答案库
        is_exist, answer = get_our_answer(ASR_text)
        if False:
            print("using our answer by accent: ", accentid)
            yield json.dumps({"path": answer, "duration": 0.0}) + "\n"
        else:
            GPT_res = ""
            idx = 0

            # time1 = datetime.now()
            # 流式获取GPT回答
            with get_client() as client:
                for data in client.get_llm_answer(ASR_text):
                    if data["type"] != 5:
                        GPT_res += data["result"]
                        print(GPT_res)
                    else:
                        # print(data, end="", flush=True)
                        GPT_res += data["result"]
                        print(GPT_res)

                        # if idx == 0:
                        #     time2 = datetime.now()
                        # print(f'chatGPT流式第一次响应耗时：{time2-time1}')

                        # 断句，遇到标点直接转音频返回
                        keys = [
                            "，",
                            "。",
                            "！",
                            "？",
                            ",",
                            "!",
                            "?",
                        ]
                        for key in keys:
                            if key in data["result"]:
                                idx += 1
                                data_str = str(data["result"])
                                remain_str = ""
                                # 获取音频结果
                                # index = data_str.index(key)
                                # remain_str += data_str[index : len(data_str)]
                                # data_str = data_str[0:index]
                                # data_clips = data_str.split(key)
                                # if data_clips[0] != key:
                                #     GPT_res += data_clips[0]
                                #     remain_str += data_clips[1]
                                #     print(f"切片1{data_clips}")
                                GPT_res = str(GPT_res).replace(" ", "")
                                tts_res = TTS_N.TTS(GPT_res, idx)
                                print("【中间结果】：", GPT_res)
                                # if idx == 1:
                                #     time3 = datetime.now()
                                # print(f'chatGPT流式第一次返回TTS：{time3-time2}')
                                tts_res["speak_type"] = str(data["type"])

                                GPT_res = ""
                                # GPT_res += remain_str
                                # 返回json格式的消息
                                yield json.dumps(tts_res) + "\n"

            # 若有最后一句，则处理，或处理最后的标点
            if GPT_res != "":
                idx += 1
                GPT_res = str(GPT_res).replace(" ", "")
                tts_res = TTS_N.TTS(GPT_res, idx)
                print("【最后结果】：", GPT_res)
                tts_res["speak_type"] = str(data["type"])
                yield json.dumps(tts_res) + "\n"
            else:
                print("上面已是【最后结果】：")
                # yield json.dumps(None) + '\n'

    return Response(generate(), mimetype="text/plain")
    # # 逐条生成回答音频，并返回结果
    # def generate():
    #     # 判断问题是否在我们的答案库
    #     is_exist, answer = get_our_answer(ASR_text)
    #     if is_exist:
    #         print("using our answer by accent: ", accentid)
    #         yield json.dumps({"path": answer, "duration": 0.0}) + "\n"
    #     else:
    #         GPT_res = ""
    #         idx = 0
    #         # time1 = datetime.now()
    #         # 流式获取GPT回答
    #         for data in chatbot.ask_stream(ASR_text, convo_id="main"):
    #             # print(data, end="", flush=True)
    #             GPT_res += data

    #             # if idx == 0:
    #             #     time2 = datetime.now()
    #             # print(f'chatGPT流式第一次响应耗时：{time2-time1}')

    #             # 断句，遇到标点直接转音频返回
    #             if data in [
    #                 "，",
    #                 "。",
    #                 "！",
    #                 "？",
    #                 ",",
    #                 "!",
    #                 "?",
    #             ]:
    #                 idx += 1
    #                 # 获取音频结果
    #                 tts_res = TTS(GPT_res, idx)
    #                 print("【中间结果】：", GPT_res)
    #                 # if idx == 1:
    #                 #     time3 = datetime.now()
    #                 # print(f'chatGPT流式第一次返回TTS：{time3-time2}')

    #                 GPT_res = ""
    #                 # 返回json格式的消息
    #                 yield json.dumps(tts_res) + "\n"

    #         # 若有最后一句，则处理，或处理最后的标点
    #         if GPT_res != "":
    #             idx += 1
    #             tts_res = TTS(GPT_res, idx)
    #             print("【最后结果】：", GPT_res)
    #             yield json.dumps(tts_res) + "\n"
    #         else:
    #             print("上面已是【最后结果】：")
    #             # yield json.dumps(None) + '\n'

    # return Response(generate(), mimetype="text/plain")


@audioApi.route("/upload_audio", methods=["POST"])
def upload_wav():
    result = {"code": -1}
    file = flask.request.files["upfile"]
    file_name = file.filename
    file_path = os.path.join("static", file_name)
    file.save(file_path)
    url = flask.url_for("static", _external=True, filename=file_path)

    ASR_res = ASR()

    GPT_res = ""

    time1 = datetime.now()
    answer = chatbot.ask(ASR_res, convo_id="main")
    time2 = datetime.now()
    print(f"chatGPT响应耗时:{time2-time1}")

    for data in answer:
        # print(data, end="", flush=True)
        GPT_res += data

    print(f"GPT_res: {GPT_res}")
    tts_res = TTS(GPT_res)
    print("TTS合成音频时长: ", tts_res["duration"])

    result["code"] = 0
    result["msg"] = "success!"

    result["data"] = tts_res["duration"]
    return flask.jsonify(result)


@audioApi.route("/flow_ask", methods=["POST"])
def flow_ask():
    result = {"code": -1}
    file = flask.request.files["upfile"]
    file_name = file.filename
    file_path = os.path.join("static", file_name)
    file.save(file_path)
    url = flask.url_for("static", _external=True, filename=file_path)

    ASR_res = flow_asr_process()
    time1 = datetime.now()
    GPT_res = ""
    for data in chatbot.ask(ASR_res, convo_id="main"):
        # print(data, end="", flush=True)
        GPT_res += data

    time2 = datetime.now()
    print(GPT_res)
    print(f"time:{time2-time1} | GPT_res: {GPT_res}")
    TTS(GPT_res)
    wav_path = "static/ttsRes.mp3"
    mp3Info = eyed3.load(wav_path)
    duration = mp3Info.info.time_secs * 1000

    result["code"] = 0
    result["msg"] = "success!"

    print("TTS合成音频时长: ", duration)

    result["data"] = duration
    return flask.jsonify(result)


@audioApi.route("/get_ans", methods=["GET"])
def get_ans():
    result = {"code": -1}
    result["code"] = 0
    result["msg"] = "success!"
    result["data"] = None

    ASR_res = ASR()
    GPT_res = ""
    for data in chatbot.ask(ASR_res, convo_id="main"):
        # print(data, end="", flush=True)
        GPT_res += data
    print(GPT_res)
    TTS(GPT_res)
    result["data"] = "static/ttsRes.mp3"
    return flask.jsonify(result)


@audioApi.route("/model_list", methods=["GET"])
def get_model_list():
    result = {"code": -1}
    result["code"] = 0
    result["msg"] = "success!"
    result["data"] = "models"
    return flask.jsonify(result)


@audioApi.route("/clean", methods=["POST"])
def clean():
    data = {"success": False}
    minutes = flask.request.form.get("minutes", type=str, default=30)
    if flask.request.method == "POST":
        cmd_gl = "find ./static/gl/ -type f -mmin +" + minutes + " -exec rm {} \;"
        cmd_npy = "find ./static/npy/ -type f -mmin +" + minutes + " -exec rm {} \;"
        cmd_vocoder = (
            "find ./static/vocoder/ -type f -mmin +" + minutes + " -exec rm {} \;"
        )
        os.system(cmd_gl)
        os.system(cmd_npy)
        os.system(cmd_vocoder)
        data["success"] = True
    return flask.jsonify(data)
