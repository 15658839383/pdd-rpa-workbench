import requests

cookies = {
    'lastLogin': '"2026-04-19 13:56:58"',
    'userRole': 'yunying_manager',
    'userUid': 'caed3c11-976b-45ab-8572-557cf9deab53',
    'loginAuth': 'true',
    'userPermissions': '"[\\"data-overview\\"\\054 \\"shop-management\\"\\054 \\"products-management\\"\\054 \\"huopan-management\\"\\054 \\"product-quality-score\\"\\054 \\"product-review-analysis\\"\\054 \\"rectification-management\\"\\054 \\"spu-trend\\"\\054 \\"art-task-management\\"\\054 \\"operator-summary\\"]"',
    'user': '%E5%BD%AD%E8%BE%89',
    'name': '%E5%BD%AD%E8%BE%89',
    'roleName': '%E8%BF%90%E8%90%A5%E7%AE%A1%E7%90%86',
}

headers = {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'keep-alive',
    # 'Cookie': 'lastLogin="2026-04-19 13:56:58"; userRole=yunying_manager; userUid=caed3c11-976b-45ab-8572-557cf9deab53; loginAuth=true; userPermissions="[\\"data-overview\\"\\054 \\"shop-management\\"\\054 \\"products-management\\"\\054 \\"huopan-management\\"\\054 \\"product-quality-score\\"\\054 \\"product-review-analysis\\"\\054 \\"rectification-management\\"\\054 \\"spu-trend\\"\\054 \\"art-task-management\\"\\054 \\"operator-summary\\"]"; user=%E5%BD%AD%E8%BE%89; name=%E5%BD%AD%E8%BE%89; roleName=%E8%BF%90%E8%90%A5%E7%AE%A1%E7%90%86',
    'Referer': 'http://106.75.215.11:8080/products.html',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 QQBrowser/21.0.8441.400',
}

params = {
    'page': '1',
    'page_size': '20',
    'search': '929421783014',
}

response = requests.get(
    'http://106.75.215.11:8080/api/products-data',
    params=params,
    cookies=cookies,
    headers=headers,
    verify=False,
)

print(response.text)