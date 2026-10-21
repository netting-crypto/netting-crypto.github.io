# 骆昕 · 泳池个人网站

访问：https://netting-crypto.github.io/

这是骆昕的个人网站，展示 AI 产品项目 Graph AI Workspace、ScholarPulse、教育背景和联系方式。首页采用可交互的 3D 泳池：点击漂浮物探索同一场景旁的作品、关于和联系区域。

## 发布与本地运行

GitHub Pages 从 main 分支根目录直接发布，无需构建。`.nojekyll` 保留以直接提供静态资源。

```sh
python3 -m http.server 4173
```

访问 http://localhost:4173/ 。请通过服务器访问，以加载脚本、模型与视频。

## 资源与内容

`pool.js`、`water-engine.js`、`float-atlas.js` 管理透视场景、水面及模型轮廓；`app.js` 管理导航；`projects.js` 保存个人项目介绍。所有依赖、模型、字体和项目视频随仓库提供。资源作者与许可见 `ASSET_LICENSES.md`。

项目数据来自个人资料，未将资料中的评测值作为本次重新运行的结果。人物使用 Kenney Mini Characters 女孩模型，图标和中文内容按个人网站调整；水面光学、反射和物理有近似。

2026-10-21 更新首页为泳池版本。原有 `projects/` 详情页及其资源保留，旧首页可从 `backup/pre-pool-2026-10-21` 分支恢复。

## 漂浮文字调整（2026-10-21）

按用户对原站细节的反馈，移除了此前新增的漂浮文字。重新对照后，现有文字投影在字号、轻重和池壁折转处仍未达到参考的质感，因此采用用户明确提出的取舍，保留清爽的泳池。首页固定介绍、漂浮物、水波和导航维持原有行为。

人物已替换为 Kenney Mini Characters 的棕发女孩 character-female-f（CC0），使用自然姿态，并适配水面裁切、模型轮廓阴影和池边停靠。
