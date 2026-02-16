/**
 * ニジ看護 チャット形式Webアンケート
 * メインアプリケーションロジック
 */

// ===============================
// 設定
// ===============================
const CONFIG = {
    // GAS API URL（本番環境で設定）
    API_URL: 'https://script.google.com/macros/s/AKfycbwT4dlPuH3edMjF5aWRV_TgAzU0Rz7YS76Zb-H0Dv3G02ph0DR1KY006ldArCJZngFs/exec',
    // デバッグモード
    DEBUG: true,
    // メッセージ表示遅延（ms）
    MESSAGE_DELAY: 300,
    // 次の質問への遅延（ms）
    NEXT_QUESTION_DELAY: 600
};

// ===============================
// 状態管理
// ===============================
class SurveyState {
    constructor() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.lineId = this.getLineIdFromUrl();
    }

    getLineIdFromUrl() {
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

    nextQuestion() {
        this.currentQuestionIndex++;
        return this.currentQuestionIndex < QUESTIONS.length;
    }

    getCurrentQuestion() {
        return QUESTIONS[this.currentQuestionIndex];
    }

    getProgress() {
        return {
            current: this.currentQuestionIndex,
            total: QUESTIONS.length,
            percentage: (this.currentQuestionIndex / QUESTIONS.length) * 100
        };
    }

    prepareSubmissionData() {
        const data = {
            lineId: this.lineId,
            answers: {
                tag: window.inflowTag || 'general',
                timing: this.answers.timing,
                location: this.answers.location,
                categories: this.answers.categories || [],
                keywords: this.answers.keywords || [],
                workStyle: this.answers.workStyle || [],
                salary: this.answers.salary,
                education: this.answers.education,
                birthday: this.answers.birthday,
                name: this.answers.name,
                phone: this.answers.phone
            }
        };

        // foreigner タグの場合のみ追加
        if (window.inflowTag === 'foreigner') {
            data.answers.jlptLevel = this.answers.jlptLevel;
            data.answers.visaStatus = this.answers.visaStatus;
        }

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
        <span class="chat-bubble__name">キャリアアドバイザーあい</span>
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

        // 複数選択の場合、カウンターと決定ボタンを追加
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

        // 都道府県グリッド
        const grid = document.createElement('div');
        grid.className = 'prefecture-grid';
        grid.id = 'prefectureGrid';

        // 初期表示は関東
        PREFECTURES['関東'].forEach(pref => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = pref;
            btn.dataset.value = pref;
            grid.appendChild(btn);
        });

        container.appendChild(grid);

        return container;
    }

    static createDateInput() {
        const container = document.createElement('div');
        container.className = 'input-group';

        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 60;
        const maxYear = currentYear - 18;

        let yearOptions = '<option value="">年</option>';
        for (let y = maxYear; y >= minYear; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        let monthOptions = '<option value="">月</option>';
        for (let m = 1; m <= 12; m++) {
            monthOptions += `<option value="${m}">${m}</option>`;
        }

        let dayOptions = '<option value="">日</option>';
        for (let d = 1; d <= 31; d++) {
            dayOptions += `<option value="${d}">${d}</option>`;
        }

        container.innerHTML = `
      <div class="date-selects">
        <select class="date-select" id="yearSelect">${yearOptions}</select>
        <span class="date-separator">年</span>
        <select class="date-select" id="monthSelect">${monthOptions}</select>
        <span class="date-separator">月</span>
        <select class="date-select" id="daySelect">${dayOptions}</select>
        <span class="date-separator">日</span>
      </div>
      <div class="action-buttons">
        <button class="btn btn--primary" id="nextBtn" disabled>次へ</button>
      </div>
    `;

        return container;
    }

    static createTextInput(placeholder, isLast = false) {
        const container = document.createElement('div');
        container.className = 'input-group';

        const buttonText = isLast ? '送信する' : '次へ';
        const buttonClass = isLast ? 'submit-btn' : 'btn btn--primary';

        container.innerHTML = `
      <input type="text" class="input-field" id="textInput" placeholder="${placeholder}" autocomplete="off">
      <div class="input-error hidden" id="inputError"></div>
      <div class="action-buttons">
        <button class="${buttonClass}" id="nextBtn" disabled>${buttonText}</button>
      </div>
    `;

        return container;
    }

    static createTelInput(placeholder) {
        const container = document.createElement('div');
        container.className = 'input-group';

        container.innerHTML = `
      <input type="tel" class="input-field" id="textInput" placeholder="${placeholder}" 
             pattern="[0-9]*" inputmode="numeric" autocomplete="off" maxlength="11">
      <div class="input-error hidden" id="inputError"></div>
      <div class="action-buttons">
        <button class="submit-btn" id="submitBtn" disabled>
          <span id="submitBtnText">送信する</span>
          <span class="loading-spinner hidden" id="submitSpinner"></span>
        </button>
      </div>
    `;

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
        this.completeScreen = document.getElementById('completeScreen');

        this.selectedOptions = [];

        this.init();
    }

    init() {
        // リアルタイムカウンター更新
        this.updateLiveCounter();

        // 最初の質問を表示
        setTimeout(() => this.showQuestion(), CONFIG.MESSAGE_DELAY);
    }

    updateLiveCounter() {
        const counter = document.getElementById('liveCount');
        const baseCount = 47;
        const variation = Math.floor(Math.random() * 10) - 5;
        counter.textContent = baseCount + variation;
    }

    updateProgress() {
        const { current, total, percentage } = this.state.getProgress();
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.innerHTML = `<span class="progress-number">${current}</span>/10`;
    }

    showQuestion() {
        const question = this.state.getCurrentQuestion();
        if (!question) {
            this.showComplete();
            return;
        }

        // 進捗更新
        this.updateProgress();

        // 質問吹き出しを表示
        const bubble = UIComponents.createAgentBubble(question.message);
        this.chatArea.appendChild(bubble);

        // スクロール
        this.scrollToBottom();

        // 入力UIを表示
        setTimeout(() => {
            this.showInputUI(question);
            this.scrollToBottom();
        }, CONFIG.MESSAGE_DELAY);
    }

    showInputUI(question) {
        let inputElement;
        this.selectedOptions = [];

        switch (question.type) {
            case 'single':
                inputElement = UIComponents.createOptionsGrid(question.options, 'single');
                this.chatArea.appendChild(inputElement);
                this.setupSingleSelect(question);
                break;

            case 'multiple':
                inputElement = UIComponents.createOptionsGrid(question.options, 'multiple', question.maxSelect);
                this.chatArea.appendChild(inputElement);
                this.setupMultipleSelect(question);
                break;

            case 'multiple-dynamic':
                const categories = this.state.getAnswer('categories') || [];
                const options = categories.flatMap(cat => JOB_CATEGORIES[cat] || []);
                inputElement = UIComponents.createOptionsGrid(options, 'multiple-dynamic', question.maxSelect);
                this.chatArea.appendChild(inputElement);
                this.setupMultipleSelect(question);
                break;

            case 'prefecture':
                inputElement = UIComponents.createPrefectureSelector();
                this.chatArea.appendChild(inputElement);
                this.setupPrefectureSelect(question);
                break;

            case 'date':
                inputElement = UIComponents.createDateInput();
                this.chatArea.appendChild(inputElement);
                this.setupDateInput(question);
                break;

            case 'text':
                inputElement = UIComponents.createTextInput(question.placeholder, question.isLast);
                this.chatArea.appendChild(inputElement);
                this.setupTextInput(question);
                break;

            case 'tel':
                inputElement = UIComponents.createTelInput(question.placeholder);
                this.chatArea.appendChild(inputElement);
                this.setupTelInput(question);
                break;
        }
    }

    setupSingleSelect(question) {
        const buttons = this.chatArea.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.state.setAnswer(question.id, value);

                // 選択状態を表示
                btn.classList.add('option-btn--selected');

                // ユーザー回答吹き出しを追加
                setTimeout(() => {
                    this.addUserResponse(value);
                    this.removeInputUI();
                    this.advanceToNext();
                }, 150);
            });
        });
    }

    setupMultipleSelect(question) {
        const buttons = this.chatArea.querySelectorAll('.option-btn');
        const counter = this.chatArea.querySelector('.selection-counter__current');
        const confirmBtn = document.getElementById('confirmBtn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                const index = this.selectedOptions.indexOf(value);

                if (index > -1) {
                    // 選択解除
                    this.selectedOptions.splice(index, 1);
                    btn.classList.remove('option-btn--selected');
                } else if (this.selectedOptions.length < question.maxSelect) {
                    // 選択
                    this.selectedOptions.push(value);
                    btn.classList.add('option-btn--selected');
                }

                // カウンター更新
                counter.textContent = this.selectedOptions.length;

                // 決定ボタンの有効化
                confirmBtn.disabled = this.selectedOptions.length === 0;

                // 最大数選択で自動進行（autoAdvanceがtrueの場合）
                if (question.autoAdvance && this.selectedOptions.length === question.maxSelect) {
                    setTimeout(() => {
                        this.confirmMultipleSelection(question);
                    }, 300);
                }
            });
        });

        // 決定ボタン
        confirmBtn.addEventListener('click', () => {
            this.confirmMultipleSelection(question);
        });
    }

    confirmMultipleSelection(question) {
        if (this.selectedOptions.length === 0) return;

        this.state.setAnswer(question.id, [...this.selectedOptions]);

        const displayValue = this.selectedOptions.join('、');
        this.addUserResponse(displayValue);
        this.removeInputUI();
        this.advanceToNext();
    }

    setupPrefectureSelect(question) {
        const tabs = this.chatArea.querySelectorAll('.region-tab');
        const grid = document.getElementById('prefectureGrid');

        // タブ切り替え
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // アクティブ状態を更新
                tabs.forEach(t => t.classList.remove('region-tab--active'));
                tab.classList.add('region-tab--active');

                // グリッドを更新
                const region = tab.dataset.region;
                grid.innerHTML = '';
                PREFECTURES[region].forEach(pref => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.textContent = pref;
                    btn.dataset.value = pref;
                    grid.appendChild(btn);
                });

                // 新しいボタンにイベントを設定
                this.setupPrefectureButtons(question);
            });
        });

        // 初期ボタンにイベント設定
        this.setupPrefectureButtons(question);
    }

    setupPrefectureButtons(question) {
        const buttons = document.getElementById('prefectureGrid').querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.state.setAnswer(question.id, value);

                btn.classList.add('option-btn--selected');

                setTimeout(() => {
                    this.addUserResponse(value);
                    this.removeInputUI();
                    this.advanceToNext();
                }, 150);
            });
        });
    }

    setupDateInput(question) {
        const yearSelect = document.getElementById('yearSelect');
        const monthSelect = document.getElementById('monthSelect');
        const daySelect = document.getElementById('daySelect');
        const nextBtn = document.getElementById('nextBtn');

        const checkComplete = () => {
            const isComplete = yearSelect.value && monthSelect.value && daySelect.value;
            nextBtn.disabled = !isComplete;
        };

        yearSelect.addEventListener('change', checkComplete);
        monthSelect.addEventListener('change', checkComplete);
        daySelect.addEventListener('change', checkComplete);

        nextBtn.addEventListener('click', () => {
            const year = yearSelect.value;
            const month = monthSelect.value.padStart(2, '0');
            const day = daySelect.value.padStart(2, '0');
            const dateValue = `${year}-${month}-${day}`;
            const displayValue = `${year}年${monthSelect.value}月${daySelect.value}日`;

            this.state.setAnswer(question.id, dateValue);
            this.addUserResponse(displayValue);
            this.removeInputUI();
            this.advanceToNext();
        });
    }

    setupTextInput(question) {
        const input = document.getElementById('textInput');
        const nextBtn = document.getElementById('nextBtn');
        const errorEl = document.getElementById('inputError');

        input.addEventListener('input', () => {
            const value = input.value.trim();
            const isValid = this.validateInput(value, question.validation);
            nextBtn.disabled = !isValid;

            if (value && !isValid) {
                errorEl.textContent = question.validation.errorMessage;
                errorEl.classList.remove('hidden');
                input.classList.add('input-field--error');
            } else {
                errorEl.classList.add('hidden');
                input.classList.remove('input-field--error');
            }
        });

        // Enterキーで送信
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !nextBtn.disabled) {
                nextBtn.click();
            }
        });

        nextBtn.addEventListener('click', () => {
            const value = input.value.trim();
            this.state.setAnswer(question.id, value);
            this.addUserResponse(value);
            this.removeInputUI();
            this.advanceToNext();
        });

        // フォーカス
        input.focus();
    }

    setupTelInput(question) {
        const input = document.getElementById('textInput');
        const submitBtn = document.getElementById('submitBtn');
        const submitBtnText = document.getElementById('submitBtnText');
        const submitSpinner = document.getElementById('submitSpinner');
        const errorEl = document.getElementById('inputError');

        // 数字のみ入力
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            const value = input.value.trim();
            const isValid = this.validateInput(value, question.validation);
            submitBtn.disabled = !isValid;

            if (value && !isValid) {
                errorEl.textContent = question.validation.errorMessage;
                errorEl.classList.remove('hidden');
                input.classList.add('input-field--error');
            } else {
                errorEl.classList.add('hidden');
                input.classList.remove('input-field--error');
            }
        });

        // Enterキーで送信
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !submitBtn.disabled) {
                submitBtn.click();
            }
        });

        submitBtn.addEventListener('click', async () => {
            const value = input.value.trim();
            this.state.setAnswer(question.id, value);

            // ローディング表示
            submitBtn.disabled = true;
            submitBtnText.textContent = '送信中...';
            submitSpinner.classList.remove('hidden');

            // ユーザー回答表示
            this.addUserResponse(value);
            this.removeInputUI();

            // API送信
            await this.submitForm();
        });

        // フォーカス
        input.focus();
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
                this.showComplete();
            }
        }, CONFIG.NEXT_QUESTION_DELAY);
    }

    submitForm() {
        const data = this.state.prepareSubmissionData();
        const loadingOverlay = document.getElementById('loadingOverlay');

        // ローディングオーバーレイを表示
        loadingOverlay.classList.remove('hidden');

        // GASへ送信（非同期で投げっぱなしにする）
        // awaitしないことで、レスポンス待ちによる待機時間を排除
        fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        }).catch(e => console.error('Background submission error:', e));

        // ユーザー体験のために少しだけ待機時間を演出 (0.5～1.0秒)
        // その後すぐに完了画面へ遷移
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            this.showComplete();
        }, 800); // 0.8秒待機
    }

    showComplete() {
        // 進捗を100%に
        this.progressFill.style.width = '100%';
        this.progressText.innerHTML = '<span class="progress-number">10</span>/10';

        // チャットエリアを非表示
        this.chatArea.classList.add('hidden');

        // 完了画面を表示
        this.completeScreen.classList.remove('hidden');

        // スクロールをトップに
        window.scrollTo(0, 0);

        // 3秒後に自動クローズ
        // LINE LIFF環境であれば liff.closeWindow() を呼ぶ想定だが、
        // Webブラウザの場合はタブを閉じるか、終了メッセージを表示する
        setTimeout(() => {
            try {
                // LIFF SDKがロードされていれば閉じる
                if (window.liff) {
                    window.liff.closeWindow();
                } else {
                    // 通常ブラウザの場合
                    window.close();
                    // 閉じられない場合のメッセージ
                    document.querySelector('.complete-message').innerHTML += '<p style="font-size:12px; color:#888; margin-top:20px;">画面を閉じてLINEにお戻りください</p>';
                }
            } catch (e) {
                console.log('Close window failed', e);
            }
        }, 3000);
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
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurveyApp();
});
