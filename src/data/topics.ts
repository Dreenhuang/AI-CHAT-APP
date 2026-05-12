/**
 * 200个预设辩论议题 - Mock数据
 * 
 * 分类说明：
 * - tech (科技): 20个
 * - education (教育): 20个  
 * - social (社会): 20个
 * - lifestyle (生活): 20个
 * - entertainment (娱乐): 20个
 * - sports (体育): 20个
 * - politics (政治): 20个
 * - economy (经济): 20个
 * - culture (文化): 20个
 * - environment (环境): 20个
 */

import { Topic, TopicCategory } from '../types';

// ============ 工具函数 ============

/** 生成唯一ID */
const generateId = (category: string, index: number): string => 
  `topic_${category}_${String(index).padStart(3, '0')}`;

/** 生成时间戳（过去30天内随机） */
const randomTimestamp = (): string => {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
  return new Date(randomTime).toISOString();
};

/** 创建议题 */
const createTopic = (
  category: TopicCategory,
  index: number,
  title: string,
  description: string,
  hot: number
): Topic => ({
  id: generateId(category, index),
  title,
  description,
  category,
  hot,
  createdAt: randomTimestamp(),
});

// ============ 科技类议题 (1-20) ============

const techTopics: Topic[] = [
  createTopic('tech', 1, '人工智能是否会取代人类工作？', '随着AI技术的快速发展，许多传统岗位面临被自动化替代的风险。探讨AI对就业市场的长期影响。', 95),
  createTopic('tech', 2, 'ChatGPT等大模型是否应该被限制使用？', '生成式AI可能产生错误信息、偏见内容。讨论是否需要立法监管AI的使用边界。', 88),
  createTopic('tech', 3, '自动驾驶汽车是否应该全面普及？', '自动驾驶技术日趋成熟，但安全性、伦理问题仍存争议。讨论其普及的时机和条件。', 82),
  createTopic('tech', 4, '元宇宙是未来趋势还是资本泡沫？', 'Meta等巨头大力投入元宇宙，但用户增长缓慢。分析元宇宙的真实前景。', 76),
  createTopic('tech', 5, '人脸识别技术是否侵犯隐私权？', '公共场合广泛部署人脸识别系统，引发隐私保护与公共安全的平衡讨论。', 91),
  createTopic('tech', 6, '区块链技术除了加密货币还有实际应用吗？', '探索区块链在供应链、医疗、版权保护等领域的真实应用价值。', 65),
  createTopic('tech', 7, '5G网络是否真的改变了我们的生活？', '5G商用已数年，评估其对普通消费者日常生活的实际影响。', 72),
  createTopic('tech', 8, '程序员会被AI编程工具取代吗？', 'GitHub Copilot等AI辅助编程工具日益强大，讨论程序员的职业前景。', 89),
  createTopic('tech', 9, '社交媒体算法是否应该更加透明？', '推荐算法影响信息获取和舆论形成，讨论平台应承担的责任。', 85),
  createTopic('tech', 10, '量子计算何时能实现商业化突破？', '量子计算研究进展迅速，但距离实际应用还有多远？', 58),
  createTopic('tech', 11, '电子游戏是否应该被视为体育运动？', '电竞已入亚运会，但社会对其"运动"属性仍有争议。', 79),
  createTopic('tech', 12, '智能手机是否让人变得更加孤独？', '虽然连接了世界，但人们面对面的交流似乎在减少。', 87),
  createTopic('tech', 13, '云游戏会取代传统游戏主机吗？', 'Google Stadia失败后，云游戏的未来走向如何？', 54),
  createTopic('tech', 14, '智能家居是否真的提高了生活质量？', '智能音箱、智能灯泡等设备普及，但用户体验参差不齐。', 68),
  createTopic('tech', 15, '无人机配送快递是否可行？', '美团、京东都在测试无人机配送，讨论其实际可行性。', 71),
  createTopic('tech', 16, 'VR/AR设备会成为下一代计算平台吗？', 'Apple Vision Pro发布后，空间计算的讨论再次升温。', 83),
  createTopic('tech', 17, '开源软件模式是否可持续？', '许多开源项目面临资金困难，探讨开源生态的未来。', 62),
  createTopic('tech', 18, '网络安全威胁是否越来越严重？', '勒索软件、数据泄露事件频发，个人和企业如何应对？', 90),
  createTopic('tech', 19, '可穿戴设备的健康监测功能可靠吗？', 'Apple Watch的心电图等功能获得认证，但其准确性如何？', 74),
  createTopic('tech', 20, '科技公司的垄断行为应该如何规制？', '谷歌、苹果等巨头面临反垄断调查，讨论数字经济的公平竞争。', 93),
];

