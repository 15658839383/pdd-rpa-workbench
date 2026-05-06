import requests

def 获取昨日销售折线(cookie_value1, queryDate):
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'origin': 'https://mms.pinduoduo.com',
        'priority': 'u=1, i',
        'referer': 'https://mms.pinduoduo.com/sycm/stores_data/operation',
        'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'cookie': cookie_value1,
    }

    json_data = {
        'queryType': 6,
        'queryDate': queryDate,# 日期格式为yyyy-MM-dd
    }

    response = requests.post(
        'https://mms.pinduoduo.com/sydney/api/mallTrade/queryMallTradeList',
        headers=headers,
        json=json_data,
    )

