import sys
import socket
import threading
import requests
import string
import time
from concurrent.futures import ThreadPoolExecutor
from DrissionPage import Chromium, ChromiumOptions
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QLineEdit, QPushButton, QTextEdit, QMessageBox, QGroupBox)
from PyQt6.QtCore import pyqtSignal, QObject, QThread, Qt
from PyQt6.QtGui import QIcon

# Global configuration
huancun_file_path = r'D:\获取数据\缓存'
xianchengshu = 1
lock = threading.Lock()

# --- Logic Functions ---

def parse_cookie_string(cookie_string):
    """将cookie字符串解析为字典"""
    cookies = {}
    if not cookie_string:
        return cookies
    
    # 按分号分割cookie字符串
    items = cookie_string.split(';')
    for item in items:
        item = item.strip()
        if not item:
            continue
        # 按等号分割，只分割一次
        if '=' in item:
            key, value = item.split('=', 1)
            cookies[key.strip()] = value.strip()
    return cookies

def ReadAccountdata():
    """从API加载用户凭证信息"""
    try:
        response = requests.get('http://106.75.215.11:8080/api/shop-info2', timeout=10)
        response.raise_for_status()
        api_data = response.json()

        if not api_data.get('success', False):
            print("API返回失败")
            return []

        user_credentials = []
        for index, shop in enumerate(api_data.get('data', [])):
            remark = shop.get('remark')
            platform = shop.get('platform')
            shop_name = shop.get('shop_name')
            phone = shop.get('phone')
            password = shop.get('password')
            card_number = shop.get('card_number')
            cookie1 = shop.get('cookie1')  # 获取cookie1

            if (platform == "拼多多" and
                shop_name and
                cookie1):  # 使用cookie1而不是账号密码
                user_credentials.append((shop_name, card_number, cookie1))

        print(f"从API获取到 {len(user_credentials)} 个店铺登录凭证")
        return user_credentials

    except Exception as e:
        print(f"从API获取店铺凭证数据失败: {str(e)}")
        return []

def load_user_credentials():
    """加载凭证 (兼容性包装)"""
    all_data = ReadAccountdata()
    user_credentials = []
    for index, row in enumerate(all_data):
        shop_name = row[0]
        card_number = row[1]
        cookie1 = row[2]
        user_credentials.append((shop_name, card_number, cookie1, index)) 
    return user_credentials

def filter_input(text):
    """过滤标点符号和空格"""
    if not text: return ""
    filtered = ''.join(char for char in text if char not in string.punctuation and not char.isspace())
    return filtered.lower()

def find_shop_card_number(shop_name_input):
    """根据店名查找对应的卡盘号"""
    filtered_input = filter_input(shop_name_input)
    all_data = ReadAccountdata()
    for row in all_data:
        shop_name = row[0]
        filtered_shop_name = filter_input(shop_name)
        if filtered_input == filtered_shop_name:
            return row[1]  # card_number
    return None