// ============ 教育类议题 (21-40) ============

const educationTopics: Topic[] = [
  createTopic('education', 1, '在线教育能否完全取代线下课堂？', '疫情推动了在线教育发展，但其效果与传统课堂相比如何？', 86),
  createTopic('education', 2, '高考制度是否需要改革？', '一考定终身的模式备受争议，探讨更科学的选拔方式。', 94),
  createTopic('education', 3, '大学生就业难是教育问题还是经济问题？', '毕业生人数创新高，但就业市场岗位有限，根源何在？', 92),
  createTopic('education', 4, '应试教育与素质教育能否兼得？', '减负政策下，如何在保证学业成绩的同时培养综合素质？', 88),
  createTopic('education', 5, '研究生扩招是否稀释了学历价值？', '硕士博士数量激增，学历贬值现象引发关注。', 81),
  createTopic('education', 6, '私立学校与公立学校哪个更优质？', '择校热背后，两种办学模式的优劣对比。', 75),
  createTopic('education', 7, '教师待遇是否应该大幅提高？', '教师工资水平影响教育质量，如何建立合理的薪酬体系？', 84),
  createTopic('education', 8, '英语在中国教育中的地位是否过高？', '取消英语主科地位的呼声不断，英语学习的必要性再思考。', 78),
  createTopic('education', 9, '职业教育是否被社会歧视？', '技能型人才缺口巨大，但职业教育的社会认可度偏低。', 80),
  createTopic('education', 10, '家长过度参与孩子教育的利与弊', '鸡娃现象普遍，家长焦虑如何影响孩子的成长？', 87),
  createTopic('education', 11, '大学专业设置是否应该紧跟市场需求？', '热门专业扎堆，冷门专业无人问津，如何平衡？', 73),
  createTopic('education', 12, '留学回国人员是否还具备竞争优势？', '海归光环褪去，留学的投资回报率如何？', 69),
  createTopic('education', 13, '学前教育（幼儿园）应该纳入义务教育吗？', '入园贵、入园难问题突出，学前教育的定位讨论。', 77),
  createTopic('education', 14, '课外辅导班是否应该彻底取缔？', '双减政策实施后，地下补习班依然存在，如何根治？', 91),
  createTopic('education', 15, '大学排名是否能真实反映学校实力？', 'QS、THE等排名影响力巨大，但其评价标准是否科学？', 66),
  createTopic('education', 16, '农村教育资源分配不均如何解决？', '城乡教育差距明显，如何推进教育公平？', 89),
  createTopic('education', 17, '终身学习理念如何真正落地？', '知识更新加速，成年人如何保持持续学习的能力？', 64),
  createTopic('education', 18, '艺术教育是否应该成为必修课？', '美育的重要性日益凸显，但在升学压力下难以落实。', 70),
  createTopic('education', 19, '学术造假现象为何屡禁不止？', '论文抄袭、数据造假事件频发，学术诚信如何保障？', 85),
  createTopic('education', 20, '教育APP是否帮助还是干扰了学习？', '各类学习工具泛滥，学生是否过度依赖技术？', 72),
];

// ============ 社会类议题 (41-60) ============

