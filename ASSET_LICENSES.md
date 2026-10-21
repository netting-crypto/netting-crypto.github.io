# 资源署名与许可

## 3D 模型

`dist/assets/models/duck.glb` — **Rubber Duck**，作者 [ElOsitoAzul](https://sketchfab.com/ElOsitoAzul)。

- 原模型：https://sketchfab.com/3d-models/rubber-duck-3c0615273e9f4322bef8723f52bfb6b9
- 许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- GLB 内嵌的 `asset.extras` 记录上述作者、来源及许可。
- 本项目调整显示尺寸、材质粗糙度，并对水面以下部分进行裁切；文件内的原始模型署名保留。

`dist/assets/models/cloud.glb` — **Clouds**，作者 [vanissa](https://sketchfab.com/vanissa)。

- 原模型：https://sketchfab.com/3d-models/clouds-1aff77425682440d989bfa0beaf9a566
- 许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- GLB 内嵌的 `asset.extras` 记录上述作者、来源及许可。
- 本项目调整显示尺寸、材质粗糙度，并进行水面裁切；原始署名保留。

以上两个模型从参考站公开提供的相同资产取得。网页关于区域提供可见署名、来源和许可链接。参考站：[Kia Bai](https://kiabai.me/)。

## 脚本依赖

Three.js 0.160.0、GLTFLoader、BufferGeometryUtils 和 SkeletonUtils 来自 Three.js 官方 npm 包，MIT 许可见 `dist/assets/THREE-LICENSE.txt`。辅助文件仅修改了本地模块导入路径。

本项目的泳池、相机控制、应用图标和水面渲染独立实现；未将下载用于分析的原站 JavaScript、HTML、CSS 放入交付站点。

## 字体

Zen Maru Gothic（本地文字子集），来自 Google Fonts，SIL Open Font License 1.1，见 `dist/assets/FONT-OFL.txt`。本项目没有修改字形设计。

## 用户内容

Graph AI Workspace 与 ScholarPulse 的演示视频来自用户已有文件，网页文字来自用户《内容资料.md》。这些用户内容不因本资源署名文件改变权利归属。

旧版本留下的 `water.jpg` 是内置图像生成工具创建的泳池纹理；当前实时水面不使用该纹理。它只作为旧样式中未启用的备用资源保留。

## 参考形象女孩

女孩外观依据用户提供的形象图制作，使用 Three.js 实体几何体独立建模；代码位于 `portrait-model.js`（发布包为 `dist/portrait-model.js`）。模型包括短发与刘海、三色发夹、曲面腮红、五官、蓝白衣领、挥手手臂和鞋子。图形为立体网格，未使用参考图裁切贴片。
