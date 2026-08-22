---
title: 基岩版开发：快速入门指南
summary: 从项目结构、行为包到资源包，快速开始 Bedrock Add-on 开发。
icon: rocket_launch
cover: icons/bedrock_dev.svg
---

# 基岩版开发：快速入门指南

Minecraft Bedrock Add-on 通常由资源包和行为包组成。资源包负责视觉、模型、材质与界面，行为包负责实体、配方、组件和游戏逻辑。

## 项目结构

建议从清晰的目录结构开始，为每个包准备独立的 `manifest.json`，并为模块设置唯一 UUID。开发过程中保持资源包和行为包版本号同步，便于排查加载问题。

## 调试流程

先用最小资源验证包能够正常加载，再逐步添加纹理、实体和组件。出现加载失败时，优先检查 JSON 格式、命名空间、路径大小写和 UUID 是否重复。

## 发布前检查

在不同设备和分辨率下测试资源显示、行为逻辑与存档兼容性，确认没有依赖本地绝对路径，再导出项目。



想要制作属于自己的 **Minecraft 附加包、模组、皮肤、地图或功能脚本**？
微软官方创作者文档是最权威、最全面的学习资料。

## 学习资源
包含：环境搭建、实体组件、行为包、资源包、Script API 等全套教程。

[访问微软基岩版开发文档](https://learn.microsoft.com/zh-cn/minecraft/creator/documents/gettingstarted\)


## 适用范围
- 附加包（Add-on）开发
- 行为包 / 资源包制作
- 自定义实体、物品、方块
- Script API 脚本逻辑开发