const socialTopics: Topic[] = [
  createTopic('social', 1, '年轻人躺平现象是社会问题还是个人选择？', '部分年轻人选择低欲望生活方式，背后的深层原因是什么？', 96),
  createTopic('social', 2, '35岁职场危机是否存在？', '年龄歧视在招聘中普遍存在，中年人的职业困境。', 93),
  createTopic('social', 3, '结婚率持续下降的原因及影响', '年轻人不愿结婚已成趋势，对社会结构的影响。', 90),
  createTopic('social', 4, '生育率走低该如何应对？', '少子化问题严峻，鼓励生育政策是否有效？', 94),
  createTopic('social', 5, '房价高企是否透支了年轻人的未来？', '买房压力影响消费和生活质量，房地产泡沫风险。', 95),
  createTopic('social', 6, '内卷文化是否有积极意义？', '竞争激烈导致过度努力，但也推动进步。如何看待内卷？', 88),
  createTopic('social', 7, '社交恐惧症是否被过度标签化？', '"社恐"成为流行词，真正的心理问题被娱乐化。', 76),
  createTopic('social', 8, '宠物是否应该被视为家庭成员？', '养宠人群扩大，宠物权益和社会责任讨论。', 74),
  createTopic('social', 9, '独居生活是否将成为主流？', '单身经济崛起，一人食、一人游成为新趋势。', 82),
  createTopic('social', 10, '志愿服务是否应该与利益挂钩？', '志愿时长的功利化使用，公益的本质是什么？', 68),
  createTopic('social', 11, '老年人数字鸿沟如何弥合？', '智能化时代，不会用手机的老人寸步难行。', 86),
  createTopic('social', 12, '社区治理中居民参与度为何低下？', '小区事务无人关心，公民意识如何培养？', 65),
  createTopic('social', 13, '网红经济对社会价值观的影响', '直播带货、短视频塑造了怎样的成功标准？', 83),
  createTopic('social', 14, '性别平等在中国取得了多大进展？', '职场歧视、家庭分工等问题依然存在。', 87),
  createTopic('social', 15, '留守儿童问题如何根本解决？', '城乡二元结构下的儿童教育和成长问题。', 91),
  createTopic('social', 16, '医患关系紧张的根本原因是什么？', '暴力伤医事件时有发生，重建信任的路径。', 89),
  createTopic('social', 17, '慈善机构的公信力如何重建？', '郭美美事件阴影未散，公众对慈善的信任危机。', 78),
  createTopic('social', 18, '城市流浪动物应该如何处理？', '捕杀、收容、TNR（抓捕-绝育-放归）各有利弊。', 80),
  createTopic('social', 19, '加班文化是否应该被法律禁止？', '996、007工作制引发广泛争议，工作与生活的平衡。', 92),
  createTopic('social', 20, '网络暴力是否应该入刑？', '键盘侠肆虐，受害者身心受创，法律如何介入？', 97),
];

// ============ 生活类议题 (61-80) ============

