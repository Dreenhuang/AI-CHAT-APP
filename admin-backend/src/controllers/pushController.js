/**
 * 推送管理控制器 (Push Controller)
 *
 * 功能说明：
 * 处理所有与推送管理相关的HTTP请求
 * 包括：推送活动CRUD、推送限额管理
 *
 * 请求流程：
 * HTTP Request → Route → Controller → Service → Controller → HTTP Response
 */

import pushService from '../services/pushService.js';

function extractOperator(request) {
  return {
    username: request.user?.username || 'unknown',
    admin_id: request.user?.id || request.user?.admin_id || null,
    role: request.user?.role || 'unknown',
    ip: request.ip || request.headers['x-forwarded-for'] || 'unknown',
  };
}

export async function listCampaigns(request, reply) {
  try {
    const result = await pushService.getCampaigns(request.query);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message || '获取推送列表失败', errorType: error.errorType };
  }
}

export async function getCampaign(request, reply) {
  try {
    const result = await pushService.getCampaignById(request.params.id);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message, errorType: error.errorType };
  }
}

export async function createCampaign(request, reply) {
  try {
    const operator = extractOperator(request);
    const result = await pushService.createCampaign(request.body, operator);
    reply.code(201);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message || '创建推送活动失败', errorType: error.errorType };
  }
}

export async function updateCampaign(request, reply) {
  try {
    const operator = extractOperator(request);
    const result = await pushService.updateCampaign(request.params.id, request.body, operator);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message, errorType: error.errorType };
  }
}

export async function deleteCampaign(request, reply) {
  try {
    const operator = extractOperator(request);
    const result = await pushService.deleteCampaign(request.params.id, operator);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message, errorType: error.errorType };
  }
}

export async function getLimits(request, reply) {
  try {
    const result = await pushService.getPushLimits();
    return reply.send(result);
  } catch (error) {
    reply.code(500);
    return { success: false, message: '获取推送限额失败' };
  }
}

export async function updateLimits(request, reply) {
  try {
    const operator = extractOperator(request);
    const result = await pushService.updatePushLimits(request.body, operator);
    return reply.send(result);
  } catch (error) {
    reply.code(error.code || 500);
    return { success: false, message: error.message || '更新推送限额失败', errorType: error.errorType };
  }
}

export default { listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, getLimits, updateLimits };
