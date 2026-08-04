const projectData = {
  zh: [
    {
      number: "01",
      title: "WES 多证据融合",
      subtitle: "GENETIC INTERPRETATION WORKBENCH",
      description: "面向遗传病候选解释的研究工具，将 WES、单细胞表达、疾病模型与网络证据组织为可追溯的优先级结果和交互式报告。",
      tags: ["WES", "scRNA-seq", "Evidence Ranking", "Research Software"],
      stage: "构建中",
      link: "https://github.com/netting-crypto/wes",
      linkLabel: "查看仓库 ↗"
    },
    {
      number: "02",
      title: "对话考古",
      subtitle: "PERSONAL CONVERSATION ARCHIVE",
      description: "从长期 AI 对话中识别项目脉络、重复模式、情绪片段和未被继续的想法，并将它们重新组织成可浏览的个人时间线与项目地图。",
      tags: ["Conversation Mining", "Clustering", "Timeline", "Personal AI"],
      stage: "设计中",
      link: null,
      linkLabel: "即将公开"
    },
    {
      number: "03",
      title: "飞书 × Codex",
      subtitle: "LOCAL AGENT BRIDGE",
      description: "探索将飞书消息接入本地 Codex 工作流，实现工作区绑定、上下文延续、任务执行与进度回传，让移动端指令真正进入本地开发环境。",
      tags: ["Feishu", "Codex", "Local Agent", "Workflow"],
      stage: "构建中",
      link: "https://github.com/netting-crypto/feishu-codex-bridge",
      linkLabel: "查看仓库 ↗"
    },
    {
      number: "04",
      title: "求职 Agent",
      subtitle: "HUMAN-IN-THE-LOOP JOB AGENT",
      description: "围绕职位发现、岗位匹配、材料定制、表单填写和投递记录设计执行型 Agent，同时保留必要的人工确认节点与过程可追溯性。",
      tags: ["Job Search", "Browser Agent", "Automation", "Human-in-the-loop"],
      stage: "探索中",
      link: null,
      linkLabel: "即将公开"
    }
  ],
  en: [
    {
      number: "01",
      title: "WES Evidence Fusion",
      subtitle: "GENETIC INTERPRETATION WORKBENCH",
      description: "A research workbench for rare-disease interpretation, organizing WES, single-cell expression, disease models and network evidence into traceable rankings and interactive reports.",
      tags: ["WES", "scRNA-seq", "Evidence Ranking", "Research Software"],
      stage: "BUILDING",
      link: "https://github.com/netting-crypto/wes",
      linkLabel: "Repository ↗"
    },
    {
      number: "02",
      title: "Conversation Archaeology",
      subtitle: "PERSONAL CONVERSATION ARCHIVE",
      description: "A system for recovering project threads, recurring patterns, emotional fragments and abandoned ideas from long-term AI conversations, then reshaping them into timelines and project maps.",
      tags: ["Conversation Mining", "Clustering", "Timeline", "Personal AI"],
      stage: "DESIGNING",
      link: null,
      linkLabel: "COMING SOON"
    },
    {
      number: "03",
      title: "Feishu × Codex",
      subtitle: "LOCAL AGENT BRIDGE",
      description: "An exploration of connecting Feishu messages to local Codex workflows, covering workspace binding, context continuity, task execution and progress reporting.",
      tags: ["Feishu", "Codex", "Local Agent", "Workflow"],
      stage: "BUILDING",
      link: "https://github.com/netting-crypto/feishu-codex-bridge",
      linkLabel: "Repository ↗"
    },
    {
      number: "04",
      title: "Job Search Agent",
      subtitle: "HUMAN-IN-THE-LOOP JOB AGENT",
      description: "An execution-oriented agent for job discovery, role matching, application material tailoring, form completion and application tracking, with explicit human checkpoints.",
      tags: ["Job Search", "Browser Agent", "Automation", "Human-in-the-loop"],
      stage: "EXPLORING",
      link: null,
      linkLabel: "COMING SOON"
    }
  ]
};