const lifestyleTopics: Topic[] = [
  createTopic('lifestyle', 1, '极简主义生活方式是否值得提倡？', '断舍离流行，减少物质拥有是否带来更多幸福？', 75),
  createTopic('lifestyle', 2, '外卖文化的兴起是好是坏？', '方便了生活，但也产生了大量垃圾和健康隐患。', 82),
  createTopic('lifestyle', 3, '健身热潮是否变成了一种焦虑营销？', '身材焦虑驱动健身消费，运动的本质被遗忘了吗？', 79),
  createTopic('lifestyle', 4, '咖啡文化在中国的本土化之路', '从星巴克到瑞幸，中国咖啡市场的独特发展。', 67),
  createTopic('lifestyle', 5, '租房还是买房更划算？', '高房价背景下，年轻人的居住选择困境。', 93),
  createTopic('lifestyle', 6, '预制菜是否应该进入家庭餐桌？', '便捷但可能不健康，预制菜的食品安全争议。', 84),
  createTopic('lifestyle', 7, '旅游打卡文化是否失去了旅行的意义？', '为了拍照而旅行，体验感让位于社交媒体展示。', 77),
  createTopic('lifestyle', 8, '养宠物的成本是否越来越高？', '宠物医疗、食品价格飙升，养宠负担加重。', 71),
  createTopic('lifestyle', 9, '二手交易平台的诚信问题', '闲鱼、转转上的骗局频发，C2C交易的信任机制。', 73),
  createTopic('lifestyle', 10, '夜宵文化对健康的影响', '烧烤、小龙虾等深夜美食，享受与健康的权衡。', 69),
  createTopic('lifestyle', 11, '共享经济是否已经退潮？', 'ofo押金未退，共享充电宝涨价，共享模式的困境。', 76),
  createTopic('lifestyle', 12, '居家办公是否应该常态化？', '疫情改变工作方式，远程办公的优缺点。', 85),
  createTopic('lifestyle', 13, '奶茶店为何开遍大街小巷？', '新茶饮市场竞争激烈，消费者的选择困惑。', 70),
  createTopic('lifestyle', 14, '断糖饮食是否科学？', '抗糖化概念流行，但糖真的是健康杀手吗？', 72),
  createTopic('lifestyle', 15, '露营为何突然火爆？', '精致露营成为中产新宠，户外休闲的新趋势。', 68),
  createTopic('lifestyle', 16, '家政服务行业的规范化问题', '保姆虐待儿童事件引发关注，行业监管亟待加强。', 88),
  createTopic('lifestyle', 17, '个人理财是否应该从年轻时开始？', '基金、股票入门，年轻人的财商教育。', 81),
  createTopic('lifestyle', 18, '睡眠经济是否在贩卖焦虑？', '助眠产品层出不穷，失眠问题的商业化解法。', 74),
  createTopic('lifestyle', 19, '城市骑行是否只是跟风？', '自行车销量暴涨，骑行是生活方式还是一时热度？', 66),
  createTopic('lifestyle', 20, '极寒/极热天气下的生活挑战', '气候变化影响日常生活，适应极端天气的策略。', 63),
];

// ============ 娱乐类议题 (81-100) ============

const entertainmentTopics: Topic[] = [
  createTopic('entertainment', 1, '短视频是否正在摧毁人们的注意力？', '抖音、快手占据大量时间，深度阅读能力下降。', 91),
  createTopic('entertainment', 2, '国产电影的质量是否在提升？', '《流浪地球》《长津湖》等大片涌现，国产片崛起？', 83),
  createTopic('entertainment', 3, '偶像选秀节目是否应该被叫停？', '饭圈乱象丛生，选秀节目的负面影响。', 86),
  createTopic('entertainment', 4, '综艺节目是否越来越同质化？', '剧本痕迹重、套路多，原创性缺失的问题。', 78),
  createTopic('entertainment', 5, '流媒体平台会取代电影院吗？', 'Netflix、爱奇艺等冲击传统院线，电影放映的未来。', 80),
  createTopic('entertainment', 6, '明星天价片酬是否合理？', '限薪令效果如何，演艺人员的收入分配。', 89),
  createTopic('entertainment', 7, '粉丝文化是否变得过于极端？', '控评、互撕、打榜，饭圈的负面效应。', 92),
  createTopic('entertainment', 8, '游戏氪金机制是否应该受限？', '抽卡、皮肤消费引发未成年人沉迷问题。', 87),
  createTopic('entertainment', 9, '脱口秀的边界在哪里？', '笑果文化事件引发讨论，喜剧创作的尺度。', 94),
  createTopic('entertainment', 10, '音乐版权保护是否过度？', '歌曲收费听、翻唱侵权，版权与传播的平衡。', 75),
  createTopic('entertainment', 11, '真人秀是否还在"真"？', '脚本化严重，真人秀的真实性存疑。', 72),
  createTopic('entertainment', 12, '韩流文化对中国青少年的影响', 'K-pop、韩剧风靡，文化输入与文化自信。', 77),
  createTopic('entertainment', 13, '动漫是否应该只面向未成年人？', '成人向动漫市场增长，动漫受众的全龄化。', 69),
  createTopic('entertainment', 14, '网红景点是否值得去？', '滤镜下的美景vs现实，打卡踩雷经历。', 65),
  createTopic('entertainment', 15, '演唱会门票黄牛问题如何解决？', '一票难求，抢票软件与黄牛的博弈。', 88),
  createTopic('entertainment', 16, '网文改编影视剧的成功率为何不高？', 'IP开发热潮，但改编剧口碑两极分化。', 73),
  createTopic('entertainment', 17, '虚拟偶像会取代真人明星吗？', '洛天依、A-SOUL等虚拟偶像的商业模式。', 62),
  createTopic('entertainment', 18, '弹幕文化是否影响了观影体验？', 'B站弹幕特色，互动与干扰的界限。', 71),
  createTopic('entertainment', 19, '综艺咖跨界演戏是否靠谱？', '演员门槛降低，流量艺人演技争议。', 84),
  createTopic('entertainment', 20, '密室逃脱、剧本杀为何受欢迎？', '沉浸式娱乐的兴起，年轻人的社交新方式。', 67),
];

