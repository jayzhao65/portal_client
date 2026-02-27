// src/components/SchemaEditor.tsx
// 结构化输出（JSON Schema）可视化编辑器
// 支持两种模式：表单模式（适合简单扁平结构）和 JSON 模式（适合嵌套/复杂结构）

import { useState, useEffect } from 'react';
import {
  Switch,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Radio
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ApiOutlined,
  FormOutlined,
  CodeOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ==========================================
// 类型定义
// ==========================================

interface SchemaField {
  name: string;
  type: string;
  description: string;
  enumValues: string;
  required: boolean;
}

interface ResponseFormat {
  type: string;
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: string;
      properties: Record<string, any>;
      required: string[];
      additionalProperties: boolean;
    };
  };
}

interface SchemaEditorProps {
  value: ResponseFormat | null;
  onChange: (value: ResponseFormat | null) => void;
  stageName?: string;
  readonly?: boolean;
}

type EditorMode = 'form' | 'json';

const FIELD_TYPES = [
  { value: 'string',      label: 'string（字符串）' },
  { value: 'boolean',     label: 'boolean（布尔值）' },
  { value: 'number',      label: 'number（数字）' },
  { value: 'string|null', label: 'string | null（字符串或空）' },
  { value: 'number|null', label: 'number | null（数字或空）' },
];

// 简单类型集合，用来判断 schema 是否能用表单模式编辑
const SIMPLE_TYPES = new Set(['string', 'boolean', 'number', 'integer']);

// ==========================================
// 判断 schema 是否为扁平结构（所有属性都是简单类型）
// ==========================================
function isFlat(rf: ResponseFormat): boolean {
  const props = rf.json_schema?.schema?.properties;
  if (!props) return true;
  for (const val of Object.values(props)) {
    const p = val as any;
    const t = p.type;
    if (Array.isArray(t)) {
      if (!t.every((x: string) => SIMPLE_TYPES.has(x) || x === 'null')) return false;
    } else if (!SIMPLE_TYPES.has(t)) {
      return false;
    }
  }
  return true;
}

// ==========================================
// 表单模式工具函数
// ==========================================
function buildResponseFormat(schemaName: string, fields: SchemaField[]): ResponseFormat {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const field of fields) {
    if (!field.name.trim()) continue;
    const prop: Record<string, any> = {};

    if (field.type === 'string|null') {
      prop.type = ['string', 'null'];
    } else if (field.type === 'number|null') {
      prop.type = ['number', 'null'];
    } else {
      prop.type = field.type;
    }

    if (field.description.trim()) {
      prop.description = field.description.trim();
    }

    if (field.enumValues.trim() && (field.type === 'string' || field.type === 'string|null')) {
      const enums = field.enumValues.split(',').map(v => v.trim()).filter(v => v);
      if (enums.length > 0) prop.enum = enums;
    }

    properties[field.name.trim()] = prop;
    if (field.required) required.push(field.name.trim());
  }

  return {
    type: 'json_schema',
    json_schema: {
      name: schemaName || 'schema',
      strict: true,
      schema: { type: 'object', properties, required, additionalProperties: false },
    },
  };
}

function parseResponseFormat(rf: ResponseFormat): { schemaName: string; fields: SchemaField[] } {
  const schemaName = rf.json_schema?.name || 'schema';
  const schema = rf.json_schema?.schema;
  if (!schema || !schema.properties) return { schemaName, fields: [] };

  const requiredSet = new Set(schema.required || []);
  const fields: SchemaField[] = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const p = prop as any;
    let type = 'string';
    if (Array.isArray(p.type)) {
      if (p.type.includes('string') && p.type.includes('null')) type = 'string|null';
      else if (p.type.includes('number') && p.type.includes('null')) type = 'number|null';
      else type = p.type[0] || 'string';
    } else {
      type = p.type || 'string';
    }
    fields.push({
      name,
      type,
      description: p.description || '',
      enumValues: (p.enum || []).join(', '),
      required: requiredSet.has(name),
    });
  }
  return { schemaName, fields };
}

