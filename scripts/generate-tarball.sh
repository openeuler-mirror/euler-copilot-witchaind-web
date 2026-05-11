#!/usr/bin/env bash
# =============================================================================
# generate-tarball.sh - 生成 RPM 构建所需的源码 tarball
#
# 兼容性: Linux, macOS 及类 UNIX 系统
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

OUTPUT_DIR=""
VERSION=""
REF="HEAD"

usage() {
    cat <<EOF
用法: $0 [选项]

默认输出到项目根目录下的 cache/ 目录。

选项:
  -o, --output DIR     输出 tarball 的目录（默认: cache/）
  -v, --version VER    指定版本号（默认: 从 package.json 读取）
  -r, --ref REF        git 引用，默认 HEAD（可指定 tag 或 commit）
  -h, --help           显示此帮助信息
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--output)  OUTPUT_DIR="$2"; shift 2 ;;
        -v|--version) VERSION="$2";   shift 2 ;;
        -r|--ref)     REF="$2";       shift 2 ;;
        -h|--help)    usage ;;
        *) log_error "未知参数: $1"; usage ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
log_info "项目根目录: $PROJECT_ROOT"

if ! git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
    log_error "当前目录不是 git 仓库，无法使用 git archive"
    exit 1
fi

if [ -z "$VERSION" ]; then
    VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    if [ -z "$VERSION" ]; then
        log_error "无法从 package.json 提取版本号"
        exit 1
    fi
    log_info "从 package.json 读取版本: $VERSION"
fi

PACKAGE_NAME="euler-copilot-witchaind-web"
TARBALL_NAME="${PACKAGE_NAME}-${VERSION}.tar.gz"

if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="$PROJECT_ROOT/cache"
fi
mkdir -p "$OUTPUT_DIR"
TARBALL_PATH="$OUTPUT_DIR/$TARBALL_NAME"

if ! git -C "$PROJECT_ROOT" diff-index --quiet HEAD -- 2>/dev/null; then
    log_warn "工作区有未提交的修改，这些修改不会包含在 tarball 中"
fi

log_info "从 git ref '$REF' 生成 tarball..."
git -C "$PROJECT_ROOT" archive --format tar.gz \
    --prefix "${PACKAGE_NAME}-${VERSION}/" \
    --output "$TARBALL_PATH" \
    "$REF"

if [ -f "$TARBALL_PATH" ]; then
    TARBALL_SIZE=$(du -h "$TARBALL_PATH" | cut -f1)
    log_info "============================================"
    log_info "Tarball 生成成功!"
    log_info "  路径: $TARBALL_PATH"
    log_info "  大小: $TARBALL_SIZE"
    log_info "============================================"
else
    log_error "Tarball 生成失败"
    exit 1
fi
