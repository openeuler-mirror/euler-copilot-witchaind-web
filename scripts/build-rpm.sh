#!/usr/bin/env bash
# =============================================================================
# build-rpm.sh - 在 openEuler 上构建 RPM 包
#
# 前置条件:
#   - openEuler 24.03 LTS-SP3 或兼容版本
#   - 已安装 rpmdevtools、rpm-build 等基础构建工具
#   - 已通过 generate-tarball.sh 生成源码 tarball
#
# 用法:
#   ./scripts/build-rpm.sh                           # 完整构建（生成 tarball + 构建 RPM）
#   ./scripts/build-rpm.sh --tarball-only            # 仅生成 tarball
#   ./scripts/build-rpm.sh --rpm-only                # 仅构建 RPM（需要已有 tarball）
#   ./scripts/build-rpm.sh --install-deps            # 仅安装构建依赖
# =============================================================================

set -euo pipefail

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------- 常量 ----------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_NAME="euler-copilot-witchaind-web"
SPEC_FILE="$PROJECT_ROOT/distribution/linux/${PACKAGE_NAME}.spec"

# 从 package.json 读取版本
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
TARBALL_NAME="${PACKAGE_NAME}-${VERSION}.tar.gz"

# ---------- 参数解析 ----------
DO_TARBALL=true
DO_RPM=true
DO_DEPS=false

usage() {
    cat <<EOF
用法: $0 [选项]

选项:
  --tarball-only    仅生成源码 tarball
  --rpm-only        仅构建 RPM（跳过 tarball 生成）
  --install-deps    仅安装 RPM 构建所需的系统依赖
  -h, --help        显示此帮助信息

环境变量:
  RPMBUILD_TOPDIR   指定 rpmbuild 顶层目录（默认: ~/rpmbuild）

示例:
  $0                           # 完整构建流程
  $0 --rpm-only                # 仅构建 RPM
  $0 --install-deps            # 仅安装依赖
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tarball-only)
            DO_RPM=false
            shift
            ;;
        --rpm-only)
            DO_TARBALL=false
            shift
            ;;
        --install-deps)
            DO_DEPS=true
            DO_TARBALL=false
            DO_RPM=false
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "未知参数: $1"
            usage
            ;;
    esac
done

# ---------- 系统检测 ----------
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /etc/openEuler-release ]; then
        echo "openeuler"
    else
        echo "unknown"
    fi
}

OS_ID=$(detect_os)

if [ "$OS_ID" != "openeuler" ] && [ "$OS_ID" != "openEuler" ]; then
    log_error "此脚本仅支持 openEuler 系统！当前系统: $OS_ID"
    log_error "请在 openEuler 24.03 LTS-SP3 或兼容版本上运行此脚本。"
    exit 1
fi

log_info "检测到 openEuler 系统: $(cat /etc/openEuler-release 2>/dev/null || echo 'unknown version')"

# ---------- 安装依赖 ----------
install_deps() {
    log_info "安装 RPM 构建依赖..."
    sudo dnf install -y \
        rpmdevtools \
        rpm-build \
        tar \
        curl \
        xz \
        file \
        gzip \
        nginx
    log_info "依赖安装完成。"
}

if [ "$DO_DEPS" = true ]; then
    install_deps
    exit 0
fi

# ---------- 设置 rpmbuild 目录结构 ----------
RPMBUILD_TOPDIR="${RPMBUILD_TOPDIR:-$HOME/rpmbuild}"
log_info "rpmbuild 顶层目录: $RPMBUILD_TOPDIR"

# 创建必要的子目录
for subdir in BUILD BUILDROOT RPMS SOURCES SPECS SRPMS; do
    mkdir -p "$RPMBUILD_TOPDIR/$subdir"
done

# ---------- 生成 tarball ----------
if [ "$DO_TARBALL" = true ]; then
    log_info "--- 步骤 1/3: 生成源码 tarball ---"
    bash "$SCRIPT_DIR/generate-tarball.sh" -o "$RPMBUILD_TOPDIR/SOURCES" -v "$VERSION"
else
    log_info "--- 跳过 tarball 生成（--rpm-only） ---"
fi

# 检查 tarball 是否存在
if [ ! -f "$RPMBUILD_TOPDIR/SOURCES/$TARBALL_NAME" ]; then
    log_error "源码 tarball 不存在: $RPMBUILD_TOPDIR/SOURCES/$TARBALL_NAME"
    log_error "请先运行 generate-tarball.sh 或去掉 --rpm-only 选项。"
    exit 1
fi

# ---------- 复制 spec 文件 ----------
log_info "--- 步骤 2/3: 准备 spec 文件 ---"
cp "$SPEC_FILE" "$RPMBUILD_TOPDIR/SPECS/"
log_info "Spec 文件已复制到: $RPMBUILD_TOPDIR/SPECS/$(basename "$SPEC_FILE")"

# ---------- 构建 RPM ----------
if [ "$DO_RPM" = true ]; then
    log_info "--- 步骤 3/3: 构建 RPM ---"
    log_info "开始 rpmbuild..."

    # 安装构建依赖（如果需要）
    if ! rpm -q rpm-build &>/dev/null; then
        log_warn "rpm-build 未安装，正在安装依赖..."
        install_deps
    fi

    cd "$RPMBUILD_TOPDIR"

    # 使用 -ba 同时构建二进制包和源码包
    # 使用 -bb 仅构建二进制包
    rpmbuild -ba \
        --define "_topdir $RPMBUILD_TOPDIR" \
        "$RPMBUILD_TOPDIR/SPECS/${PACKAGE_NAME}.spec" \
        2>&1 | tee "$PROJECT_ROOT/rpm-build.log"

    RPMBUILD_EXIT_CODE=${PIPESTATUS[0]}

    if [ $RPMBUILD_EXIT_CODE -eq 0 ]; then
        log_info "============================================"
        log_info "RPM 构建成功!"
        log_info "============================================"

        # 列出生成的 RPM 包
        echo ""
        log_info "生成的 RPM 包:"
        find "$RPMBUILD_TOPDIR/RPMS" -name "${PACKAGE_NAME}*.rpm" -type f 2>/dev/null | while read -r rpm; do
            echo "  $(basename "$rpm")  ($(du -h "$rpm" | cut -f1))"
        done

        echo ""
        log_info "源码 RPM 包:"
        find "$RPMBUILD_TOPDIR/SRPMS" -name "${PACKAGE_NAME}*.src.rpm" -type f 2>/dev/null | while read -r srpm; do
            echo "  $(basename "$srpm")  ($(du -h "$srpm" | cut -f1))"
        done
    else
        log_error "RPM 构建失败！退出码: $RPMBUILD_EXIT_CODE"
        log_error "详细日志请查看: $PROJECT_ROOT/rpm-build.log"
        exit $RPMBUILD_EXIT_CODE
    fi
else
    log_info "--- 跳过 RPM 构建 ---"
    log_info "Tarball 已准备就绪: $RPMBUILD_TOPDIR/SOURCES/$TARBALL_NAME"
    log_info "后续可运行: $0 --rpm-only"
fi
