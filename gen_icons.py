# -*- coding: utf-8 -*-
"""
生成小程序所需的所有轻量 PNG 图标
使用 Pillow 绘制矢量风格图标，比 emoji 更省流量、渲染更稳定
运行: python gen_icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'icons')
TABBAR_DIR = os.path.dirname(os.path.abspath(__file__))  # TabBar 图标放在 images/ 根目录

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 尺寸配置
ICON_SIZE = 48  # 输出图标尺寸
BG_SIZE = ICON_SIZE + 8  # 背景稍大一点用于圆角
COLORS = {
    'red': '#B71C1C',
    'red_dark': '#D32F2F',
    'green': '#2E7D32',
    'gold': '#DAA520',
    'gold_dark': '#8B6914',
    'purple': '#7B1FA2',
    'gray': '#86868B',
    'gray_light': '#AEAEB2',
    'white': '#FFFFFF',
    'orange': '#E65100',
}

def make_icon(draw_func, filename, size=ICON_SIZE):
    """创建透明背景的图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_func(draw, size)
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, 'PNG', optimize=True)
    print(f'  ✓ {filename} ({os.path.getsize(path)} bytes)')
    return path

def make_circle_icon(bg_color, symbol, filename, size=ICON_SIZE):
    """创建圆形背景+文字/符号的图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = 1
    draw.ellipse([margin, margin, size-margin-1, size-margin-1], fill=bg_color)
    # 尝试使用系统字体
    try:
        font = ImageFont.truetype('msyh.ttc', int(size * 0.45))
    except:
        try:
            font = ImageFont.truetype('arial.ttf', int(size * 0.45))
        except:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), symbol, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - 2), symbol, fill='white', font=font)
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, 'PNG', optimize=True)
    print(f'  ✓ {filename} ({os.path.getsize(path)} bytes)')

def icon_share_wechat(draw, s):
    """分享（微信对话气泡）"""
    c = COLORS['green']
    r = s // 2 - 4
    cx, cy = s // 2, s // 2
    # 气泡主体
    draw.rounded_rectangle([cx-r, cy-r-2, cx+r, cy+r+6], radius=r//2, fill=c)
    # 气泡尾巴
    draw.polygon([(cx+2, cy+r+4), (cx+8, cy+r+10), (cx+r-4, cy+r+4)], fill=c)
    # 三个点
    for i, oy in enumerate([-6, 0, 6]):
        draw.ellipse([cx-2, cy+oy-2, cx+2, cy+oy+2], fill='white')

def icon_share_moments(draw, s):
    """朋友圈（圆圈）"""
    c = COLORS['gold']
    cx, cy = s // 2, s // 2
    r_out = s // 2 - 4
    r_in = r_out - 6
    draw.ellipse([cx-r_out, cy-r_out, cx+r_out, cy+r_out], outline=c, width=3)
    draw.ellipse([cx-r_in, cy-r_in, cx+r_in, cy+r_in], outline=c, width=2)
    # 圆心点
    draw.ellipse([cx-3, cy-3, cx+3, cy+3], fill=c)

def icon_save(draw, s):
    """保存（软盘/存储）"""
    c = COLORS['gold_dark']
    margin = 6
    # 软盘外形
    draw.rounded_rectangle([margin, margin+4, s-margin, s-margin-2], radius=3, fill=c)
    # 标签区域
    draw.rectangle([margin+4, margin+4, s-margin-4, margin+s//3], fill='#FFF8E7')
    # 底部滑块
    draw.rectangle([margin+6, s-margin-12, s-margin-6, s-margin-6], fill='#FFF8E7')
    # 中间横线
    draw.line([margin, s//2+2, s, s//2+2], fill='#FFF8E7', width=2)

def icon_fo(draw, s):
    """佛历（法轮/吉祥结简化）"""
    c = COLORS['purple']
    cx, cy = s // 2, s // 2
    r = s // 2 - 6
    # 外圈
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=c, width=2)
    # 内部八辐简化为十字+四角
    arm = r * 0.55
    for angle in [0, 90, 180, 270]:
        import math
        rad = math.radians(angle)
        x1, y1 = cx + math.cos(rad)*r*0.25, cy + math.sin(rad)*r*0.25
        x2, y2 = cx + math.cos(rad)*arm, cy + math.sin(rad)*arm
        draw.line([x1, y1, x2, y2], fill=c, width=2)

def icon_yin_yang(draw, s):
    """阴阳/功过格（太极简化）"""
    c1 = COLORS['gold_dark']
    c2 = '#333'
    cx, cy = s // 2, s // 2
    r = s // 2 - 5
    # 左半圆（阳）
    draw.pieslice([cx-r, cy-r, cx+r, cy+r], 90, 270, fill=c1)
    # 右半圆（阴）
    draw.pieslice([cx-r, cy-r, cx+r, cy+r], -90, 90, fill=c2)
    # 阴中阳点
    draw.ellipse([cx-r*0.35, cy-r*0.15, cx+r*0.15, cy+r*0.35], fill=c2)
    # 阳中阴点
    draw.ellipse([cx-r*0.15, cy-r*0.35, cx+r*0.35, cy+r*0.15], fill=c1)

def icon_home(draw, s):
    """今日/首页（房子简化）"""
    c = COLORS['red']
    margin = 6
    top_y = margin + s//4
    # 屋顶三角形
    draw.polygon([
        [s//2, margin],
        [margin+2, top_y],
        [s-margin-2, top_y]
    ], fill=c)
    # 房身
    draw.rectangle([margin+4, top_y, s-margin-4, s-margin], fill=c)
    # 门
    dw, dh = s//4, s//4
    draw.rectangle([s//2-dw//2, s-margin-dh, s//2+dw//2, s-margin], fill='#FFECB3')

def icon_settings(draw, s):
    """设置（齿轮简化）"""
    c = COLORS['gray']
    cx, cy = s // 2, s // 2
    r_outer = s // 2 - 4
    r_inner = r_outer * 0.4
    # 齿轮外圈（用多边形模拟齿）
    import math
    teeth = 8
    points = []
    for i in range(teeth * 2):
        angle = math.radians(i * 180 / teeth - 90)
        if i % 2 == 0:
            rr = r_outer
        else:
            rr = r_outer * 0.78
        points.append((cx + math.cos(angle) * rr, cy + math.sin(angle) * rr))
    draw.polygon(points, fill=c)
    # 中心孔
    draw.ellipse([cx-r_inner, cy-r_inner, cx+r_inner, cy+r_inner], fill='white')

def icon_edit(draw, s):
    """编辑/笔记（铅笔简化）"""
    c = COLORS['gold_dark']
    margin = 6
    # 笔身（旋转的矩形）
    import math
    angle = math.radians(-45)
    cx, cy = s // 2 + 2, s // 2
    hw, hh = s // 3, s // 5
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    corners = [
        (cx - hw*cos_a + hh*sin_a, cy - hw*sin_a - hh*cos_a),
        (cx + hw*cos_a + hh*sin_a, cy + hw*sin_a - hh*cos_a),
        (cx + hw*cos_a - hh*sin_a, cy + hw*sin_a + hh*cos_a),
        (cx - hw*cos_a - hh*sin_a, cy - hw*sin_a + hh*cos_a),
    ]
    draw.polygon(corners, fill=c)
    # 笔尖
    tip_y = corners[3][1] + 4
    draw.polygon([corners[3], (corners[3][0]-3, tip_y), (corners[3][0]+3, tip_y)], fill=c)

def icon_clock(draw, s):
    """时钟/时辰（钟表简化）"""
    c = COLORS['orange']
    cx, cy = s // 2, s // 2
    r = s // 2 - 5
    # 表盘
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=c, width=2)
    # 时针
    draw.line([cx, cy, cx, cy-r*0.5], fill=c, width=2)
    # 分针
    draw.line([cx, cy, cx+r*0.65, cy], fill=c, width=2)
    # 中心点
    draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=c)

def icon_scroll(draw, s):
    """彭祖百忌/卷轴（卷轴简化）"""
    c = COLORS['gold_dark']
    margin = 6
    rw, rh = s - margin*2, s - margin*2
    rx, ry = margin, margin
    # 卷轴体
    draw.rounded_rectangle([rx, ry+4, rx+rw, ry+rh-4], radius=3, fill='#FFF8E7', outline=c, width=1)
    # 上轴
    draw.rounded_rectangle([rx-2, ry, rx+rw+2, ry+6], radius=2, fill=c)
    # 下轴
    draw.rounded_rectangle([rx-2, ry+rh-6, rx+rw+2, ry+rh], radius=2, fill=c)
    # 文字线
    for ly in range(ry+14, ry+rh-10, 8):
        draw.line([rx+8, ly, rx+rw-8, ly], fill=c, width=1)

def icon_horse(draw, s):
    """生肖马前缀（马头简化）"""
    c = COLORS['gold_dark']
    cx, cy = s // 2, s // 2
    # 马头轮廓简化
    draw.ellipse([cx-12, cy-10, cx+12, cy+12], outline=c, width=2)
    # 耳朵
    draw.polygon([[cx-8, cy-10], [cx-4, cy-18], [cx-2, cy-10]], fill=c)
    draw.polygon([[cx+2, cy-10], [cx+4, cy-18], [cx+8, cy-10]], fill=c)
    # 鬃毛
    for i in range(4):
        draw.arc([cx-10+i*5, cy-14, cx-4+i*5, cy-2], 200, 340, fill=c, width=1)

def icon_leaf(draw, s):
    """节气/叶子（叶子简化）"""
    c = COLORS['green']
    cx, cy = s // 2, s // 2 + 2
    # 叶子形状
    draw.polygon([
        [cx, cy-16],
        [cx-12, cy-4],
        [cx-8, cy+12],
        [cx, cy+8],
        [cx+8, cy+12],
        [cx+12, cy-4],
    ], fill=c)
    # 叶脉
    draw.line([cx, cy-14, cx, cy+10], fill='white', width=1)
    draw.line([cx, cy-4, cx-6, cy+2], fill='white', width=1)
    draw.line([cx, cy-4, cx+6, cy+2], fill='white', width=1)

def icon_plus(draw, s):
    """加号"""
    c = COLORS['green']
    cx, cy = s // 2, s // 2
    l = s // 3
    w = 3
    draw.rectangle([cx-l, cy-w, cx+l, cy+w], fill=c)
    draw.rectangle([cx-w, cy-l, cx+w, cy+l], fill=c)

def icon_minus(draw, s):
    """减号"""
    c = COLORS['red']
    cx, cy = s // 2, s // 2
    l = s // 3
    w = 3
    draw.rectangle([cx-l, cy-w, cx+l, cy+w], fill=c)

def icon_delete(draw, s):
    """删除（垃圾桶简化）"""
    c = '#C62828'
    margin = 8
    bw, bh = s - margin*2, s - margin*2 - 4
    bx, by = margin, margin + 6
    # 桶身
    draw.rectangle([bx, by, bx+bw, by+bh], fill=c)
    # 盖子
    draw.rectangle([bx-2, by-4, bx+bw+2, by+2], fill=c)
    # 提手
    draw.line([bx+bw//3, by-4, bx+bw*2//3, by-4], fill=c, width=2)
    # 线条
    for ly in range(by+8, by+bh-2, 8):
        draw.line([bx+3, ly, bx+bw-3, ly], fill='white', width=1)

def icon_warning(draw, s):
    """警告（三角感叹号）"""
    c = COLORS['orange']
    cx, cy = s // 2, s // 2
    # 三角形
    draw.polygon([
        [cx, cy-14],
        [cx-13, cy+10],
        [cx+13, cy+10],
    ], fill=c)
    # 感叹号
    draw.rectangle([cx-2, cy-6, cx+2, cy+2], fill='white')
    draw.ellipse([cx-2, cy+4, cx+2, cy+8], fill='white')

def icon_cake(draw, s):
    """生日蛋糕"""
    c1 = '#E91E63'
    c2 = '#FFC107'
    cx, cy = s // 2, s // 2
    # 蛋糕体
    draw.rounded_rectangle([cx-14, cy, cx+14, cy+12], radius=3, fill=c1)
    # 奶油层
    draw.rectangle([cx-12, cy-3, cx+12, cy+2], fill=c2)
    # 蜡烛
    draw.rectangle([cx-2, cy-12, cx+2, cy-2], fill='#FFF')
    # 火焰
    draw.ellipse([cx-4, cy-18, cx+4, cy-12], fill='#FF9800')

def icon_heart(draw, s):
    """爱心/纪念日"""
    c = '#E91E63'
    cx, cy = s // 2 + 2, s // 2 - 2
    import math
    # 心形用两个圆+三角形模拟
    draw.ellipse([cx-10, cy-8, cx, cy+4], fill=c)
    draw.ellipse([cx, cy-8, cx+10, cy+4], fill=c)
    points = [
        [cx-10, cy],
        [cx, cy+16],
        [cx+10, cy],
    ]
    draw.polygon(points, fill=c)


def icon_star(draw, s):
    """星星/自定义"""
    c = '#FFC107'
    cx, cy = s // 2, s // 2
    import math
    # 五角星
    r_out = s // 2 - 5
    r_in = r_out * 0.4
    points = []
    for i in range(10):
        angle = math.radians(i * 36 - 90) + math.radians(180 if i % 2 else 0)
        rr = r_in if i % 2 else r_out
        points.append((cx + math.cos(angle) * rr, cy + math.sin(angle) * rr))
    draw.polygon(points, fill=c)


# ==================== 主程序 ====================
if __name__ == '__main__':
    print(f'🎨 开始生成图标 -> {OUTPUT_DIR}')
    print()

    # --- 分享按钮图标 ---
    print('--- 分享按钮图标 ---')
    make_icon(icon_share_wechat, 'share-wechat.png')
    make_icon(icon_share_moments, 'share-moments.png')
    make_icon(icon_save, 'save.png')

    # --- 功能图标 ---
    print('\n--- 功能图标 ---')
    make_icon(icon_fo, 'fo.png')           # 佛历
    make_icon(icon_yin_yang, 'yin-yang.png')  # 功过格/阴阳
    make_icon(icon_home, 'home.png')       # 今日/首页
    make_icon(icon_settings, 'settings.png')   # 设置
    make_icon(icon_edit, 'edit.png')       # 编辑/笔记
    make_icon(icon_clock, 'clock.png')     # 时辰/时钟
    make_icon(icon_scroll, 'scroll.png')   # 彭祖百忌/卷轴
    make_icon(icon_horse, 'horse.png')     # 生肖马
    make_icon(icon_leaf, 'leaf.png')       # 节气/叶子
    make_icon(icon_plus, 'plus.png')       # 加号
    make_icon(icon_minus, 'minus.png')     # 减号
    make_icon(icon_delete, 'delete.png')   # 删除
    make_icon(icon_warning, 'warning.png') # 警告

    # --- 事件分类图标 ---
    print('\n--- 事件分类图标 ---')
    make_icon(icon_cake, 'cake.png')         # 生日
    make_icon(icon_heart, 'heart.png')       # 纪念日
    make_icon(icon_star, 'star.png')         # 自定义

    # ==================== TabBar 图标（81×81 px） ====================
    print('\n--- TabBar 导航图标（81×81） ---')

    TABBAR_SIZE = 81
    TABBAR_COLOR_NORMAL = '#999999'       # 未选中颜色
    # 各 Tab 选中色
    TABBAR_TODAY_ACTIVE = '#FFA000'      # 今日选中：太阳本色（金橙）
    TABBAR_CALENDAR_ACTIVE = '#E65100'   # 黄历选中：橙色
    TABBAR_MERIT_ACTIVE = '#C6D300'     # 功过格选中：柠檬色

    def make_tabbar(draw_func, filename, is_active=False):
        """生成 81×81 的 TabBar 图标"""
        img = Image.new('RGBA', (TABBAR_SIZE, TABBAR_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_func(draw, TABBAR_SIZE, active=is_active)
        path = os.path.join(TABBAR_DIR, 'images', filename)
        img.save(path, 'PNG', optimize=True)
        print(f'  ✓ {filename} ({os.path.getsize(path)} bytes)')

    # ---- 今日（太阳 + 光芒） ----
    def tabbar_today(draw, s, active=False):
        import math
        cx, cy = s // 2, s // 2
        c = TABBAR_TODAY_ACTIVE if active else TABBAR_COLOR_NORMAL
        # 太阳圆体（核心）
        r = s // 2 - 18
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
        # 光芒（12 条长短交替的光线，更有太阳感）
        for i in range(12):
            angle = math.radians(i * 30 - 90)
            if i % 2 == 0:
                # 长光芒（主光线）
                inner_r = r + 3
                outer_r = r + 10
                w = 3
            else:
                # 短光芒（副光线）
                inner_r = r + 5
                outer_r = r + 8
                w = 2
            x1 = int(cx + math.cos(angle) * inner_r)
            y1 = int(cy + math.sin(angle) * inner_r)
            x2 = int(cx + math.cos(angle) * outer_r)
            y2 = int(cy + math.sin(angle) * outer_r)
            draw.line([x1, y1, x2, y2], fill=c, width=w)
        # 选中态：太阳中心加高光点，更有"发光"感
        if active:
            hr = r * 0.3
            draw.ellipse([cx-hr+1, cy-hr-1, cx+hr+1, cy+hr-1], fill='#FFF5CC')

    # ---- 黄历（卷轴/日历书） ----
    def tabbar_calendar(draw, s, active=False):
        c = TABBAR_CALENDAR_ACTIVE if active else TABBAR_COLOR_NORMAL
        margin = 14
        rw, rh = s - margin*2, s - margin*2 - 4
        rx, ry = margin, margin + 2
        # 卷轴/书本主体
        draw.rounded_rectangle([rx, ry, rx+rw, ry+rh], radius=4, fill=c)
        # 上轴
        draw.rounded_rectangle([rx-2, ry-2, rx+rw+2, ry+5], radius=2, fill=c)
        # 下轴
        draw.rounded_rectangle([rx-2, ry+rh-5, rx+rw+2, ry+rh+2], radius=2, fill=c)
        # 中间横线（模拟文字行）
        line_y = ry + rh//2
        draw.line([rx+8, line_y, rx+rw-8, line_y], fill='white', width=2)
        draw.line([rx+8, line_y-6, rx+rw-12, line_y-6], fill='white', width=1)
        draw.line([rx+8, line_y+6, rx+rw-12, line_y+6], fill='white', width=1)

    # ---- 功过格（圆形） ----
    def tabbar_merit(draw, s, active=False):
        import math
        cx, cy = s // 2, s // 2
        r = s // 2 - 16
        if active:
            # 选中态：纯柠檬色实心圆 + 内部太极阴阳纹理
            c_fill = TABBAR_MERIT_ACTIVE
            c_stroke = '#B8A800'
            # 外层实心圆
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c_fill)
            # 内部淡淡的阴阳纹理（用细线勾勒，保持柠檬色主调）
            ri = r * 0.6
            draw.arc([cx-ri, cy-ri, cx+ri, cy+ri], 90, 270, fill=c_stroke, width=1)
            draw.arc([cx-ri, cy-ri, cx+ri, cy+ri], -90, 90, fill=c_stroke, width=1)
            # 两个小点
            dott = r * 0.18
            draw.ellipse([cx-dott-1, cy-dott*0.4-1, cx+dott-1, cy+dott*0.4-1], fill=c_stroke)
            draw.ellipse([cx-dott-1, cy+dott*0.4-2, cx+dott-1, cy+dott*1.2-2], fill=c_stroke)
        else:
            # 常态：灰色空心圆
            c = TABBAR_COLOR_NORMAL
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=c, width=3)

    # 生成全部 TabBar 图标
    make_tabbar(tabbar_today, 'today.png', is_active=False)
    make_tabbar(tabbar_today, 'today-active.png', is_active=True)
    make_tabbar(tabbar_calendar, 'calendar.png', is_active=False)
    make_tabbar(tabbar_calendar, 'calendar-active.png', is_active=True)
    make_tabbar(tabbar_merit, 'merit.png', is_active=False)
    make_tabbar(tabbar_merit, 'merit-active.png', is_active=True)

    print(f'\n✅ 全部完成！共生成图标到 {OUTPUT_DIR}/')
