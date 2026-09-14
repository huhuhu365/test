# 你接下来怎样完成 Kiro + Copilot 练习

这些材料和初始代码由当前助手生成，不能算作已经实际使用 Kiro 或 Copilot。作业的重点是你用指定工具参与需求、设计、生成和排错，并理解改动。下面为待执行步骤。

## 1. 在 Kiro 做需求和设计

安装并登录 [Kiro](https://kiro.dev/)，打开 `C:\wang\onboarding-app`。参考 [Kiro Specs](https://kiro.dev/docs/specs/best-practices/) 创建入社申请 spec，把下面的提示词发给 Kiro：

```text
入社申請機能のみを実装する研修です。このフォルダには初期実装があります。
まず README.md、backend/app.py、template.yaml を読み、現在の実装を確認してください。
入社申請→DB登録→一覧→詳細の要件を requirements.md に整理し、
AWS API Gateway + Python Lambda + DynamoDB の設計を design.md にまとめてください。
必須項目、メール・電話番号、入社予定日（日本時間）の検証条件を明記してください。
ローカル SQLite と AWS DynamoDB の違いを説明してください。
承認・編集・削除などの機能は増やさないでください。
まだコードは変更せず、不足点とテスト可能な受入条件を示してください。
```

阅读生成的 requirements/design 后，检查与题目是否一致，保存 Kiro 对话截图。让 Kiro 生成 tasks.md，标明哪些已在本地实现、哪些尚待 AWS 验证。不要只把现有文档放进 `.kiro` 文件夹就算使用完成。

## 2. 在 GitHub Copilot 做代码生成与重构

在 VS Code 安装官方 GitHub Copilot 扩展，登录有使用权限的 GitHub 账号。打开本项目和 Copilot Chat。参考 [官方 Chat 文档](https://docs.github.com/en/copilot/how-tos/chat-with-copilot/chat-in-ide?tool=vscode)。

```text
backend/static/app.js の入力検証を、振る舞いを変えずに独立した関数へ抽出してください。
変更前に、検証処理と申請API呼び出しの流れを初心者向けに説明してください。
必須・メール・電話・入社予定日のルールは変えず、新機能は追加しないでください。
生成したコードの差分と、フロントだけで検証してはいけない理由も説明してください。
```

你需要看懂差分再接受。接受后重新执行后端测试和浏览器申请流程，保存 Copilot 对话及改动截图。这是对已有版本的一次真实 Copilot 代码生成和重构练习。

## 3. 用 Copilot 生成边界测试

```text
tests/test_app.py を読み、既存テストに不足している境界条件を挙げてください。
例えば日本時間の深夜0時前後での入社予定日判定、電話番号の10桁・15桁境界、
文字数上限のちょうど境界を、unittest でテストしてください。
時刻は固定してテストし、テスト対象と同じ実装をテスト側にコピーしないでください。
```

运行 `python -m unittest discover -s tests -v`。若报错，将相关错误和对应文件交给 Copilot 调查，不要给它任何 AWS 密钥或真实员工资料。参考 [Copilot 测试教程](https://docs.github.com/en/copilot/tutorials/write-tests)。

## 4. 你必须能解释的内容

- 点击申请后，浏览器如何发 POST？服务端何时返回 201？
- 为什么浏览器校验后，服务端仍必须校验？
- 申请编号、状态、申请时间为什么由服务端生成？
- 为什么刷新后记录仍在？SQLite 与 DynamoDB 分别在哪里？
- Lambda 如何取得 DynamoDB 权限？为什么不用把 AWS 密钥放在 JavaScript？
- 共享访问码有什么限制？这次为什么只能用虚构数据？

## 5. 使用记录（实际完成后填写）

| 时间 | 工具 | 提示内容 | 生成结果 | 人工检查 / 修改 | 验证结果 |
| --- | --- | --- | --- | --- | --- |
| 待填写 | Kiro | 需求与设计整理 | 待执行 | 待检查 | 待验证 |
| 待填写 | Copilot | 验证函数重构 | 待执行 | 待检查 | 待验证 |
| 待填写 | Copilot Chat | 测试生成 / 错误调查 | 待执行 | 待检查 | 待验证 |
