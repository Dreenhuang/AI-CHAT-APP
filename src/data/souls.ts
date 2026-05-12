/**
 * Soul好友Mock数据
 * 
 * 包含8个示例Soul好友，每个都有独特的性格和辩论风格
 */

import { Soul } from '../types';

/** 示例Soul好友数据 */
export const mockSouls: Soul[] = [
  {
    id: 'soul_001',
    name: '逻辑君',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=logic',
    personality: 'rational',
    description: '冷静理性的分析者，善于用数据和逻辑拆解问题，从不被情绪左右。',
    specialty: '科技、经济、数学',
    winRate: 78,
    debateCount: 342,
    isOnline: true,
    addedAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'soul_002',
    name: '情感姐',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=emotion',
    personality: 'emotional',
    description: '共情能力超强的倾听者，总能从人性角度出发，用温暖的语言打动对方。',
    specialty: '社会、教育、心理',
    winRate: 72,
    debateCount: 289,
    isOnline: true,
    addedAt: '2024-01-15T12:30:00.000Z',
  },
  {
    id: 'soul_003',
    name: '挑战者',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aggressive',
    personality: 'aggressive',
    description: '锋芒毕露的辩手，喜欢直击要害，用犀利的反问让对手措手不及。',
    specialty: '政治、法律、商业',
    winRate: 81,
    debateCount: 456,
    isOnline: false,
    addedAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'soul_004',
    name: '和事佬',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=moderate',
    personality: 'moderate',
    description: '温和折中的调解者，擅长寻找共同点，在对立中寻求平衡与共识。',
    specialty: '文化、生活、家庭',
    winRate: 65,
    debateCount: 198,
    isOnline: true,
    addedAt: '2024-02-14T15:20:00.000Z',
  },
  {
    id: 'soul_005',
    name: '脑洞王',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=creative',
    personality: 'creative',
    description: '思维跳跃的创意家，总能在辩论中提出意想不到的角度和观点。',
    specialty: '娱乐、艺术、科技前沿',
    winRate: 70,
    debateCount: 267,
    isOnline: true,
    addedAt: '2024-03-01T10:45:00.000Z',
  },
  {
    id: 'soul_006',
    name: '质疑者',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=critical',
    personality: 'critical',
    description: '批判性思维的践行者，善于发现论点漏洞，用严谨的质疑推动深度思考。',
    specialty: '科学、哲学、环境',
    winRate: 75,
    debateCount: 334,
    isOnline: false,
    addedAt: '2024-03-20T14:00:00.000Z',
  },
  {
    id: 'soul_007',
    name: '数据侠',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=data',
    personality: 'rational',
    description: '数据驱动的分析达人，每个观点都有统计数据支撑，用事实说话。',
    specialty: '经济、体育、社会调查',
    winRate: 83,
    debateCount: 412,
    isOnline: true,
    addedAt: '2024-04-05T11:30:00.000Z',
  },
  {
    id: 'soul_008',
    name: '哲学家',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=philo',
    personality: 'emotional',
    description: '深邃思考的思想者，喜欢从本质和根源探讨问题，追求真理与智慧。',
    specialty: '政治、伦理、文化',
    winRate: 69,
    debateCount: 223,
    isOnline: true,
    addedAt: '2024-04-18T16:15:00.000Z',
  },
];

/** 根据ID获取Soul */
export const getSoulById = (id: string): Soul | undefined => 
  mockSouls.find(soul => soul.id === id);

/** 获取所有Soul好友 */
export const getAllSouls = (): Soul[] => mockSouls;

/** 获取在线的Soul */
export const getOnlineSouls = (): Soul[] => 
  mockSouls.filter(soul => soul.isOnline);

/** 按性格类型获取Soul */
export const getSoulsByPersonality = (personality: Soul['personality']): Soul[] => 
  mockSouls.filter(soul => soul.personality === personality);

/** 获取推荐的Soul（按胜率排序） */
export const getRecommendedSouls = (limit: number = 3): Soul[] => 
  [...mockSouls]
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
