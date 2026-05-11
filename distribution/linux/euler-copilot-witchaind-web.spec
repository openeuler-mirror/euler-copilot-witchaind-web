%define debug_package %{nil}
# -----------------------------------------------------
# 元数据部分：定义包的基本信息
# -----------------------------------------------------
Summary: Witchaind Web Application
Name: euler-copilot-witchaind-web
Version: 0.10.1
Release: 1%{?dist}
License: MulanPSL-2.0
Group: Applications/Internet
Source0: %{name}-%{version}.tar.gz
URL: https://atomgit.com/src-openeuler/euler-copilot-witchaind-web
BuildRequires: tar
BuildRequires: curl
BuildRequires: xz
Requires: nginx

# -----------------------------------------------------
# 描述部分：应用功能说明
# -----------------------------------------------------
%description
Witchaind Web Application 是数据链平台的前端应用，通过 Nginx 服务提供 Web 界面访问。

# -----------------------------------------------------
# 准备阶段：解压源代码
# -----------------------------------------------------
%prep
%setup -q

# -----------------------------------------------------
# 构建阶段：下载 Node.js 并编译应用
# -----------------------------------------------------
%build
# -------------------------------------------------------
# 1. 从 package.json 提取所需 Node.js 版本
# -------------------------------------------------------
echo "检查 package.json 中的 Node.js 版本要求..."
cat package.json | grep '"node":'

NODE_VER=$(grep '"node":' package.json | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -z "$NODE_VER" ]; then
    echo "错误：无法从 package.json 中提取 Node.js 版本号"
    exit 1
fi
echo "检测到需要 Node.js 版本: $NODE_VER"

# -------------------------------------------------------
# 2. 确定架构
# -------------------------------------------------------
ARCH="x64"
case "%{_arch}" in
    x86_64) ARCH="x64" ;;
    aarch64) ARCH="arm64" ;;
    *) echo "警告：未识别的架构 %{_arch}，默认使用 x64" ;;
esac
echo "使用架构: $ARCH"

# -------------------------------------------------------
# 3. 准备 Node.js（缓存到 $HOME/.cache，避免重复下载）
# -------------------------------------------------------
NODE_CACHE_DIR="$HOME/.cache/rpmbuild-node"
NODE_ARCHIVE="node-v${NODE_VER}-linux-${ARCH}.tar.xz"
NODE_LINK="https://mirrors.huaweicloud.com/nodejs/v${NODE_VER}/${NODE_ARCHIVE}"
NODE_HOME="$PWD/.node-v${NODE_VER}"

mkdir -p "$NODE_CACHE_DIR"

if [ -f "$NODE_CACHE_DIR/$NODE_ARCHIVE" ]; then
    echo "Node.js 缓存命中: $NODE_CACHE_DIR/$NODE_ARCHIVE"
else
    echo "下载 Node.js 从: $NODE_LINK"
    curl -sSL "$NODE_LINK" -o "$NODE_CACHE_DIR/$NODE_ARCHIVE"
    if [ ! -s "$NODE_CACHE_DIR/$NODE_ARCHIVE" ]; then
        echo "错误：下载的 Node.js 文件为空"
        exit 1
    fi
    echo "Node.js 已缓存到: $NODE_CACHE_DIR/$NODE_ARCHIVE"
fi

echo "解压 Node.js..."
mkdir -p "$NODE_HOME"
tar -xJ -f "$NODE_CACHE_DIR/$NODE_ARCHIVE" -C "$NODE_HOME" --strip-components=1

# -------------------------------------------------------
# 4. 配置环境变量（含 pnpm store 缓存）
# -------------------------------------------------------
export NODE_HOME
export PATH="$NODE_HOME/bin:$PATH"

PNPM_STORE="$HOME/.cache/pnpm-store"
mkdir -p "$PNPM_STORE"
export PNPM_STORE_DIR="$PNPM_STORE"

echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"
echo "pnpm store 目录: $PNPM_STORE_DIR"

# -------------------------------------------------------
# 5. 安装 pnpm 并构建应用
#    package.json 已配置 pnpm.onlyBuiltDependencies，
#    允许 esbuild、vue-demi 等必需的构建脚本运行。
# -------------------------------------------------------
echo "安装 pnpm 包管理器..."
npm install pnpm -g --registry=https://mirrors.huaweicloud.com/repository/npm/

echo "安装项目依赖..."
export HUSKY=0
pnpm install --registry=https://mirrors.huaweicloud.com/repository/npm/

echo "构建应用..."
pnpm run build

# -------------------------------------------------------
# 6. 验证构建结果
# -------------------------------------------------------
echo "验证构建结果..."
ls -la dist/

# -----------------------------------------------------
# 安装阶段：复制文件到 RPM 构建根目录
# -----------------------------------------------------
%install
rm -rf $RPM_BUILD_ROOT

echo "复制 Web 应用文件..."
mkdir -p %{buildroot}/usr/share/witchaind-web

# 验证源文件
echo "源文件列表:"
ls -la %{_builddir}/%{name}-%{version}/dist/ || echo "dist目录不存在或为空"
ls -la %{_builddir}/%{name}-%{version}/public/ || echo "public目录不存在或为空"

# 复制 dist 产物
echo "复制 dist 目录内容..."
cp -av %{_builddir}/%{name}-%{version}/dist/. %{buildroot}/usr/share/witchaind-web/

# 复制 public 静态资源
echo "复制 public 目录内容..."
cp -av %{_builddir}/%{name}-%{version}/public/. %{buildroot}/usr/share/witchaind-web/

echo "目标文件列表:"
ls -la %{buildroot}/usr/share/witchaind-web/

chmod -R a+rX %{buildroot}/usr/share/witchaind-web

# 复制 Nginx 配置
mkdir -p %{buildroot}/etc/nginx/conf.d
cp -a %{_builddir}/%{name}-%{version}/build/linux/nginx.conf %{buildroot}/etc/nginx/conf.d/witchaind-web.conf

# -----------------------------------------------------
# 文件列表：定义 RPM 包包含的文件
# -----------------------------------------------------
%files
%attr(0644, root, root) /usr/share/witchaind-web/*
%attr(0644, root, root) /usr/share/witchaind-web/css/*
%attr(0644, root, root) /usr/share/witchaind-web/fonts/*
%attr(0644, root, root) /usr/share/witchaind-web/img/*
%attr(0644, root, root) /usr/share/witchaind-web/js/*
%attr(0644, root, root) /usr/share/witchaind-web/webp/*

%config(noreplace,missingok) /etc/nginx/conf.d/witchaind-web.conf

# -----------------------------------------------------
# 脚本部分：安装后和卸载前执行的操作
# -----------------------------------------------------
%post
systemctl reload nginx || :

%preun
if [ $1 -eq 0 ]; then
    rm -f /etc/nginx/conf.d/witchaind-web.conf
    systemctl reload nginx || :
fi

# -----------------------------------------------------
# 变更日志：记录包的版本变更历史
# -----------------------------------------------------
%changelog
* Mon May 11 2026 hongyu-shi <shywzt@iCloud.com> - 0.10.1-1
- 更新版本至 0.10.1
- 配置 pnpm.onlyBuiltDependencies 正确处理构建脚本

* Mon Dec 1 2025 ylzhangah <ylzhangah@qq.com> - 0.10.0-2
- 修复卸载时报 witchaind-web.conf无法找到的问题

* Mon Sep 15 2025 zxstty <zhaojiaqi18@huawei.com> - 0.10.0-1
- 更新源码

* Tue Jun 10 2025 zxstty <zhaojiaqi18@huawei.com> - 0.9.6-1
- 初始版本发布，构建阶段自动安装 Node.js
