import openai
openai.api_key = "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"

def askChatGPT(question):
    prompt = question
    completions = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "请告诉我中国的国土面积有多大"},
        ],
        temperature=0.2,
    )

    message = completions.choices[0].text
    print(message)

askChatGPT("请告诉我中国的国土面积有多大")