// ============ 体育类议题 (101-120) ============

const sportsTopics: Topic[] = [
  createTopic('sports', 1, '中国足球为何始终无法崛起？', '归化球员、联赛改革、青训体系，问题出在哪里？', 95),
  createTopic('sports', 2, '电子竞技是否应该加入奥运会？', '电竞入亚运成功，奥运会的态度如何？', 82),
  createTopic('sports', 3, '运动员的商业价值是否被过度开发？', '代言、直播、综艺，训练与商业活动的平衡。', 76),
  createTopic('sports', 4, '兴奋剂检测是否足够严格？', '孙杨事件后续，反兴奋剂斗争的复杂性。', 89),
  createTopic('sports', 5, '群众体育设施是否充足？', '健身房费用高、公园器材老旧，全民健身的硬件短板。', 80),
  createTopic('sports', 6, 'NBA在中国市场的前景如何？', '莫雷事件后的恢复，中美体育文化交流。', 73),
  createTopic('sports', 7, '马拉松赛事是否过多过滥？', '各地争办马拉松，参赛体验和安全问题。', 68),
  createTopic('sports', 8, '青少年体育培训是否太贵？', '游泳、网球、冰球等项目的费用门槛。', 85),
  createTopic('sports', 9, '体育明星的榜样作用是否在减弱？', '丑闻频发，运动员形象管理的重要性。', 77),
  createTopic('sports', 10, '冬奥会对冰雪运动的带动作用', '谷爱凌、苏翊鸣走红，冰雪产业发展的机遇。', 79),
  createTopic('sports', 11, '中超联赛的观众为何越来越少？', '比赛质量下降、票价不合理、观赛体验差。', 86),
  createTopic('sports', 12, '校园体育是否应该更加重视？', '学生体质下降，体育课被占用的现象。', 90),
  createTopic('sports', 13, '女性运动员的待遇是否公平？', '同工不同酬，媒体曝光度差异等问题。', 83),
  createTopic('sports', 14, '极限运动的安全性问题', '翼装飞行、徒手攀岩等高风险运动的规范。', 71),
  createTopic('sports', 15, '体育博彩是否应该合法化？', '欧洲成熟模式vs国内禁止政策。', 64),
  createTopic('sports', 16, '奥运会举办成本是否太高？', '里约、东京亏损严重，奥运模式的可持续性。', 74),
  createTopic('sports', 17, '乒乓球是否依然是国球？', '关注度下降，年轻一代对乒乓球的兴趣。', 69),
  createTopic('sports', 18, '体育转播权的价格战', '英超、NBA版权费天价，谁为高价买单？', 72),
  createTopic('sports', 19, '退役运动员的转型困境', '除了教练和官员，运动员还能做什么？', 87),
  createTopic('sports', 20, '健身房的预付卡陷阱', '跑路频发，消费者权益如何保障？', 93),
];

// ============ 政治类议题 (121-140) ============

