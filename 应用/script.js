// 首页核心功能卡片跳转
window.navigateToFeature = function(featureKey) {
    // 根据首页传入的关键字，跳转到对应的功能详情页面/模块
    switch (featureKey) {
        case 'ai':
            // AI 个性化推荐引擎
            window.location.href = 'features.html#ai-engine';
            break;
        case 'holographic':
            // 全息显示技术
            window.location.href = 'features.html#holographic';
            break;
        case 'assessment':
            // 智能评估系统
            window.location.href = 'features.html#assessment';
            break;
        case 'collaboration':
            // 实时协作学习
            window.location.href = 'features.html#collaboration';
            break;
        default:
            // 兜底跳转到功能总览
            window.location.href = 'features.html';
    }
}

// 页面加载进度条
function createLoadingBar() {
    const loadingBar = document.createElement('div');
    loadingBar.id = 'loading-bar';
    loadingBar.innerHTML = `
        <div class="loading-progress"></div>
        <div class="loading-text">正在加载...</div>
    `;
    
    loadingBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.1);
        z-index: 10001;
        transition: opacity 0.3s ease;
    `;
    
    const progress = loadingBar.querySelector('.loading-progress');
    progress.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        width: 0%;
        transition: width 0.3s ease;
    `;
    
    const text = loadingBar.querySelector('.loading-text');
    text.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        color: #6366f1;
        font-size: 14px;
        font-weight: 500;
    `;
    
    document.body.appendChild(loadingBar);
}

// 更新加载进度
function updateLoadingProgress() {
    const loadingBar = document.getElementById('loading-bar');
    if (!loadingBar) return;
    
    const progress = loadingBar.querySelector('.loading-progress');
    const text = loadingBar.querySelector('.loading-text');
    
    let percentage = 0;
    let message = '正在加载...';
    
    switch (document.readyState) {
        case 'loading':
            percentage = 30;
            message = '正在加载资源...';
            break;
        case 'interactive':
            percentage = 70;
            message = '正在初始化...';
            break;
        case 'complete':
            percentage = 100;
            message = '加载完成';
            break;
    }
    
    progress.style.width = percentage + '%';
    text.textContent = message;
}

// 隐藏加载进度条
function hideLoadingBar() {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
        setTimeout(() => {
            loadingBar.style.opacity = '0';
            setTimeout(() => {
                loadingBar.remove();
            }, 300);
        }, 500);
    }
}

// 显示页面加载完成提示
function showPageLoadComplete() {
    // 添加页面加载完成的视觉反馈
    document.body.classList.add('page-loaded');
    
    // 触发入场动画
    const animatedElements = document.querySelectorAll('.hero-title, .hero-subtitle, .cta-buttons');
    animatedElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate-in');
        }, index * 200);
    });
}

// 拦截fetch请求添加加载状态
function interceptFetch() {
    const originalFetch = window.fetch;
    let activeRequests = 0;
    
    window.fetch = function(...args) {
        activeRequests++;
        showNetworkActivity();
        
        return originalFetch.apply(this, args)
            .then(response => {
                activeRequests--;
                if (activeRequests === 0) {
                    hideNetworkActivity();
                }
                return response;
            })
            .catch(error => {
                activeRequests--;
                if (activeRequests === 0) {
                    hideNetworkActivity();
                }
                throw error;
            });
    };
}

// 显示网络活动指示器
function showNetworkActivity() {
    let indicator = document.getElementById('network-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'network-indicator';
        indicator.innerHTML = '🌐';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background: rgba(99, 102, 241, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            z-index: 10000;
            animation: pulse 1s infinite;
        `;
        document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
}

