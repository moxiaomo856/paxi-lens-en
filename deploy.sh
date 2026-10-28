#!/usr/bin/env bash
# 一键部署脚本（不经过 GitHub，源码不公开到仓库）
# 用法：在 Git Bash 中 cd 到本目录后执行  bash deploy.sh
set -e

# 进入脚本所在目录（项目根）
cd "$(dirname "$0")"

echo "==> 同步静态资源到 public/（排除 .git / .wrangler / 配置 / Worker 入口 / *.map）"
rm -rf public
mkdir -p public
tar \
  --exclude='./.git' \
  --exclude='./.wrangler' \
  --exclude='./node_modules' \
  --exclude='./public' \
  --exclude='./.gitignore' \
  --exclude='./wrangler.toml' \
  --exclude='./worker.js' \
  --exclude='./deploy.sh' \
  --exclude='*.map' \
  -cf - . | (cd public && tar -xf -)

echo "==> 部署到 Cloudflare Workers"
npx wrangler deploy
