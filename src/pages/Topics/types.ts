/**
 * 议题管理页面 - 类型定义
 *
 * Apple Design Style CRUD Interface
 * 定义议题管理所需的所有 TypeScript 类型接口
 */

// ============ 议题状态枚举 ============

/** 议题状态 */
export type TopicStatus = 'active' | 'completed' | 'paused' | 'pending' | 'archived';

/** 议题类型 */
export type TopicType = 'debate' | 'vote' | 'discussion' | 'qa';

// ============ 议题数据结构 ============

/** 议题实体（扩展版，用于管理页面） */
export interface TopicItem {
  /** 唯一标识 */
  id: string;
  /** 显示编号（如 001、002） */
  displayId: string;
  /** 议题标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 状态：进行中/已完成/已暂停/待审核/已归档 */
  status: TopicStatus;
  /** 类型：辩论/投票/讨论/问答 */
  type: TopicType;
  /** 标签列表 */
  tags: string[];
  /** 封面图片 URL */
  coverImage?: string;
  /** 热度值 0-100 */
  hotness: number;
  /** 创建时间 ISO 格式 */
  createdAt: string;
  /** 更新时间 ISO 格式 */
  updatedAt: string;
  /** 参与人数 */
  participantCount?: number;
  /** 辩论回合数 */
  debateCount?: number;
}

// ============ 筛选参数 ============

/** 列表查询参数 */
export interface TopicQueryParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 搜索关键词 */
  search?: string;
  /** 状态筛选 */
  status?: TopicStatus | 'all';
  /** 类型筛选 */
  type?: TopicType | 'all';
  /** 排序字段 */
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'hotness';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 开始日期 */
  dateFrom?: string;
  /** 结束日期 */
  dateTo?: string;
}

// ============ 表单数据 ============

/** 新建/编辑表单数据 */
export interface TopicFormData {
  /** 标题（必填） */
  title: string;
  /** 描述 */
  description: string;
  /** 类型（必填） */
  type: TopicType;
  /** 状态 */
  status: TopicStatus;
  /** 标签列表 */
  tags: string[];
  /** 封面图片 */
  coverImage?: string | File;
}

// ============ 分页数据 ============

/** 分页信息 */
export interface PaginationInfo {
  /** 当前页 */
  current: number;
  /** 总页数 */
  total: number;
  /** 每页条数 */
  pageSize: number;
  /** 总记录数 */
  totalItems: number;
}

// ============ API 响应类型 ============

/** 列表 API 响应 */
export interface TopicListResponse {
  /** 数据列表 */
  items: TopicItem[];
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 统计摘要（可选） */
  summary?: {
    totalActive: number;
    totalCompleted: number;
    totalPaused: number;
    totalPending: number;
  };
}

// ============ 组件 Props 类型 ============

/** 表格操作回调 */
export interface TableCallbacks {
  /** 编辑 */
  onEdit: (item: TopicItem) => void;
  /** 删除 */
  onDelete: (item: TopicItem) => void;
  /** 查看详情 */
  onViewDetail: (item: TopicItem) => void;
  /** 选择变化 */
  onSelectionChange: (selectedIds: string[]) => void;
}

/** 筛选器回调 */
export interface FilterCallbacks {
  /** 筛选条件变化 */
  onFilterChange: (params: Partial<TopicQueryParams>) => void;
  /** 重置筛选 */
  onReset: () => void;
}

/** 表单模态框回调 */
export interface FormModalCallbacks {
  /** 保存 */
  onSave: (data: TopicFormData) => Promise<void>;
  /** 取消 */
  onCancel: () => void;
}
