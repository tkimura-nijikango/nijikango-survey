/**
 * ニジ看護 チャット形式Webアンケート
 * 質問データ定義（看護師専用）
 */

// ===============================
// 看護師向け施設形態マッピング
// ===============================
const NURSING_FACILITIES = {
    '病院': ['正看護師', '准看護師', '助産師', '看護助手', '管理職', '専門看護師', '認定看護師'],
    'クリニック': ['正看護師', '准看護師', '医療事務', '看護助手', '管理職'],
    '訪問看護': ['正看護師', '准看護師', '理学療法士', '作業療法士', 'ケアマネジャー'],
    '介護施設': ['正看護師', '准看護師', '介護福祉士', 'ケアマネジャー', '看護助手'],
    'その他': ['保健師', '産業看護師', '治験コーディネーター', '保育園看護師', '学校看護師', 'その他']
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
// 看護師向け質問フロー
// ===============================
const QUESTIONS = [
    {
        id: 'timing',
        type: 'single',
        message: '転職を希望する時期を教えてください！',
        options: ['すぐにでも', '3ヶ月以内', '半年以内', '良い求人があれば'],
        autoAdvance: true,
        saveAs: '転職希望時期'
    },
    {
        id: 'facilities',
        type: 'multiple',
        message: '希望の施設形態を教えてください！\n（最大2つまで選択できます）',
        options: Object.keys(NURSING_FACILITIES),
        maxSelect: 2,
        autoAdvance: true,
        saveAs: '希望職種（大枠）'
    },
    {
        id: 'jobTypes',
        type: 'multiple-dynamic',
        message: '希望の職種を選んでください！\n（最大3つまで選択できます）',
        dependsOn: 'facilities',
        maxSelect: 3,
        autoAdvance: true,
        saveAs: '希望職種（キーワード）'
    },
    {
        id: 'workStyle',
        type: 'multiple',
        message: '希望の働き方を教えてください！\n（複数選択OK）',
        options: [
            '日勤のみ', '夜勤あり', '2交代制', '3交代制',
            '駅近', '車通勤可', '扶養内', '残業少なめ',
            'オンコールなし', '未経験可', 'ブランク可', '託児所あり'
        ],
        maxSelect: 12,
        autoAdvance: false,
        saveAs: '希望の働き方'
    },
    {
        id: 'location',
        type: 'prefecture',
        message: '希望の勤務地を教えてください！',
        autoAdvance: true,
        saveAs: '希望勤務地'
    },
    {
        id: 'license',
        type: 'multiple',
        message: '保有資格を教えてください！\n（複数選択OK）',
        options: [
            '正看護師', '准看護師', '助産師', '保健師',
            '専門看護師', '認定看護師', '認定看護管理者',
            '資格なし（看護助手等）'
        ],
        maxSelect: 8,
        autoAdvance: false,
        saveAs: '資格'
    },
    {
        id: 'experience',
        type: 'single',
        message: '臨床経験年数を教えてください！',
        options: ['1年未満', '1-3年', '3-5年', '5-10年', '10年以上', '経験なし'],
        autoAdvance: true,
        saveAs: '臨床経験'
    },
    {
        id: 'salary',
        type: 'single',
        message: '希望の最低年収を教えてください！',
        options: [
            '300万円以上', '400万円以上', '500万円以上',
            '600万円以上', '700万円以上', '800万円以上',
            'こだわらない'
        ],
        autoAdvance: true,
        saveAs: '希望最低年収'
    },
    {
        id: 'education',
        type: 'single',
        message: '最終学歴を教えてください！',
        options: ['看護大学院卒', '看護大学卒', '看護短大卒', '看護専門学校卒', 'その他'],
        autoAdvance: true,
        saveAs: '最終学歴'
    },
    {
        id: 'birthday',
        type: 'date',
        message: '生年月日を教えてください！',
        autoAdvance: false,
        saveAs: '生年月日'
    },
    {
        id: 'name',
        type: 'text',
        message: 'お名前を教えてください！',
        placeholder: '例：山田 花子',
        validation: {
            required: true,
            minLength: 2,
            errorMessage: 'お名前を入力してください'
        },
        autoAdvance: false,
        saveAs: '本名'
    },
    {
        id: 'phone',
        type: 'tel',
        message: '最後に、電話番号を教えてください！\n（ハイフンなしで入力）',
        placeholder: '例：09012345678',
        validation: {
            required: true,
            pattern: /^0[789]0\d{8}$/,
            errorMessage: '正しい携帯電話番号を入力してください'
        },
        autoAdvance: false,
        isLast: true,
        saveAs: '電話番号'
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
