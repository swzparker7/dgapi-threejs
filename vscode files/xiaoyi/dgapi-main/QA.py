import pandas as pd
import re
import os
from lib.tts import TTS
import numpy as np

# 用于判断当前问题是否在题库中，若匹配则按题库内容进行回答
# 若题库已包含本地音频则直接返回本地地址，否则调用TTS获取回答音频

# 读取题库文件
df = pd.read_csv("./QA.csv", header=None, encoding="gbk")
QAdict = dict(zip(df[1], df[2]))

# 正则表达式匹配，匹配到一个关键词就匹配成功
# def get_our_answer(question, split=' '):
#     for key in QAdict.keys():
#         pattern = ("|").join(key.split(split))
#         result = re.search(pattern, question)
#         if result:
#             return True, os.path.join('static','answer', str(QAdict[key]) + '.mp3')
#     return False, None


# # 正则表达式，有n个关键词时，匹配n-（error_word_count）个就匹配成功，当关键词小于等于2个时需全部匹配
# def get_our_answer(question, split=' ', error_word_count = 1):
#     for key in QAdict.keys():
#         # 分解当前问题的关键词
#         words = key.split(split)
#         # 记录当前匹配关键词数量
#         count = 0
#         # 总关键词数量
#         total = len(words)
#         for word in words:
#             result = re.search(word, question)
#             # 若关键词匹配，则数量+1
#             if result:
#                 count += 1;
#             # 判断问题是否匹配成功，分总数小于等于2和大于2两种情况
#             if (total <= 2):
#                 # 总数小于等于2需全部匹配，才成功
#                 if count == total:
#                     # 若当前问题无本地回答音频文件，则用TTS根据答案生成，若有本地文件，则直接获取位置，返回成功和音频文件位置
#                     if(np.isnan(QAdict[key])):
#                         result = TTS(df.loc[df[1] == key].iloc[0][3])
#                         return True, result['path']
#                     else:
#                         return True, os.path.join('static','answer', str(QAdict[key]) + '.mp3')
#             # 总数大于3，则匹配n-（error_word_count）个就匹配成功
#             else:
#                 if count == total - error_word_count:
#                     if(np.isnan(QAdict[key])):
#                         result = TTS(df.loc[df[1] == key].iloc[0][3])
#                         return True, result['path']
#                     else:
#                         return True, os.path.join('static','answer', str(QAdict[key]) + '.mp3')
#     # 如果都不匹配，则返回失败
#     return False, None

import lib.tts_new as tts_new


# 正则表达式，匹配所有关键词才匹配成功
def get_our_answer(question, split=" "):
    # 遍历每一个问题
    for key in QAdict.keys():
        # 将问题关键词分解，逐个判断是否匹配
        for word in key.split(split):
            result = re.search(word, question)
            # 有一个关键词不匹配，就直接进入下一个问题
            if not result:
                break
        # 如果循环没有被break，则全部匹配成功
        else:
            # 若当前问题无本地回答音频文件，则用TTS根据答案生成，若有本地文件，则直接获取位置，返回成功和音频文件位置
            if np.isnan(QAdict[key]):
                result = tts_new.TTS(df.loc[df[1] == key].iloc[0][3])
                return True, result["path"]
            else:
                result = tts_new.TTS(df.loc[df[1] == key].iloc[0][3])
                return True, result["path"]
                # return True, os.path.join("static", "answer", str(QAdict[key]) + ".mp3")
    # 如果都不匹配，则返回失败
    return False, None


if __name__ == "__main__":
    question = "南明区税务局中曹司税务分局的地址在哪里？"
    flag, answer = get_our_answer(question)
    print(flag, answer)
