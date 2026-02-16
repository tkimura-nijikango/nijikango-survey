/**
 * ニジ看護 チャット形式Webアンケート
 * 質問データ定義（看護師向け10問構成）
 * ★ 全質問が「ユーザー管理」シートのヘッダーに直接対応
 */

// ===============================
// 看護師向け施設形態 → 職種マッピング
// ===============================
const NURSING_FACILITIES = {
    '病院': ['病棟看護師', 'オペ室看護師', '外来看護師', 'ICU/救急看護師', '透析看護師', '管理職・師長'],
    'クリニック': ['外来看護師', '美容看護師', '内視鏡看護師', '訪問診療同行', '管理職'],
    '訪問看護': ['訪問看護師', '管理者', 'リハビリ担当'],
    '介護施設': ['施設看護師', 'デイサービス看護師', '管理者', 'ケアマネジャー'],
    '美容クリニック': ['美容看護師', 'カウンセラー', 'レーザー担当', 'オペ介助'],
    '健診センター': ['健診看護師', '保健指導', '採血担当'],
    '保育園・学校': ['保育園看護師', '学校看護師', '養護教諭'],
    'その他': ['産業看護師', '治験コーディネーター', 'コールセンター看護師', 'ライター・編集', 'その他']
};

// ===============================
// 都道府県データ（エリア別）
// ===============================
const PREFECTURES = {
    '関東': ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'],
    '関西': ['大阪府', '兵庫県', '京都府', '奈良県', '滋賀県', '和歌山県'],
    '東海': ['愛知県', '静岡県', '岐阜県', '三重県'],
    '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    '北陸・甲信越': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県'],
    '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
    '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
    '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
};

// ===============================
// 看護師向け質問フロー（10問）
// ===============================
const QUESTIONS = [
    // Q1: 保有資格 → ヘッダー「資格」
    {
        id: 'license',
        type: 'single',
        message: 'はじめまして！ニジ看護です💕\nまず、お持ちの資格を教えてください！',
        options: ['看護師', '准看護師', '看護学生'],
        autoAdvance: true,
        saveAs: '資格'
    },
    // Q2: 希望の働き方 → ヘッダー「希望の働き方」
    {
        id: 'workStyle',
        type: 'single',
        message: 'ありがとうございます✨\n希望の働き方を教えてください！',
        options: [
            '常勤（夜勤OK）',
            '常勤（日勤のみ）',
            '非常勤・パート',
            '派遣',
            '夜勤専従'
        ],
        autoAdvance: true,
        saveAs: '希望の働き方'
    },
    // Q3: 転職希望時期 → ヘッダー「転職希望時期」
    {
        id: 'timing',
        type: 'single',
        message: '転職を希望する時期はいつ頃ですか？🗓️',
        options: ['今すぐ', '3ヶ月以内', '6ヶ月以内', '1年以内', 'いい求人があれば'],
        autoAdvance: true,
        saveAs: '転職希望時期'
    },
    // Q4: 希望施設形態 → ヘッダー「希望職種（大枠）」
    {
        id: 'facilities',
        type: 'multiple',
        message: '希望の施設形態を教えてください！🏥\n（最大2つまで選択できます）',
        options: Object.keys(NURSING_FACILITIES),
        maxSelect: 2,
        autoAdvance: true,
        saveAs: '希望職種（大枠）'
    },
    // Q5: 希望職種（施設連動） → ヘッダー「希望職種（キーワード）」
    {
        id: 'jobTypes',
        type: 'multiple-dynamic',
        message: '希望の職種を選んでください！👩‍⚕️\n（最大3つまで選択できます）',
        dependsOn: 'facilities',
        maxSelect: 3,
        autoAdvance: true,
        saveAs: '希望職種（キーワード）'
    },
    // Q6: 住まいの郵便番号 → ヘッダー「郵便番号」(+ 住所自動取得 → 「住所」「希望勤務地」)
    {
        id: 'postalCode',
        type: 'postalCode',
        message: 'お住まいの郵便番号を教えてください📮\n（ハイフンなしで入力）',
        placeholder: '例：1500001',
        validation: {
            required: true,
            pattern: /^\d{7}$/,
            errorMessage: '7桁の郵便番号を入力してください'
        },
        autoAdvance: false,
        saveAs: '郵便番号'
    },
    // Q7: お名前 → ヘッダー「本名」
    {
        id: 'name',
        type: 'text',
        message: 'お名前を教えてください！😊',
        placeholder: '例：山田 花子',
        validation: {
            required: true,
            minLength: 2,
            errorMessage: 'お名前を入力してください'
        },
        autoAdvance: false,
        saveAs: '本名'
    },
    // Q8: 生年月日 → ヘッダー「生年月日」
    {
        id: 'birthday',
        type: 'date',
        message: '生年月日を教えてください！🎂',
        autoAdvance: false,
        saveAs: '生年月日'
    },
    // Q9: 携帯電話番号 → ヘッダー「電話番号」
    {
        id: 'phone',
        type: 'tel',
        message: '携帯電話番号を教えてください📱\n（ハイフンなしで入力）',
        placeholder: '例：09012345678',
        validation: {
            required: true,
            pattern: /^0[789]0\d{8}$/,
            errorMessage: '正しい携帯電話番号を入力してください'
        },
        autoAdvance: false,
        saveAs: '電話番号'
    },
    // Q10: 希望最低年収 → ヘッダー「希望最低年収」
    {
        id: 'salary',
        type: 'single',
        message: '最後に、希望の最低年収を教えてください！💰',
        options: [
            '300万円以上', '400万円以上', '500万円以上',
            '600万円以上', '700万円以上', '800万円以上',
            'こだわらない'
        ],
        autoAdvance: true,
        isLast: true,
        saveAs: '希望最低年収'
    }
];

// ===============================
// エクスポート
// ===============================
window.QUESTIONS = QUESTIONS;
window.PREFECTURES = PREFECTURES;
window.JOB_CATEGORIES = NURSING_FACILITIES;
window.TAG_KEYWORDS_MAPPING = { 'nursing': NURSING_FACILITIES };
window.inflowTag = 'nursing';
