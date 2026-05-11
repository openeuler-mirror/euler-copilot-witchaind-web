## 打包

RPM 打包说明见 [distribution/linux/README.md](distribution/linux/README.md)。

## 项目启动

```bash
# 安装 pnpm
npm install pnpm -g

# 设置镜像源(可忽略)
pnpm config set registry https://registry.npmmirror.com

# 安装依赖
pnpm install

# 启动运行
pnpm run dev
```
