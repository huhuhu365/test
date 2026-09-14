# AWS 部署步骤（尚未执行）

## 当前阻碍

本机安装了 AWS CLI，但 `aws configure list` 显示尚未配置凭证及区域；未找到 AWS SAM CLI。需要你在电脑上完成 AWS 登录，不要将密码、Access Key、Secret Key 发到聊天或提交到 Git。

## 推荐步骤

1. 使用公司提供的 AWS 练习账号，先确认允许使用的区域（本例 `ap-northeast-1`，东京）及练习额度。
2. 按官方文档安装 [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)。本地 Python 3.14 已安装。
3. 若组织使用 IAM Identity Center，在本机执行 `aws configure sso`，然后 `aws sso login --profile <你的练习profile>`。如果公司提供另一种登录方式，按公司的方式操作。
4. 检查 `aws sts get-caller-identity --profile <你的练习profile>`，确认是正确练习账号。

```powershell
cd C:\wang\onboarding-app
sam validate --lint --region ap-northeast-1 --profile <你的练习profile>
sam build
sam deploy --guided --region ap-northeast-1 --profile <你的练习profile>
```

尖括号内容是占位符，执行前替换。第一次 guided 部署填写：

| 提示 | 建议值 |
| --- | --- |
| Stack Name | onboarding-training |
| AWS Region | ap-northeast-1（或公司指定区域） |
| Parameter AppToken | 自行生成并保管的 32–128 位随机英文字母/数字/下划线/短横线；不是 AWS 密钥 |
| Confirm changes before deploy | Y |
| Allow SAM CLI IAM role creation | 检查模板里的 DynamoDB 读写与日志权限后确认 |
| Function has no authorization defined | API Gateway 不做授权，应用层检查访问码；仅为虚构数据练习，确认后继续 |
| Save arguments to configuration file | N（避免访问码被写入配置文件） |

部署将创建收费型 AWS 资源；具体费用取决于请求和存储用量，不能承诺免费。先审阅 SAM 显示的 CloudFormation change set。访问码虽在 CloudFormation 中 NoEcho，具有读取 Lambda 配置权限的 AWS 管理员仍可能看到它。

代码无额外运行时依赖，AWS Lambda Python 运行时提供 boto3。SAM `build` 使用本机 Python 3.14；若你的 SAM 版本不支持该运行时，先更新 SAM。不要在未检查兼容性的情况下随意改版本。

## 部署后的验收

1. 打开输出的 `ApplicationUrl`，右上角应显示「AWS DynamoDB」。
2. 输入你设置的 AppToken；每次刷新需重新输入，访问码仅保留在页面内存。
3. 用虚构数据提交入社申请，记录生成的完整申请编号。
4. 打开列表 → 点击姓名 → 核对全部字段。
5. 刷新页面，重新输入访问码，确认列表仍有这条申请。
6. 在 DynamoDB 控制台找到输出 `TableName`，以申请编号查询，确认真实 AWS DB 中存在记录。
7. 查看 CloudWatch 对应 `/aws/lambda/...` 日志组，确认无错误；不要记录完整申请内容。
8. 截取 AWS 页面、列表、详情和 DB 记录，补充报告。当前已有截图均为本地 SQLite 版本。

## 清理

练习完成且你确认不再需要应用后，可用 SAM 删除该练习堆栈。表配置了 Retain，删除堆栈不会删除数据表，剩余表可能继续产生费用；单独删除表前务必确认表名和备份需求。不要删除其他项目的资源。

## 官方参考

- [AWS SAM 首次部署](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-deploy.html)
- [API Gateway Lambda v2 代理集成](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
- [Lambda 与 API Gateway / DynamoDB 示例](https://docs.aws.amazon.com/us_en/lambda/latest/dg/services-apigateway-tutorial.html)
