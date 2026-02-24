/**
 * ニジ看護 チャット形式Webアンケート
 * 質問データ定義（4問構成・シナリオ分岐対応版）
 * ★ 全質問が「ユーザー管理」シートのヘッダーに直接対応
 */

// ===============================
// 質問フロー（4問・シナリオ分岐）
// ===============================
const QUESTIONS = [
    // Q1: 最も優先する条件（メイン軸の決定）
    {
        id: 'priority',
        type: 'single',
        message: 'これから希望にマッチする求人だけを、独自のデータから厳選してご紹介します。\nまずは、今の「本音の希望」を教えてください！\n\n下記の中で、今最も優先したい条件はどれですか？',
        options: [
            '夜勤の負担を減らしたい',
            '月収をアップさせたい',
            '勤務施設にこだわりたい'
        ],
        autoAdvance: true,
        saveAs: '優先条件',
        displayStep: 1
    },

    // Q2a: 夜勤頻度（Q1で「夜勤」を選んだ場合のみ表示）
    {
        id: 'nightShift',
        type: 'single',
        branch: { dependsOn: 'priority', showWhen: '夜勤の負担を減らしたい' },
        message: 'ありがとうございます！無理のない働き方を提案します。\n希望の夜勤回数は、月に最大何回までですか？',
        options: [
            '夜勤なし（日勤のみ）',
            '月に1回程度',
            '月に2〜3回',
            '月に4〜5回',
            '特に制限なし（稼ぎたい）'
        ],
        autoAdvance: true,
        saveAs: '夜勤頻度',
        displayStep: 2
    },

    // Q2b: 希望月収（Q1で「月収」を選んだ場合のみ表示）
    {
        id: 'targetSalary',
        type: 'single',
        branch: { dependsOn: 'priority', showWhen: '月収をアップさせたい' },
        message: '承知いたしました。生活を豊かにするための目標ですね！\n希望の月収（総支給額）はいくら位をお考えですか？',
        options: [
            '月収25〜30万円',
            '月収31〜35万円',
            '月収36〜40万円',
            '月収41〜50万円',
            '月収51万円以上'
        ],
        autoAdvance: true,
        saveAs: '希望月収',
        displayStep: 2
    },

    // Q2c: 希望施設（Q1で「施設」を選んだ場合のみ表示）
    {
        id: 'facilityType',
        type: 'single',
        branch: { dependsOn: 'priority', showWhen: '勤務施設にこだわりたい' },
        message: '働く環境は大切ですよね。\nご希望の勤務施設の種類を教えてください。',
        options: [
            '一般病院・大学病院',
            'クリニック・診療所',
            '美容クリニック',
            '訪問看護ステーション',
            '介護施設（有料ホーム等）',
            '一般企業（産業看護師等）'
        ],
        autoAdvance: true,
        saveAs: '希望職種（大枠）',
        displayStep: 2
    },

    // Q3: 郵便番号（エリア情報取得）
    {
        id: 'postalCode',
        type: 'postalCode',
        message: 'お探しの地域（勤務地）はどこですか？\n通勤30分圏内など、ご自宅に近い求人を照合します。',
        placeholder: '郵便番号（ハイフンなし）を入力 例：1234567',
        validation: {
            required: true,
            pattern: /^\d{7}$/,
            errorMessage: '7桁の郵便番号を入力してください'
        },
        autoAdvance: false,
        saveAs: '郵便番号',
        displayStep: 3
    },

    // Q4: 保有資格＋希望の働き方（複合型）
    {
        id: 'licenseAndWork',
        type: 'combined',
        message: '最後に、現在の資格と希望の雇用形態を教えてください。\nこれにより、非公開の特別案件を特定できます！',
        sections: [
            {
                label: '▼保有資格',
                id: 'license',
                options: ['正看護師', '准看護師', '助産師', 'その他'],
                saveAs: '資格'
            },
            {
                label: '▼希望の働き方',
                id: 'workStyle',
                options: ['常勤（夜勤あり）', '日勤常勤', 'パート / アルバイト'],
                saveAs: '希望の働き方'
            }
        ],
        isLast: true,
        displayStep: 4
    }
];

// ===============================
// エクスポート
// ===============================
window.QUESTIONS = QUESTIONS;
window.inflowTag = 'nursing';