def find_free_port():
    """查找一个可用的端口"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def login_to_pinduoduo(shop_name, card_number, cookie1, index, target_shop_name):
    """使用Cookie注入方式登录"""
    # Double check target
    if filter_input(shop_name) != filter_input(target_shop_name):
        return False

    print(f"正在尝试登录店铺: {shop_name}")
    
    user_data_path = huancun_file_path + '\\' + shop_name
    local_port = find_free_port()

    try:
        co = ChromiumOptions(read_file=False).set_paths(user_data_path=user_data_path).set_local_port(local_port)
        browser = Chromium(addr_or_opts=co, session_options=False)
        
        # 先创建一个空白标签页来注入 cookies
        tab = browser.new_tab()
        tab.set.activate()
        

        # 解析cookie字符串
        cookies = parse_cookie_string(cookie1)
        print(f"准备注入 {len(cookies)} 个cookies")
        
        # 注入 cookies
        for name, value in cookies.items():
            domain = '.pinduoduo.com'
            try:
                if name == '_nano_fp' or name == 'JSESSIONID' or name == 'PASS_ID' or name == 'x-visit-time' or name == 'windows_app_shop_token_23':
                    domain = 'mms.pinduoduo.com'
                if 'mms_' in name:
                    continue
                tab.set.cookies({
                    'name': name,
                    'value': value,
                    'domain': domain,  # 域名需要以点开头，适用于所有子域名
                    'path': '/',
                })
                print(f"✓ 成功设置 cookie: {name}")
            except Exception as e:
                print(f"✗ 设置 cookie 失败 {name}: {e}")

        tab.get("https://mms.pinduoduo.com/home")
       
            
    except Exception as e:
        print(f"浏览器操作异常: {e}")
        return False

# --- GUI Components ---

class Stream(QObject):
    """Redirects stdout to a signal"""
    newText = pyqtSignal(str)
    def write(self, text):
        self.newText.emit(str(text))
    def flush(self):
        pass

class LoginWorker(QThread):
    """Worker thread for executing the login process"""
    finished_signal = pyqtSignal()
    
    def __init__(self, target_shop_name):
        super().__init__()
        self.target_shop_name = target_shop_name
        self.is_running = True

    def run(self):
        print(f"--- 开始任务: {self.target_shop_name} ---")
        try:
            # Load credentials
            credentials = load_user_credentials()
            
            # Filter for the target shop
            target_creds = [c for c in credentials if filter_input(c[0]) == filter_input(self.target_shop_name)]
            
            if not target_creds:
                print(f"错误: 未找到店铺 '{self.target_shop_name}' 的凭证信息。")
                self.finished_signal.emit()
                return

            print(f"找到 {len(target_creds)} 个匹配的店铺凭证。")

            # Execute login
            with ThreadPoolExecutor(max_workers=xianchengshu) as executor:
                futures = []
                for shop_name, card_number, cookie1, index in target_creds:
                    if not self.is_running: break
                    future = executor.submit(login_to_pinduoduo, shop_name, card_number, cookie1, index, self.target_shop_name)
                    futures.append(future)
                
                # Wait for all to complete
                for future in futures:
                    future.result()

        except Exception as e:
            print(f"任务执行出错: {e}")
        
        print("--- 任务结束 ---")
        self.finished_signal.emit()

    def stop(self):
        self.is_running = False

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.worker = None
        self.initUI()

    def initUI(self):
        self.setWindowTitle('拼多多Cookie自动登录助手')
        self.setGeometry(100, 100, 600, 500)
        self.setWindowIcon(QIcon(r'c:\Users\Administrator\Desktop\登录\generated-f1171a136f1da195e66aa460e6e3ec776e61291f28bba0724d59cca6b70812e2.ico'))
        
        layout = QVBoxLayout()
        
        # Input Section
        input_group = QGroupBox("操作设置")
        input_layout = QHBoxLayout()
        
        self.shop_label = QLabel("输入店名:")
        self.shop_input = QLineEdit()
        self.shop_input.setPlaceholderText("请输入店铺名称")
        self.shop_input.returnPressed.connect(self.start_login)
        
        self.check_btn = QPushButton("查询卡盘号")
        self.check_btn.clicked.connect(self.check_card_number)
        
        input_layout.addWidget(self.shop_label)
        input_layout.addWidget(self.shop_input)
        input_layout.addWidget(self.check_btn)
        input_group.setLayout(input_layout)
        layout.addWidget(input_group)
        
        # Info Section
        self.info_label = QLabel("卡盘号: 等待查询...")
        self.info_label.setStyleSheet("font-weight: bold; color: #333; font-size: 14px;")
        layout.addWidget(self.info_label)
        
        # Action Section
        self.start_btn = QPushButton("开始登录")
        self.start_btn.setMinimumHeight(40)
        self.start_btn.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold;")
        self.start_btn.clicked.connect(self.start_login)
        self.start_btn.setEnabled(True)
        layout.addWidget(self.start_btn)
        
        # Log Section
        log_group = QGroupBox("运行日志")
        log_layout = QVBoxLayout()
        self.log_output = QTextEdit()
        self.log_output.setReadOnly(True)
        self.log_output.setStyleSheet("background-color: #f0f0f0; font-family: Consolas;")
        log_layout.addWidget(self.log_output)
        log_group.setLayout(log_layout)
        layout.addWidget(log_group)

        self.setLayout(layout)

        # Redirect stdout
        sys.stdout = Stream(newText=self.on_print)
        sys.stderr = Stream(newText=self.on_print)

    def on_print(self, text):
        cursor = self.log_output.textCursor()
        cursor.movePosition(cursor.MoveOperation.End)
        cursor.insertText(text)
        self.log_output.setTextCursor(cursor)
        self.log_output.ensureCursorVisible()

    def check_card_number(self):
        shop_name = self.shop_input.text().strip()
        if not shop_name:
            QMessageBox.warning(self, "提示", "请输入店铺名称")
            return
            
        self.log_output.append(f"正在查询店铺 '{shop_name}' 的信息...")
        QApplication.processEvents() # Force update
        
        try:
            card_number = find_shop_card_number(shop_name)
            if card_number:
                self.info_label.setText(f"卡盘号: {card_number}")
                self.info_label.setStyleSheet("font-weight: bold; color: green; font-size: 14px;")
                self.start_btn.setEnabled(True)
                self.log_output.append(f"查询成功: 卡盘号 {card_number}")
            else:
                self.info_label.setText("卡盘号: 未找到")
                self.info_label.setStyleSheet("font-weight: bold; color: red; font-size: 14px;")
                self.start_btn.setEnabled(False)
                self.log_output.append("未找到对应的卡盘号")
        except Exception as e:
            self.log_output.append(f"查询出错: {e}")

    def start_login(self):
        shop_name = self.shop_input.text().strip()
        if not shop_name:
            return

        # 清空输入框
        self.shop_input.clear()

        self.start_btn.setEnabled(False)
        self.shop_input.setEnabled(False)
        self.check_btn.setEnabled(False)

        self.worker = LoginWorker(shop_name)
        self.worker.finished_signal.connect(self.on_login_finished)
        self.worker.start()

    def on_login_finished(self):
        self.start_btn.setEnabled(True)
        self.shop_input.setEnabled(True)
        self.check_btn.setEnabled(True)

    def closeEvent(self, event):
        # Restore stdout
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
