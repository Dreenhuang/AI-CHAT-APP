/**
 * Dashboard 主仪表盘页面
 *
 * 功能说明：
 * 这是管理员后台的核心数据可视化页面。
 * 整合了统计卡片、趋势图表、分布图、操作日志等所有模块。
 *
 * 页面布局（Bento Grid风格）：
 * ┌─────────────────────────────────────────────────────┐
 * │ 页面标题 + 时间戳                                   │
 * ├──────────┬──────────┬──────────┬─────────────────────┤
 * │ StatCard │ StatCard │ StatCard │ StatCard            │
 * │ 总用户数  │ 总议题数  │ 今日新增  │ 活跃率              │
 * ├──────────┴──────────┴──────────┴─────────────────────┤
 * │ 用户趋势图 (60%)           │ 议题分布图 (40%)       │
 * ├────────────────────────────┴────────────────────────┤
 * │ 最近操作日志表格                                      │
 * └─────────────────────────────────────────────────────┘
 *
 * 技术特性：
 * - 自动从API获取真实数据，失败时使用Mock数据演示
 * - 响应式布局：移动端单列，平板端双列，桌面端多列
 * - 加载状态：Skeleton骨架屏动画
 * - 错误处理：显示重试按钮
 * - 数据自动刷新（5分钟间隔）
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle, LayoutDashboard, Clock } from 'lucide-react';

// 导入子组件
import StatCard from '../components/StatCard';
import UserTrendChart from '../components/UserTrendChart';
import TopicDistributionChart from '../components/TopicDistributionChart';
import AuditLogTable from '../components/AuditLogTable';

// 导入API服务和Mock数据
import dashboardApi, {
  mockStats,
  mockUserTrend,
  mockTopicDistribution,
  mockAuditLogs,
  DashboardStats,
} from '../services/dashboardService';

// ============ 类型定义 ============

interface DashboardData {
  stats: DashboardStats | null;
  trendData: Array<{ date: string; newUsers: number; activeUsers: number }>;
  topicDistribution: Array<{ name: string; value: number; color: string }>;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    adminName: string;
    actionType: string;
    target: string;
    result: 'success' | 'failed';
    details: string;
  }>;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ============ 主组件 ============

const Dashboard: React.FC = () => {
  // 状态管理
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [data, setData] = useState<DashboardData>({
    stats: null,
    trendData: [],
    topicDistribution: [],
    auditLogs: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 获取所有Dashboard数据的异步函数
   */
  const fetchDashboardData = useCallback(async (useMockOnError: boolean = true) => {
    try {
      setLoadingState('loading');
      setError(null);

      // 并行请求所有API接口
      const [statsRes, trendRes, distributionRes, logsRes] =
        await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getUserTrend({ period: '7d' }),
          dashboardApi.getTopicDistribution(),
          dashboardApi.getRecentLogs(10),
        ]);

      // 处理统计数据
      let stats: DashboardStats | null = null;
      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        stats = statsRes.value.data;
      } else if (useMockOnError) {
        console.warn('[Dashboard] Stats API failed, using mock data');
        stats = mockStats;
      }

      // 处理趋势数据
      let trendData: Array<{ date: string; newUsers: number; activeUsers: number }> = [];
      if (trendRes.status === 'fulfilled' && trendRes.value.success && trendRes.value.data) {
        const trendResult = trendRes.value.data;
        trendData = trendResult.dates.map((date, index) => ({
          date,
          newUsers: trendResult.newUsers[index] || 0,
          activeUsers: trendResult.activeUsers[index] || 0,
        }));
      } else if (useMockOnError) {
        console.warn('[Dashboard] Trend API failed, using mock data');
        trendData = mockUserTrend.dates.map((date, index) => ({
          date,
          newUsers: mockUserTrend.newUsers[index],
          activeUsers: mockUserTrend.activeUsers[index],
        }));
      }

      // 处理分布数据
      let topicDistribution: Array<{ name: string; value: number; color: string }> = [];
      if (distributionRes.status === 'fulfilled' && distributionRes.value.success && distributionRes.value.data) {
        topicDistribution = distributionRes.value.data;
      } else if (useMockOnError) {
        console.warn('[Dashboard] Distribution API failed, using mock data');
        topicDistribution = mockTopicDistribution;
      }

      // 处理审计日志
      let auditLogs: Array<{
        id: string;
        timestamp: string;
        adminName: string;
        actionType: string;
        target: string;
        result: 'success' | 'failed';
        details: string;
      }> = [];
      if (logsRes.status === 'fulfilled' && logsRes.value.success && logsRes.value.data) {
        auditLogs = logsRes.value.data;
      } else if (useMockOnError) {
        console.warn('[Dashboard] Audit logs API failed, using mock data');
        auditLogs = mockAuditLogs;
      }

      // 更新状态
      setData({ stats, trendData, topicDistribution, auditLogs });
      setLoadingState('success');
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Dashboard] Failed to fetch data:', err);
      setLoadingState('error');
      setError('数据加载失败，请检查网络连接或稍后重试');

      // 如果允许，使用Mock数据作为降级方案
      if (useMockOnError) {
        console.info('[Dashboard] Falling back to mock data for demonstration');
        setData({
          stats: mockStats,
          trendData: mockUserTrend.dates.map((date, index) => ({
            date,
            newUsers: mockUserTrend.newUsers[index],
            activeUsers: mockUserTrend.activeUsers[index],
          })),
          topicDistribution: mockTopicDistribution,
          auditLogs: mockAuditLogs,
        });
        setLoadingState('success');
        setLastUpdated(new Date());
      }
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 自动刷新定时器（5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(false); // 刷新时不强制使用Mock
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // 手动刷新处理函数
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(false);
    setIsRefreshing(false);
  };

  // ============ 渲染部分 ============

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== 页面头部 ========== */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              仪表盘总览
            </h1>
          </div>

          {/* 副标题 + 更新时间 */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>实时监控平台运营数据</span>
            {lastUpdated && (
              <>
                <span className="text-gray-300">|</span>
                <span>
                  最后更新：{lastUpdated.toLocaleTimeString('zh-CN')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 手动刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loadingState === 'loading'}
          className="inline-flex items-center gap-2 rounded-apple-sm bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>{isRefreshing ? '刷新中...' : '刷新数据'}</span>
        </button>
      </div>

      {/* ========== 错误状态显示 ========== */}
      {loadingState === 'error' && !data.stats && (
        <div className="flex flex-col items-center justify-center rounded-apple-lg border-2 border-dashed border-red-200 bg-red-50/50 py-16">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <p className="text-lg font-semibold text-red-800">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="mt-4 rounded-apple-sm bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-red-700 hover:shadow-lg"
          >
            重试加载
          </button>
        </div>
      )}

      {/* ========== 加载状态 - Skeleton骨架屏 ========== */}
      {loadingState === 'loading' && !data.stats && (
        <div className="space-y-6">
          {/* 统计卡片骨架屏 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-apple-md bg-white p-6 shadow-apple-card">
                <div className="skeleton mb-4 h-4 w-24 rounded" />
                <div className="skeleton mb-3 h-9 w-32 rounded" />
                <div className="skeleton h-5 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* 图表骨架屏 */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="col-span-3 rounded-apple-md bg-white p-6 shadow-apple-card">
              <div className="skeleton mb-4 h-6 w-48 rounded" />
              <div className="skeleton h-[320px] w-full rounded" />
            </div>
            <div className="col-span-2 rounded-apple-md bg-white p-6 shadow-apple-card">
              <div className="skeleton mb-4 h-6 w-36 rounded" />
              <div className="skeleton h-[320px] w-full rounded" />
            </div>
          </div>

          {/* 表格骨架屏 */}
          <div className="rounded-apple-md bg-white p-6 shadow-apple-card">
            <div className="skeleton mb-4 h-6 w-40 rounded" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== 主内容区域（数据加载完成后） ========== */}
      {(loadingState === 'success' || data.stats) && (
        <>
          {/* 第一行：4个统计指标卡片 */}
          {data.stats && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* 卡片1：总用户数 */}
              <StatCard
                title="总用户数"
                value={data.stats.totalUsers}
                change={12.5}
                trend="up"
                icon="Users"
                color="#007AFF"
              />

              {/* 卡片2：总议题数 */}
              <StatCard
                title="总议题数"
                value={data.stats.totalTopics}
                change={8.3}
                trend="up"
                icon="FileText"
                color="#34C759"
              />

              {/* 卡片3：今日新增用户 */}
              <StatCard
                title="今日新增"
                value={data.stats.todayNewUsers}
                change={15.2}
                trend="up"
                icon="TrendingUp"
                color="#FF9500"
              />

              {/* 卡片4：活跃率 */}
              <StatCard
                title="活跃率"
                value={`${data.stats.activeRate}%`}
                change={-2.1}
                trend="down"
                icon="Activity"
                color="#AF52DE"
              />
            </div>
          )}

          {/* 第二行：图表区域（左侧趋势图60% + 右侧分布图40%） */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* 左侧：用户增长趋势图（占3列 = 60%） */}
            <div className="col-span-1 lg:col-span-3">
              {data.trendData.length > 0 && (
                <UserTrendChart data={data.trendData} period="近7天" />
              )}
            </div>

            {/* 右侧：议题类型分布图（占2列 = 40%） */}
            <div className="col-span-1 lg:col-span-2">
              {data.topicDistribution.length > 0 && (
                <TopicDistributionChart data={data.topicDistribution} />
              )}
            </div>
          </div>

          {/* 第三行：最近操作日志表格 */}
          {data.auditLogs.length > 0 && (
            <AuditLogTable logs={data.auditLogs} maxRows={10} />
          )}
        </>
      )}

      {/* ========== 底部提示信息 ========== */}
      <div className="mt-6 rounded-apple-md bg-blue-50/70 px-4 py-3 text-center text-xs text-blue-600/80">
        <p>
          💡 提示：数据每5分钟自动刷新。如需手动获取最新数据，请点击右上角「刷新数据」按钮。
          当前使用{' '}
          <span className="font-semibold">Mock演示数据</span> 进行展示。
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
