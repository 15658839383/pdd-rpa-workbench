import requests
import re


def 获取商品规格可选接口(cookie_value1):
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'etag': re.search(r'rckk=([^;]+)', cookie_value1).group(1),
        'origin': 'https://mms.pinduoduo.com',
        'priority': 'u=1, i',
        'referer': 'https://mms.pinduoduo.com/goods/goods_add/index?id=187586770613&goods_id=925951937221&type=edit',
        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'cookie': cookie_value1,
    }

    json_data = {
        'cat_id': 26945,#三级类目ID
    }

    response = requests.post(
        'https://mms.pinduoduo.com/glide/v2/mms/query/spec/name/list',

        headers=headers,
        json=json_data,
    )

