import requests
import json
#这个一个OPENAI通过中转站调用chat大模型的例子

url = "https://value.apiqik.online/v1/chat/completions"

payload = json.dumps({
   "temperature": 0.7,
   "messages": [
      {
         "role": "user",
         "content": "你好啊"
      }
   ],
   "model": "gpt-5.4",
   "stream": False
})
headers = {
   'Authorization': 'sk-f9DDXFBukvjdl970LScHVgVtFwIq0Ib4YVgZBRqTBo7O1Lag',
   'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)

#响应
#{"id":"chatcmpl-7235eb56-21db-44b7-b937-e0ba4d0dfa68","object":"chat.completion","created":1778306001,"model":"gpt-5.4","choices":[{"index":0,"message":{"role":"assistant","content":"你好！很高兴见到你 😊  \n有什么我可以帮你的吗
# ？"},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":21,"total_tokens":29}}