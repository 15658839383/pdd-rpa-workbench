import requests
import re

def 获取商品属性(cookie_value1):
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
        'cache-control': 'max-age=0',
        'etag': re.search(r'rckk=([^;]+)', cookie_value1).group(1),
        'priority': 'u=1, i',
        'referer': 'https://mms.pinduoduo.com/goods/category?msfrom=mms_sidenav',
        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'cookie': cookie_value1,
    }

    params = {
        'catId': '23350',#三级类目
        'pageType': '1',
        # 'goodsCommitId': '187496502437',
        # 'goodsId': '929403645690',
    }

    response = requests.get('https://mms.pinduoduo.com/draco-ms/mms/template/mall', params=params,  headers=headers)

