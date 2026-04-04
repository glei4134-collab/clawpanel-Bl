# 安全政策

## 关于本版本

ClawPanel-Bl 是 [ClawPanel](https://github.com/qingchencloud/clawpanel) 的魔改版本。

## 报告安全漏洞

如果你发现了安全漏洞，**请不要**在公开的 Issue 中提交。

请通过以下方式私下报告：

1. 在本仓库发起 Security Advisory
2. 或联系原始项目 [qingchencloud/clawpanel](https://github.com/qingchencloud/clawpanel/security/advisories/new)

### 报告内容应包含

- 漏洞的详细描述
- 复现步骤
- 受影响的版本
- 可能的影响范围
- 如果有的话，建议的修复方案

### 响应时间

- **确认收到**：48 小时内
- **初步评估**：7 个工作日内
- **修复发布**：根据严重程度，通常在 30 天内

## 安全最佳实践

- API Key 存储在本地，勿在公开场所泄露
- 建议为 OpenClaw 数据目录设置适当权限
- 多人共用时使用独立实例
- 定期更新到最新版本

## 已知限制

- 本应用设计用于本地网络管理
- 公网部署请务必配置访问密码和防火墙
