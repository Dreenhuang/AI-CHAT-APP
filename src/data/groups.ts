/**
 * 群组Mock数据
 * 
 * 包含5个示例辩论群组，涵盖不同领域和风格
 */

import { Group } from '../types';

/** 示例群组数据 */
export const mockGroups: Group[] = [
  {
    id: 'group_001',
    name: '科技前沿辩论社',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=tech',
    description: '探讨人工智能、元宇宙、区块链等科技热点话题，理性分析技术趋势。',
    memberCount: 1286,
    topics: ['topic_tech_001', 'topic_tech_002', 'topic_tech_008'],
    createdAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: 'group_002',
    name: '社会观察家',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=social',
    description: '关注社会热点事件，从多角度分析社会现象背后的深层逻辑。',
    memberCount: 2341,
    topics: ['topic_social_001', 'topic_social_002', 'topic_social_020'],
    createdAt: '2024-02-20T10:30:00.000Z',
  },
  {
    id: 'group_003',
    name: '生活哲学研讨室',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=life',
    description: '讨论生活方式、人生选择、价值观等话题，寻找生活的意义。',
    memberCount: 892,
    topics: ['topic_lifestyle_001', 'topic_lifestyle_005', 'topic_lifestyle_012'],
    createdAt: '2024-03-05T14:00:00.000Z',
  },
  {
    id: 'group_004',
    name: '青年观点碰撞场',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=youth',
    description: '年轻人表达观点的平台，畅聊职场、情感、梦想与焦虑。',
    memberCount: 5621,
    topics: ['topic_social_001', 'topic_social_006', 'topic_economy_010'],
    createdAt: '2024-03-18T09:15:00.000Z',
  },
  {
    id: 'group_005',
    name: '环保行动派',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=eco',
    description: '关注环境问题，倡导绿色生活方式，用辩论推动环保意识。',
    memberCount: 1567,
    topics: ['topic_environment_001', 'topic_environment_002', 'topic_environment_011'],
    createdAt: '2024-04-01T11:45:00.000Z',
  },
];

/** 根据ID获取群组 */
export const getGroupById = (id: string): Group | undefined => 
  mockGroups.find(group => group.id === id);

/** 获取所有群组 */
export const getAllGroups = (): Group[] => mockGroups;
