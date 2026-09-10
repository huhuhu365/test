# MuleSoft Hello World

最小 Mule 4 HTTP API：`GET /hello` → HTTP 200，纯文本 `Hello World`。

流程：HTTP Listener 接收请求 → Set Payload 设置响应 → Listener 返回结果。

## 在 Anypoint Studio 中运行

1. 使用 Java 17 和支持 Mule 4.9 的 Anypoint Studio 7，选择可用的 Mule 4.9 补丁版本。
2. 通过 File → Import → Anypoint Studio → Anypoint Studio project from File System 导入本目录。
3. 打开 `src/main/mule/hello-world.xml`，可查看两个流程组件。
4. 右键项目，选择 Run As → Mule Application，等待应用启动成功。
5. 打开 `http://127.0.0.1:8081/hello`，预期显示 `Hello World`。

也可以用 PowerShell 验证：

```powershell
$response = Invoke-WebRequest -Uri 'http://127.0.0.1:8081/hello' -UseBasicParsing
$response.StatusCode
$response.Content
```

预期状态码为 `200`，正文为 `Hello World`。运行前该地址不会提供服务。

## 打包

在本目录、Java 17 环境下运行 `mvn package`。依赖首次下载需要网络。
产物位于 `target/`；打包不会自动启动或部署服务。

## 配置

`src/main/resources/config.properties` 默认仅监听本机 `127.0.0.1:8081`。
如果端口被占用，可更改 `http.port`。云端部署前需要根据目标平台调整监听地址和端口。
账号用于 Anypoint 平台登录与云端功能，不应写进项目文件。

## 官方参考

- https://docs.mulesoft.com/http-connector/latest/
- https://docs.mulesoft.com/mule-runtime/latest/package-a-mule-application

## Windows 启动提醒

本项目本身就是后端 API，没有 Vue/React 前端，也没有 package.json；不要执行 `pnpm start` 或 `pnpm dev`。
在 Studio 中导入整个 `C:\wang\mulesoft-hello-world` 项目，使用兼容 Mule 4.9 的运行时和 Java 17，通过 Run As → Mule Application 启动。
`mvn package` 只生成部署包，不会启动 8081 服务；登录 Anypoint 网站本身也不会自动运行本地项目。

```powershell
cd C:\wang\mulesoft-hello-world
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17.0.18'
mvn package
```

本文没有给出未经验证的云端部署地址。运行后再访问 `http://127.0.0.1:8081/hello`；前面的启动步骤仍需在 Studio 中完成。

返回 [全部项目启动指南](../启动指南.md)。
