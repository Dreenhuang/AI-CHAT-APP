/**
 * MiniMax 图片生成脚本 - 生成30张卡通猫咪头像
 * 
 * 使用方式：node generate_cat_avatars.js
 * 
 * 生图API: https://api.minimax.chat/v1/image_generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// MiniMax API配置
const API_KEY = 'your_minimax_api_key_here';
const API_URL = 'https://api.minimax.chat/v1/image_generation';

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'cat-avatars');

// 30张猫咪提示词（各种风格和场景）
const CAT_PROMPTS = [
  // 可爱日常风格 (1-10)
  { name: 'cat_01', prompt: 'Cute cartoon cat avatar, round face, big shiny eyes, pink nose, soft pastel colors, kawaii style, simple background, white and orange tabby cat, chibi art, Disney style illustration, 2D cartoon' },
  { name: 'cat_02', prompt: 'Adorable cartoon kitten, fluffy fur, smiling face, bright blue eyes, pastel pink and white colors, cute chibi style, sitting pose, simple clean background, Japanese anime style, kawaii cat avatar' },
  { name: 'cat_03', prompt: 'Cute grey cartoon cat, big golden eyes, round face, tiny pink nose, soft fur texture, pastel blue background, minimalist kawaii style, modern vector art, cute pet illustration' },
  { name: 'cat_04', prompt: 'White cartoon cat avatar, fluffy ears, pink cheeks, happy expression, pastel rainbow colors, cute chibi character, simple clean design, pastel art style, kawaii Japanese illustration' },
  { name: 'cat_05', prompt: 'Orange tabby cartoon cat, playful expression, big eyes, cute smile, soft warm colors, pastel background, kawaii style, round design, Disney inspired, cute pet avatar' },
  { name: 'cat_06', prompt: 'Black and white tuxedo cartoon cat, formal expression but cute, shiny eyes, pastel colors, minimalist style, clean design, cute mascot character, kawaii art' },
  { name: 'cat_07', prompt: 'Cute Siamese cartoon cat, blue eyes, elegant pose, pastel purple and cream colors, cute chibi style, big expressive eyes, kawaii anime illustration' },
  { name: 'cat_08', prompt: 'Scottish fold cartoon cat, folded ears, round face, golden eyes, cream and white colors, soft pastel background, adorable kawaii style, cute pet illustration' },
  { name: 'cat_09', prompt: 'Persian cartoon cat, fluffy long fur, sweet face, pink nose, pastel pink colors, elegant cute style, chibi character, kawaii anime art' },
  { name: 'cat_10', prompt: 'British Shorthair cartoon cat, round face, copper eyes, chubby cheeks, blue grey colors, pastel background, cute kawaii style, adorable mascot character' },
  
  // 搞笑趣味风格 (11-20)
  { name: 'cat_11', prompt: 'Funny cartoon cat wearing sunglasses, cool pose, beach background, pastel sunset colors, playful style, cute mascot character, kawaii anime, summer vibes' },
  { name: 'cat_12', prompt: 'Sleepy cartoon cat with closed eyes, yawning expression, pastel blue sky background, cute chibi style, cozy atmosphere, kawaii illustration, dreamy soft colors' },
  { name: 'cat_13', prompt: 'Surprised cartoon cat with big round eyes, raised paws, pastel yellow background, funny cute expression, kawaii anime style, comic style character' },
  { name: 'cat_14', prompt: 'Angry but cute cartoon cat, puffed up fur, funny expression, pastel red and orange colors, humorous style, chibi character design' },
  { name: 'cat_15', prompt: 'Cute cartoon cat eating a fish, happy expression, pastel blue and orange colors, playful style, kawaii anime illustration, food themed mascot' },
  { name: 'cat_16', prompt: 'Cartoon cat with a bow tie, formal elegant pose, pastel purple background, cute gentleman style, chibi character, kawaii anime art' },
  { name: 'cat_17', prompt: 'Dizzy cartoon cat with spiral eyes, funny expression, pastel pink background, humorous style, cute chibi character, cartoon meme style' },
  { name: 'cat_18', prompt: 'Cute cartoon cat with a crown, royal pose, pastel gold and purple colors, majestic but cute, kawaii anime style, cute king mascot' },
  { name: 'cat_19', prompt: 'Hungry cartoon cat with empty bowl, sad eyes, pastel orange background, funny cute style, kawaii illustration, pet themed character' },
  { name: 'cat_20', prompt: 'Cartoon cat wearing a raincoat, happy splashing in puddles, pastel blue rain background, fun playful style, kawaii anime, rainy day vibes' },
  
  // 梦幻魔法风格 (21-30)
  { name: 'cat_21', prompt: 'Magical cartoon cat with wings, sparkle effects, pastel rainbow colors, dreamy fantasy style, cute fairy cat, kawaii anime illustration' },
  { name: 'cat_22', prompt: 'Mystic cartoon cat with stars and moon, magical aura, deep purple and blue colors, fantasy style, cute chibi character, kawaii anime art' },
  { name: 'cat_23', prompt: 'Astronaut cartoon cat in space, floating pose, pastel galaxy background with stars, cute space theme, kawaii anime illustration, cosmic adventure' },
  { name: 'cat_24', prompt: 'Wizard cartoon cat with magic wand and hat, sparkle effects, pastel purple and gold colors, fantasy style, cute magical mascot, kawaii anime' },
  { name: 'cat_25', prompt: 'Unicorn cartoon cat with rainbow mane, magical sparkle, pastel pink and blue colors, fantasy style, cute mythical creature, kawaii anime illustration' },
  { name: 'cat_26', prompt: 'Sailor moon style cartoon cat, magical girl outfit, crescent moon, pastel blue and pink colors, cute anime style, magical transformation' },
  { name: 'cat_27', prompt: 'Cute cartoon cat with flower crown, spring theme, pastel pink and green colors, nature elements, kawaii anime style, botanical illustration' },
  { name: 'cat_28', prompt: 'Rainbow cartoon cat with colorful fur patterns, pastel rainbow colors, joyful expression, cute mascot style, kawaii anime, celebration theme' },
  { name: 'cat_29', prompt: 'Moonlight cartoon cat with glowing effect, night sky background, pastel silver and blue colors, dreamy magical style, kawaii anime illustration' },
  { name: 'cat_30', prompt: 'Forest fairy cartoon cat with leaves and flowers, magical forest setting, pastel green and pink colors, nature spirit style, kawaii anime art' }
];

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`[生成器] 创建输出目录: ${OUTPUT_DIR}`);
}

/**
 * 调用MiniMax图片生成API
 */
