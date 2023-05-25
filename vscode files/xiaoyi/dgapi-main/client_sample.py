import zerorpc
import numpy as np
from contextlib import contextmanager


@contextmanager
def get_client():
    try:
        client = zerorpc.Client()
        client.connect("tcp://59.77.13.250:10003")  # connect to server
        yield client
    except Exception as e:
        import traceback

        raise Exception(traceback.format_exc())
    finally:
        client.close()


if __name__ == "__main__":
    with get_client() as client:
        text_inputs = "你好"
        for resp in client.get_llm_answer(text_inputs):
            print("从服务端获取数据如下：")
            print(resp["result"])
            print(resp["type"])
