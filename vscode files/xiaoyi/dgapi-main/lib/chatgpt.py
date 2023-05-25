# python -m revChatGPT.V3 --api_key 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

# 测试用
from revChatGPT.V3 import Chatbot
chatbot = Chatbot(api_key="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")
question = '请以我的父亲为题写一篇500字的作文。他为人十分和善、淳朴，是个农民。'
print('user: ', question)
for data in chatbot.ask_stream(question, convo_id='main'):
    print(data, end="", flush=True)


# print('\nUser:  3')
# for data in chatbot.ask("3", convo_id='main'):
#     print(data, end="", flush=True)

# print('\nUser:  1')
# for data in chatbot.ask("1", convo_id='main'):
#     print(data, end="", flush=True)