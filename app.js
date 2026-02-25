/**
 * ニジ看護 チャット形式Webアンケート
 * メインアプリケーションロジック（シナリオ分岐対応版）
 */

// ===============================
// 設定
// ===============================
const CONFIG = {
    // GAS API URL
    API_URL: 'https://script.google.com/macros/s/AKfycbwgGfNXsduo1lZWAAbwJz-xdrAsXp3zTeiOx-KIrvtC4AK_09q7nV-ZYYRxoeIbXBrzqw/exec',
    // デバッグモード
    DEBUG: true,
    // メッセージ表示遅延（ms）
    MESSAGE_DELAY: 300,
    // 次の質問への遅延（ms）
    NEXT_QUESTION_DELAY: 600,
    // カレンダー予約URL
    CALENDAR_URL: 'https://nijikango-calendar.pages.dev'
};

// ===============================
// 状態管理（シナリオ分岐対応）
// ===============================
class SurveyState {
    constructor() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.lineId = this.getLineIdFromUrl();
        this.resolvedAddress = '';
        const urlParams = new URLSearchParams(window.location.search);
        this.inflowTag = urlParams.get('tag') || 'LINE';
    }

    getLineIdFromUrl() {
        if (window.__liffUserId) {
            return window.__liffUserId;
        }
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('uid') || 'TEST_USER';
    }

    setAnswer(questionId, value) {
        this.answers[questionId] = value;
        if (CONFIG.DEBUG) {
            console.log('Answer saved:', questionId, value);
            console.log('All answers:', this.answers);
        }
    }

    getAnswer(questionId) {
        return this.answers[questionId];
    }

    /**
     * 分岐条件を評価して次の有効な質問へ進む
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        while (this.currentQuestionIndex < QUESTIONS.length) {
            const q = QUESTIONS[this.currentQuestionIndex];
            if (!q.branch || this.answers[q.branch.dependsOn] === q.branch.showWhen) {
                return true;
            }
            this.currentQuestionIndex++;
        }
        return false;
    }

    /**
     * 現在の質問を取得（分岐条件を評価）
     */
    getCurrentQuestion() {
        while (this.currentQuestionIndex < QUESTIONS.length) {
            const q = QUESTIONS[this.currentQuestionIndex];
            if (!q.branch || this.answers[q.branch.dependsOn] === q.branch.showWhen) {
                return q;
            }
            this.currentQuestionIndex++;
        }
        return null;
    }

    /**
     * プログレス計算（displayStepベース、常に4問中X問）
     */
    getProgress() {
        const q = this.getCurrentQuestion();
        const step = q ? (q.displayStep || 1) : 4;
        return {
            current: step,
            total: 4,
            percentage: (step / 4) * 100
        };
    }

    /**
     * 送信データを「ユーザー管理」シートのヘッダーに直接対応する形式で生成
     */
    prepareSubmissionData() {
        const data = {
            lineId: this.lineId,
            answers: {}
        };

        QUESTIONS.forEach(q => {
            if (q.type === 'combined' && q.sections) {
                // combined型: 各セクションのsaveAsで回答を取得
                q.sections.forEach(section => {
                    const answer = this.answers[section.id];
                    if (answer !== undefined && answer !== null) {
                        data.answers[section.saveAs] = answer;
                    }
                });
            } else {
                const answer = this.answers[q.id];
                if (answer !== undefined && answer !== null) {
                    if (Array.isArray(answer)) {
                        data.answers[q.saveAs] = answer.join('、');
                    } else {
                        data.answers[q.saveAs] = answer;
                    }
                }
            }
        });

        // 流入経路タグ
        data.answers['流入経路'] = this.inflowTag;

        return data;
    }
}

