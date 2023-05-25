import pandas as pd
from lib.tts import TTS
import shutil

# 用于根据题库QA.csv文件生成回答音频
df = pd.read_csv('QA.csv', header=None, encoding='gbk')
for i, answer in enumerate(df[3]):
    result = TTS(answer)
    shutil.copy(result['path'], f'static/answer/{i+1}.mp3')
print('Done')

# print(TTS('您好!有什么需要我帮助的吗? 请讲'))