function generateImage(prompt, imageName) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      model: 'MiniMax-Image-01',
      prompt: prompt,
      num_images: 1,
      size: '1K'
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
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`[生成中] ${imageName}: ${prompt.substring(0, 50)}...`);

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

          // 解析返回的图片URL
          if (jsonResponse.data && jsonResponse.data[0] && jsonResponse.data[0].url) {
            const imageUrl = jsonResponse.data[0].url;
            console.log(`[成功] ${imageName} - URL: ${imageUrl}`);
            resolve(imageUrl);
          } else if (jsonResponse.data && jsonResponse.data[0] && jsonResponse.data[0].base64) {
            // 如果返回的是base64，直接保存
            const base64Data = jsonResponse.data[0].base64;
            const filePath = path.join(OUTPUT_DIR, `${imageName}.png`);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            console.log(`[成功] ${imageName} - 已保存到: ${filePath}`);
            resolve(filePath);
          } else {
            console.log(`[响应] ${imageName}:`, JSON.stringify(jsonResponse).substring(0, 200));
            reject(new Error('未找到图片数据'));
          }
        } catch (parseError) {
          console.error(`[解析错误] ${imageName}:`, parseError.message);
          console.log(`[原始响应]:`, responseData.substring(0, 500));
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
  console.log('==========================================');
  console.log('  MiniMax图片生成器 - 卡通猫咪头像 (30张)');
  console.log('==========================================');
  console.log(`输出目录: ${OUTPUT_DIR}`);
  console.log('');

  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < CAT_PROMPTS.length; i++) {
    const cat = CAT_PROMPTS[i];
    
    try {
      console.log(`\n[进度] ${i + 1}/30`);
      const result = await generateImage(cat.prompt, cat.name);
      results.success.push({
        name: cat.name,
        url: result
      });
    } catch (error) {
      console.error(`[失败] ${cat.name}: ${error.message}`);
      results.failed.push({
        name: cat.name,
        error: error.message
      });
    }

    // 每个请求间隔3秒（避免API限流）
    if (i < CAT_PROMPTS.length - 1) {
      console.log('[等待] 3秒后继续下一个...');
      await new Promise(resolve => setTimeout(resolve, 3000));
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
}

main().catch(error => {
  console.error('[致命错误]', error);
  process.exit(1);
});