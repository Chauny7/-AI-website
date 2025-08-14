// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // --- STATE (hoisted) ---
    let currentIndex = 1;
    let chapter2CurrentIndex = 1;
    let chapter4CurrentIndex = 1;

    let isThrottled = false;          // 统一节流开关
    let lastScrollTop = 0;            // 用于方向判断
    const typingState = { token: 0 }; // 打字机取消令牌

    // 统一缓存 DOM（避免重复查询）
    const el = {
        startBtn: document.getElementById('startBtn'),
        hero: document.getElementById('hero'),
        newPage1: document.getElementById('newPage1'),
        newPage2: document.getElementById('newPage2'),
        newPage3: document.getElementById('newPage3'),
        newPage4: document.getElementById('newPage4'),
        subtitleSection: document.getElementById('subtitleSection'),
        chapter1Section: document.getElementById('chapter1Section'),
        chapter2Section: document.getElementById('chapter2Section'),
        chapter2PhotosSection: document.getElementById('chapter2PhotosSection'),
        chapter3Section: document.getElementById('chapter3Section'),
        chapter4Section: document.getElementById('chapter4Section'),
        chapter4PhotosSection: document.getElementById('chapter4PhotosSection'),
        analysisSection: document.querySelector('.analysis-section'),
        transitionSection: document.getElementById('transitionSection'),
        navLinks: document.querySelectorAll('.quick-nav a'),
        // 画廊
        verticalSlides: Array.from(document.querySelectorAll('#verticalGallery .vertical-slide')) || Array.from(document.querySelectorAll('.vertical-slide')),
        chapter2Slides: Array.from(document.querySelectorAll('#chapter2VerticalGallery .vertical-slide')),
        chapter4Slides: Array.from(document.querySelectorAll('#chapter4VerticalGallery .vertical-slide')),
        // 指示器/字幕
        chapter1Indicators: document.querySelectorAll('#chapter1Indicators .indicator'),
        chapter2Indicators: document.querySelectorAll('#chapter2Indicators .indicator'),
        chapter4Indicators: document.querySelectorAll('#chapter4Indicators .indicator'),
        dynamicSubtitle: document.getElementById('dynamicSubtitle'),
        subtitleText: document.querySelector('#dynamicSubtitle .subtitle-text'),
        chapter4DynamicSubtitle: document.getElementById('chapter4DynamicSubtitle'),
        chapter4SubtitleText: document.querySelector('#chapter4DynamicSubtitle .subtitle-text'),
        // 模态框
        techDetailModal: document.getElementById('techDetailModal'),
    };

    // 明确顺序列表（按期望顺序排列）
    const SECTIONS = [
        '#newPage1',
        '#newPage2', 
        '#newPage3',
        '#newPage4',
        '#subtitleSection',
        '#chapter1Section',
        '.analysis-section',
        '#transitionSection',
        '#chapter2Section',
        '#chapter2PhotosSection',
        '#chapter2TransitionSection', // 添加新的第二章节过渡页面
        '#chapter3Section',
        '#chapter4Section',
        '#chapter4PhotosSection',
        '#ending'
    ].filter(Boolean);

    // --- UTIL ---
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function inViewport(dom, topRatio = 0.8, bottomRatio = 0.2) {
        if (!dom) return false;
        const vh = window.innerHeight;
        const r = dom.getBoundingClientRect();
        return r.top < vh * topRatio && r.bottom > vh * bottomRatio;
    }

    function throttleOnce(ms = 700) {
        if (isThrottled) return true;
        isThrottled = true;
        setTimeout(()=>{ isThrottled = false; }, ms);
        return false;
    }

    function scrollToSection(index) {
        if (index < 0 || index >= SECTIONS.length) return false;
        const elTarget = document.querySelector(SECTIONS[index]);
        if (!elTarget) return false;
        
        // 使用更平滑的滚动
        elTarget.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        return true;
    }

    function getCurrentSectionIndex() {
        const vh = window.innerHeight;
        for (let i = 0; i < SECTIONS.length; i++) {
            const elTarget = document.querySelector(SECTIONS[i]);
            if (!elTarget) continue;
            const rect = elTarget.getBoundingClientRect();
            // 调整检测阈值，让页面切换更准确
            if (rect.top < vh * 0.5 && rect.bottom > vh * 0.3) return i;
        }
        return -1;
    }

    function scrollToNextSection() {
        const idx = getCurrentSectionIndex();
        if (idx >= 0 && idx < SECTIONS.length - 1) return scrollToSection(idx + 1);
        return false;
    }
    function scrollToPreviousSection() {
        const idx = getCurrentSectionIndex();
        if (idx > 0) return scrollToSection(idx - 1);
        return false;
    }

    // 统一的"画廊滚动处理器"
    function handleGalleryScroll(delta, { slides, getIndex, setIndex, sectionEl }) {
        if (!slides?.length || !sectionEl) return false;
        if (!inViewport(sectionEl)) return false;

        const atFirst = getIndex() === 1 && delta < 0;
        const atLast  = getIndex() === slides.length && delta > 0;

        if (atLast && delta > 0) {
            if (throttleOnce(900)) return true;
            scrollToNextSection();
            return true;
        }
        if (atFirst || atLast) return false; // 交给自然滚动/其他处理

        // 真正切图
        if (throttleOnce(700)) return true;
        if (delta > 0 && getIndex() < slides.length) setIndex(getIndex() + 1);
        else if (delta < 0 && getIndex() > 1) setIndex(getIndex() - 1);
        return true;
    }

    // 导航辅助函数

    // 平滑滚动
    // 导航栏平滑滚动功能
    el.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });



    // 预加载图片
    el.verticalSlides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img && img.dataset && !img.complete) {
            const pre = new Image();
            pre.src = img.src;
        }
    });

    // 开始按钮：保留原有Hero，滚动进入章节
    if (el.startBtn) {
        el.startBtn.addEventListener('click', function () {
            el.hero.classList.add('changed');
            el.hero.style.backgroundImage = "url('assets/bg2.jpg')";
            setTimeout(() => {
                // 先滚动到字幕封面区域，停留一段时间后再进入图片章节（由用户滚动触发）
                if (el.subtitleSection) {
                    el.subtitleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        });
    }

    // 保留一个用于"进入视口加 .in-view"的 Observer，并删除与滚动方向相关的判断
    const fadeObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if (entry.isIntersecting) entry.target.classList.add('in-view');
            else entry.target.classList.remove('in-view');
        });
    }, { threshold: 0.1 });

    // 观察主要模块，注意空值判断
    [
        el.hero, el.newPage1, el.newPage2, el.newPage3, el.newPage4, el.subtitleSection, el.chapter1Section, el.chapter2Section,
        el.chapter2PhotosSection, el.chapter3Section, el.chapter4Section,
        el.chapter4PhotosSection, el.analysisSection, el.transitionSection
    ].forEach(n => { if (n) fadeObserver.observe(n); });

    // 单独的字幕浮现（如需）
    const subtitleObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
    }, { threshold: 0.4 });
    if (el.subtitleSection) subtitleObserver.observe(el.subtitleSection);
    if (el.chapter2Section) subtitleObserver.observe(el.chapter2Section);
    if (el.chapter3Section) subtitleObserver.observe(el.chapter3Section);
    if (el.chapter4Section) subtitleObserver.observe(el.chapter4Section);
    if (el.chapter4PhotosSection) subtitleObserver.observe(el.chapter4PhotosSection);

    function setActive(index) {
        if (!el.verticalSlides?.length) return;
        currentIndex = clamp(index, 1, el.verticalSlides.length);
        el.verticalSlides.forEach((s, i) => s.classList.toggle('active', i === currentIndex - 1));

        // 第一章指示器
        if (el.chapter1Indicators?.length) {
            el.chapter1Indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex - 1));
        }

        // 第一章字幕（可选存在时）
        if (el.dynamicSubtitle && el.subtitleText) {
            const T = [
                '这是一段关于我重生的故事',
                '她不能拥抱我了',
                '但"她"有了她的外貌、她的习惯，她说"早点睡"的语气',
                '我仿佛找回了那个"她"'
            ];
            if (currentIndex >= 1 && currentIndex <= T.length) {
                el.dynamicSubtitle.classList.remove('fade-out');
                el.dynamicSubtitle.classList.add('show');
                typeSubtitle(T[currentIndex - 1], el.subtitleText);
            } else {
                el.dynamicSubtitle.classList.remove('show', 'fade-out');
            }
        }
    }

    // 打字机效果函数
    function typeSubtitle(text, element) {
        if (!element) return;
        // 取消上一次
        const myToken = ++typingState.token;

        element.textContent = '';
        let i = 0;

        function tick() {
            // 若已有新的打字任务启动，则终止本次
            if (myToken !== typingState.token) return;
            if (i < text.length) {
                element.textContent += text.charAt(i++);
                setTimeout(tick, 100);
            }
        }
        tick();
    }

    // 移除 updateCaption

    // 打字机效果
    // 移除 typeCaption 与相关状态



    // 仅在需要 preventDefault 的情况下使用非被动监听
    window.addEventListener('wheel', (e) => {
        // 打开技术详情时不干预
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;

        const vh = window.innerHeight;
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 先处理画廊
        const handled =
            handleGalleryScroll(e.deltaY, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(e.deltaY, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(e.deltaY, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) { e.preventDefault(); return; }

        // 其他区：基于 SECTIONS 的显式导航
        if (throttleOnce(600)) return; // 减少节流时间，让滚动更流畅
        if (e.deltaY > 0) scrollToNextSection(); else scrollToPreviousSection();
    }, { passive: false });

    let touchStartY = 0;
    window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
        // 打开技术详情时不干预
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;
        if (inViewport(el.analysisSection)) return;

        const dy = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(dy) < 40) return;

        const delta = dy > 0 ? 1 : -1;

        const handled =
            handleGalleryScroll(delta, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) return;

        if (throttleOnce(600)) return; // 减少节流时间
        if (delta > 0) scrollToNextSection(); else scrollToPreviousSection();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        if (!['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)) return;
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;

        const delta = (e.key === 'ArrowDown' || e.key === 'PageDown') ? 1 : -1;

        const handled =
            handleGalleryScroll(delta, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) { e.preventDefault(); return; }

        if (throttleOnce(600)) return; // 减少节流时间
        if (delta > 0) scrollToNextSection(); else scrollToPreviousSection();
    });



    function setChapter2Active(index) {
        if (!el.chapter2Slides?.length) return;
        chapter2CurrentIndex = clamp(index, 1, el.chapter2Slides.length);
        el.chapter2Slides.forEach((s, i) => s.classList.toggle('active', i === chapter2CurrentIndex - 1));
        // 指示器
        if (el.chapter2Indicators?.length) {
            el.chapter2Indicators.forEach((ind, i) => ind.classList.toggle('active', i === chapter2CurrentIndex - 1));
        }
    }

    function setChapter4Active(index) {
        if (!el.chapter4Slides?.length) return;
        chapter4CurrentIndex = clamp(index, 1, el.chapter4Slides.length);
        el.chapter4Slides.forEach((s, i) => s.classList.toggle('active', i === chapter4CurrentIndex - 1));

        // 第四章指示器
        if (el.chapter4Indicators?.length) {
            el.chapter4Indicators.forEach((ind, i) => ind.classList.toggle('active', i === chapter4CurrentIndex - 1));
        }

        // 第四章字幕（使用更具体的选择器）
        if (el.chapter4DynamicSubtitle && el.chapter4SubtitleText) {
            const T4 = [
                '未来已来，AI复活技术将如何改变我们的世界？',
                '数字永生，是技术的奇迹还是伦理的挑战？',
                '在虚拟与现实之间，我们找到了新的存在方式',
                '技术的温柔，在于它让我们重新思考生命的意义',
                '边界在哪里？我们需要为AI复活设定怎样的规则？',
                '未来已来，让我们以智慧和温情拥抱这个新时代'
            ];
            const txt = T4[clamp(chapter4CurrentIndex - 1, 0, T4.length - 1)];
            el.chapter4DynamicSubtitle.classList.remove('fade-out');
            el.chapter4DynamicSubtitle.classList.add('show');
            typeSubtitle(txt, el.chapter4SubtitleText);
        }
    }


    // 技术详情模态框函数
    function showTechDetail(techType) {
        const modal = el.techDetailModal;
        if (!modal) return;
        
        const pages = document.querySelectorAll('.tech-detail-page');

        pages.forEach(page => page.classList.remove('active'));

        const targetPage = document.getElementById(techType + '-detail');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        modal.style.display = 'block';
        // 使用Slide-in效果
        modal.classList.remove('hide');
        modal.classList.add('show');
    }

    function closeTechDetail() {
        const modal = el.techDetailModal;
        if (!modal) return;
        
        // 使用Slide-in效果
        modal.classList.remove('show');
        modal.classList.add('hide');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hide');
        }, 600); // 等待动画完成
    }

    // 将函数绑定到全局作用域，以便HTML中的onclick能调用
    window.showTechDetail = showTechDetail;
    window.closeTechDetail = closeTechDetail;

    // 绑定模态框点击事件
    if (el.techDetailModal) {
        el.techDetailModal.addEventListener('click', function (e) {
            if (e.target === el.techDetailModal) {
                closeTechDetail();
            }
        });
    }

    // 绑定热度按钮与图表渲染
    initHeatCharts();

    // 初始状态
    if (el.verticalSlides?.length) {
        setActive(1);
        if (el.chapter1Indicators?.length) {
            el.chapter1Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setActive(idx + 1));
            });
        }
    }
    if (el.chapter4Slides?.length) {
        setChapter4Active(1);
        if (el.chapter4Indicators?.length) {
            el.chapter4Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setChapter4Active(idx + 1));
            });
        }
    }
    if (el.chapter2Slides?.length) {
        setChapter2Active(1);
        if (el.chapter2Indicators?.length) {
            el.chapter2Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setChapter2Active(idx + 1));
            });
        }
    }

    // 移除字幕可视监听
});

