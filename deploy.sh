#!/bin/bash
# AI Chat 一键部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  AI Chat 部署脚本 v1.0"
echo "=========================================="

# 配置变量
SERVER_IP="43.139.1.48"
SERVER_USER="root"
SSH_KEY="C:/Users/Administrator/Documents/腾讯云服务器私钥code.pem"
REMOTE_DIR="/www/wwwroot/aichat"
DOMAIN="aichat.renrenup.cn"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤1: 测试SSH连接
echo ""
log_info "步骤1/7: 测试SSH连接..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'SSH连接成功' && uname -a" || {
    log_error "SSH连接失败！请检查："
    log_error "1. 私钥文件路径是否正确: $SSH_KEY"
    log_error "2. 服务器IP是否正确: $SERVER_IP"
    log_error "3. 服务器是否允许SSH密钥登录"
    exit 1
}

# 步骤2: 创建远程目录结构
echo ""
log_info "步骤2/7: 创建远程目录..."
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'REMOTE_CMD'
mkdir -p /www/wwwroot/aichat/{server,frontend,logs,ssl}
echo "目录创建完成"
REMOTE_CMD

# 步骤3: 上传后端代码
echo ""
log_info "步骤3/7: 上传后端服务代码..."
scp -i "$SSH_KEY" -r server/* ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/server/
log_info "后端代码上传完成"

# 步骤4: 上传前端构建产物（如果存在）
if [ -d "dist" ]; then
    echo ""
    log_info "步骤4/7: 上传前端构建产物..."
    scp -i "$SSH_KEY" -r dist/* ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/frontend/
    log_info "前端代码上传完成"
else
    log_warn "未找到dist目录，跳过前端上传（将使用开发模式）"
fi

# 步骤5: 安装依赖并初始化数据库
echo ""
log_info "步骤5/7: 安装Node.js依赖并初始化数据库..."
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'REMOTE_CMD'
cd /www/wwwroot/aichat/server

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

# 安装PM2（进程管理器）
npm install -g pm2 || true

# 安装项目依赖
npm install --production

# 初始化Supabase数据库表（首次运行）
if [ -f scripts/init-database.sql ]; then
    echo "请手动在Supabase控制台执行 scripts/init-database.sql 初始化数据库表"
fi

echo "依赖安装完成"
REMOTE_CMD

# 步骤6: 配置Nginx反向代理和SSL
echo ""
log_info "步骤6/7: 配置Nginx反向代理+SSL证书..."
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} > /tmp/nginx_config.conf << 'NGINX_CONF'
# AI Chat Nginx配置
# 域名: aichat.renrenup.cn

# HTTP -> HTTPS 重定向
server {
    listen 80;
    server_name aichat.renrenup.cn www.aichat.renrenup.cn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name aichat.renrenup.cn www.aichat.renrenup.cn;

    # SSL证书配置（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/aichat.renrenup.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aichat.renrenup.cn/privkey.pem;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:9461;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket代理
    location /ws {
        proxy_pass http://127.0.0.1:9461;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    # 前端静态文件（如果有）
    location / {
        try_files $uri $uri/ /index.html;
        
        # Expo Web静态文件路径
        root /www/wwwroot/aichat/frontend;
        index index.html;
        
        # 缓存控制
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 访问日志
    access_log /var/log/nginx/aichat_access.log;
    error_log /var/log/nginx/aichat_error.log;
}
NGINX_CONF

ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} "sudo cp /tmp/nginx_config.conf /etc/nginx/sites-available/aichat && sudo ln -sf /etc/nginx/sites-available/aichat /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"
log_info "Nginx配置完成"

# 步骤7: 申请SSL证书并启动服务
echo ""
log_info "步骤7/7: 申请SSL证书并启动服务..."

# 申请Let's Encrypt SSL证书
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'REMOTE_CMD'
# 安装certbot（如果没有）
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# 申请证书
certbot --nginx -d aichat.renrenup.cn -d www.aichat.renrenup.cn --non-interactive --agree-tos --email admin@renrenup.cn --redirect || echo "证书申请可能失败，请检查域名DNS解析"
REMOTE_CMD

# 启动后端API服务
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'REMOTE_CMD'
cd /www/wwwroot/aichat/server

# 使用生产环境配置
cp .env.production .env

# 启动或重启服务
if pm2 list | grep -q "aichat-api"; then
    pm2 restart aichat-api
else
    pm2 start ecosystem.config.js
fi

# 保存PM2进程列表
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /home/root || true
pm2 save

echo "服务启动完成"
REMOTE_CMD

echo ""
echo "=========================================="
echo "  🎉 部署完成！"
echo "=========================================="
echo ""
echo "📱 访问地址:"
echo "   https://aichat.renrenup.cn"
echo ""
echo "🔧 API地址:"
echo "   https://aichat.renrenup.cn/api/health"
echo ""
echo "📊 管理命令:"
echo "   SSH登录: ssh -i $SSH_KEY root@$SERVER_IP"
echo "   PM2状态: pm2 status"
echo "   PM2日志: pm2 logs aichat-api"
echo "   重启服务: pm2 restart aichat-api"
echo ""
echo "⚠️  重要提示:"
echo "   1. 请确保域名 aichat.renrenup.cn 已解析到 $SERVER_IP"
echo "   2. 请在Supabase控制台执行 init-database.sql 初始化数据库"
echo "   3. 首次访问可能需要等待1-2分钟（证书申请）"
echo ""
