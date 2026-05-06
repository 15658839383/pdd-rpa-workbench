import requests
import re

def 获取在售数量(cookie_value1):
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'etag': re.search(r'rckk=([^;]+)', cookie_value1).group(1),
        'origin': 'https://mms.pinduoduo.com',
        'priority': 'u=1, i',
        'referer': 'https://mms.pinduoduo.com/goods/goods_list?msfrom=mms_sidenav',
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
        'excluded_goods_type_list': [
            112,
        ],
    }

    response = requests.post(
        'https://mms.pinduoduo.com/vodka/v2/mms/query/display/mall_goods/count',
        headers=headers,
        json=json_data,
    )