// ===============================
// UI コンポーネント生成
// ===============================
class UIComponents {
    static createAgentBubble(message) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble chat-bubble--agent';
        bubble.innerHTML = `
      <div class="chat-bubble__avatar">
        <img src="aichan.jpg" alt="" class="chat-bubble__avatar-img">
      </div>
      <div class="chat-bubble__content">
        <span class="chat-bubble__name">ニジ看護アドバイザー</span>
        <div class="chat-bubble__message">${message.replace(/\n/g, '<br>')}</div>
      </div>
    `;
        return bubble;
    }

    static createUserBubble(message) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble chat-bubble--user';
        bubble.innerHTML = `
      <div class="chat-bubble__content">
        <div class="chat-bubble__message">${message}</div>
      </div>
    `;
        return bubble;
    }

    static createOptionsGrid(options, type, maxSelect) {
        const container = document.createElement('div');
        container.className = 'options-container';

        const grid = document.createElement('div');
        grid.className = 'options-grid';

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.dataset.value = option;
            grid.appendChild(btn);
        });

        container.appendChild(grid);

        if (type === 'multiple' || type === 'multiple-dynamic') {
            const counter = document.createElement('div');
            counter.className = 'selection-counter';
            counter.innerHTML = `<span class="selection-counter__current">0</span> / ${maxSelect} 選択中`;
            container.appendChild(counter);

            const actionBtns = document.createElement('div');
            actionBtns.className = 'action-buttons';
            actionBtns.innerHTML = `
        <button class="btn btn--primary" id="confirmBtn" disabled>決定する</button>
      `;
            container.appendChild(actionBtns);
        }

        return container;
    }

    static createPostalCodeInput(placeholder) {
        const container = document.createElement('div');
        container.className = 'input-group';

        container.innerHTML = `
      <input type="tel" class="input-field" id="textInput" placeholder="${placeholder}"
             pattern="[0-9]*" inputmode="numeric" autocomplete="off" maxlength="7">
      <div class="input-error hidden" id="inputError"></div>
      <div class="postal-result hidden" id="postalResult" style="margin-top:8px; padding:10px; background:#f0f8f0; border-radius:8px; font-size:0.9rem; color:#333;">
        <span id="postalAddress"></span>
      </div>
      <div class="action-buttons">
        <button class="btn btn--primary" id="nextBtn" disabled>次へ</button>
      </div>
    `;

        return container;
    }

    /**
     * 都道府県セレクタ（エリアタブ + グリッド）
     */
    static createPrefectureSelector() {
        const container = document.createElement('div');
        container.className = 'options-container';

        // エリアタブ
        const tabs = document.createElement('div');
        tabs.className = 'region-tabs';

        const regions = Object.keys(PREFECTURES);
        regions.forEach((region, index) => {
            const tab = document.createElement('button');
            tab.className = 'region-tab' + (index === 0 ? ' region-tab--active' : '');
            tab.textContent = region;
            tab.dataset.region = region;
            tabs.appendChild(tab);
        });
        container.appendChild(tabs);

        // 都道府県グリッド（初期表示: 関東）
        const grid = document.createElement('div');
        grid.className = 'prefecture-grid';
        grid.id = 'prefectureGrid';

        PREFECTURES[regions[0]].forEach(pref => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = pref;
            btn.dataset.value = pref;
            grid.appendChild(btn);
        });
        container.appendChild(grid);

        return container;
    }

    /**
     * 複合型入力（資格＋働き方を1画面で選択）
     */
    static createCombinedInput(question) {
        const container = document.createElement('div');
        container.className = 'options-container combined-container';

        question.sections.forEach(section => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'combined-section';
            sectionEl.dataset.sectionId = section.id;

            const label = document.createElement('div');
            label.className = 'combined-section__label';
            label.textContent = section.label;
            sectionEl.appendChild(label);

            const grid = document.createElement('div');
            grid.className = 'options-grid';

            section.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option;
                btn.dataset.value = option;
                btn.dataset.section = section.id;
                grid.appendChild(btn);
            });

            sectionEl.appendChild(grid);
            container.appendChild(sectionEl);
        });

        const actionBtns = document.createElement('div');
        actionBtns.className = 'action-buttons';
        actionBtns.innerHTML = `
      <button class="submit-btn" id="combinedSubmitBtn" disabled>送信する</button>
    `;
        container.appendChild(actionBtns);

        return container;
    }
}

