/**
 * 推送管理路由模块 (Push Routes)
 *
 * 功能说明：
 * 定义所有与推送管理相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/push 前缀
 *
 * 路由列表：
 * ┌──────────┬───────────────────────────┬──────────┬──────────────────────┐
 * │  方法    │  路径                      │  权限    │  功能说明             │
 * ├──────────┼───────────────────────────┼──────────┼──────────────────────┤
 * │ GET      │ /push                     │ admin+   │ P001: 推送活动列表    │
 * │ GET      │ /push/:id                 │ admin+   │ P002: 推送活动详情    │
 * │ POST     │ /push                     │ admin+   │ P003: 创建推送活动    │
 * │ PUT      │ /push/:id                 │ admin+   │ P004: 编辑推送活动    │
 * │ DELETE   │ /push/:id                 │ super+   │ P005: 删除推送活动    │
 * │ GET      │ /push/limits              │ admin+   │ P006: 获取推送限额    │
 * │ PUT      │ /push/limits              │ super+   │ P007: 更新推送限额    │
 * └──────────┴───────────────────────────┴──────────┴──────────────────────┘
 *
 * 统一响应格式：
 * { success: boolean, data?: any, message?: string, error?: string }
 */

import { authMiddleware as auth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/rbac.js';
import pushController from '../controllers/pushController.js';

export default async function pushRoutes(fastify, options) {

  fastify.get('/', {
    preHandler: [auth],
    schema: {
      description: '获取推送活动列表（分页、状态筛选、搜索）',
      tags: ['Push Notification'],
      summary: '分页查询推送活动，支持按状态筛选和标题搜索',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, description: '页码' },
          pageSize: { type: 'integer', default: 20, description: '每页条数' },
          status: { type: 'string', enum: ['', 'draft', 'scheduled', 'sent', 'cancelled'], description: '状态筛选' },
          search: { type: 'string', description: '搜索关键词' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: {
                  type: 'object',
                  properties: { total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' }, totalPages: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    },
  }, pushController.listCampaigns);

  fastify.get('/:id', {
    preHandler: [auth],
    schema: {
      description: '获取单个推送活动详情',
      tags: ['Push Notification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', description: '推送活动ID' } },
        required: ['id'],
      },
    },
  }, pushController.getCampaign);

  fastify.post('/', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '创建新的推送活动',
      tags: ['Push Notification'],
      summary: '创建一个新的推送活动，可设置标题、内容、发送时间和分类',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'sendAt'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100, description: '推送标题' },
          content: { type: 'string', maxLength: 500, description: '推送内容' },
          sendAt: { type: 'string', description: '发送时间 (ISO格式，精确到分钟)' },
          status: { type: 'string', enum: ['draft', 'scheduled'], default: 'draft', description: '状态' },
          category: { type: 'string', description: '话题分类' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, pushController.createCampaign);

  fastify.put('/:id', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '编辑推送活动',
      tags: ['Push Notification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 100 },
          content: { type: 'string', maxLength: 500 },
          sendAt: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'scheduled', 'sent', 'cancelled'] },
          category: { type: 'string' },
        },
      },
    },
  }, pushController.updateCampaign);

  fastify.delete('/:id', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN])],
    schema: {
      description: '删除推送活动（仅超级管理员）',
      tags: ['Push Notification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, pushController.deleteCampaign);

  fastify.get('/limits/config', {
    preHandler: [auth],
    schema: {
      description: '获取推送频率限制配置',
      tags: ['Push Notification'],
      security: [{ bearerAuth: [] }],
    },
  }, pushController.getLimits);

  fastify.put('/limits/config', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '更新推送频率限制',
      tags: ['Push Notification'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['daily', 'weekly', 'monthly'],
        properties: {
          daily: { type: 'integer', minimum: 1, description: '每日上限' },
          weekly: { type: 'integer', minimum: 1, description: '每周上限' },
          monthly: { type: 'integer', minimum: 1, description: '每月上限' },
        },
      },
    },
  }, pushController.updateLimits);
}
