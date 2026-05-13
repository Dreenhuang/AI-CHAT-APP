const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'notificationSettings.json');
const STATS_FILE = path.join(DATA_DIR, 'notificationStats.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`写入文件失败 ${filePath}:`, error.message);
    return false;
  }
}

router.get('/settings', (req, res) => {
  try {
    const { userId } = req.query;
    const allSettings = readJsonFile(SETTINGS_FILE, {});

    const settings = userId ? allSettings[userId] : null;

    res.json({
      success: true,
      data: settings || {
        enabled: true,
        hour: 9,
        minute: 0,
        soundEnabled: true,
        subscribedCategories: [],
      },
    });
  } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({ success: false, message: '获取通知设置失败' });
  }
});

router.post('/settings', (req, res) => {
  try {
    const { userId, settings } = req.body;

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId, settings',
      });
    }

    const allSettings = readJsonFile(SETTINGS_FILE, {});
    allSettings[userId] = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    writeJsonFile(SETTINGS_FILE, allSettings);

    res.json({
      success: true,
      data: allSettings[userId],
      message: '通知设置已保存',
    });
  } catch (error) {
    console.error('保存通知设置失败:', error);
    res.status(500).json({ success: false, message: '保存通知设置失败' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    const todayStr = new Date().toDateString();
    const todayRecords = (stats.records || []).filter(
      (r) => new Date(r.pushedAt).toDateString() === todayStr
    );

    const totalPushes = stats.records?.length || 0;
    const totalClicks = (stats.records || []).filter((r) => r.clicked).length;

    res.json({
      success: true,
      data: {
        totalPushes,
        todayPushes: todayRecords.length,
        totalClicks,
        clickRate: totalPushes > 0 ? Math.round((totalClicks / totalPushes) * 100) : 0,
        lastPushTime: stats.records?.[stats.records.length - 1]?.pushedAt || null,
      },
    });
  } catch (error) {
    console.error('获取推送统计失败:', error);
    res.status(500).json({ success: false, message: '获取推送统计失败' });
  }
});

router.post('/record', (req, res) => {
  try {
    const { topicId, topicTitle, userId } = req.body;

    if (!topicId || !topicTitle) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: topicId, topicTitle',
      });
    }

    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    stats.records.push({
      id: `push_${Date.now()}`,
      topicId,
      topicTitle,
      userId: userId || 'anonymous',
      pushedAt: new Date().toISOString(),
      clicked: false,
    });

    if (stats.records.length > 1000) {
      stats.records = stats.records.slice(-500);
    }

    writeJsonFile(STATS_FILE, stats);

    res.json({ success: true, message: '推送事件已记录' });
  } catch (error) {
    console.error('记录推送事件失败:', error);
    res.status(500).json({ success: false, message: '记录推送事件失败' });
  }
});

router.post('/click', (req, res) => {
  try {
    const { topicId, userId } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: topicId',
      });
    }

    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    for (let i = stats.records.length - 1; i >= 0; i--) {
      const record = stats.records[i];
      if (record.topicId === topicId && !record.clicked) {
        record.clicked = true;
        record.clickedAt = new Date().toISOString();
        break;
      }
    }

    writeJsonFile(STATS_FILE, stats);

    res.json({ success: true, message: '点击事件已记录' });
  } catch (error) {
    console.error('记录点击事件失败:', error);
    res.status(500).json({ success: false, message: '记录点击事件失败' });
  }
});

module.exports = router;