// ===============================
// メインアプリケーション
// ===============================
class SurveyApp {
    constructor() {
        this.state = new SurveyState();
        this.chatArea = document.getElementById('chatArea');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.diagnosisScreen = document.getElementById('diagnosisScreen');

        this.selectedOptions = [];

        this.init();
    }

    init() {
        this.updateLiveCounter();
        setTimeout(() => this.showQuestion(), CONFIG.MESSAGE_DELAY);
    }

    updateLiveCounter() {
        const counter = document.getElementById('liveCount');
        if (counter) {
            const baseCount = 32;
            const variation = Math.floor(Math.random() * 10) - 5;
            counter.textContent = baseCount + variation;
        }
    }

    updateProgress() {
        const { current, total, percentage } = this.state.getProgress();
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.innerHTML = `<span class="progress-number">${current}</span>/${total}`;
    }

    showQuestion() {
        const question = this.state.getCurrentQuestion();
        if (!question) {
            this.showDiagnosisResult();
            return;
        }

        this.updateProgress();

        const bubble = UIComponents.createAgentBubble(question.message);
        this.chatArea.appendChild(bubble);
        this.scrollToBottom();

        setTimeout(() => {
            this.showInputUI(question);
            this.scrollToBottom();
        }, CONFIG.MESSAGE_DELAY);
    }

    showInputUI(question) {
        let inputElement;
        this.selectedOptions = [];
        this._autoAdvanced = false;

        switch (question.type) {
            case 'single':
                inputElement = UIComponents.createOptionsGrid(question.options, 'single');
                this.chatArea.appendChild(inputElement);
                this.setupSingleSelect(question, inputElement);
                break;

            case 'postalCode':
                inputElement = UIComponents.createPostalCodeInput(question.placeholder);
                this.chatArea.appendChild(inputElement);
                this.setupPostalCodeInput(question);
                break;

            case 'prefecture':
                inputElement = UIComponents.createPrefectureSelector();
                this.chatArea.appendChild(inputElement);
                this.setupPrefectureSelect(question);
                break;

            case 'combined':
                inputElement = UIComponents.createCombinedInput(question);
                this.chatArea.appendChild(inputElement);
                this.setupCombinedSelect(question, inputElement);
                break;
        }
    }

