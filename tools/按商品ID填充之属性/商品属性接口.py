import requests
import re

def 获取商品属性(cookie_value1,goods_id):
    headers = {
    'accept': '*/*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'anti-content': requests.get('http://106.75.215.11:9000/api/0as').json().get('data'),
    'cache-control': 'max-age=0',
    'content-type': 'application/json',
    'origin': 'https://mms.pinduoduo.com',
    'priority': 'u=1, i',
    'referer': 'https://mms.pinduoduo.com/goods/goods_detail',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'cookie': cookie_value1,
    }

    json_data = {
        'goods_id': goods_id,
    }

    response = requests.post(
        'https://mms.pinduoduo.com/draco-ms/mms/query-goods-property',
        headers=headers,
        json=json_data,
    )


#成功响应
# {
#     "success": true,
#     "error_code": 1000000,
#     "result": {
#         "goods_properties": [
#             {
#                 "name": "\u54C1\u724C",
#                 "ref_pid": 310,
#                 "values": [
#                     {
#                         "vid": 60,
#                         "value": "Yaloo/\u96C5\u9E7F",
#                         "unit": "",
#                         "raw_value": "Yaloo/\u96C5\u9E7F"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u9762\u6599\u4FD7\u79F0",
#                 "ref_pid": 349,
#                 "values": [
#                     {
#                         "vid": 10367,
#                         "value": "\u5929\u9E45\u7ED2",
#                         "unit": "",
#                         "raw_value": "\u5929\u9E45\u7ED2"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u9762\u6599\u4E3B\u6750\u8D28",
#                 "ref_pid": 353,
#                 "values": [
#                     {
#                         "vid": 12964,
#                         "value": "\u7C98\u80F6\u7EA4\u7EF4",
#                         "unit": "",
#                         "raw_value": "\u7C98\u80F6\u7EA4\u7EF4"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u6210\u5206\u542B\u91CF",
#                 "ref_pid": 396,
#                 "values": [
#                     {
#                         "vid": 14500,
#                         "value": "81%\uFF08\u542B\uFF09\u201490%\uFF08\u542B\uFF09",
#                         "unit": "%",
#                         "raw_value": "81%\uFF08\u542B\uFF09\u201490%\uFF08\u542B\uFF09"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u9002\u7528\u6027\u522B",
#                 "ref_pid": 340,
#                 "values": [
#                     {
#                         "vid": 13287,
#                         "value": "\u5973",
#                         "unit": "",
#                         "raw_value": "\u5973"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u539A\u8584",
#                 "ref_pid": 341,
#                 "values": [
#                     {
#                         "vid": 13378,
#                         "value": "\u8584\u6B3E",
#                         "unit": "",
#                         "raw_value": "\u8584\u6B3E"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u98CE\u683C",
#                 "ref_pid": 322,
#                 "values": [
#                     {
#                         "vid": 10487,
#                         "value": "\u751C\u7F8E",
#                         "unit": "",
#                         "raw_value": "\u751C\u7F8E"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u670D\u88C5\u6B3E\u5F0F\u7EC6\u8282",
#                 "ref_pid": 348,
#                 "values": [
#                     {
#                         "vid": 13214,
#                         "value": "\u7EAF\u8272",
#                         "unit": "",
#                         "raw_value": "\u7EAF\u8272"
#                     },
#                     {
#                         "vid": 774148,
#                         "value": "\u889C\u5957",
#                         "unit": "",
#                         "raw_value": "\u889C\u5957"
#                     },
#                     {
#                         "vid": 10537,
#                         "value": "\u624E\u67D3",
#                         "unit": "",
#                         "raw_value": "\u624E\u67D3"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u56FE\u6848",
#                 "ref_pid": 750,
#                 "values": [
#                     {
#                         "vid": 56754,
#                         "value": "\u7EAF\u8272",
#                         "unit": "",
#                         "raw_value": "\u7EAF\u8272"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u529F\u80FD",
#                 "ref_pid": 351,
#                 "values": [
#                     {
#                         "vid": 912734,
#                         "value": "\u7F8E\u817F\u5851\u5F62",
#                         "unit": "",
#                         "raw_value": "\u7F8E\u817F\u5851\u5F62"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u5DE5\u827A",
#                 "ref_pid": 368,
#                 "values": [
#                     {
#                         "vid": 2071152,
#                         "value": "\u5355\u9488",
#                         "unit": "",
#                         "raw_value": "\u5355\u9488"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u4E0A\u5E02\u65F6\u8282",
#                 "ref_pid": 1906,
#                 "values": [
#                     {
#                         "vid": 5433146,
#                         "value": "2026\u5E74\u590F\u5B63",
#                         "unit": "",
#                         "raw_value": "2026\u5E74\u590F\u5B63"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u9488\u6570",
#                 "ref_pid": 3338,
#                 "values": [
#                     {
#                         "vid": 2436064,
#                         "value": "168\u9488\uFF08\u542B\uFF09-200\u9488\uFF08\u4E0D\u542B\uFF09",
#                         "unit": "",
#                         "raw_value": "168\u9488\uFF08\u542B\uFF09-200\u9488\uFF08\u4E0D\u542B\uFF09"
#                     }
#                 ]
#             },
#             {
#                 "name": "\u662F\u5426\u65E0\u9AA8\u7F1D\u5236",
#                 "ref_pid": 3548,
#                 "values": [
#                     {
#                         "vid": 3852846,
#                         "value": "\u975E\u65E0\u9AA8\u7F1D\u5236",
#                         "unit": "",
#                         "raw_value": "\u975E\u65E0\u9AA8\u7F1D\u5236"
#                     }
#                 ]
#             }
#         ],
#         "sku_properties": {}
#     }
# }