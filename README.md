# 当AI重构逝者:慰藉的温柔与技术的僭越

这是一个关于AI复活技术的多媒体展示网页，探讨技术与伦理的边界。

## 新功能：自定义内容展示区域

在"话题热度"部分，我们新增了自定义内容功能，支持通过代码嵌入图片和Tableau图表：

### 1. 图表展示（默认）
- 显示关注度、讨论量、参与度的可视化图表
- 支持折线图、柱状图、圆环图等多种图表类型
- 鼠标悬停显示详细数据

### 2. 图片嵌入
- 通过代码直接嵌入图片
- 支持JPG、PNG、GIF等格式
- 自动适应容器大小（500px高度）

### 3. Tableau动态图表嵌入
- 通过代码直接嵌入Tableau图表
- 支持各种Tableau链接格式
- 自动转换为嵌入链接
- 包含数据指标文本框（关注度、讨论量、参与度）
- 500px高度，确保内容完整显示

## 开发者使用方法

### 嵌入图片
```javascript
// 嵌入图片
embedImageByCode('图片URL', '图片描述');

// 示例
embedImageByCode('https://example.com/image.jpg', '数据可视化图表');
```

### 嵌入Tableau
```javascript
// 嵌入Tableau图表
embedTableauByCode('Tableau链接');

// 示例
embedTableauByCode('https://public.tableau.com/views/YourDashboard/YourView');
```

### 返回图表模式
```javascript
// 显示默认图表
showChart();
```

### 显示Tableau内容（测试用）
```javascript
// 显示Tableau内容区域（包含示例iframe和文本框）
showTableauContent();
```

## 技术特性

- 响应式设计，支持各种屏幕尺寸
- 纯CSS3动画效果
- 原生JavaScript实现，无外部依赖
- 支持触摸和鼠标操作
- 无障碍访问支持

## 文件结构

```
网页（2）/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── script.js      # 功能脚本
└── assets/            # 图片资源
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

- 图片上传功能仅在支持File API的现代浏览器中可用
- Tableau嵌入需要网络连接
- 建议使用现代浏览器以获得最佳体验 