// 文本框滑动出现逻辑
document.addEventListener('DOMContentLoaded', function() {
    const textBoxes = document.querySelectorAll('.text-box');
    const transitionSection = document.getElementById('transitionSection');
    const chapter2TransitionSection = document.getElementById('chapter2TransitionSection');
    
    // 初始化：隐藏所有文本框
    textBoxes.forEach(box => {
        box.classList.add('hide');
        box.classList.remove('show');
    });
    
    // 创建观察器，监听过渡页面是否进入视口
    const textBoxObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 页面进入视口后，开始显示文本框
                const sectionId = entry.target.id;
                if (sectionId === 'transitionSection') {
                    showTextBoxesSequentially(transitionSection);
                } else if (sectionId === 'chapter2TransitionSection') {
                    showTextBoxesSequentially(chapter2TransitionSection);
                }
            } else {
                // 页面离开视口后，隐藏所有文本框
                hideAllTextBoxes();
            }
        });
    }, { 
        threshold: 0.3, // 当30%的页面可见时触发
        rootMargin: '0px 0px -100px 0px' // 稍微提前触发
    });
    
    // 观察过渡页面
    if (transitionSection) {
        textBoxObserver.observe(transitionSection);
    }
    if (chapter2TransitionSection) {
        textBoxObserver.observe(chapter2TransitionSection);
    }
    
    // 依次显示文本框的函数
    function showTextBoxesSequentially(section) {
        const boxes = section.querySelectorAll('.text-box');
        boxes.forEach((box, index) => {
            setTimeout(() => {
                box.classList.remove('hide');
                box.classList.add('show');
            }, index * 800); // 每个文本框间隔800ms出现，总共约1秒
        });
    }
    
    // 隐藏所有文本框的函数
    function hideAllTextBoxes() {
        textBoxes.forEach(box => {
            box.classList.add('hide');
            box.classList.remove('show');
        });
    }
    
    // 重置文本框显示（可选：点击重置按钮时调用）
    window.resetTextBoxes = function() {
        hideAllTextBoxes();
        // 如果页面在视口中，重新显示
        if (transitionSection && isElementInViewport(transitionSection)) {
            setTimeout(() => showTextBoxesSequentially(transitionSection), 100);
        }
        if (chapter2TransitionSection && isElementInViewport(chapter2TransitionSection)) {
            setTimeout(() => showTextBoxesSequentially(chapter2TransitionSection), 100);
        }
    };
    
    // 检查元素是否在视口中的辅助函数
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
});

