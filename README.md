# pixel-profile

一个原生 HTML / CSS / JavaScript 实现的像素风个人主页，适合直接部署到 GitHub Pages。

## 当前内容

- 中英文切换
- 明暗主题切换
- 像素操作系统 / 工作台视觉
- 四条核心项目线
  - WES + 单细胞多组学软件
  - 飞书 × Codex 桥接
  - ChatGPT 历史对话考古
  - 批量投递 Agent
- 右下角像素小鱼宠物
- 轻量本地对话逻辑
- GuppyLM / ONNX 懒加载接口预留
- 响应式桌面端与移动端布局
- 零框架、零构建依赖

## 本地预览

直接双击 `index.html` 即可。

也可以运行：

```bash
python -m http.server 8080
```

然后打开：

```text
http://127.0.0.1:8080
```

## 部署到 GitHub Pages

### 推荐仓库名

```text
pixel-profile
```

部署后地址：

```text
https://netting-crypto.github.io/pixel-profile/
```

### 操作步骤

1. 在 GitHub 创建公开仓库 `pixel-profile`
2. 上传本目录全部文件
3. 打开仓库 `Settings → Pages`
4. 在 `Build and deployment` 中选择 `Deploy from a branch`
5. 选择 `main` 和 `/ (root)`
6. 保存并等待 GitHub Pages 完成部署

## 改成 GitHub 个人主页地址

若希望地址直接是：

```text
https://netting-crypto.github.io/
```

则仓库必须命名为：

```text
netting-crypto.github.io
```

## GuppyLM 接入建议

当前版本没有直接把约 10MB 的模型塞进首屏，而是保留了 `lazyLoadGuppyLM()` 接口。

建议后续：

1. 用户第一次点击小鱼时，只打开轻量聊天窗
2. 用户选择“启用本地模型”后再加载 ONNX Runtime Web
3. 下载 `model.onnx` 与 `tokenizer.json`
4. 将会话切换到浏览器端 WASM 推理
5. 对模型加载失败、低性能设备和移动端提供当前规则回复兜底

这样能保留趣味性，同时避免个人主页首屏被模型下载拖慢。
