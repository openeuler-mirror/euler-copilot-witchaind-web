# euler-copilot-witchaind-web 打包指南

## 依赖

```bash
dnf install -y rpmdevtools rpm-build git curl tar xz nginx
```

## 快速开始

```bash
# 1. 生成源码 tarball
bash scripts/generate-tarball.sh -o ~/rpmbuild/SOURCES

# 2. 复制 spec 到构建目录
cp distribution/linux/euler-copilot-witchaind-web.spec ~/rpmbuild/SPECS/

# 3. 构建 RPM
rpmbuild -ba --define "_topdir $HOME/rpmbuild" \
    ~/rpmbuild/SPECS/euler-copilot-witchaind-web.spec
```

构建产物：
- 二进制包：`~/rpmbuild/RPMS/$(uname -m)/euler-copilot-witchaind-web-*.rpm`
- 源码包：`~/rpmbuild/SRPMS/euler-copilot-witchaind-web-*.src.rpm`

## 文件说明

| 文件 | 用途 |
|------|------|
| `euler-copilot-witchaind-web.spec` | RPM Spec，定义包的元数据、构建和安装流程 |
| `../scripts/generate-tarball.sh` | 使用 `git archive` 生成源码 tarball |
| `../scripts/build-rpm.sh` | 一键构建脚本（封装 tarball 生成 + rpmbuild） |

## 构建流程

1. `%prep` — 解压源码 tarball
2. `%build` — 下载 Node.js（带缓存），用 pnpm 安装依赖并执行 `vite build`
3. `%install` — 将 `dist/` 产物和 Nginx 配置复制到构建根目录
4. `%files` — 声明 RPM 包含的文件
5. `%post`/`%preun` — 安装/卸载时重载 Nginx

## 缓存

反复构建时以下目录会被复用，无需重新下载：

- `~/.cache/rpmbuild-node/` — Node.js 二进制包
- `~/.cache/pnpm-store/` — pnpm 依赖包