    setupSingleSelect(question, container) {
        const buttons = container.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.state.setAnswer(question.id, value);
                this.sendPartialAnswer(question);

                btn.classList.add('option-btn--selected');

                setTimeout(() => {
                    this.addUserResponse(value);
                    this.removeInputUI();

                    if (question.isLast) {
                        this.submitForm();
                    } else {
                        this.advanceToNext();
                    }
                }, 150);
            });
        });
    }

    /**
     * 複合型質問のセットアップ（資格＋働き方）
     */
    setupCombinedSelect(question, container) {
        const sectionSelections = {};

        question.sections.forEach(section => {
            sectionSelections[section.id] = null;
        });

        const submitBtn = container.querySelector('#combinedSubmitBtn');
        const allButtons = container.querySelectorAll('.option-btn');

        allButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sectionId = btn.dataset.section;
                const value = btn.dataset.value;

                // 同じセクション内の他のボタンの選択を解除
                const sectionEl = container.querySelector(`[data-section-id="${sectionId}"]`);
                sectionEl.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.remove('option-btn--selected');
                });

                // このボタンを選択
                btn.classList.add('option-btn--selected');
                sectionSelections[sectionId] = value;

                // 全セクション選択済みかチェック
                const allSelected = Object.values(sectionSelections).every(v => v !== null);
                submitBtn.disabled = !allSelected;
            });
        });

        submitBtn.addEventListener('click', () => {
            // 各セクションの回答を保存
            question.sections.forEach(section => {
                const value = sectionSelections[section.id];
                if (value) {
                    this.state.setAnswer(section.id, value);
                }
            });

            // ユーザー回答を表示
            const displayParts = question.sections.map(section => {
                return `${section.label.replace('▼', '')}：${sectionSelections[section.id]}`;
            });
            this.addUserResponse(displayParts.join('<br>'));
            this.removeInputUI();

            // partial answerを送信してからsubmit
            this.sendCombinedPartialAnswer(question);
            this.submitForm();
        });
    }

    setupPostalCodeInput(question) {
        const input = document.getElementById('textInput');
        const nextBtn = document.getElementById('nextBtn');
        const errorEl = document.getElementById('inputError');
        const postalResult = document.getElementById('postalResult');
        const postalAddress = document.getElementById('postalAddress');

        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            const value = input.value.trim();
            const isValid = this.validateInput(value, question.validation);
            nextBtn.disabled = !isValid;

            if (value && !isValid) {
                errorEl.textContent = question.validation.errorMessage;
                errorEl.classList.remove('hidden');
                input.classList.add('input-field--error');
                postalResult.classList.add('hidden');
            } else {
                errorEl.classList.add('hidden');
                input.classList.remove('input-field--error');
            }

            if (value.length === 7) {
                this.lookupPostalCode(value, postalResult, postalAddress);
            } else {
                postalResult.classList.add('hidden');
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !nextBtn.disabled) {
                nextBtn.click();
            }
        });

        nextBtn.addEventListener('click', () => {
            const value = input.value.trim();
            this.state.setAnswer(question.id, value);
            this.sendPartialAnswer(question);

            const displayText = this.state.resolvedAddress
                ? `〒${value}（${this.state.resolvedAddress}）`
                : `〒${value}`;
            this.addUserResponse(displayText);
            this.removeInputUI();
            this.advanceToNext();
        });

        input.focus();
    }

    setupPrefectureSelect(question) {
        const tabs = this.chatArea.querySelectorAll('.region-tab');
        const grid = document.getElementById('prefectureGrid');

        // タブ切り替え
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('region-tab--active'));
                tab.classList.add('region-tab--active');

                const region = tab.dataset.region;
                grid.innerHTML = '';
                PREFECTURES[region].forEach(pref => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.textContent = pref;
                    btn.dataset.value = pref;
                    grid.appendChild(btn);
                });

                this.setupPrefectureButtons(question);
            });
        });

        this.setupPrefectureButtons(question);
    }

    setupPrefectureButtons(question) {
        const buttons = document.getElementById('prefectureGrid').querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.state.setAnswer(question.id, value);
                this.sendPartialAnswer(question);

                btn.classList.add('option-btn--selected');

                setTimeout(() => {
                    this.addUserResponse(value);
                    this.removeInputUI();
                    this.advanceToNext();
                }, 150);
            });
        });
    }

    async lookupPostalCode(code, resultEl, addressEl) {
        try {
            const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const r = data.results[0];
                const address = `${r.address1}${r.address2}${r.address3}`;
                this.state.resolvedAddress = address;
                addressEl.textContent = address;
                resultEl.classList.remove('hidden');
            } else {
                this.state.resolvedAddress = '';
                resultEl.classList.add('hidden');
            }
        } catch (e) {
            console.error('Postal code lookup failed:', e);
            this.state.resolvedAddress = '';
        }
    }

    validateInput(value, validation) {
        if (!validation) return true;

        if (validation.required && !value) return false;
        if (validation.minLength && value.length < validation.minLength) return false;
        if (validation.pattern && !validation.pattern.test(value)) return false;

        return true;
    }

    addUserResponse(text) {
        const bubble = UIComponents.createUserBubble(text);
        this.chatArea.appendChild(bubble);
        this.scrollToBottom();
    }

    removeInputUI() {
        const optionsContainer = this.chatArea.querySelector('.options-container');
        const inputGroup = this.chatArea.querySelector('.input-group');

        if (optionsContainer) optionsContainer.remove();
        if (inputGroup) inputGroup.remove();
    }

    advanceToNext() {
        setTimeout(() => {
            if (this.state.nextQuestion()) {
                this.showQuestion();
            } else {
                this.showDiagnosisResult();
            }
        }, CONFIG.NEXT_QUESTION_DELAY);
    }

    submitForm() {
        const data = this.state.prepareSubmissionData();
        const loadingOverlay = document.getElementById('loadingOverlay');

        loadingOverlay.classList.remove('hidden');

        // GASへ送信
        fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        }).catch(e => console.error('Background submission error:', e));

        // 診断結果画面へ遷移
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            this.showDiagnosisResult();
        }, 800);
    }

    /**
     * 1問回答ごとにGASへ部分送信
     */
    sendPartialAnswer(question) {
        const lineId = this.state.lineId;
        if (!lineId || lineId === 'TEST_USER') return;

        const answers = {};
        const rawAnswer = this.state.getAnswer(question.id);

        if (rawAnswer !== undefined && rawAnswer !== null) {
            if (Array.isArray(rawAnswer)) {
                answers[question.saveAs] = rawAnswer.join('、');
            } else {
                answers[question.saveAs] = rawAnswer;
            }
        }

        const step = question.displayStep || (this.state.currentQuestionIndex + 1);

        const data = {
            action: 'partial_answer',
            lineId: lineId,
            answers: answers,
            step: step,
            totalSteps: 4
        };

        fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        }).catch(e => console.error('Partial answer send error:', e));
    }

    /**
     * combined型の部分送信
     */
    sendCombinedPartialAnswer(question) {
        const lineId = this.state.lineId;
        if (!lineId || lineId === 'TEST_USER') return;

        const answers = {};
        question.sections.forEach(section => {
            const value = this.state.getAnswer(section.id);
            if (value) {
                answers[section.saveAs] = value;
            }
        });

        const data = {
            action: 'partial_answer',
            lineId: lineId,
            answers: answers,
            step: 4,
            totalSteps: 4
        };

        fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        }).catch(e => console.error('Combined partial answer send error:', e));
    }

    /**
     * 診断結果画面を表示
     */
    showDiagnosisResult() {
        // ヘッダー・特典カード・ライブカウンター・プログレスバー・チャットを全て非表示
        const header = document.querySelector('.header');
        const statsSection = document.querySelector('.stats-section');
        const liveCounter = document.querySelector('.live-counter');
        const progressSection = document.querySelector('.progress-section');
        if (header) header.classList.add('hidden');
        if (statsSection) statsSection.classList.add('hidden');
        if (liveCounter) liveCounter.classList.add('hidden');
        if (progressSection) progressSection.classList.add('hidden');
        this.chatArea.classList.add('hidden');

        // 診断結果のコンテンツを動的に生成
        const priorityAnswer = this.state.getAnswer('priority') || '';
        const areaName = this.state.getAnswer('location') || this.state.resolvedAddress || '指定エリア';

        // Q1の回答に応じた表示テキスト
        let priorityLabel = '';
        if (priorityAnswer.includes('夜勤')) priorityLabel = '夜勤負担軽減';
        else if (priorityAnswer.includes('月収')) priorityLabel = '月収アップ';
        else if (priorityAnswer.includes('施設')) priorityLabel = '施設こだわり';

        const calendarUrl = `${CONFIG.CALENDAR_URL}?uid=${encodeURIComponent(this.state.lineId)}`;

        const screen = this.diagnosisScreen;
        screen.innerHTML = `
            <div class="diagnosis-result">
                <div class="diagnosis-result__check-icon">&#10003;</div>
                <h2 class="diagnosis-result__title">診断完了！</h2>
                <p class="diagnosis-result__message">
                    「<strong>${priorityLabel}</strong> × <strong>${areaName}</strong>」の<br>
                    非公開求人をお送りします。
                </p>
                <div class="diagnosis-result__line-notice">
                    <span class="diagnosis-result__line-icon">💬</span>
                    <span><strong>LINEのトーク画面</strong>でお待ちください！</span>
                </div>

                <a href="${calendarUrl}" class="booking-cta" target="_blank" rel="noopener">
                    面談を予約する
                </a>
                <p class="booking-cta__note">
                    ＼無理な勧誘は一切ありません／<br>
                    「まずは情報収集だけ」という方も大歓迎です。
                </p>
            </div>
        `;

        screen.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatArea.scrollTop = this.chatArea.scrollHeight;
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }
}

// ===============================
// アプリケーション起動
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    if (window.__liffReady) {
        try { await window.__liffReady; } catch (e) { console.log('LIFF ready wait failed:', e); }
    }
    window.app = new SurveyApp();
});
