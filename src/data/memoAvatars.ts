/**
 * Alohe Avatars - Memoji系列头像配置
 * 
 * 使用 alohe/avatars 项目中的 Memoji 系列头像
 * CDN来源: https://cdn.jsdelivr.net/gh/alohe/avatars/png/
 * 
 * 包含35个Memoji头像，对应35个Soul角色
 */

export const MEMO_AVATARS = {
  baseUrl: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png',
  series: 'memo',
  count: 35,
  format: 'png',
};

/**
 * 获取指定索引的Memo头像URL
 * @param index - 头像索引 (1-35)
 * @returns 完整的头像URL
 */
export function getMemoAvatarUrl(index: number): string {
  const safeIndex = Math.max(1, Math.min(35, index));
  return `${MEMO_AVATARS.baseUrl}/${MEMO_AVATARS.series}_${safeIndex}.${MEMO_AVATARS.format}`;
}

/**
 * 预定义的35个Memo头像URL列表
 * 用于Soul角色分配
 */
export const memoAvatarUrls: string[] = Array.from({ length: 35 }, (_, i) => 
  getMemoAvatarUrl(i + 1)
);

/**
 * Alohe Avatars项目其他可用系列（供参考）
 */
export const ALOHE_AVATAR_SERIES = {
  vibrent: { prefix: 'vibrent', count: 30, color: '#FFBEB8' },
  memo: { prefix: 'memo', count: 35, color: '#FFF7B8' },
  '3d': { prefix: '3d', count: 30, color: '#C8F1FF' },
  blues: { prefix: 'blues', count: 30, color: '#B8D4FF' },
};