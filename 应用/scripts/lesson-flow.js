'use strict';

// Shared guided-learning flow for the chemistry and history demos.
(function createLessonFlow() {
  function init(config) {
    const root = document.querySelector('[data-lesson-root]');
    if (!root || !config) return;

    const stage = root.querySelector('[data-lesson-stage]');
    const feedback = root.querySelector('[data-lesson-feedback]');
    const progress = root.querySelector('[data-lesson-progress]');
    const status = root.querySelector('[data-lesson-status]');
    const state = {
      phase: 'intro',
      stepIndex: 0,
      questionIndex: 0,
      selectedAnswer: null,
      answers: [],
      startedAt: null,
    };

    const setStatus = message => {
      if (status) status.textContent = message || '';
    };

    const setProgress = value => {
      if (progress) progress.style.width = `${Math.max(0, Math.min(100, value))}%`;
    };

    const updateProgress = () => {
      const total = config.steps.length + config.quiz.length;
      const completed = state.phase === 'intro'
        ? 0
        : state.phase === 'steps'
          ? state.stepIndex
          : state.phase === 'quiz'
            ? config.steps.length + state.questionIndex
            : total;
      setProgress((completed / total) * 100);
    };

    const actionButton = (label, action, extra = '') => (
      `<button type="button" class="lesson-action ${extra}" data-lesson-action="${action}">${label}</button>`
    );

    const renderIntro = () => {
      root.dataset.phase = 'intro';
      stage.innerHTML = `
        <div class="lesson-kicker">${config.subject} · 引导探究</div>
        <h3>${config.title}</h3>
        <p>${config.goal}</p>
        <div class="lesson-meta"><span>预计 ${config.duration}</span><span>${config.steps.length} 个探究步骤</span><span>${config.quiz.length} 道检测题</span></div>
        <div class="lesson-intro-note">完成操作后再进入下一步，最后会生成一份本地学习报告。</div>
        ${actionButton('开始探究', 'start', 'lesson-action-primary')}
      `;
      setStatus('尚未开始');
      updateProgress();
    };

    const renderStep = () => {
      const step = config.steps[state.stepIndex];
      root.dataset.phase = 'steps';
      const specialActions = (step.actions || []).map(item => (
        `<button type="button" class="lesson-action lesson-action-secondary" data-lesson-special="${item.action}">${item.label}</button>`
      )).join('');
      stage.innerHTML = `
        <div class="lesson-kicker">步骤 ${state.stepIndex + 1} / ${config.steps.length}</div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        ${step.tip ? `<div class="lesson-tip"><strong>观察提示</strong>${step.tip}</div>` : ''}
        ${specialActions ? `<div class="lesson-actions">${specialActions}</div>` : ''}
        ${actionButton(state.stepIndex === config.steps.length - 1 ? '进入小测' : '完成本步', 'complete', 'lesson-action-primary')}
      `;
      setStatus(`正在进行：${step.title}`);
      updateProgress();
    };

    const renderQuiz = () => {
      const question = config.quiz[state.questionIndex];
      const selected = state.selectedAnswer;
      root.dataset.phase = 'quiz';
      const options = question.options.map((option, index) => {
        const selectedClass = selected === index ? 'selected' : '';
        return `<button type="button" class="lesson-option ${selectedClass}" data-lesson-answer="${index}">${String.fromCharCode(65 + index)}. ${option}</button>`;
      }).join('');
      const hasAnswer = selected !== null;
      const isCorrect = selected === question.correct;
      feedback.innerHTML = hasAnswer
        ? `<div class="lesson-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}"><strong>${isCorrect ? '回答正确' : '再想一想'}</strong><span>${question.explanation}</span></div>`
        : '';
      stage.innerHTML = `
        <div class="lesson-kicker">知识检测 ${state.questionIndex + 1} / ${config.quiz.length}</div>
        <h3>${question.question}</h3>
        <div class="lesson-options">${options}</div>
        ${hasAnswer ? actionButton(state.questionIndex === config.quiz.length - 1 ? '查看学习报告' : '下一题', 'next', 'lesson-action-primary') : '<div class="lesson-answer-hint">选择一个答案后继续</div>'}
      `;
      setStatus('正在进行知识检测');
      updateProgress();
    };

    const saveReport = score => {
      const report = {
        lesson: config.title,
        subject: config.subject,
        score,
        total: config.quiz.length,
        completedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(`hiec_lesson_${config.id}`, JSON.stringify(report));
      } catch (error) {
        console.warn('学习报告保存失败:', error.message);
      }
      return report;
    };

    const renderReport = () => {
      const score = state.answers.reduce((sum, answer, index) => (
        sum + (answer === config.quiz[index].correct ? 1 : 0)
      ), 0);
      const percentage = Math.round((score / config.quiz.length) * 100);
      saveReport(score);
      root.dataset.phase = 'report';
      feedback.innerHTML = '';
      stage.innerHTML = `
        <div class="lesson-kicker">探究完成</div>
        <h3>你的学习报告</h3>
        <div class="lesson-report-score"><strong>${percentage}</strong><span>分</span></div>
        <p>${config.report(percentage)}</p>
        <div class="lesson-report-grid"><span>答对 ${score} / ${config.quiz.length}</span><span>已保存到本机</span></div>
        <div class="lesson-actions">${actionButton('保存报告', 'download', 'lesson-action-secondary')}${actionButton('再做一次', 'restart', 'lesson-action-primary')}</div>
      `;
      setStatus('本次探究已完成');
      updateProgress();
    };

    const downloadReport = () => {
      const score = state.answers.reduce((sum, answer, index) => (
        sum + (answer === config.quiz[index].correct ? 1 : 0)
      ), 0);
      const report = {
        lesson: config.title,
        subject: config.subject,
        score: `${score}/${config.quiz.length}`,
        answers: state.answers,
        completedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.id}-学习报告.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('报告下载已开始');
    };

    root.addEventListener('click', event => {
      const target = event.target.closest('button');
      if (!target) return;

      const action = target.dataset.lessonAction;
      if (action === 'start') {
        state.phase = 'steps';
        state.startedAt = Date.now();
        state.stepIndex = 0;
        state.questionIndex = 0;
        state.answers = [];
        state.selectedAnswer = null;
        renderStep();
        config.onStart?.(state);
        return;
      }
      if (action === 'complete') {
        if (state.stepIndex < config.steps.length - 1) {
          state.stepIndex += 1;
          renderStep();
        } else {
          state.phase = 'quiz';
          state.questionIndex = 0;
          state.selectedAnswer = null;
          renderQuiz();
        }
        config.onCompleteStep?.(state);
        return;
      }
      if (action === 'next') {
        state.answers[state.questionIndex] = state.selectedAnswer;
        if (state.questionIndex < config.quiz.length - 1) {
          state.questionIndex += 1;
          state.selectedAnswer = null;
          renderQuiz();
        } else {
          state.phase = 'report';
          renderReport();
        }
        return;
      }
      if (action === 'restart') {
        state.phase = 'intro';
        state.stepIndex = 0;
        state.questionIndex = 0;
        state.selectedAnswer = null;
        state.answers = [];
        feedback.innerHTML = '';
        renderIntro();
        config.onReset?.(state);
        return;
      }
      if (action === 'download') {
        downloadReport();
        return;
      }

      const answer = target.dataset.lessonAnswer;
      if (answer !== undefined) {
        state.selectedAnswer = Number(answer);
        renderQuiz();
        return;
      }

      const special = target.dataset.lessonSpecial;
      if (special) {
        config.onAction?.(special, state);
      }
    });

    renderIntro();
  }

  window.HIECLesson = { init };
})();
