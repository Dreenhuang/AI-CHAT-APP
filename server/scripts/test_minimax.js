/**
 * MiniMax API 连接测试脚本
 * 测试API密钥是否可用
 */

const https = require('https');

const API_KEY = 'your_minimax_api_key_here';

console.log('==========================================');
console.log('  MiniMax API 连接测试');
console.log('==========================================\n');

// 测试1: 文本生成API (chat completions)
function testChatAPI() {
  return new Promise((resolve, reject) => {
    console.log('[测试1] 测试文本生成API...');
    
    const data = JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [
        { role: 'user', content: '你好，请回复"测试成功"' }
      ],
      max_tokens: 50
    });

    const url = new URL('https://api.minimax.chat/v1/chat/completions');
    
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

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => { responseData += chunk; });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.error) {
            console.log(`  ❌ 失败: ${json.error.message}`);
            resolve(false);
          } else {
            console.log(`  ✅ 成功! 响应: ${json.choices?.[0]?.message?.content || '无响应'}`);
            resolve(true);
          }
        } catch (e) {
          console.log(`  ❌ 解析失败: ${e.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ 网络错误: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      console.log('  ❌ 超时');
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 测试2: 图片生成API
function testImageAPI() {
  return new Promise((resolve, reject) => {
    console.log('\n[测试2] 测试图片生成API...');
    
    const data = JSON.stringify({
      model: 'MiniMax-Image-01',
      prompt: 'Cute simple cartoon cat face, white color, big eyes, kawaii style, minimal design, clean background',
      num_images: 1,
      size: '1K'
    });

    const url = new URL('https://api.minimax.chat/v1/image_generation');
    
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

    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => { responseData += chunk; });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.error) {
            console.log(`  ❌ 失败: ${json.error.message}`);
            resolve(false);
          } else if (json.data && json.data[0]) {
            const imgData = json.data[0];
            if (imgData.url) {
              console.log(`  ✅ 成功! 图片URL: ${imgData.url.substring(0, 60)}...`);
              resolve(true);
            } else if (imgData.base64) {
              console.log(`  ✅ 成功! 返回base64图片数据 (${imgData.base64.length} 字符)`);
              resolve(true);
            } else {
              console.log(`  ❌ 未知的响应格式`);
              resolve(false);
            }
          } else {
            console.log(`  ❌ 无数据返回: ${JSON.stringify(json).substring(0, 100)}`);
            resolve(false);
          }
        } catch (e) {
          console.log(`  ❌ 解析失败: ${e.message}`);
          console.log(`  原始响应: ${responseData.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ 网络错误: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.log('  ❌ 超时');
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 执行测试
async function main() {
  const chatResult = await testChatAPI();
  const imageResult = await testImageAPI();
  
  console.log('\n==========================================');
  console.log('  测试结果汇总');
  console.log('==========================================');
  console.log(`文本生成API: ${chatResult ? '✅ 正常' : '❌ 异常'}`);
  console.log(`图片生成API: ${imageResult ? '✅ 正常' : '❌ 异常'}`);
  console.log('');
  
  if (chatResult && imageResult) {
    console.log('🎉 所有API测试通过！可以开始生成猫咪头像。');
  } else if (chatResult && !imageResult) {
    console.log('⚠️ 文本API正常，但图片API异常，请检查配额限制。');
  } else {
    console.log('❌ API连接异常，请检查密钥是否正确或额度是否充足。');
  }
}

main().catch(console.error);