// 隐藏网络活动指示器
function hideNetworkActivity() {
    const indicator = document.getElementById('network-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// 添加加载状态相关样式
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .page-loaded {
        animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .animate-in {
        animation: slideInUp 0.6s ease forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes slideInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* 骨架屏样式 */
    .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    .skeleton-text {
        height: 1em;
        margin: 0.5em 0;
        border-radius: 4px;
    }
    
    .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }
    
    .skeleton-card {
        height: 200px;
        border-radius: 8px;
        margin: 1em 0;
    }
`;
document.head.appendChild(loadingStyles);

// 节流工具函数（用于滚动等高频事件）
if (typeof throttle !== 'function') {
  function throttle(callback, delay = 100) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      const remaining = delay - (now - last);
      const context = this;
      if (remaining <= 0) {
        last = now;
        callback.apply(context, args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => {
          last = Date.now();
          callback.apply(context, args);
        }, remaining);
      }
    };
  }
}

// 应用节流到滚动事件
window.addEventListener('scroll', throttle(() => {
    // 滚动相关的性能优化代码
}, 16)); // 约60fps

// 下载和文档入口
const DOCUMENT_PATHS = {
    'architecture.pdf': 'docs/architecture.md',
    'architecture.md': 'docs/architecture.md',
    'deployment.md': 'docs/deployment.md'
};

function downloadArchitectureDoc() {
    downloadDoc('architecture.md');
}

function downloadDoc(filename) {
    const target = DOCUMENT_PATHS[filename];
    if (!target) {
        showNotification('文档尚未配置下载文件。', 'warning');
        return;
    }
    const link = document.createElement('a');
    link.href = target;
    link.download = filename.replace(/\.pdf$/i, '.md');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotification('文档下载已开始。', 'success');
}

function viewApiDocs() {
    window.open('docs/api.md', '_blank', 'noopener');
}

// Architecture page actions use the same public demo entry points as the rest of the site.
window.viewDemo = function() {
    window.location.href = 'demo.html';
};

window.viewTechDemo = function(type) {
    const targets = {
        frontend: '3d-collaboration.html',
        backend: 'architecture.html#business-logic',
        ai: 'features.html#ai-engine',
        immersive: 'scenarios.html#immersive-classroom',
    };
    window.location.href = targets[type] || 'demo.html';
};

window.contactTech = function() {
    window.location.href = 'contact.html#contact-form';
};

window.requestDemo = function() {
    window.location.href = 'contact.html#contact-form';
};

// 联系页使用本地演示提交，避免把展示版表单误认为已经接入真实客服系统。
function initContactForm() {
    const form = document.getElementById('demo-request');
    if (!form) return;
    const status = document.getElementById('contact-form-status');
    const storageKey = 'hiec_contact_demo';

    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        const contact = String(data.get('contact') || '').trim();
        const message = String(data.get('message') || '').trim();
        if (!name || !contact || !message) {
            if (status) status.textContent = '请补全称呼、联系方式和需求说明。';
            showNotification('请补全必填信息。', 'warning');
            return;
        }

        const record = {
            name,
            contact,
            topic: String(data.get('topic') || '其他需求'),
            message,
            savedAt: new Date().toISOString(),
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(record));
        } catch (error) {
            console.warn('保存咨询演示记录失败:', error.message);
        }
        form.reset();
        if (status) status.textContent = '已保存到本机演示记录，可继续体验场景。';
        showNotification('咨询信息已保存到本机。', 'success');
    });
}

document.addEventListener('DOMContentLoaded', initContactForm);

// --- AI Chat & API Settings ---
// 默认提供 DeepSeek 浏览器直连，也保留同源服务端和离线演示模式。
const API_SETTINGS_STORAGE_KEY = 'hiec_api_settings';
const DEFAULT_DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
let apiSettings = {
    provider: 'deepseek',
    url: DEFAULT_DEEPSEEK_URL,
    key: '',
    model: 'deepseek-chat'
};

function resolveSameOriginUrl(value) {
    const target = String(value || '').trim();
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(target)) return target;
    return new URL(target.replace(/^\/+/, ''), document.baseURI).href;
}

function updateAPISettingsUI() {
    const provider = document.getElementById('api-provider');
    const urlInput = document.getElementById('api-url');
    const keyInput = document.getElementById('api-key');
    const modelInput = document.getElementById('api-model');

    if (provider) provider.value = apiSettings.provider;
    const isLocal = apiSettings.provider === 'local';
    if (urlInput) {
        urlInput.value = apiSettings.url;
        urlInput.readOnly = isLocal;
    }
    if (keyInput) {
        keyInput.value = apiSettings.key;
        keyInput.placeholder = isLocal ? '本地模式不需要 Key' : 'sk-...';
        keyInput.disabled = isLocal;
    }
    if (modelInput) {
        modelInput.value = apiSettings.model;
        modelInput.readOnly = isLocal;
    }
}

async function loadAPISettings() {
    try {
        const stored = localStorage.getItem(API_SETTINGS_STORAGE_KEY);
        if (stored) {
            const storedSettings = JSON.parse(stored);
            apiSettings = {
                ...apiSettings,
                provider: storedSettings.provider || apiSettings.provider,
                url: storedSettings.url || apiSettings.url,
                key: storedSettings.key || '',
                model: storedSettings.model || apiSettings.model
            };
        }
    } catch (error) {
        console.warn('读取浏览器 API 配置失败:', error.message);
    }

    updateAPISettingsUI();
    try {
        const response = await fetch(resolveSameOriginUrl('api/config'));
        if (!response.ok) throw new Error(`配置接口返回 ${response.status}`);
        const config = await response.json();
        const status = document.getElementById('api-status');
        if (status) {
            status.textContent = apiSettings.provider === 'local'
                ? '当前为本地服务/离线演示模式。'
                : '当前为浏览器直连模式，Key 仅保存在本机浏览器。';
        }
    } catch (error) {
        console.warn('AI 配置接口不可用，使用离线前端提示:', error.message);
    }
}

function saveAPISettings() {
    const provider = document.getElementById('api-provider');
    const urlInput = document.getElementById('api-url');
    const keyInput = document.getElementById('api-key');
    const modelInput = document.getElementById('api-model');
    if (provider) apiSettings.provider = provider.value;
    if (urlInput) apiSettings.url = urlInput.value.replace(/`/g, '').trim();
    if (keyInput) apiSettings.key = keyInput.value.trim();
    if (modelInput) apiSettings.model = modelInput.value.trim();

    if (apiSettings.provider === 'local') {
        apiSettings.url = 'api/chat';
        apiSettings.model = 'offline-demo';
    }

    try {
        localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(apiSettings));
    } catch (error) {
        console.warn('保存浏览器 API 配置失败:', error.message);
    }
    const modal = document.getElementById('api-settings-modal');
    if (modal) modal.style.display = 'none';
    addChatMessage('ai', apiSettings.provider === 'local'
        ? '已切换到本地服务/离线演示模式。'
        : '已切换到 DeepSeek 浏览器直连模式。');
}