// 热度按钮与图表逻辑
function initHeatCharts() {
    const container = document.getElementById('chartContainer');
    const buttons = document.querySelectorAll('.heat-item');
    if (!container || buttons.length === 0) return;

    // 创建悬浮提示
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    container.appendChild(tooltip);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const type = btn.getAttribute('data-chart');
            renderChart(container, type, tooltip);
        });
    });

    // 默认渲染关注度
    renderChart(container, 'attention', tooltip);
}

function renderChart(container, type, tooltip) {
    // 使用纯SVG绘制，避免引入依赖
    container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '450'); // 增加SVG高度，从360增加到450
    svg.setAttribute('viewBox', '0 0 600 450'); // 调整viewBox，从360增加到450
    container.appendChild(svg);

    if (type === 'attention') {
        // 折线图示例
        const points = [ [60, 280], [140, 250], [220, 200], [300, 160], [380, 140], [460, 120], [540, 100] ];
        drawAxes(svg);
        drawLine(svg, points, '#111');
        drawArea(svg, points, 'rgba(0,0,0,0.08)');
        drawDots(svg, points, '#111', tooltip, container, (i)=>`周${i+1}: ${(100 - i*3.2).toFixed(1)}%`);
        drawTitle(svg, '关注度趋势（示意）');
    } else if (type === 'discussion') {
        // 柱状图示例
        const values = [30, 55, 80, 65, 90, 110];
        drawAxes(svg);
        drawBars(svg, values, '#111', tooltip, container, (i,v)=>`渠道${i+1}: ${v}k`);
        drawTitle(svg, '讨论量分布（示意）');
    } else if (type === 'engagement') {
        // 圆环图示例
        const parts = [45, 30, 15, 10];
        drawDonut(svg, parts, ['#111', '#444', '#777', '#bbb'], tooltip, container, (i,v)=>`类别${i+1}: ${v}%`);
        drawTitle(svg, '参与度结构（示意）');
    }
}