const translations = {
  zh: {
    navProjects: "Projects",
    navAbout: "About",
    availability: "OPEN TO AI PRODUCT OPPORTUNITIES · 2027",
    hello: "你好，我是",
    heroIntro: "我把模糊的问题拆成可执行、可验证、可持续迭代的 AI 系统。",
    heroDetail: "关注 AI 应用落地、Agent 工作流，以及生命科学中的多证据融合。",
    viewWork: "查看项目",
    resumeSoon: "简历 · 待上传",
    basedAtLabel: "BASED AT",
    basedAt: "中国科学技术大学",
    currentLabel: "CURRENT",
    current: "构建个人 AI 工具与研究软件",
    projectsTitle: "正在推进的独立项目",
    projectsIntro: "围绕研究解释、个人信息管理和 Agent 执行构建的长期项目。",
    aboutTitle: "背景与联系",
    aboutIntro: "我的教育背景，以及目前可以公开的联系入口。",
    educationTime: "在读 · 预计 2027 年毕业",
    school: "中国科学技术大学",
    degree: "电子信息专业 · 硕士",
    educationDetail: "研究关注遗传病解释、WES 与单细胞多组学证据融合，同时持续探索 AI 产品与 Agent 的真实应用。",
    contactTitle: "让想法进入下一步",
    contactDesc: "目前优先通过 GitHub 展示项目；简历与邮箱入口将在内容确认后补充。",
    preparing: "准备中",
    footer: "Designed as a personal research workbench."
  },
  en: {
    navProjects: "Projects",
    navAbout: "About",
    availability: "OPEN TO AI PRODUCT OPPORTUNITIES · 2027",
    hello: "Hello, I'm",
    heroIntro: "I turn ambiguous problems into AI systems that can be executed, evaluated and continuously improved.",
    heroDetail: "Focused on applied AI products, agent workflows and multi-evidence integration in life sciences.",
    viewWork: "View projects",
    resumeSoon: "Resume · Soon",
    basedAtLabel: "BASED AT",
    basedAt: "University of Science and Technology of China",
    currentLabel: "CURRENT",
    current: "Building personal AI tools and research software",
    projectsTitle: "Independent projects in progress",
    projectsIntro: "Long-term work around scientific interpretation, personal information systems and agent execution.",
    aboutTitle: "Background & contact",
    aboutIntro: "My education and the contact channels currently available.",
    educationTime: "Current · Expected 2027",
    school: "University of Science and Technology of China",
    degree: "M.E. in Electronic Information",
    educationDetail: "My research focuses on rare-disease interpretation and the integration of WES with single-cell multi-omics evidence, alongside applied explorations in AI products and agents.",
    contactTitle: "Move an idea forward",
    contactDesc: "Projects are currently shared through GitHub. Resume and email links will be added after the content is finalized.",
    preparing: "Preparing",
    footer: "Designed as a personal research workbench."
  }
};

const state = {
  language: localStorage.getItem("language") === "en" ? "en" : "zh"
};

const projectList = document.querySelector("#projectList");
const languageToggle = document.querySelector("#languageToggle");
const themeToggle = document.querySelector("#themeToggle");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function projectTemplate(project) {
  const tags = project.tags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  const projectAction = project.link
    ? `<a class="project-link" href="${escapeHtml(project.link)}" target="_blank" rel="noreferrer">${escapeHtml(project.linkLabel)}</a>`
    : `<span class="project-placeholder">${escapeHtml(project.linkLabel)}</span>`;

  return `
    <article class="project-item reveal">
      <span class="project-number">${escapeHtml(project.number)}</span>
      <div class="project-title-group">
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.subtitle)}</p>
      </div>
      <div class="project-copy">
        <p>${escapeHtml(project.description)}</p>
        <div class="project-tags">${tags}</div>
      </div>
      <div class="project-end">
        <span class="project-stage">${escapeHtml(project.stage)}</span>
        ${projectAction}
      </div>
    </article>
  `;
}

function renderProjects() {
  projectList.innerHTML = projectData[state.language].map(projectTemplate).join("");
  observeRevealElements();
}

function applyLanguage() {
  const dictionary = translations[state.language];

  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = state.language === "zh" ? "骆昕 / Luo Xin" : "Luo Xin / Personal Workbench";
  languageToggle.textContent = state.language === "zh" ? "EN" : "中";
  languageToggle.setAttribute("aria-label", state.language === "zh" ? "Switch to English" : "切换到中文");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key]) {
      element.textContent = dictionary[key];
    }
  });

  renderProjects();
  localStorage.setItem("language", state.language);
}

function toggleLanguage() {
  state.language = state.language === "zh" ? "en" : "zh";
  applyLanguage();
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
}

let revealObserver;

function observeRevealElements() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );
  }

  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));
}

function setupActiveNavigation() {
  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".site-nav a")];

  if (!sections.length || !links.length) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visibleEntry.target.id}`);
      });
    },
    { rootMargin: "-28% 0px -60%", threshold: [0, 0.15, 0.4] }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

languageToggle.addEventListener("click", toggleLanguage);
themeToggle.addEventListener("click", toggleTheme);

applyLanguage();
observeRevealElements();
setupActiveNavigation();
