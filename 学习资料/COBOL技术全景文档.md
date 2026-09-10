# COBOL 技术全景文档 / COBOL技術大全

---

## 目次 / 目次

1. [COBOL概述 / COBOL概要](#1)
2. [程序结构 / プログラム構造](#2)
3. [编码规则 / コーディングルール](#3)
4. [数据类型 / データ型](#4)
5. [数据定义 / データ定義](#5)
6. [基本语句 / 基本命令文](#6)
7. [条件分支 / 条件分岐](#7)
8. [循环 / 繰り返し](#8)
9. [数组 / 配列](#9)
10. [表探索 / テーブル探索](#10)
11. [字符串操作 / 文字列操作](#11)
12. [文件处理 / ファイル処理](#12)
13. [子程序 / サブプログラム](#13)
14. [排序 / SORT](#14)
15. [字符串函数 / 組み込み関数](#15)
16. [开发环境 / 開発環境](#16)
17. [学习路线 / 学習ロードマップ](#17)

---

<h2 id="1">1. COBOL概述 / COBOL概要</h2>

### 1.1 什么是COBOL / COBOLとは

COBOL（Common Business Oriented Language）は、1959年に米国で開発された**事務処理用プログラミング言語**です。英語に近い構文を持ち、**可読性が高い**ことが特徴です。

- 誕生: 1959年（66年の歴史）
- 設計目的: 事務処理・商業データ処理
- 特徴: 英語ライクな構文、高い可読性、安定性
- 現役コード: 世界で**2200億行**が稼働中
- 処理規模: 世界のATM取引の**95%**、金融取引の**80%** を処理

### 1.2 主要用途 / 主な用途

| 分野 | 具体例 |
|------|--------|
| 金融 / 金融 | 銀行勘定系システム、保険業務システム |
| 官公庁 / 政府 | 税務、社会保障、住民記録システム |
| 企業基幹 / 企业核心 | 給与計算、在庫管理、受発注管理 |
| 交通 / 交通 | 座席予約システム、運行管理 |

### 1.3 优缺点 / メリット・デメリット

| メリット / 优点 | デメリット / 缺点 |
|-----------------|-------------------|
| 可読性が高い / 可读性高 | コードが冗長 / 代码冗长 |
| 安定性・信頼性が極めて高い / 极其稳定可靠 | 学習リソースが少ない / 学习资源少 |
| 10進数演算が正確 / 十进制运算精确 | モダンな開発環境との親和性が低い / 与现代开发环境亲和性低 |
| 大量データ処理に最適 / 适合海量数据处理 | Web/モバイル開発には不向き / 不适合Web/移动开发 |
| 技術者が少なく希少価値が高い / 技术人员稀缺 | 新規開発案件が減少傾向 / 新开发项目减少 |

---

<h2 id="2">2. 程序结构 / プログラム構造</h2>

### 2.1 四大部 / 4つの部（DIVISION）

COBOLプログラムは以下の**4つの部（DIVISION）**で構成されます。

```
       IDENTIFICATION DIVISION.         ① 見出し部（标识部）
       PROGRAM-ID. SAMPLE.
       
       ENVIRONMENT DIVISION.            ② 環境部（环境部）
       DATA DIVISION.                   ③ データ部（数据部）
       PROCEDURE DIVISION.              ④ 手続き部（过程部）
           DISPLAY "HELLO"
           STOP RUN.
```

**各部の役割 / 各部的作用:**

| 部 / Division | 役割 / 作用 | 必須 / 必需 |
|---------------|-------------|------------|
| IDENTIFICATION DIVISION | プログラム名の定義 / 定义程序名 | **必須** |
| ENVIRONMENT DIVISION | ファイル・環境変数の定義 / 定义文件、环境变量 | 省略可 |
| DATA DIVISION | 変数・データの定義 / 定义变量、数据 | 省略可 |
| PROCEDURE DIVISION | 処理の記述 / 描述处理逻辑 | **必須**（SIT COBOL） |

### 2.2 部・節・段落の階層 / 部·节·段落层次

```
IDENTIFICATION DIVISION.         ← 部（DIVISION）
       PROGRAM-ID. SAMPLE.       ← 段落（PARAGRAPH）

ENVIRONMENT DIVISION.            ← 部
       INPUT-OUTPUT SECTION.     ← 節（SECTION）
       FILE-CONTROL.             ← 段落
           SELECT INFILE ...     ← 文（文は段落に属する）

DATA DIVISION.                   ← 部
       WORKING-STORAGE SECTION.  ← 節
       01 WS-DATA PIC X(10).     ← データ記述

PROCEDURE DIVISION.              ← 部
       MAIN-00.                  ← 段落
           DISPLAY "HELLO".      ← 文
           STOP RUN.
```

### 2.3 A領域とB領域のルール / A区域与B区域的规则

| 領域 / 区域 | 桁数 / 列 | 記述するもの / 书写内容 |
|-------------|-----------|------------------------|
| A領域 | **8～11桁目** | 部・節・段落の開始、レベル番号01/77 |
| B領域 | **12～72桁目** | 命令文、SELECT文、レベル番号02～49/66/88 |
| 標識領域 | **7桁目** | `*`=コメント行、`-`=継続行、`D`=デバッグ行 |
| 行番号領域 | **1～6桁目** | 行番号（自動採番されることが多い） |

**重要:** 部・節・段落の定義は**必ずA領域（8桁目）**から書き始めます。命令文は**B領域（12桁目）**から書きます。

```
000010* 列:1    8        12
000020*    |    |        |
000030 IDENTIFICATION DIVISION.     ← A領域から開始
000040 PROGRAM-ID. HELLO.           ← 段落（A領域）
000050 PROCEDURE DIVISION.          ← 部（A領域）
000060     DISPLAY "HELLO".         ← B領域から開始
000070     STOP RUN.
```

> **SIT COBOL補足:** SIT COBOLではA領域/B領域の区別はやや緩く、B領域に書くべきものをA領域に書いても動作することが多いが、**COB85規格の作法として覚えておくこと**。

---

<h2 id="3">3. 编码规则 / コーディングルール</h2>

### 3.1 基本ルール / 基本规则

- **1行80桁**まで（73～80桁目はコメント領域として無視されることが多い）
- **文の終わりはピリオド（.）**
- 大文字・小文字の区別なし（伝統的に大文字で書く）
- **コメント行:** 7桁目に `*` を置く
- **文中コメント:** `*>`

```
000100* この行はコメントです
000200     DISPLAY "HELLO" *> これもコメント
```

### 3.2 自由形式 / 自由格式

近代のCOBOL処理系（GnuCOBOL、SIT COBOL等）では**自由形式（free format）**もサポートしています。

```
IDENTIFICATION DIVISION.
PROGRAM-ID. FREE1.
PROCEDURE DIVISION.
DISPLAY "自由形式で書けます".
STOP RUN.
```

自由形式ではA領域/B領域の制限がなくなり、**行頭から自由に記述**できます。

---

<h2 id="4">4. 数据类型 / データ型</h2>

### 4.1 基本データ型 / 基本数据类型

| PIC句 / PIC子句 | 意味 / 含义 | 例 / 示例 |
|----------------|------------|-----------|
| `PIC X(n)` | 英数字（文字列）n桁 | `PIC X(20)` で20桁の文字列 |
| `PIC 9(n)` | 数字n桁 | `PIC 9(4)` で4桁の数値（0～9999） |
| `PIC S9(n)` | 符号付き数字 | `PIC S9(4)` で符号付き4桁数値 |
| `PIC 9(n)V9(m)` | 小数を含む数字 | `PIC 9(3)V99` で整数3桁＋小数2桁 |
| `PIC N(n)` | 日本語（全角）n文字 | `PIC N(10)` で全角10文字 |

### 4.2 編集文字 / 编辑字符

| 文字 / 字符 | 意味 / 含义 |
|------------|------------|
| `Z` | 先頭ゼロを空白に置換 / 将前导零替换为空格 |
| `*` | 先頭ゼロを`*`に置換（チェック対策） |
| `$` | 通貨記号を付加 / 添加货币符号 |
| `.` | 小数点を挿入 / 插入小数点 |
| `,` | 3桁区切りカンマ / 千位分隔逗号 |
| `-` | 負号の表示制御 / 控制负号显示 |
| `0` | 強制的に0を表示 / 强制显示0（ゼロ挿入） |
| `B` | 空白を挿入 / 插入空格 |

**例:**

```
01 WS-AMOUNT PIC 9(5).         →     12345
01 WS-DISP  PIC ZZZZ9.         →   12345（または 12345、先頭ゼロは空白に）
01 WS-PRICE PIC $$$$9.99.      →   $12345.00
01 WS-FORMAT PIC Z,ZZZ,ZZ9.99. →   12,345.00
```

### 4.3 レベル番号 / 层号

| レベル / 层号 | 用途 / 用途 |
|--------------|------------|
| **01** | 最上位のグループ項目（A領域から開始） |
| **02～49** | 従属項目（階層を表現、B領域から開始） |
| **66** | RENAMES句で再グループ化（特殊用途） |
| **77** | 独立した基本項目（A領域から開始） |
| **88** | 条件名（VALUEに基づく論理名） |

---

<h2 id="5">5. 数据定义 / データ定義</h2>

### 5.1 WORKING-STORAGE SECTION（作業場所節）

プログラム内で使用する**変数**を定義します。

```
DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-NAME    PIC X(20).          * 文字列変数
01 WS-COUNT   PIC 9(4) VALUE 0.   * 数値変数（初期値0）
01 WS-PRICE   PIC 9(5)V99.        * 小数含む数値
01 WS-GROUP.                       * グループ項目
    05 WS-YEAR  PIC 9(4).
    05 WS-MONTH PIC 9(2).
    05 WS-DAY   PIC 9(2).
01 WS-AREA.
    05 WS-ITEM  PIC 9(3) OCCURS 10 TIMES.  * 配列
77 WS-FLAG    PIC X(1).           * 独立項目（77レベル）
    88 WS-OK    VALUE "Y".        * 条件名（88レベル）
    88 WS-NG    VALUE "N".
```

### 5.2 SCREEN SECTION（画面節）

画面に表示する項目の**レイアウト定義**を行います。（SIT COBOLの特徴的な機能）

```
DATA DIVISION.
WORKING-STORAGE SECTION.
01 YES-NO PIC X.
SCREEN SECTION.
01 S-MAIN.
    03 VALUE "商品管理システム" LINE 1 COLUMN 30.
    03 VALUE "1. 登録"          LINE 5 COLUMN 10.
    03 VALUE "2. 照会"          LINE 6 COLUMN 10.
    03 VALUE "3. 終了"          LINE 8 COLUMN 10.
    03 VALUE "選択＞"           LINE 10 COLUMN 10.
01 S-INPUT PIC X(1) TO YES-NO LINE 10 COLUMN 18.
```

### 5.3 FILE SECTION（ファイル節）

ファイル入出力を行う場合のレコード定義を行います。

```
DATA DIVISION.
FILE SECTION.
FD INFILE.
01 IN-REC.
    05 IN-CODE   PIC X(6).
    05 IN-NAME   PIC X(30).
    05 IN-PRICE  PIC 9(8).
```

---

<h2 id="6">6. 基本语句 / 基本命令文</h2>

### 6.1 DISPLAY文（画面出力）

```
* 文字列出力
DISPLAY "HELLO WORLD".

* 変数の出力
DISPLAY WS-NAME.

* 複数項目の出力
DISPLAY "名前: " WS-NAME " 年齢: " WS-AGE.

* 改行なし
DISPLAY "入力待ち..." WITH NO ADVANCING.
ACCEPT WS-INPUT.
```

### 6.2 ACCEPT文（キーボード入力）

```
* コンソール入力
ACCEPT WS-INPUT.

* 日付・時刻の取得
ACCEPT WS-DATE FROM DATE.       * YYMMDD形式
ACCEPT WS-TIME FROM TIME.       * HHMMSS形式
```

### 6.3 MOVE文（代入）

```
* リテラルの代入
MOVE "COBOL" TO WS-NAME.
MOVE 100 TO WS-COUNT.

* 変数間の代入
MOVE WS-INPUT TO WS-OUTPUT.

* グループ項目の一括代入
MOVE WS-GROUP1 TO WS-GROUP2.

* 特殊な値
MOVE SPACE TO WS-NAME.     * 空白で埋める
MOVE ZERO TO WS-COUNT.     * ゼロで埋める
MOVE HIGH-VALUE TO WS-KEY. * 最大値で埋める
```

### 6.4 COMPUTE文（計算）

COBOLで四則演算を行うにはCOMPUTE文が最も現代的です。

```
COMPUTE WS-RESULT = WS-A + WS-B.
COMPUTE WS-RESULT = WS-A - WS-B.
COMPUTE WS-RESULT = WS-A * WS-B.
COMPUTE WS-RESULT = WS-A / WS-B.
COMPUTE WS-RESULT = (WS-A + WS-B) * 2.
COMPUTE WS-RESULT = WS-A ** 2.        * べき乗
```

**伝統的な演算文:**

```
ADD WS-A TO WS-B.                        * WS-B = WS-B + WS-A
ADD WS-A WS-B GIVING WS-RESULT.         * WS-RESULT = WS-A + WS-B
SUBTRACT WS-A FROM WS-B.                 * WS-B = WS-B - WS-A
SUBTRACT WS-A FROM WS-B GIVING WS-RES.  * WS-RES = WS-B - WS-A
MULTIPLY WS-A BY WS-B.                   * WS-B = WS-B * WS-A
DIVIDE WS-A INTO WS-B.                   * WS-B = WS-B / WS-A
DIVIDE WS-A BY WS-B GIVING WS-Q REMAINDER WS-R.
```

### 6.5 INITIALIZE文（初期化）

変数を初期値（数字項目は0、英数字項目は空白）に戻します。

```
INITIALIZE WS-GROUP.                     * グループ全体を初期化
INITIALIZE WS-NAME WS-COUNT.             * 複数項目を初期化
INITIALIZE WS-GROUP REPLACING NUMERIC DATA BY 0
                                ALPHANUMERIC DATA BY SPACE.
```

---

<h2 id="7">7. 条件分支 / 条件分岐</h2>

### 7.1 IF文

```
IF WS-AGE >= 20 THEN
    DISPLAY "成人"
ELSE
    DISPLAY "未成年"
END-IF.
```

**複数条件:**

```
IF WS-CODE = "A" AND WS-FLAG = "Y" THEN
    DISPLAY "条件成立"
END-IF.
```

**ネストIF:**

```
IF WS-CODE = "A" THEN
    IF WS-AMOUNT > 10000 THEN
        DISPLAY "A区分・高額"
    ELSE
        DISPLAY "A区分・通常"
    END-IF
ELSE
    DISPLAY "A区分以外"
END-IF.
```

### 7.2 EVALUATE文（多岐分岐）

EVALUATE文は複数の条件を簡潔に記述できます。

```
EVALUATE WS-CODE
    WHEN "A"  DISPLAY "優"
    WHEN "B"  DISPLAY "良"
    WHEN "C"  DISPLAY "可"
    WHEN OTHER DISPLAY "不可"
END-EVALUATE.
```

**EVALUATE TRUE（条件式の利用）:**

```
EVALUATE TRUE
    WHEN WS-SCORE >= 80  DISPLAY "A"
    WHEN WS-SCORE >= 60  DISPLAY "B"
    WHEN WS-SCORE >= 40  DISPLAY "C"
    WHEN OTHER           DISPLAY "D"
END-EVALUATE.
```

### 7.3 88レベル（条件名）

88レベルを使うと条件に**名前を付ける**ことができ、可読性が向上します。

```
01 WS-STATUS PIC X(1).
    88 WS-ACTIVE   VALUE "A".
    88 WS-INACTIVE VALUE "I".
    88 WS-ERROR    VALUE "E".
    88 WS-VALID    VALUE "A" "I".         * 複数の値を指定

* 以下のように使える
IF WS-ACTIVE THEN
    DISPLAY "アクティブです"
END-IF.

IF NOT WS-VALID THEN
    DISPLAY "無効なステータス"
END-IF.
```

---

<h2 id="8">8. 循环 / 繰り返し</h2>

### 8.1 PERFORM TIMES（回数指定）

```
PERFORM 5 TIMES
    DISPLAY "繰り返し"
END-PERFORM.
```

### 8.2 PERFORM UNTIL（条件付きループ）

```
01 WS-I PIC 9(2) VALUE 1.
PERFORM UNTIL WS-I > 10
    DISPLAY "I = " WS-I
    ADD 1 TO WS-I
END-PERFORM.
```

### 8.3 PERFORM VARYING（FOR文相当）

最も強力なループ構文です。**初期値・増分・終了条件**を1行で指定します。

```
PERFORM VARYING WS-I FROM 1 BY 1
        UNTIL WS-I > 10
    DISPLAY "I = " WS-I
END-PERFORM.
```

**減算ループ:**

```
PERFORM VARYING WS-I FROM 10 BY -1
        UNTIL WS-I < 1
    DISPLAY "I = " WS-I
END-PERFORM.
```

**2重ループ:**

```
PERFORM VARYING WS-I FROM 1 BY 1 UNTIL WS-I > 9
    PERFORM VARYING WS-J FROM 1 BY 1 UNTIL WS-J > 9
        COMPUTE WS-RES = WS-I * WS-J
        DISPLAY WS-I "x" WS-J "=" WS-RES
    END-PERFORM
END-PERFORM.
```

### 8.4 PERFORM 段落名（手続き呼出）

段落や節を**サブルーチンとして呼び出す**ことができます。

```
PROCEDURE DIVISION.
    PERFORM MAIN-PROC.
    STOP RUN.

MAIN-PROC.
    DISPLAY "メイン処理".
    PERFORM SUB-PROC.
    DISPLAY "メインに戻った".

SUB-PROC.
    DISPLAY "サブ処理".
```

**PERFORM THRU（複数段落の連続実行）:**

```
PERFORM A-PARA THRU C-PARA.
STOP RUN.

A-PARA.
    DISPLAY "A".
B-PARA.
    DISPLAY "B".
C-PARA.
    DISPLAY "C".
D-PARA.
    DISPLAY "D（実行されない）".
```

**PERFORMのネスト:**

PERFORM文の中からさらにPERFORMを呼び出す「ネスト実行」が可能です。

```
PERFORM 3 TIMES
    DISPLAY "外側ループ"
    PERFORM 2 TIMES
        DISPLAY "  内側ループ"
    END-PERFORM
END-PERFORM.
```

---

<h2 id="9">9. 数组 / 配列</h2>

### 9.1 OCCURS句

OCCURS句で**配列**を定義します。

```
01 WS-TABLE.
    05 WS-ITEM PIC 9(3) OCCURS 10 TIMES.
```

**添字（サブスクリプト）:**

COBOLの配列添字は**1始まり**です。

```
MOVE 100 TO WS-ITEM(1).
MOVE 200 TO WS-ITEM(2).
DISPLAY WS-ITEM(1).
```

**ループで全要素処理:**

```
PERFORM VARYING WS-I FROM 1 BY 1 UNTIL WS-I > 10
    DISPLAY "ITEM(" WS-I ") = " WS-ITEM(WS-I)
END-PERFORM.
```

### 9.2 多次元配列

OCCURSをネストすることで多次元配列を定義できます。

```
01 WS-MATRIX.
    05 WS-ROW OCCURS 3 TIMES.
        10 WS-COL PIC 9(3) OCCURS 4 TIMES.

* 参照: WS-COL(行, 列)
MOVE 100 TO WS-COL(1, 1).
MOVE 200 TO WS-COL(1, 2).
```

### 9.3 INDEXED BY（索引）

SEARCH ALL（二分探索）を使う場合はINDEXED BYが必要です。

```
01 WS-TABLE.
    05 WS-ITEM PIC X(10) OCCURS 100 TIMES
           ASCENDING KEY WS-ITEM
           INDEXED BY WS-IDX.
```

---

<h2 id="10">10. 表探索 / テーブル探索</h2>

### 10.1 SEARCH文（線形探索）

```
SEARCH WS-ITEM VARYING WS-I
    AT END DISPLAY "見つかりません"
    WHEN WS-ITEM(WS-I) = WS-SEARCH
        DISPLAY "発見: " WS-ITEM(WS-I)
END-SEARCH.
```

### 10.2 SEARCH ALL（二分探索）

OCCURSにASCENDING KEYとINDEXED BYが必要です。

```
SEARCH ALL WS-ITEM
    AT END DISPLAY "見つかりません"
    WHEN WS-ITEM(WS-IDX) = WS-SEARCH
        DISPLAY "発見: " WS-ITEM(WS-IDX)
END-SEARCH.
```

---

<h2 id="11">11. 字符串操作 / 文字列操作</h2>

### 11.1 STRING文（文字列連結）

```
STRING WS-FIRST-NAME " " WS-LAST-NAME
    DELIMITED BY SIZE INTO WS-FULL-NAME
END-STRING.
```

`DELIMITED BY SIZE`は項目の**全長**を連結します。
`DELIMITED BY SPACE`は項目内の**最初の空白まで**を連結します。

### 11.2 UNSTRING文（文字列分解）

```
UNSTRING WS-FULL-NAME DELIMITED BY SPACE
    INTO WS-PART1 WS-PART2 WS-PART3
END-UNSTRING.
```

### 11.3 INSPECT文（文字列検索・置換）

```
* 文字カウント
INSPECT WS-STRING TALLYING WS-CNT FOR ALL "A".

* 文字置換
INSPECT WS-STRING REPLACING ALL "A" BY "B".
INSPECT WS-STRING REPLACING LEADING SPACE BY ZERO.
```

---

<h2 id="12">12. 文件处理 / ファイル処理</h2>

### 12.1 ファイル定義 / 文件定义

ファイルを使うには**ENVIRONMENT DIVISION**と**DATA DIVISION**の両方で定義が必要です。

```
ENVIRONMENT DIVISION.
INPUT-OUTPUT SECTION.
FILE-CONTROL.
    SELECT INFILE ASSIGN TO "input.txt"
        ORGANIZATION IS LINE SEQUENTIAL.
    SELECT OUTFILE ASSIGN TO "output.txt"
        ORGANIZATION IS LINE SEQUENTIAL.

DATA DIVISION.
FILE SECTION.
FD INFILE.
01 IN-REC.
    05 IN-CODE   PIC X(6).
    05 IN-NAME   PIC X(30).
    05 IN-PRICE  PIC 9(8).
FD OUTFILE.
01 OUT-REC.
    05 OUT-CODE  PIC X(6).
    05 OUT-NAME  PIC X(30).
    05 OUT-PRICE PIC 9(8).
```

### 12.2 ファイル読込 / 文件读取

```
PROCEDURE DIVISION.
    OPEN INPUT INFILE.
    PERFORM UNTIL 1 = 2
        READ INFILE INTO IN-REC
            AT END EXIT PERFORM
            NOT AT END DISPLAY IN-NAME
        END-READ
    END-PERFORM.
    CLOSE INFILE.
```

### 12.3 ファイル書込 / 文件写入

```
PROCEDURE DIVISION.
    OPEN OUTPUT OUTFILE.
    MOVE "A001"  TO OUT-CODE.
    MOVE "商品A" TO OUT-NAME.
    MOVE 1000    TO OUT-PRICE.
    WRITE OUT-REC.
    CLOSE OUTFILE.
```

### 12.4 ファイルステータス / 文件状态

```
FILE-CONTROL.
    SELECT INFILE ASSIGN TO "data.txt"
        FILE STATUS IS WS-FILE-STATUS.

PROCEDURE DIVISION.
    OPEN INPUT INFILE.
    IF WS-FILE-STATUS NOT = "00"
        DISPLAY "ファイルエラー: " WS-FILE-STATUS
    END-IF.
```

| ステータス / 状态 | 意味 / 含义 |
|-------------------|------------|
| 00 | 成功 |
| 10 | ファイル終了（AT END） |
| 30 | 永続的エラー |
| 90 | 存在しないファイル/パス |

---

<h2 id="13">13. 子程序 / サブプログラム</h2>

### 13.1 CALL文（サブプログラム呼出）

**呼び出し側:**

```
IDENTIFICATION DIVISION.
PROGRAM-ID. MAINPROG.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-MSG PIC X(20) VALUE "Hello Subprogram".
PROCEDURE DIVISION.
    CALL "SUBPROG" USING WS-MSG
    DISPLAY "戻り値: " WS-MSG
    STOP RUN.
```

**呼ばれる側:**

```
IDENTIFICATION DIVISION.
PROGRAM-ID. SUBPROG.
PROCEDURE DIVISION USING WS-DATA.
    DISPLAY "サブで受信: " WS-DATA
    MOVE "Changed!!" TO WS-DATA
    EXIT PROGRAM.
```

### 13.2 CANCEL文

呼び出したサブプログラムを解放します。

```
CALL "SUBPROG" USING WS-DATA.
CANCEL "SUBPROG".
```

---

<h2 id="14">14. 排序 / SORT</h2>

SORT文を使うとファイル内のデータを**昇順または降順**に並べ替えられます。

```
SORT WORK-FILE ON ASCENDING KEY OUT-NAME
                    DESCENDING KEY OUT-PRICE
    USING INFILE
    GIVING OUTFILE.
```

- `WORK-FILE`: SD（Sort Description）で定義した作業ファイル
- `USING`: 入力ファイル
- `GIVING`: 出力ファイル
- `ASCENDING KEY` / `DESCENDING KEY`: ソートキー

---

<h2 id="15">15. 字符串函数 / 組み込み関数</h2>

COBOL 2002以降で使える組み込み関数の一部です。

| 関数 / Function | 説明 / 说明 |
|----------------|------------|
| `FUNCTION LENGTH(項目)` | データ項目の長さを返す |
| `FUNCTION TRIM(項目)` | 末尾の空白を除去 |
| `FUNCTION UPPER-CASE(項目)` | 英字を大文字に変換 |
| `FUNCTION LOWER-CASE(項目)` | 英字を小文字に変換 |
| `FUNCTION SUBSTITUTE(項目, 検索, 置換)` | 文字列置換 |
| `FUNCTION NUMVAL(項目)` | 文字列を数値に変換 |
| `FUNCTION INTEGER(項目)` | 整数化 |
| `FUNCTION MOD(A, B)` | A÷Bの余り |
| `FUNCTION CURRENT-DATE` | 現在日時（YYYYMMDDHHMMSS...） |

**例:**

```
DISPLAY FUNCTION TRIM(WS-NAME).
COMPUTE WS-MOD = FUNCTION MOD(10, 3).  * WS-MOD = 1
MOVE FUNCTION CURRENT-DATE TO WS-DATE-TIME.
```

---

<h2 id="16">16. 开发环境 / 開発環境</h2>

### 16.1 主なCOBOL処理系 / 主要COBOL处理系统

| 名称 | 種類 | 特徴 |
|------|------|------|
| **SIT COBOL** | インタプリタ（Python製） | セットアップ不要、学習用に最適、日本語完全対応、画面節対応 |
| **GnuCOBOL (OpenCOBOL)** | コンパイラ | オープンソース、Linux/Windows/Mac対応、COBOL85準拠 |
| **Visual COBOL (Micro Focus)** | 商用コンパイラ | Visual Studio統合、.NET/Java連携 |
| **Enterprise COBOL (IBM)** | 商用コンパイラ | z/OS（メインフレーム）標準、業界デファクト |
| **NetCOBOL (富士通)** | 商用コンパイラ | 日本語対応、Windows/.NET対応 |

### 16.2 SIT COBOLの特徴

**URL:** https://sit-cobol.sit11.com/
**ダウンロード:** VectorサイトからZIPを入手

- **セットアップ不要:** ZIP解凍してexeを実行するだけ
- **即実行可能:** インタプリタ方式でコードを書いたらすぐ実行
- **ステップ実行:** 1命令ずつ実行して動作確認
- **トレースモード:** 通過した行番号を表示
- **画面節対応:** SCREEN SECTIONによる本格的な画面アプリ作成可能

### 16.3 GnuCOBOLのインストール

```bash
# macOS (Homebrew)
brew install gnucobol

# Ubuntu/Debian
sudo apt install gnucobol

# コンパイルと実行
cobc -x hello.cob -free
./hello
```

---

<h2 id="17">17. 学习路线 / 学習ロードマップ</h2>

### フェーズ1: 基礎（1～2週間）
- SIT COBOLのインストールと起動
- HELLO WORLD（DISPLAY文）
- 4つのDIVISIONの理解
- コーディングルール（A領域/B領域）
- 変数定義（PIC X / 9）

### フェーズ2: 基本文法（2～4週間）
- MOVE文 / COMPUTE文
- DISPLAY文 / ACCEPT文
- IF文 / EVALUATE文
- PERFORM文（TIMES / UNTIL / VARYING）
- グループ項目とレベル番号

### フェーズ3: 応用（4～8週間）
- 配列（OCCURS）
- 88レベル（条件名）
- ファイル入出力
- STRING / UNSTRING
- サブプログラム（CALL）

### フェーズ4: 実践（8週間～）
- テーブル探索（SEARCH / SEARCH ALL）
- SORT文
- 画面節（SCREEN SECTION）アプリ開発
- 既存COBOLコードの読解
- 移行（マイグレーション）の知識

### おすすめ学習リソース

| リソース | 説明 |
|----------|------|
| SIT COBOL入門動画（YouTube） | 30回の動画で基礎から応用まで学習可能 |
| Open Mainframe Project COBOL Course | IBM提供の無料COBOLコース（英語） |
| COBOL Programming Course (GitHub) | オープンソースのCOBOL教材 |
| Udemy「C/Javaプログラマー向け COBOL入門」 | SIT COBOL開発者による有償講座 |

---

> 作成日: 2026年7月
> 対象: SIT COBOLによるCOBOL入門
> ライセンス: 自由に使用・改変可能