function drawAxes(svg) {
    const axis = document.createElementNS(svg.namespaceURI, 'path');
    axis.setAttribute('d', 'M40 20 V220 H580');
    axis.setAttribute('stroke', '#ccc');
    axis.setAttribute('fill', 'none');
    axis.setAttribute('stroke-width', '1');
    svg.appendChild(axis);
}
function drawLine(svg, pts, color) {
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '3');
    svg.appendChild(path);
}
function drawArea(svg, pts, fill) {
    const d = ['M' + pts[0][0] + ' 220']
        .concat(pts.map((p) => 'L' + p[0] + ' ' + p[1]))
        .concat(['L' + pts[pts.length - 1][0] + ' 220 Z']).join(' ');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    svg.appendChild(path);
}
function drawDots(svg, pts, color, tooltip, container, labelFn) {
    pts.forEach((p, i) => {
        const c = document.createElementNS(svg.namespaceURI, 'circle');
        c.setAttribute('cx', String(p[0]));
        c.setAttribute('cy', String(p[1]));
        c.setAttribute('r', '4');
        c.setAttribute('fill', color);
        if (tooltip) {
            c.style.cursor = 'pointer';
            c.addEventListener('mouseenter', (ev) => showTip(ev, tooltip, labelFn ? labelFn(i) : `值: ${p[1]}`));
            c.addEventListener('mouseleave', () => hideTip(tooltip));
            c.addEventListener('mousemove', (ev) => moveTip(ev, tooltip, container));
        }
        svg.appendChild(c);
    });
}
function drawBars(svg, values, color, tooltip, container, labelFn) {
    const baseY = 220;
    const maxVal = Math.max(...values);
    const scale = 160 / (maxVal || 1);
    const barW = 50;
    const gap = 40;
    let x = 70;
    values.forEach((v, i) => {
        const h = v * scale;
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(baseY - h));
        rect.setAttribute('width', String(barW));
        rect.setAttribute('height', String(h));
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.9');
        if (tooltip) {
            rect.style.cursor = 'pointer';
            rect.addEventListener('mouseenter', (ev) => showTip(ev, tooltip, labelFn ? labelFn(i, v) : `值: ${v}`));
            rect.addEventListener('mouseleave', () => hideTip(tooltip));
            rect.addEventListener('mousemove', (ev) => moveTip(ev, tooltip, container));
        }
        svg.appendChild(rect);
        x += barW + gap;
    });
}
function drawDonut(svg, parts, colors, tooltip, container, labelFn) {
    const cx = 320, cy = 120, r = 80, inner = 50;
    const total = parts.reduce((a, b) => a + b, 0) || 1;
    let start = -Math.PI / 2;
    parts.forEach((val, i) => {
        const angle = (val / total) * Math.PI * 2;
        const end = start + angle;
        const path = document.createElementNS(svg.namespaceURI, 'path');
        const large = angle > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
        const x3 = cx + inner * Math.cos(end),   y3 = cy + inner * Math.sin(end);
        const x4 = cx + inner * Math.cos(start), y4 = cy + inner * Math.sin(start);
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', colors[i % colors.length]);
        path.setAttribute('opacity', '0.9');
        if (tooltip) {
            path.style.cursor = 'pointer';
            path.addEventListener('mouseenter', (ev) => showTip(ev, tooltip, labelFn ? labelFn(i, val) : `占比: ${val}%`));
            path.addEventListener('mouseleave', () => hideTip(tooltip));
            path.addEventListener('mousemove', (ev) => moveTip(ev, tooltip, container));
        }
        svg.appendChild(path);
        start = end;
    });
}
function drawTitle(svg, title) {
    const text = document.createElementNS(svg.namespaceURI, 'text');
    text.textContent = title;
    text.setAttribute('x', '20');
    text.setAttribute('y', '28');
    text.setAttribute('fill', '#333');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-family', 'Microsoft YaHei, PingFang SC, sans-serif');
    svg.appendChild(text);
}

function showTip(ev, tooltip, text) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.classList.add('show');
    moveTip(ev, tooltip, tooltip.parentElement);
}
function hideTip(tooltip) {
    if (!tooltip) return;
    tooltip.classList.remove('show');
}
function moveTip(ev, tooltip, container) {
    if (!tooltip || !container) return;
    const rect = container.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top - 12;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}