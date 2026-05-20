# Oracle Prompt 种子文件

## `oracle_system_web.template.json`

- **来源**：`yilore_sever/database/oracle_system_patch_auspicious_day.json`（与当前 App 主聊天 `oracle_system` 最新稿一致）
- **`stage_name`**：`oracle_system_web`（网页专用，默认 `is_active: false`）
- **用途**：在门户「Prompt 配置」里新建版本时，把 `system_prompt` / `tools` 粘贴进去后自行删减（例如去掉 `trigger_picture_divination` 观物）

### 在门户里新建（推荐）

1. 打开 **Prompt 配置** → 阶段选 **Oracle 系统（网页端）**
2. 点 **新增**，`model_name` / `config` 与当前激活的 **Oracle 系统（App）** 保持一致
3. 从本 JSON 复制 `system_prompt`、`tools` 到表单（或整段 Tools JSON）
4. 模板已去掉 `trigger_picture_divination`（观物）、`trigger_add_person`（AI 建档），并写好网页端说明；确认后保存并 **激活**
5. 后端需实现 `X-Yilore-Client-Platform: web` → 读取 `oracle_system_web`（尚未接路由时，仅能在门户里编辑存库）

### 字段说明

| 字段 | 说明 |
|------|------|
| `placeholders` | 与 App 相同：`{user_profile}` `{related_persons}` `{active_facts}` `{related_reports}` |
| `user_prompt` | 留空，由后端上下文注入 |
| `model_name` | 模板里为空，新建时请从激活的 `oracle_system` 复制 |
