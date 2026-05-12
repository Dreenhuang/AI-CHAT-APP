/**
 * MiniMax 图片生成器 - 批量生成卡通猫咪头像
 * 
 * 使用方式: node scripts/batch_generate_cats.js
 * 
 * 生成30张卡通猫咪头像，保存到 assets/cat-avatars/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API配置
const API_KEY = 'your_minimax_api_key_here';
const API_URL = 'https://api.minimaxi.com/v1/image_generation';

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'cat-avatars');

// 30张猫咪的prompt
const CAT_PROMPTS = [
  'Cute cartoon cat avatar, round face, big shiny eyes, pink nose, soft pastel colors, kawaii style, simple background, white and orange tabby cat, chibi art, 2D cartoon',
  'Adorable cartoon kitten, fluffy fur, smiling face, bright blue eyes, pastel pink and white colors, cute chibi style, sitting pose, simple clean background, Japanese anime style',
  'Cute grey cartoon cat, big golden eyes, round face, tiny pink nose, soft fur texture, pastel blue background, minimalist kawaii style, modern vector art',
  'White cartoon cat avatar, fluffy ears, pink cheeks, happy expression, pastel rainbow colors, cute chibi character, simple clean design, kawaii Japanese illustration',
  'Orange tabby cartoon cat, playful expression, big eyes, cute smile, soft warm colors, pastel background, kawaii style, round design, Disney inspired',
  'Black and white tuxedo cartoon cat, formal expression but cute, shiny eyes, pastel colors, minimalist style, clean design, cute mascot character',
  'Cute Siamese cartoon cat, blue eyes, elegant pose, pastel purple and cream colors, cute chibi style, big expressive eyes',
  'Scottish fold cartoon cat, folded ears, round face, golden eyes, cream and white colors, soft pastel background, adorable kawaii style',
  'Persian cartoon cat, fluffy long fur, sweet face, pink nose, pastel pink colors, elegant cute style, chibi character',
  'British Shorthair cartoon cat, round face, copper eyes, chubby cheeks, blue grey colors, pastel background, cute kawaii style',
  'Funny cartoon cat wearing sunglasses, cool pose, beach background, pastel sunset colors, playful style',
  'Sleepy cartoon cat with closed eyes, yawning expression, pastel blue sky background, cute chibi style, cozy atmosphere',
  'Surprised cartoon cat with big round eyes, raised paws, pastel yellow background, funny cute expression',
  'Angry but cute cartoon cat, puffed up fur, funny expression, pastel red and orange colors, humorous style',
  'Cute cartoon cat eating a fish, happy expression, pastel blue and orange colors, playful style',
  'Cartoon cat with a bow tie, formal elegant pose, pastel purple background, cute gentleman style',
  'Dizzy cartoon cat with spiral eyes, funny expression, pastel pink background, humorous style',
  'Cute cartoon cat with a crown, royal pose, pastel gold and purple colors, majestic but cute',
  'Hungry cartoon cat with empty bowl, sad eyes, pastel orange background',
  'Cartoon cat wearing a raincoat, happy splashing in puddles, pastel blue rain background',
  'Magical cartoon cat with wings, sparkle effects, pastel rainbow colors, dreamy fantasy style',
  'Mystic cartoon cat with stars and moon, magical aura, deep purple and blue colors',
  'Astronaut cartoon cat in space, floating pose, pastel galaxy background with stars',
  'Wizard cartoon cat with magic wand and hat, sparkle effects, pastel purple and gold colors',
  'Unicorn cartoon cat with rainbow mane, magical sparkle, pastel pink and blue colors',
  'Sailor style cartoon cat, magical girl outfit, crescent moon, pastel blue and pink colors',
  'Cute cartoon cat with flower crown, spring theme, pastel pink and green colors',
  'Rainbow cartoon cat with colorful fur patterns, pastel rainbow colors, joyful expression',
  'Moonlight cartoon cat with glowing effect, night sky background, pastel silver and blue colors',
  'Forest fairy cartoon cat with leaves and flowers, magical forest setting, pastel green and pink colors'
];

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('==========================================');
console.log('  MiniMax图片生成器 - 卡通猫咪头像 (30张)');
console.log('==========================================');
console.log(`输出目录: ${OUTPUT_DIR}`);
console.log('');

/**
 * 调用MiniMax图片生成API
 */
function generateImage(prompt, imageName) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      model: 'image-01',
      prompt: prompt,
      aspect_ratio: '1:1',
      n: 1,
      response_format: 'base64'
    };

    const data = JSON.stringify(requestBody);
    const url = new URL(API_URL);

    const requestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    console.log(`[生成中] ${imageName}...`);

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          
          if (jsonResponse.error) {
            console.error(`[错误] ${imageName}: ${jsonResponse.error.message}`);
            reject(new Error(jsonResponse.error.message));
            return;
          }

          if (jsonResponse.data && jsonResponse.data.image_base64 && jsonResponse.data.image_base64[0]) {
            const base64Data = jsonResponse.data.image_base64[0];
            const filePath = path.join(OUTPUT_DIR, `${imageName}.png`);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            console.log(`[成功] ${imageName} -> ${filePath}`);
            resolve(filePath);
          } else {
            console.log(`[响应] ${imageName}:`, JSON.stringify(jsonResponse).substring(0, 300));
            reject(new Error('未找到图片数据'));
          }
        } catch (parseError) {
          console.error(`[解析错误] ${imageName}:`, parseError.message);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[请求错误] ${imageName}:`, error.message);
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('API请求超时 (60秒)'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 主函数：批量生成图片
 */
async function main() {
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < CAT_PROMPTS.length; i++) {
    const imageName = `cat_avatar_${String(i + 1).padStart(2, '0')}`;
    
    try {
      const result = await generateImage(CAT_PROMPTS[i], imageName);
      results.success.push({ name: imageName, path: result });
    } catch (error) {
      console.error(`[失败] ${imageName}: ${error.message}`);
      results.failed.push({ name: imageName, error: error.message });
    }

    // 每个请求间隔5秒（避免API限流）
    if (i < CAT_PROMPTS.length - 1) {
      console.log('[等待] 5秒后继续下一个...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 保存生成结果报告
  const reportPath = path.join(OUTPUT_DIR, 'generation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n==========================================');
  console.log('  生成完成报告');
  console.log('==========================================');
  console.log(`成功: ${results.success.length}/30`);
  console.log(`失败: ${results.failed.length}/30`);
  console.log(`报告: ${reportPath}`);
  
  if (results.failed.length > 0) {
    console.log('\n失败列表:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  
  console.log('\n生成完成！图片保存在:', OUTPUT_DIR);
}

main().catch(error => {
  console.error('[致命错误]', error);
  process.exit(1);
});