// ==========================================
// 组件主体
// ==========================================
export default function SchemaEditor({ value, onChange, stageName, readonly = false }: SchemaEditorProps) {
  const [enabled, setEnabled] = useState<boolean>(!!value);
  const [schemaName, setSchemaName] = useState<string>('');
  const [fields, setFields] = useState<SchemaField[]>([]);

  // JSON 模式相关状态
  const [mode, setMode] = useState<EditorMode>('form');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  // 初始化
  useEffect(() => {
    if (value) {
      setEnabled(true);
      // 如果是复杂嵌套结构，自动切换到 JSON 模式
      if (!isFlat(value)) {
        setMode('json');
        setJsonText(JSON.stringify(value, null, 2));
        setJsonError('');
      } else {
        const parsed = parseResponseFormat(value);
        setSchemaName(parsed.schemaName);
        setFields(parsed.fields);
        // 保持当前模式不变（不强制切回 form）
        if (mode === 'json') {
          setJsonText(JSON.stringify(value, null, 2));
          setJsonError('');
        }
      }
    } else {
      setEnabled(false);
      const autoName = stageName
        ? stageName.replace(/[\/\s]/g, '_').toLowerCase() + '_result'
        : 'schema';
      setSchemaName(autoName);
      setFields([]);
      setJsonText('');
      setJsonError('');
    }
  }, [value, stageName]);

  // 表单模式：字段变化 → 生成 response_format
  const emitChange = (newEnabled: boolean, newSchemaName: string, newFields: SchemaField[]) => {
    if (!newEnabled) { onChange(null); return; }
    const validFields = newFields.filter(f => f.name.trim());
    if (validFields.length === 0) { onChange(null); return; }
    onChange(buildResponseFormat(newSchemaName, validFields));
  };

  // 开关切换
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(null);
    } else if (mode === 'form') {
      emitChange(true, schemaName, fields);
    } else {
      // JSON 模式开启时，尝试解析当前文本
      handleJsonApply(jsonText);
    }
  };

  // 模式切换
  const handleModeSwitch = (newMode: EditorMode) => {
    if (newMode === mode) return;

    if (newMode === 'json') {
      // 表单 → JSON：把当前值序列化到文本框
      const currentValue = value || (fields.filter(f => f.name.trim()).length > 0
        ? buildResponseFormat(schemaName, fields.filter(f => f.name.trim()))
        : null);
      setJsonText(currentValue ? JSON.stringify(currentValue, null, 2) : '');
      setJsonError('');
    } else {
      // JSON → 表单：只有扁平结构才能切回
      if (value && !isFlat(value)) {
        setJsonError('当前 Schema 包含嵌套结构（数组/对象），无法切换到表单模式');
        return;
      }
      if (value) {
        const parsed = parseResponseFormat(value);
        setSchemaName(parsed.schemaName);
        setFields(parsed.fields);
      }
      setJsonError('');
    }
    setMode(newMode);
  };

  // JSON 模式：应用文本
  const handleJsonApply = (text: string) => {
    if (!text.trim()) {
      setJsonError('');
      onChange(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      // 基础校验：必须有 type 和 json_schema
      if (parsed.type !== 'json_schema' || !parsed.json_schema?.schema) {
        setJsonError('格式错误：顶层需要 { "type": "json_schema", "json_schema": { "name": "...", "strict": true, "schema": { ... } } }');
        return;
      }
      setJsonError('');
      onChange(parsed as ResponseFormat);
    } catch (e: any) {
      setJsonError(`JSON 解析失败: ${e.message}`);
    }
  };

  // 表单模式回调
  const handleSchemaNameChange = (newName: string) => {
    setSchemaName(newName);
    emitChange(enabled, newName, fields);
  };

  const handleAddField = () => {
    const newFields = [...fields, { name: '', type: 'string', description: '', enumValues: '', required: true }];
    setFields(newFields);
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    emitChange(enabled, schemaName, newFields);
  };

  const handleFieldChange = (index: number, key: keyof SchemaField, val: any) => {
    const newFields = [...fields];
    (newFields[index] as any)[key] = val;
    setFields(newFields);
    emitChange(enabled, schemaName, newFields);
  };

  // ==========================================
  // 只读模式
  // ==========================================
  if (readonly) {
    if (!value) {
      return (
        <div style={{ padding: '8px 12px', background: '#fafafa', borderRadius: '6px' }}>
          <Text type="secondary">未启用结构化输出</Text>
        </div>
      );
    }
    return (
      <div style={{ padding: '12px', background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: '6px' }}>
        <Space style={{ marginBottom: 8 }}>
          <ApiOutlined style={{ color: '#1890ff' }} />
          <Text strong>结构化输出</Text>
          <Tag color="blue">{value.json_schema?.name || 'schema'}</Tag>
          {!isFlat(value) && <Tag color="orange">嵌套结构</Tag>}
        </Space>
        <pre style={{
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: 11,
          maxHeight: 300,
          overflow: 'auto',
          margin: '8px 0 0',
        }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  // ==========================================
  // 编辑模式
  // ==========================================
  return (
    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
      {/* 开关 + 模式切换 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: enabled ? 12 : 0 }}>
        <Space>
          <Switch checked={enabled} onChange={handleToggle} />
          <Text strong>启用结构化输出（JSON Schema）</Text>
          <Tooltip title="启用后，OpenRouter 会强制模型按定义的字段结构输出 JSON，避免格式错误">
            <Text type="secondary" style={{ cursor: 'help' }}>(?)</Text>
          </Tooltip>
        </Space>
        {enabled && (
          <Radio.Group
            size="small"
            value={mode}
            onChange={(e) => handleModeSwitch(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="form"><FormOutlined /> 表单</Radio.Button>
            <Radio.Button value="json"><CodeOutlined /> JSON</Radio.Button>
          </Radio.Group>
        )}
      </div>

      {enabled && mode === 'form' && (
        <>
          <Divider style={{ margin: '8px 0 12px' }} />

          {/* Schema 名称 */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Schema 名称：</Text>
            <Input
              value={schemaName}
              onChange={(e) => handleSchemaNameChange(e.target.value)}
              placeholder="如: question_verify_result"
              style={{ width: 300 }}
            />
          </div>

          {/* 字段列表 */}
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>字段定义（适用于简单扁平结构）：</Text>
            {fields.map((field, index) => (
              <div
                key={index}
                style={{
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: 8,
                }}
              >
                <Row gutter={[8, 8]} align="middle">
                  <Col span={5}>
                    <Input
                      size="small"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      placeholder="字段名"
                      addonBefore="名称"
                    />
                  </Col>
                  <Col span={5}>
                    <Select
                      size="small"
                      value={field.type}
                      onChange={(val) => handleFieldChange(index, 'type', val)}
                      style={{ width: '100%' }}
                    >
                      {FIELD_TYPES.map(t => (
                        <Option key={t.value} value={t.value}>{t.label}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Input
                      size="small"
                      value={field.description}
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                      placeholder="字段描述"
                    />
                  </Col>
                  <Col span={4}>
                    {(field.type === 'string' || field.type === 'string|null') ? (
                      <Input
                        size="small"
                        value={field.enumValues}
                        onChange={(e) => handleFieldChange(index, 'enumValues', e.target.value)}
                        placeholder="枚举值,逗号分隔"
                      />
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                    )}
                  </Col>
                  <Col span={4}>
                    <Space>
                      <Tooltip title={field.required ? '必填' : '可选'}>
                        <Tag
                          color={field.required ? 'blue' : 'default'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleFieldChange(index, 'required', !field.required)}
                        >
                          {field.required ? '必填' : '可选'}
                        </Tag>
                      </Tooltip>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteField(index)}
                      />
                    </Space>
                  </Col>
                </Row>
              </div>
            ))}

            <Button
              type="dashed"
              onClick={handleAddField}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              size="small"
            >
              添加字段
            </Button>
          </div>

          {/* 预览 */}
          {fields.filter(f => f.name.trim()).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                生成的 response_format 预览：
              </Text>
              <pre style={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: 11,
                maxHeight: 200,
                overflow: 'auto',
                margin: 0,
              }}>
                {JSON.stringify(buildResponseFormat(schemaName, fields.filter(f => f.name.trim())), null, 2)}
              </pre>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              需要嵌套结构（数组、对象）？切换到右上角的 <strong>JSON 模式</strong>
            </Text>
          </div>
        </>
      )}

      {enabled && mode === 'json' && (
        <>
          <Divider style={{ margin: '8px 0 12px' }} />

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="JSON 模式：直接编辑完整的 response_format JSON，支持嵌套数组/对象等复杂结构"
          />

          <TextArea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError('');
            }}
            placeholder={'粘贴或编辑 response_format JSON，格式如：\n{\n  "type": "json_schema",\n  "json_schema": {\n    "name": "xxx",\n    "strict": true,\n    "schema": { ... }\n  }\n}'}
            autoSize={{ minRows: 8, maxRows: 24 }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />

          {jsonError && (
            <Alert type="error" message={jsonError} style={{ marginTop: 8 }} showIcon />
          )}

          <Button
            type="primary"
            size="small"
            style={{ marginTop: 8 }}
            onClick={() => handleJsonApply(jsonText)}
          >
            应用 JSON
          </Button>

          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              简单扁平结构？切换到右上角的 <strong>表单模式</strong> 更方便
            </Text>
          </div>
        </>
      )}
    </div>
  );
}