function updateProviderSettings() {
    const provider = document.getElementById('api-provider');
    if (!provider) return;
    apiSettings.provider = provider.value;
    if (apiSettings.provider === 'local') {
        apiSettings.url = 'api/chat';
        apiSettings.model = 'offline-demo';
    } else if (!apiSettings.url || apiSettings.url === '/api/chat' || apiSettings.url === 'api/chat') {
        apiSettings.url = DEFAULT_DEEPSEEK_URL;
        apiSettings.model = 'deepseek-chat';
    }
    updateAPISettingsUI();
}

// Call on load
document.addEventListener('DOMContentLoaded', loadAPISettings);

// 让所有页面都具备安装入口；相对路径也兼容 GitHub Pages 的项目子路径。
function ensurePwaMetadata() {
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifest = document.createElement('link');
        manifest.rel = 'manifest';
        manifest.href = new URL('manifest.json', document.baseURI).href;
        document.head.appendChild(manifest);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
        const theme = document.createElement('meta');
        theme.name = 'theme-color';
        theme.content = '#0f0f23';
        document.head.appendChild(theme);
    }
}

ensurePwaMetadata();

// 只在 HTTP(S) 环境注册，保证本地直接双击 HTML 时不会产生误导性报错。
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(new URL('sw.js', document.baseURI))
            .catch(error => console.warn('离线缓存未启用:', error.message));
    });
}

// PWA installation is progressively enhanced: browsers without an install prompt
// keep the normal website experience, while supported browsers get one clear action.
let deferredInstallPrompt = null;

function showPWAInstallButton() {
    if (document.getElementById('pwa-install-button')) return;
    if (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'pwa-install-button';
    button.className = 'pwa-install-button';
    button.innerHTML = '<i class="fas fa-mobile-screen-button" aria-hidden="true"></i><span>安装到手机</span>';
    button.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
            showNotification('请在浏览器菜单中选择“添加到主屏幕”。', 'info');
            return;
        }
        deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        if (result.outcome === 'accepted') button.remove();
        deferredInstallPrompt = null;
    });
    document.body.appendChild(button);
}

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showPWAInstallButton();
});

window.addEventListener('appinstalled', () => {
    document.getElementById('pwa-install-button')?.remove();
    showNotification('HIEC 已添加到设备主屏幕。', 'success');
});

document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(showPWAInstallButton, 1200);
});

// --- Chat File Handling ---
let chatAttachments = [];

function handleChatFileSelect(input) {
    const files = input.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            showNotification(`文件 ${file.name} 超过 2 MB，已跳过。`, 'warning');
            return;
        }
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        
        reader.onload = function(e) {
            chatAttachments.push({
                name: file.name,
                type: file.type,
                content: e.target.result,
                isImage: isImage
            });
            updateAttachmentPreview();
        };

        if (isImage) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
    
    // Reset input so same file can be selected again
    input.value = '';
}