const politicsTopics: Topic[] = [
  createTopic('politics', 1, '基层治理能力如何提升？', '社区工作人员负担重，执行力不足的问题。', 84),
  createTopic('politics', 2, '公务员考试热度为何持续不减？', '考公大军浩荡，稳定工作的吸引力。', 91),
  createTopic('politics', 3, '政府信息公开的程度是否足够？', '申请公开流程复杂，知情权的保障。', 78),
  createTopic('politics', 4, '乡村振兴的关键在哪里？', '人才流失、产业薄弱，乡村发展难题。', 86),
  createTopic('politics', 5, '城市交通拥堵如何有效治理？', '限号、限购、地铁建设，各种手段的效果。', 88),
  createTopic('politics', 6, '医疗保障体系的公平性', '异地就医、医保报销，看病难看病贵。', 92),
  createTopic('politics', 7, '住房保障政策的有效性', '公租房、共有产权房，能否解决低收入群体住房问题？', 89),
  createTopic('politics', 8, '环境保护与经济发展的平衡', '碳达峰碳中和目标，绿色转型的代价。', 85),
  createTopic('politics', 9, '司法公正如何更好地实现？', '冤假错案纠正，律师权利保障。', 87),
  createTopic('politics', 10, '反腐倡廉的成效与挑战', '打虎拍蝇不停步，预防腐败的长效机制。', 90),
  createTopic('politics', 11, '户籍制度改革的难点', '落户限制放宽，但公共服务配套滞后。', 82),
  createTopic('politics', 12, '老龄化社会的养老保障', '养老金缺口，居家养老vs机构养老。', 94),
  createTopic('politics', 13, '粮食安全问题如何确保？', '耕地红线、种子技术、粮食储备。', 81),
  createTopic('politics', 14, '能源安全与新能源发展', '石油依赖、光伏风电、储能技术。', 76),
  createTopic('politics', 15, '国家安全概念的泛化', '数据安全、生物安全等新领域的安全挑战。', 79),
  createTopic('politics', 16, '地方债务风险的防控', '城投债、隐性债务，金融系统性风险。', 83),
  createTopic('politics', 17, '两岸关系的未来发展', '和平统一vs武力统一，台湾问题的走向。', 96),
  createTopic('politics', 18, '国际话语权的提升策略', '讲好中国故事，对外传播的效果。', 73),
  createTopic('politics', 19, '应急管理体系的建设', '自然灾害、公共卫生事件的响应能力。', 80),
  createTopic('politics', 20, '基层减负的实际效果', '形式主义整治，为基层干部松绑。', 85),
];

// ============ 经济类议题 (141-160) ============

const economyTopics: Topic[] = [
  createTopic('economy', 1, '中国经济增速放缓的原因及对策', '从高速增长转向高质量发展，阵痛与机遇。', 93),
  createTopic('economy', 2, '通货膨胀是否会影响普通人生活？', '物价上涨，购买力下降，如何保值增值？', 87),
  createTopic('economy', 3, '股市是否适合普通投资者？', '七亏二平一赚，散户的投资困境。', 84),
  createTopic('economy', 4, '房地产市场是否已经见底？', '房企暴雷、房价下跌，楼市拐点来了吗？', 95),
  createTopic('economy', 5, '数字货币的未来前景', '央行数字货币、比特币、稳定币的发展方向。', 78),
  createTopic('economy', 6, '平台经济反垄断的成效', '阿里、美团被罚后，市场竞争格局的变化。', 82),
  createTopic('economy', 7, '中小企业融资难如何破解？', '银行贷款门槛高，民间借贷风险大。', 89),
  createTopic('economy', 8, '消费降级还是消费升级？', '拼多多崛起vs奢侈品销售增长，消费趋势判断。', 86),
  createTopic('economy', 9, '人民币国际化进程如何？', '跨境支付、外汇储备、汇率波动。', 75),
  createTopic('economy', 10, '灵活就业者的社会保障', '外卖骑手、网约车司机，零工经济的权益保护。', 91),
  createTopic('economy', 11, '共同富裕的实现路径', '三次分配、税收调节、区域协调发展。', 88),
  createTopic('economy', 12, '新能源汽车产业的补贴退坡影响', '特斯拉降价、国补取消，市场竞争加剧。', 83),
  createTopic('economy', 13, '银行业利率下行的影响', '存款利息减少，贷款成本降低，储户怎么办？', 80),
  createTopic('economy', 14, '跨境电商的发展机遇与挑战', 'Shein、Temu出海，中国制造的新渠道。', 76),
  createTopic('economy', 15, '私募基金的监管问题', '爆雷事件频发，投资者的风险防范。', 72),
  createTopic('economy', 16, '供应链安全的战略意义', '芯片断供教训，产业链自主可控。', 90),
  createTopic('economy', 17, '共享员工模式是否可行？', '疫情期间的创新，人力资源的灵活配置。', 68),
  createTopic('economy', 18, 'ESG投资的实质与泡沫', '企业社会责任投资，是趋势还是噱头？', 70),
  createTopic('economy', 19, '县域经济的发展潜力', '下沉市场消费升级，县城青年的消费力。', 74),
  createTopic('economy', 20, '全球经济衰退的风险', '战争、通胀、债务危机，世界经济前景。', 92),
];

