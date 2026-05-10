import requests

def 获取商品信息(cookie_value1,goods_id):

    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
        'cache-control': 'max-age=0',
        'content-type': 'application/json',
        'origin': 'https://mms.pinduoduo.com',
        'priority': 'u=1, i',
        'referer': 'https://mms.pinduoduo.com/goods/goods_add/index?id=191029441198&goods_id=925780808295&type=edit',
        'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'cookie': cookie_value1,
    }

    json_data = {
        'goods_id': goods_id,
    }

    response = requests.post(
        'https://mms.pinduoduo.com/glide/v2/mms/query/commit/on_shop/detail',
        headers=headers,
        json=json_data,
    )