function updateAttachmentPreview() {
    const container = document.getElementById('chat-attachments');
    if (!container) return;
    container.replaceChildren();
    
    if (chatAttachments.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    
    chatAttachments.forEach((att, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'position: relative; border: 1px solid #ddd; padding: 5px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 5px; background: #f9f9f9; color: #333; max-width: 150px;';

        const icon = document.createElement('i');
        icon.className = att.isImage ? 'fas fa-image' : 'fas fa-file-alt';
        div.appendChild(icon);
        if (att.isImage) {
            const preview = document.createElement('img');
            preview.src = att.content;
            preview.alt = '';
            preview.style.cssText = 'width: 20px; height: 20px; object-fit: cover; border-radius: 2px;';
            div.appendChild(preview);
        }

        const name = document.createElement('span');
        name.textContent = att.name;
        name.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        div.appendChild(name);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.setAttribute('aria-label', `移除附件 ${att.name}`);
        removeButton.textContent = '×';
        removeButton.style.cssText = 'cursor: pointer; color: #999; margin-left: 5px; border: 0; background: transparent; font-size: 16px;';
        removeButton.addEventListener('click', () => removeAttachment(index));
        div.appendChild(removeButton);
        container.appendChild(div);
    });
}

function removeAttachment(index) {
    chatAttachments.splice(index, 1);
    updateAttachmentPreview();
}

function addChatMessage(role, text, attachments = []) {
    const history = document.getElementById('chat-history');
    if (!history) return;
    
    const div = document.createElement('div');
    div.className = `chat-message ${role}-message`;
    div.style.cssText = role === 'user' 
        ? 'align-self: flex-end; background: var(--accent-cyan); color: black; padding: 8px 12px; border-radius: 10px 10px 0 10px; max-width: 80%; margin-bottom: 10px;'
        : 'align-self: flex-start; background: rgba(255,255,255,0.1); color: white; padding: 8px 12px; border-radius: 10px 10px 10px 0; max-width: 80%; margin-bottom: 10px;';
        
    const content = document.createElement('div');

    if (attachments && attachments.length > 0) {
        const attachmentBox = document.createElement('div');
        attachmentBox.className = 'msg-attachments';
        attachmentBox.style.marginBottom = '5px';
        attachments.forEach(att => {
            if (att.isImage && /^data:image\//i.test(att.content || '')) {
                const image = document.createElement('img');
                image.src = att.content;
                image.alt = att.name || '上传图片';
                image.style.cssText = 'max-width: 100%; border-radius: 4px; margin-top: 5px;';
                attachmentBox.appendChild(image);
            } else {
                const file = document.createElement('div');
                file.style.cssText = 'font-size: 0.8em; opacity: 0.8;';
                file.textContent = `附件：${att.name}`;
                attachmentBox.appendChild(file);
            }
        });
        content.appendChild(attachmentBox);
    }

    const messageText = document.createElement('div');
    messageText.textContent = String(text || '');
    messageText.style.whiteSpace = 'pre-wrap';
    content.appendChild(messageText);
    div.appendChild(content);
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message && chatAttachments.length === 0) return;

    // Add user message
    addChatMessage('user', message, chatAttachments); 
    input.value = '';
    
    // Capture current attachments and clear
    const currentAttachments = [...chatAttachments];
    chatAttachments = [];
    updateAttachmentPreview();
    
    // Show loading state
    const history = document.getElementById('chat-history');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'ai-loading';
    loadingDiv.className = 'chat-message ai-message';
    loadingDiv.style.cssText = 'align-self: flex-start; background: rgba(255,255,255,0.1); color: white; padding: 8px 12px; border-radius: 10px 10px 10px 0; max-width: 80%; margin-bottom: 10px;';
    loadingDiv.textContent = '正在思考...';
    history.appendChild(loadingDiv);
    history.scrollTop = history.scrollHeight;

    // Prepare API request
    try {
        const messages = [
            { role: "system", content: "You are a helpful AI learning assistant for the Future Scenario Design platform." }
        ];
        
        let userContent = message;
        // Append attachment info if any (simplistic approach for text-only models)
        if (currentAttachments.length > 0) {
            userContent += "\n\n[Attachments]:\n" + currentAttachments.map(a => a.name + (a.isImage ? " (Image)" : " (File)")).join("\n");
        }
        
        messages.push({ role: "user", content: userContent });

        if (apiSettings.provider !== 'local' && !apiSettings.key) {
            throw new Error('NO_API_KEY');
        }

        const apiUrl = apiSettings.provider === 'local'
            ? resolveSameOriginUrl('api/chat')
            : (apiSettings.url || DEFAULT_DEEPSEEK_URL).replace(/`/g, '').trim();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiSettings.provider !== 'local') {
            headers.Authorization = `Bearer ${apiSettings.key}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                attachments: currentAttachments.map(att => ({
                    name: att.name,
                    type: att.type,
                    isImage: att.isImage
                })),
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const aiText = data.answer || data.choices?.[0]?.message?.content || '暂时没有可显示的回答。';

        // Remove loading and add AI response
        loadingDiv.remove();
        addChatMessage('ai', aiText);

    } catch (error) {
        console.error(error);
        loadingDiv.remove();
        const fallback = getOfflineChatReply(message);
        addChatMessage('ai', error.message === 'NO_API_KEY'
            ? `请先在 API 设置中填写 DeepSeek API Key。\n\n离线演示回答：\n${fallback}`
            : `大模型直连暂时失败，已显示离线演示回答：\n${fallback}`);
    }
}

// 静态托管环境没有后端时仍保留可用的离线教学演示。
function getOfflineChatReply(question) {
    if (/甲烷|分子|化学|键角|正四面体/.test(question)) {
        return '以甲烷为例：碳原子位于中心，四个氢原子分布在正四面体的四个顶点，H-C-H 键角约为 109.5°。';
    }
    if (/天文|行星|太阳|轨道|宇宙/.test(question)) {
        return '天文场景可以先观察太阳、地球和轨道关系，再讨论距离与周期的联系。';
    }
    if (/解剖|器官|人体|心脏|肺/.test(question)) {
        return '解剖场景建议按“系统总览 → 器官定位 → 功能解释 → 小测验”的顺序学习。';
    }
    if (/历史|文明|朝代|场景/.test(question)) {
        return '历史场景可以把时间线、地点和事件串起来，再用时间顺序题检验理解。';
    }
    return '这是 HIEC 离线演示模式的示例回答。系统可以围绕学习目标、知识讲解、练习反馈和下一步建议组织教学流程。';
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 设置样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 根据类型设置背景色
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// --- Smart Assessment System ---
let currentQuestionIndex = 0;
let userAnswers = [];
let quizTimerInterval;
let quizStartTime;

const assessmentQuestions = [
    {
        question: "在解决复杂问题时，您倾向于首先做什么？",
        options: [
            { text: "分析问题的根本原因和逻辑结构", scores: { logic: 9, creativity: 4, practical: 5 } },
            { text: "寻找类似的案例或现有的解决方案", scores: { logic: 6, creativity: 3, practical: 8 } },
            { text: "尝试一些新的、非常规的方法", scores: { logic: 4, creativity: 9, practical: 4 } },
            { text: "召集团队进行头脑风暴", scores: { logic: 5, creativity: 7, practical: 6 } }
        ]
    },
    {
        question: "面对新的学习任务，您的首选策略是？",
        options: [
            { text: "制定详细的学习计划和时间表", scores: { logic: 8, creativity: 3, practical: 7 } },
            { text: "直接动手实践，在做中学", scores: { logic: 5, creativity: 5, practical: 9 } },
            { text: "寻找可视化的图表或视频教程", scores: { logic: 6, creativity: 8, practical: 5 } },
            { text: "阅读相关的理论书籍和文档", scores: { logic: 9, creativity: 4, practical: 4 } }
        ]
    },
    {
        question: "如果项目进度落后，您会如何应对？",
        options: [
            { text: "重新评估优先级，削减非必要功能", scores: { logic: 8, creativity: 5, practical: 8 } },
            { text: "寻找更高效的工具或自动化方法", scores: { logic: 7, creativity: 8, practical: 6 } },
            { text: "加班加点，依靠努力赶上进度", scores: { logic: 4, creativity: 3, practical: 9 } },
            { text: "寻求外部专家的帮助或建议", scores: { logic: 6, creativity: 6, practical: 7 } }
        ]
    },
    {
        question: "您如何看待失败或错误？",
        options: [
            { text: "详细分析原因，避免再次发生", scores: { logic: 9, creativity: 3, practical: 6 } },
            { text: "视为尝试新事物的必要成本", scores: { logic: 5, creativity: 9, practical: 4 } },
            { text: "立即修正，继续前进", scores: { logic: 6, creativity: 4, practical: 9 } },
            { text: "记录下来作为经验教训", scores: { logic: 7, creativity: 5, practical: 7 } }
        ]
    },
    {
        question: "在团队协作中，您通常扮演什么角色？",
        options: [
            { text: "负责统筹规划和逻辑梳理", scores: { logic: 9, creativity: 4, practical: 5 } },
            { text: "提出创新点子和解决方案", scores: { logic: 4, creativity: 9, practical: 4 } },
            { text: "负责具体的执行和落实", scores: { logic: 5, creativity: 3, practical: 9 } },
            { text: "协调各方资源和沟通", scores: { logic: 7, creativity: 6, practical: 7 } }
        ]
    },
    {
        question: "面对模糊不清的需求时，您会？",
        options: [
            { text: "与利益相关者反复沟通确认细节", scores: { logic: 8, creativity: 3, practical: 6 } },
            { text: "先做一个快速原型看看效果", scores: { logic: 5, creativity: 6, practical: 9 } },
            { text: "构思多种可能的解释和方案", scores: { logic: 4, creativity: 9, practical: 4 } },
            { text: "查阅行业标准和类似案例", scores: { logic: 7, creativity: 4, practical: 7 } }
        ]
    },
    {
        question: "当需要学习一项全新技术时，您倾向于？",
        options: [
            { text: "系统阅读官方文档和原理", scores: { logic: 9, creativity: 3, practical: 5 } },
            { text: "直接下载Demo代码运行调试", scores: { logic: 5, creativity: 4, practical: 9 } },
            { text: "思考这项技术能创造什么新应用", scores: { logic: 4, creativity: 9, practical: 4 } },
            { text: "观看视频教程跟随操作", scores: { logic: 6, creativity: 5, practical: 8 } }
        ]
    },
    {
        question: "在做决策时，您主要依据？",
        options: [
            { text: "详尽的数据分析和逻辑推演", scores: { logic: 9, creativity: 2, practical: 5 } },
            { text: "过往经验和直觉", scores: { logic: 5, creativity: 8, practical: 6 } },
            { text: "实际可行性和资源限制", scores: { logic: 6, creativity: 3, practical: 9 } },
            { text: "团队共识和专家建议", scores: { logic: 7, creativity: 4, practical: 7 } }
        ]
    },
    {
        question: "遇到意见分歧时，您的处理方式是？",
        options: [
            { text: "列出优缺点进行理性分析", scores: { logic: 9, creativity: 3, practical: 5 } },
            { text: "寻找能够融合双方观点的创新方案", scores: { logic: 5, creativity: 9, practical: 4 } },
            { text: "通过小规模测试来验证谁对", scores: { logic: 6, creativity: 4, practical: 9 } },
            { text: "寻求第三方仲裁或投票", scores: { logic: 7, creativity: 3, practical: 6 } }
        ]
    },
    {
        question: "您更喜欢哪种工作环境？",
        options: [
            { text: "井井有条、流程清晰", scores: { logic: 9, creativity: 2, practical: 6 } },
            { text: "自由开放、鼓励尝试", scores: { logic: 4, creativity: 9, practical: 5 } },
            { text: "务实高效、结果导向", scores: { logic: 5, creativity: 3, practical: 9 } },
            { text: "安静独立、专注思考", scores: { logic: 8, creativity: 5, practical: 4 } }
        ]
    },
    {
        question: "面对突发的紧急情况，您的第一反应是？",
        options: [
            { text: "快速评估风险和影响范围", scores: { logic: 9, creativity: 3, practical: 5 } },
            { text: "立即采取行动止损", scores: { logic: 5, creativity: 4, practical: 9 } },
            { text: "思考有没有打破常规的解决办法", scores: { logic: 4, creativity: 9, practical: 4 } },
            { text: "按既定应急预案执行", scores: { logic: 7, creativity: 2, practical: 8 } }
        ]
    },
    {
        question: "您如何评估一个创意的价值？",
        options: [
            { text: "逻辑上是否自洽，理论是否成立", scores: { logic: 9, creativity: 3, practical: 4 } },
            { text: "是否具有颠覆性和独特性", scores: { logic: 3, creativity: 9, practical: 4 } },
            { text: "能否落地实施，成本收益如何", scores: { logic: 5, creativity: 4, practical: 9 } },
            { text: "用户是否真的需要", scores: { logic: 6, creativity: 5, practical: 8 } }
        ]
    },
    {
        question: "在进行头脑风暴时，您通常？",
        options: [
            { text: "负责记录和分类整理想法", scores: { logic: 9, creativity: 3, practical: 6 } },
            { text: "不断抛出天马行空的新点子", scores: { logic: 3, creativity: 9, practical: 4 } },
            { text: "思考这些点子如何实现", scores: { logic: 5, creativity: 4, practical: 9 } },
            { text: "对现有想法进行补充和完善", scores: { logic: 7, creativity: 6, practical: 5 } }
        ]
    },
    {
        question: "您认为成功的关键在于？",
        options: [
            { text: "严谨的规划和执行", scores: { logic: 9, creativity: 2, practical: 7 } },
            { text: "不断的创新和突破", scores: { logic: 4, creativity: 9, practical: 5 } },
            { text: "脚踏实地的行动和坚持", scores: { logic: 5, creativity: 3, practical: 9 } },
            { text: "准确的判断和机遇把握", scores: { logic: 8, creativity: 6, practical: 6 } }
        ]
    },
    {
        question: "面对枯燥的重复性工作，您会？",
        options: [
            { text: "分析流程，寻找优化的可能", scores: { logic: 9, creativity: 5, practical: 4 } },
            { text: "尝试用不同的方式去做，增加乐趣", scores: { logic: 4, creativity: 9, practical: 5 } },
            { text: "耐心地一步步完成", scores: { logic: 5, creativity: 2, practical: 9 } },
            { text: "编写工具自动化处理", scores: { logic: 8, creativity: 7, practical: 8 } }
        ]
    },
    {
        question: "您更擅长处理哪类信息？",
        options: [
            { text: "抽象的概念和理论", scores: { logic: 9, creativity: 5, practical: 2 } },
            { text: "具体的图像和感官体验", scores: { logic: 4, creativity: 9, practical: 5 } },
            { text: "实际的数据和操作步骤", scores: { logic: 6, creativity: 3, practical: 9 } },
            { text: "人际关系和情感交互", scores: { logic: 5, creativity: 7, practical: 6 } }
        ]
    },
    {
        question: "当您发现别人的方案有漏洞时，您会？",
        options: [
            { text: "直接指出逻辑错误", scores: { logic: 9, creativity: 2, practical: 4 } },
            { text: "提出一个更好的替代方案", scores: { logic: 5, creativity: 9, practical: 5 } },
            { text: "帮忙修补漏洞，使其可行", scores: { logic: 6, creativity: 4, practical: 9 } },
            { text: "私下委婉提醒", scores: { logic: 7, creativity: 5, practical: 6 } }
        ]
    },
    {
        question: "您对未来的规划通常是？",
        options: [
            { text: "制定详细的五年/十年计划", scores: { logic: 9, creativity: 3, practical: 6 } },
            { text: "有一个宏大的愿景，路径灵活", scores: { logic: 5, creativity: 9, practical: 4 } },
            { text: "关注当下的机会，步步为营", scores: { logic: 6, creativity: 3, practical: 9 } },
            { text: "跟随行业趋势动态调整", scores: { logic: 7, creativity: 6, practical: 7 } }
        ]
    },
    {
        question: "您认为领导力的核心是？",
        options: [
            { text: "清晰的战略思维", scores: { logic: 9, creativity: 4, practical: 6 } },
            { text: "激发团队潜能的感召力", scores: { logic: 5, creativity: 9, practical: 5 } },
            { text: "以身作则的执行力", scores: { logic: 6, creativity: 3, practical: 9 } },
            { text: "知人善任的洞察力", scores: { logic: 8, creativity: 6, practical: 6 } }
        ]
    },
    {
        question: "在空闲时间，您更倾向于？",
        options: [
            { text: "阅读非虚构类书籍，充电学习", scores: { logic: 9, creativity: 4, practical: 5 } },
            { text: "从事艺术创作或DIY", scores: { logic: 4, creativity: 9, practical: 6 } },
            { text: "运动健身或户外活动", scores: { logic: 5, creativity: 3, practical: 9 } },
            { text: "玩策略游戏或解谜", scores: { logic: 8, creativity: 7, practical: 4 } }
        ]
    }
];

function startAssessment() {
    document.getElementById('start-assessment-btn').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('assessment-result').style.display = 'none';
    
    currentQuestionIndex = 0;
    userAnswers = [];
    quizStartTime = Date.now();
    
    // Start Timer
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(updateQuizTimer, 1000);
    
    showQuestion(0);
}

function updateQuizTimer() {
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('quiz-timer').innerText = `${minutes}:${seconds}`;
}

function showQuestion(index) {
    const q = assessmentQuestions[index];
    document.getElementById('current-question-num').innerText = index + 1;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, i) => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option';
        btn.innerText = opt.text;
        btn.onclick = () => selectOption(index, i);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(qIndex, oIndex) {
    userAnswers[qIndex] = assessmentQuestions[qIndex].options[oIndex].scores;
    
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    } else {
        finishAssessment();
    }
}

function finishAssessment() {
    clearInterval(quizTimerInterval);
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('assessment-result').style.display = 'block';
    
    calculateAndShowResults();
}

function calculateAndShowResults() {
    // Calculate total scores
    let totalLogic = 0, totalCreativity = 0, totalPractical = 0;
    userAnswers.forEach(score => {
        totalLogic += score.logic;
        totalCreativity += score.creativity;
        totalPractical += score.practical;
    });
    
    // Normalize to 0-100 scale
    // Max possible score per dimension per question is 9
    const maxScore = assessmentQuestions.length * 9;
    const logicScore = Math.round((totalLogic / maxScore) * 100);
    const creativityScore = Math.round((totalCreativity / maxScore) * 100);
    const practicalScore = Math.round((totalPractical / maxScore) * 100);
    
    const overallScore = Math.round((logicScore + creativityScore + practicalScore) / 3);
    
    // Update UI text
    animateValue('total-score-value', 0, overallScore, 1000);
    
    // Random improvement for demo
    const improvement = Math.floor(Math.random() * 15) + 5;
    document.getElementById('score-improvement').innerText = `${improvement}%`;
    
    // Generate Feedback
    let feedback = "";
    if (logicScore > creativityScore && logicScore > practicalScore) {
        feedback = "您的逻辑分析能力非常出色，擅长解构复杂问题。建议尝试更多开放性思维训练，以提升创新能力。";
    } else if (creativityScore > logicScore && creativityScore > practicalScore) {
        feedback = "您具有极强的创新思维，总是能想到独特的解决方案。建议加强方案落地的可行性分析，将创意转化为现实。";
    } else {
        feedback = "您的执行力很强，是一个典型的实干家。建议在行动前多花些时间进行系统性规划，事半功倍。";
    }
    document.getElementById('ai-feedback-text').innerText = feedback;
    
    // Draw Radar Chart
    drawRadarChart(logicScore, creativityScore, practicalScore);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function drawRadarChart(logic, creativity, practical) {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background grid (polygons)
    const levels = 5;
    const sides = 3; // Triangle for 3 dimensions
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= levels; i++) {
        const levelRadius = (radius / levels) * i;
        ctx.beginPath();
        for (let j = 0; j < sides; j++) {
            const angle = (Math.PI * 2 / sides) * j - Math.PI / 2;
            const x = centerX + levelRadius * Math.cos(angle);
            const y = centerY + levelRadius * Math.sin(angle);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Labels
    const labels = ["逻辑分析", "创新思维", "实践能力"];
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    
    for (let j = 0; j < sides; j++) {
        const angle = (Math.PI * 2 / sides) * j - Math.PI / 2;
        const x = centerX + (radius + 30) * Math.cos(angle);
        const y = centerY + (radius + 30) * Math.sin(angle);
        ctx.fillText(labels[j], x, y);
    }
    
    // Draw Data Polygon
    const scores = [logic, creativity, practical];
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    for (let j = 0; j < sides; j++) {
        const angle = (Math.PI * 2 / sides) * j - Math.PI / 2;
        // Scale score 0-100 to radius
        const valueRadius = (scores[j] / 100) * radius;
        const x = centerX + valueRadius * Math.cos(angle);
        const y = centerY + valueRadius * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw Points
    ctx.fillStyle = '#fff';
    for (let j = 0; j < sides; j++) {
        const angle = (Math.PI * 2 / sides) * j - Math.PI / 2;
        const valueRadius = (scores[j] / 100) * radius;
        const x = centerX + valueRadius * Math.cos(angle);
        const y = centerY + valueRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function showAIDemo(type) {
    const demoResult = document.getElementById('ai-demo-result');
    if (!demoResult) return;
    
    let message = "";
    
    switch(type) {
        case 'learning-path':
            message = "<strong>已生成个性化学习路径：</strong><br><br>1. 基础理论学习（2周）：深入理解核心概念与原理<br>2. 实践项目练习（3周）：通过实际案例巩固所学知识<br>3. 进阶技巧提升（2周）：探索高级应用与优化策略<br>4. 综合案例分析（1周）：融会贯通，解决复杂问题";
            break;
        case 'content-recommend':
            message = "<strong>为您推荐以下高匹配度学习资源：</strong><br><br>1. 《深度学习实战》（书籍）：评分 4.8/5.0<br>2. 《AI在教育中的应用》（视频课程）：观看时长 12小时<br>3. 《知识图谱构建指南》（技术博客）：阅读量 10k+";
            break;
        case 'difficulty-adapt':
            message = "<strong>难度自适应调整已触发：</strong><br><br>根据您最近的答题表现（正确率 85%），系统已将后续内容的难度提升至【中等偏上】。建议您挑战更多应用题，以进一步提升实战能力。";
            break;
        default:
            message = "未知的演示类型。";
    }
    
    demoResult.innerHTML = `<div style="padding: 1.5rem; background: rgba(0, 212, 255, 0.1); border-left: 4px solid #00d4ff; border-radius: 4px; margin-top: 1rem; animation: fadeIn 0.5s ease;">${message}</div>`;
    
    showNotification(`已为您展示${type === 'learning-path' ? '学习路径' : type === 'content-recommend' ? '学习资源推荐' : '难度自适应调整'}演示`, 'success');
}

function initKnowledgeGraph() {
    const nodes = document.querySelectorAll('.graph-node');
    nodes.forEach(node => {
        node.addEventListener('click', () => {
            const topic = node.innerText;
            showNotification(`正在为您解析知识节点：${topic}`, 'info');
            
            // Visual feedback
            node.classList.add('active-node');
            
            setTimeout(() => {
                node.classList.remove('active-node');
                
                // Show simulated detail in a floating card or notification
                // Since we don't have a dedicated detail container for the graph, we'll use a custom notification or modal
                // For simplicity and effectiveness, let's use a long-duration notification with more info
                
                showNotification(`已展开 [${topic}] 的关联知识点`, 'success');
            }, 300);
        });
    });
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initKnowledgeGraph();
});
