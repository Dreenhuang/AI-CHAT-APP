/**
 * 推送管理服务层 (Push Service)
 *
 * 功能说明：
 * 封装推送活动管理的所有业务逻辑
 * 使用JSON文件持久化推送活动数据
 *
 * 数据存储：
 * - pushCampaigns.json: 推送活动列表
 * - 推送限额存储于 system_configs 表
 * - 操作日志复用 auditService
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog, inferActionFromMethod } from './auditService.js';
import configService from './configService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'pushCampaigns.json');
const LIMITS_CONFIG_KEY = 'push.limits';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_LIMITS = { daily: 3, weekly: 15, monthly: 60 };

function readCampaigns() {
  try {
    if (!fs.existsSync(CAMPAIGNS_FILE)) return [];
    const raw = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCampaigns(campaigns) {
  fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
}

export async function getCampaigns(query = {}) {
  const { page = 1, pageSize = 20, status = '', search = '' } = query;
  let campaigns = readCampaigns();

  if (status) {
    campaigns = campaigns.filter(c => c.status === status);
  }
  if (search) {
    const kw = search.toLowerCase();
    campaigns = campaigns.filter(c =>
      c.title.toLowerCase().includes(kw) || c.content.toLowerCase().includes(kw)
    );
  }

  campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = campaigns.length;
  const validPage = Math.max(1, parseInt(page) || 1);
  const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const start = (validPage - 1) * validPageSize;
  const items = campaigns.slice(start, start + validPageSize);

  return {
    success: true,
    data: {
      items,
      pagination: {
        total,
        page: validPage,
        pageSize: validPageSize,
        totalPages: Math.ceil(total / validPageSize),
      },
    },
  };
}

export async function getCampaignById(id) {
  const campaigns = readCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  if (!campaign) {
    throw { code: 404, message: '推送活动不存在', errorType: 'CAMPAIGN_NOT_FOUND' };
  }
  return { success: true, data: campaign };
}

export async function createCampaign(data, operator) {
  const now = new Date().toISOString();
  const campaign = {
    id: uuidv4(),
    title: data.title,
    content: data.content || '',
    sendAt: data.sendAt || null,
    status: data.status || 'draft',
    category: data.category || '',
    createdBy: operator?.admin_id || 'unknown',
    createdAt: now,
    updatedAt: now,
  };

  const campaigns = readCampaigns();
  campaigns.push(campaign);
  writeCampaigns(campaigns);

  await createAuditLog({
    adminId: operator?.admin_id || 'unknown',
    action: 'CREATE',
    targetType: 'PUSH_CAMPAIGN',
    targetId: campaign.id,
    newData: { title: campaign.title, sendAt: campaign.sendAt, status: campaign.status },
    ipAddress: operator?.ip || 'unknown',
    result: 'SUCCESS',
  });

  return { success: true, data: campaign, message: '推送活动创建成功' };
}

export async function updateCampaign(id, data, operator) {
  const campaigns = readCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) {
    throw { code: 404, message: '推送活动不存在', errorType: 'CAMPAIGN_NOT_FOUND' };
  }

  const old = { ...campaigns[index] };
  campaigns[index] = {
    ...campaigns[index],
    title: data.title ?? campaigns[index].title,
    content: data.content ?? campaigns[index].content,
    sendAt: data.sendAt ?? campaigns[index].sendAt,
    status: data.status ?? campaigns[index].status,
    category: data.category ?? campaigns[index].category,
    updatedAt: new Date().toISOString(),
  };

  writeCampaigns(campaigns);

  await createAuditLog({
    adminId: operator?.admin_id || 'unknown',
    action: 'UPDATE',
    targetType: 'PUSH_CAMPAIGN',
    targetId: id,
    oldData: { title: old.title, sendAt: old.sendAt, status: old.status },
    newData: { title: campaigns[index].title, sendAt: campaigns[index].sendAt, status: campaigns[index].status },
    ipAddress: operator?.ip || 'unknown',
    result: 'SUCCESS',
  });

  return { success: true, data: campaigns[index], message: '推送活动更新成功' };
}

export async function deleteCampaign(id, operator) {
  const campaigns = readCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) {
    throw { code: 404, message: '推送活动不存在', errorType: 'CAMPAIGN_NOT_FOUND' };
  }

  const deleted = campaigns.splice(index, 1)[0];
  writeCampaigns(campaigns);

  await createAuditLog({
    adminId: operator?.admin_id || 'unknown',
    action: 'DELETE',
    targetType: 'PUSH_CAMPAIGN',
    targetId: id,
    oldData: { title: deleted.title, sendAt: deleted.sendAt, status: deleted.status },
    ipAddress: operator?.ip || 'unknown',
    result: 'SUCCESS',
  });

  return { success: true, message: '推送活动已删除' };
}

export async function getPushLimits() {
  try {
    const result = await configService.getConfigByKey(LIMITS_CONFIG_KEY);
    if (result.success && result.data) {
      return { success: true, data: result.data.configValue };
    }
  } catch {}
  return { success: true, data: DEFAULT_LIMITS };
}

export async function updatePushLimits(limits, operator) {
  const old = await getPushLimits();
  const newLimits = {
    daily: Math.max(1, parseInt(limits.daily) || DEFAULT_LIMITS.daily),
    weekly: Math.max(1, parseInt(limits.weekly) || DEFAULT_LIMITS.weekly),
    monthly: Math.max(1, parseInt(limits.monthly) || DEFAULT_LIMITS.monthly),
  };

  try {
    await configService.updateConfig({
      configKey: LIMITS_CONFIG_KEY,
      configValue: newLimits,
      configType: 'NOTIFICATION',
      description: '推送频率限制：每日/每周/每月上限',
      isSensitive: false,
      updatedBy: operator?.admin_id || null,
    });
  } catch {
    throw { code: 500, message: '保存推送限额失败', errorType: 'LIMITS_SAVE_ERROR' };
  }

  await createAuditLog({
    adminId: operator?.admin_id || 'unknown',
    action: 'CONFIG_CHANGE',
    targetType: 'CONFIG',
    targetId: LIMITS_CONFIG_KEY,
    oldData: { limits: old.data },
    newData: { limits: newLimits },
    ipAddress: operator?.ip || 'unknown',
    result: 'SUCCESS',
  });

  return { success: true, data: newLimits, message: '推送限额已更新' };
}

export default { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getPushLimits, updatePushLimits };