// ============ 文化类议题 (161-180) ============

const cultureTopics: Topic[] = [
  createTopic('culture', 1, '传统文化的传承与创新', '汉服热、国潮兴起，传统文化复兴的路径。', 85),
  createTopic('culture', 2, '方言的保护与普通话推广', '方言消失加速，语言多样性的保留。', 79),
  createTopic('culture', 3, '博物馆热的背后', '文创产品火爆，公众文化需求的提升。', 76),
  createTopic('culture', 4, '网络小说的文学价值', '网文IP影视化，网络文学的正名之路。', 73),
  createTopic('culture', 5, '节日习俗的现代演变', '春节年味淡了，传统节日的当代诠释。', 81),
  createTopic('culture', 6, '茶文化与咖啡文化的碰撞', '新式茶饮崛起，东西方饮品文化的融合。', 69),
  createTopic('culture', 7, '非遗技艺的生存困境', '老手艺无人继承，非遗保护的出路。', 83),
  createTopic('culture', 8, '地域文化差异的魅力', '南北差异、东西部差异，多元文化的价值。', 72),
  createTopic('culture', 9, '美食文化的输出能力', '中餐海外传播，软实力的体现。', 67),
  createTopic('culture', 10, '古典音乐的普及难题', '高雅艺术小众化，如何吸引年轻观众？', 65),
  createTopic('culture', 11, '建筑遗产的保护与开发', '古城改造、历史街区，保护与利用的平衡。', 86),
  createTopic('culture', 12, '读书习惯的改变', '电子书vs纸质书，碎片化阅读vs深度阅读。', 88),
  createTopic('culture', 13, '婚礼习俗的变迁', '天价彩礼、简约婚礼，婚俗改革的呼声。', 90),
  createTopic('culture', 14, '姓名文化的多样性', '起名自由、复姓复兴、四字名的出现。', 62),
  createTopic('culture', 15, '酒桌文化的利与弊', '劝酒陋习、商务宴请，饮酒文化的反思。', 84),
  createTopic('culture', 16, '生肖文化的现代意义', '本命年、星座vs生肖，传统信仰的延续。', 70),
  createTopic('culture', 17, '书法艺术的传承', '硬笔书写减少，毛笔书法的生存空间。', 74),
  createTopic('culture', 18, '民俗节日的商业化', '庙会、灯会，传统文化活动的商业化运作。', 77),
  createTopic('culture', 19, '移民文化的融合', '华侨华人、外来人口，文化认同的构建。', 68),
  createTopic('culture', 20, 'Emoji是否是一种新的语言？', '表情符号的表意功能，跨文化交流的工具。', 64),
];

// ============ 环境类议题 (181-200) ============

