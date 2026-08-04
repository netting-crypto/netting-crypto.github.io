(() => {
  const translations = {
    zh: {
      'nav.projects': '项目',
      'nav.about': '关于',
      'intro.title': '你好，我是骆昕',
      'intro.desc': 'AI Product / Agent / Computational Biology',
      'intro.note': '我关注 AI 应用落地，也在尝试把产品方法与生命科学计算结合起来。',
      'intro.resume': '简历准备中',
      'intro.status': '正在寻找 AI 产品机会',
      'projects.title': '独立项目',
      'projects.code': '查看代码',
      'projects.soon': '准备中',
      'projects.wes.title': 'WES + 单细胞多证据融合',
      'projects.wes.desc': '面向遗传病候选解释的多证据融合工具，将 WES、单细胞表达、疾病模型与网络证据整合为可追溯的优先级结果和交互式报告。',
      'projects.archive.title': 'ChatGPT 历史对话考古',
      'projects.archive.desc': '从长期对话记录中识别重复模式、情绪片段、项目脉络和未被继续的想法，生成可浏览的个人时间线与项目地图。',
      'projects.bridge.title': '飞书 × Codex 桥接',
      'projects.bridge.desc': '让飞书消息进入本地 Codex 工作流，完成工作区绑定、线程切换、进度回传和任务延续。',
      'projects.agent.title': '求职 Agent',
      'projects.agent.desc': '围绕职位检索、岗位匹配、材料定制、表单填写和投递记录，构建带人工确认节点的求职执行 Agent。',
      'about.title': '关于与联系',
      'about.kicker': '教育经历',
      'about.school': '中国科学技术大学',
      'about.degree': '电子信息硕士 · 预计 2027 年毕业',
      'about.copy': '目前主要关注 AI 产品、Agent 工作流与生命科学计算，希望把模糊问题拆成可以验证、迭代和真正落地的系统。',
      'about.emailPending': '待补充',
      'about.resumeLabel': '简历',
      'about.resumePending': '待上传'
    },
    en: {
      'nav.projects': 'Projects',
      'nav.about': 'About',
      'intro.title': "Hello, I'm Luo Xin",
      'intro.desc': 'AI Product / Agent / Computational Biology',
      'intro.note': 'I build practical AI products and explore how product thinking can connect with computational biology.',
      'intro.resume': 'Resume coming soon',
      'intro.status': 'Open to AI product opportunities',
      'projects.title': 'Independent Projects',
      'projects.code': 'View Code',
      'projects.soon': 'Coming Soon',
      'projects.wes.title': 'WES + Single-cell Evidence Fusion',
      'projects.wes.desc': 'A multi-evidence interpretation tool for genetic disease candidates, combining WES, single-cell expression, disease models and network evidence into traceable rankings and interactive reports.',
      'projects.archive.title': 'ChatGPT Conversation Archaeology',
      'projects.archive.desc': 'A system that discovers recurring patterns, emotional fragments, project evolution and abandoned ideas from long-term conversation history.',
      'projects.bridge.title': 'Feishu × Codex Bridge',
      'projects.bridge.desc': 'A local-agent bridge that connects Feishu messages with Codex workspaces, threads, progress updates and continuous task execution.',
      'projects.agent.title': 'Job Search Agent',
      'projects.agent.desc': 'A human-in-the-loop agent for job discovery, role matching, application material customization, form completion and application tracking.',
      'about.title': 'About & Contact',
      'about.kicker': 'EDUCATION',
      'about.school': 'University of Science and Technology of China',
      'about.degree': "Master's in Electronic Information · Expected 2027",
      'about.copy': 'My current focus spans AI products, agent workflows and computational biology. I enjoy turning ambiguous problems into systems that can be tested, iterated and deployed.',
      'about.emailPending': 'To be added',
      'about.resumeLabel': 'Resume',
      'about.resumePending': 'Coming soon'
    }
  };

  const projects = [
    {
      key: 'wes',
      cover: 'cover-wes',
      index: 'PROJECT 01',
      coverTitle: 'Evidence Fusion',
      tags: ['WES', 'scRNA-seq', 'Evidence Ranking', 'Python'],
      href: 'https://github.com/netting-crypto/wes'
    },
    {
      key: 'archive',
      cover: 'cover-archive',
      index: 'PROJECT 02',
      coverTitle: 'Conversation Archive',
      tags: ['Conversation Mining', 'Clustering', 'Timeline', 'Personal AI']
    },
    {
      key: 'bridge',
      cover: 'cover-bridge',
      index: 'PROJECT 03',
      coverTitle: 'Local Agent Bridge',
      tags: ['Feishu', 'Codex', 'Local Agent', 'Node.js'],
      href: 'https://github.com/netting-crypto/feishu-codex-bridge'
    },
    {
      key: 'agent',
      cover: 'cover-agent',
      index: 'PROJECT 04',
      coverTitle: 'Job Search Agent',
      tags: ['Job Search', 'Browser Agent', 'Automation', 'Human-in-the-loop']
    }
  ];

  let currentLanguage = localStorage.getItem('language') || 'zh';
  if (!translations[currentLanguage]) currentLanguage = 'zh';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const t = (key) => translations[currentLanguage][key] || key;

  function applyTranslations() {
    document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
    document.title = currentLanguage === 'zh' ? "骆昕的个人主页" : "Luo Xin's database";

    qsa('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });

    const langButton = qs('.lang-toggle');
    if (langButton) langButton.textContent = currentLanguage === 'zh' ? 'English' : '中文';

    renderProjects();
  }

  function renderProjects() {
    const container = qs('.projects-grid');
    if (!container) return;

    container.innerHTML = projects.map((project, index) => {
      const action = project.href
        ? `<a href="${project.href}" target="_blank" rel="noopener noreferrer" class="project-action">
             <i class="fab fa-github"></i><span>${t('projects.code')}</span>
           </a>`
        : `<span class="project-action project-action--disabled">
             <i class="fas fa-clock"></i><span>${t('projects.soon')}</span>
           </span>`;

      const tags = project.tags.map((tag) => `<span class="project-tag">${tag}</span>`).join('');

      return `
        <article class="card project-card reveal" style="--reveal-delay:${index * 65}ms">
          <div class="project-thumbnail-wrapper" aria-hidden="true">
            <div class="project-cover ${project.cover}">
              <div class="project-cover-copy">
                <small>${project.index}</small>
                <strong>${project.coverTitle}</strong>
              </div>
            </div>
          </div>
          <div class="project-info">
            <h3>${t(`projects.${project.key}.title`)}</h3>
            <p>${t(`projects.${project.key}.desc`)}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-actions">${action}</div>
          </div>
        </article>
      `;
    }).join('');

    observeRevealElements();
  }

  function initTheme() {
    const button = qs('.theme-toggle');
    if (!button) return;

    button.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  function initLanguage() {
    const button = qs('.lang-toggle');
    if (!button) return;

    button.addEventListener('click', () => {
      currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
      localStorage.setItem('language', currentLanguage);
      applyTranslations();
    });
  }

  let revealObserver;

  function observeRevealElements() {
    const elements = qsa('.reveal:not([data-reveal-bound])');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    }

    elements.forEach((element) => {
      element.dataset.revealBound = 'true';
      revealObserver.observe(element);
    });
  }

  function initActiveNavigation() {
    const links = qsa('.nav-links a');
    const sections = links
      .map((link) => qs(link.getAttribute('href')))
      .filter(Boolean);

    const update = () => {
      const y = window.scrollY + 140;
      let activeId = '';
      sections.forEach((section) => {
        if (section.offsetTop <= y) activeId = section.id;
      });
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
      });
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initAvatarFallback() {
    const avatar = qs('.avatar');
    if (!avatar) return;

    avatar.addEventListener('error', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="280" height="280">
          <rect width="100%" height="100%" fill="#252526"/>
          <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#3794ff" font-family="Arial, sans-serif" font-size="96" font-weight="700">LX</text>
        </svg>`;
      avatar.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }, { once: true });
  }

  function init() {
    initTheme();
    initLanguage();
    initAvatarFallback();
    applyTranslations();
    observeRevealElements();
    initActiveNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
