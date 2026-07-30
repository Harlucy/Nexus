#!/bin/bash
# 查看 TOTP 密钥的脚本（需要在服务器上执行）

AUTH_FILE="${AUTH_FILE:-./server/auth.json}"

if [ ! -f "$AUTH_FILE" ]; then
    echo "错误: auth.json 不存在"
    echo "请先启动服务: docker compose up -d"
    exit 1
fi

SECRET=$(cat "$AUTH_FILE" | grep -o '"totpSecret":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SECRET" ]; then
    echo "错误: 无法读取密钥"
    exit 1
fi

echo "================================="
echo "  TOTP 密钥"
echo "================================="
echo ""
echo "密钥: $SECRET"
echo ""
echo "添加链接:"
echo "otpauth://totp/SubWeb:admin@subweb?secret=$SECRET&issuer=SubWeb&algorithm=SHA1&digits=6&period=30"
echo ""
echo "请使用 Google Authenticator 等应用扫描或手动输入密钥"
echo "================================="