const environmentTopics: Topic[] = [
  createTopic('environment', 1, '全球变暖是否到了临界点？', '极端天气频发，气候变化的紧迫性。', 94),
  createTopic('environment', 2, '塑料污染的解决方案', '禁塑令、可降解材料、塑料回收。', 89),
  createTopic('environment', 3, '新能源汽车真的环保吗？', '电池生产、发电来源、全生命周期碳排放。', 85),
  createTopic('environment', 4, '垃圾分类实施的难点', '居民参与度低、后端处理能力不足。', 87),
  createTopic('environment', 5, '核电站的安全性', '福岛核污水排放，核能的利弊权衡。', 92),
  createTopic('environment', 6, '水资源短缺的应对策略', '南水北调、海水淡化、节水技术。', 83),
  createTopic('environment', 7, '空气质量的改善成果', '雾霾天数减少，蓝天保卫战的成效。', 80),
  createTopic('environment', 8, '森林砍伐与生态保护', '亚马逊雨林、植树造林，地球之肺的健康。', 86),
  createTopic('environment', 9, '海洋生态危机', '珊瑚白化、微塑料污染、过度捕捞。', 88),
  createTopic('environment', 10, '野生动物保护', '濒危物种、非法贸易、栖息地破坏。', 91),
  createTopic('environment', 11, '可持续发展理念的实践', 'ESG、循环经济、绿色生活方式。', 78),
  createTopic('environment', 12, '农业面源污染治理', '化肥农药过量使用，土壤和水体污染。', 75),
  createTopic('environment', 13, '城市热岛效应的缓解', '绿化、通风廊道、海绵城市建设。', 72),
  createTopic('environment', 14, '光污染的影响', '夜间灯光对生态系统和人类健康的危害。', 66),
  createTopic('environment', 15, '噪声污染的防治', '交通噪音、施工噪音，城市安静权。', 70),
  createTopic('environment', 16, '再生能源的发展瓶颈', '太阳能、风能的间歇性和储能问题。', 81),
  createTopic('environment', 17, '碳交易市场的有效性', '碳配额、碳税，市场化减排机制。', 74),
  createTopic('environment', 18, '环保 activism 的方式与边界', '极端环保行为vs理性倡导。', 77),
  createTopic('environment', 19, '个人碳足迹的计算与减排', '低碳生活的具体行动和效果测量。', 69),
  createTopic('environment', 20, '后代的环境代际公平', '我们留给下一代什么样的地球？', 93),
];

// ============ 导出所有议题 ============

/** 完整的200个议题列表 */
export const allTopics: Topic[] = [
  ...techTopics,
  ...educationTopics,
  ...socialTopics,
  ...lifestyleTopics,
  ...entertainmentTopics,
  ...sportsTopics,
  ...politicsTopics,
  ...economyTopics,
  ...cultureTopics,
  ...environmentTopics,
];

/** 按分类获取议题 */
export const getTopicsByCategory = (category: TopicCategory): Topic[] => 
  allTopics.filter(topic => topic.category === category);

/** 获取热门议题（按热度排序） */
export const getHotTopics = (limit: number = 10): Topic[] => 
  [...allTopics]
    .sort((a, b) => b.hot - a.hot)
    .slice(0, limit);

/** 随机获取议题 */
export const getRandomTopics = (count: number = 5): Topic[] => {
  const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/** 搜索议题 */
export const searchTopics = (keyword: string): Topic[] => {
  const lowerKeyword = keyword.toLowerCase();
  return allTopics.filter(topic => 
    topic.title.toLowerCase().includes(lowerKeyword) ||
    topic.description.toLowerCase().includes(lowerKeyword)
  );
};

/** 获取分类统计 */
export const getCategoryStats = () => {
  const stats: Record<TopicCategory, number> = {
    tech: 0,
    education: 0,
    social: 0,
    lifestyle: 0,
    entertainment: 0,
    sports: 0,
    politics: 0,
    economy: 0,
    culture: 0,
    environment: 0,
  };
  
  allTopics.forEach(topic => {
    stats[topic.category]++;
  });
  
  return stats;
};
