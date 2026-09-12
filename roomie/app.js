const initialTasks = {
  rent: {
    id: 'rent', room: 'living', location: '客厅 · 存钱罐', icon: '¥', tone: 'urgent',
    title: '9 月房租还差一人', description: '本月房租共 ¥7,500，目前已经收齐 2/3。',
    short: '房租待结算', meta: '小李还有 ¥2,500 未支付', done: false,
  },
  paper: {
    id: 'paper', room: 'bath', location: '卫生间 · 纸巾架', icon: '▦', tone: 'warn',
    title: '卫生纸只剩 1 卷', description: '按最近 7 天消耗速度，预计还能使用约 2 天。',
    short: '卫生纸快没了', meta: '预计 2 天后用完', done: false, claimed: false, purchased: false,
  },
  clean: {
    id: 'clean', room: 'kitchen', location: '厨房 · 清洁区', icon: '↗', tone: 'warn',
    title: '今晚轮到小王清厨房', description: '厨房地面 + 灶台，建议在 22:00 前完成。',
    short: '厨房值日', meta: '负责人：小王 · 22:00 前', done: false,
  },
};

const roomCopy = {
  living: ['客厅', '账单、公约与公共协作都发生在这里。'],
  kitchen: ['厨房', '今天这里有一项清洁任务。'],
  bath: ['卫生间', '公共消耗品正在提醒你补货。'],
  balcony: ['阳台 / 洗衣区', '状态良好，洗衣液仍有约 70%。'],
};

let tasks = structuredClone(initialTasks);
let activeTaskId = null;

const sceneWrap = document.getElementById('sceneWrap');
const drawerEmpty = document.getElementById('drawerEmpty');
const drawerContent = document.getElementById('drawerContent');
const statusList = document.getElementById('statusList');
const taskCount = document.getElementById('taskCount');
const houseHealth = document.getElementById('houseHealth');
const sceneCaption = document.getElementById('sceneCaption');
const toast = document.getElementById('toast');

function getOpenTasks() {
  return Object.values(tasks).filter((task) => !task.done);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateSummary() {
  const open = getOpenTasks();
  taskCount.textContent = `${open.length} TASK${open.length === 1 ? '' : 'S'}`;
  houseHealth.textContent = String(76 + (3 - open.length) * 8);

  statusList.innerHTML = '';
  open.forEach((task) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'status-row';
    button.dataset.taskId = task.id;
    button.innerHTML = `
      <span class="status-icon">${task.icon}</span>
      <span class="status-copy"><strong>${task.short}</strong><span>${task.meta}</span></span>
      <span class="status-badge ${task.tone}">!</span>
    `;
    statusList.appendChild(button);
  });

  if (!open.length) {
    statusList.innerHTML = `
      <div class="status-row" style="cursor:default">
        <span class="status-icon">✓</span>
        <span class="status-copy"><strong>今天都处理完了</strong><span>这个家的状态很好</span></span>
        <span class="status-badge ok">✓</span>
      </div>`;
  }

  document.querySelectorAll('[data-hotspot]').forEach((node) => {
    const id = node.dataset.hotspot;
    if (!tasks[id]?.done) return;
    node.classList.add('is-done');
    const core = node.querySelector('.hotspot-core');
    const ring = node.querySelector('.hotspot-ring');
    const text = node.querySelector('.hotspot-text');
    core?.classList.remove('urgent', 'warn'); core?.classList.add('calm');
    ring?.classList.remove('urgent', 'warn'); ring?.classList.add('calm');
    if (text) { text.textContent = '✓'; text.classList.add('check'); }
  });

  document.querySelectorAll('[data-map-alert]').forEach((node) => {
    const id = node.dataset.mapAlert;
    if (tasks[id]?.done) {
      node.textContent = '✓';
      node.classList.add('is-done');
    } else {
      node.textContent = '!';
      node.classList.remove('is-done');
    }
  });
}

function focusRoom(room) {
  sceneWrap.dataset.focus = room;
  document.querySelectorAll('[data-map-room]').forEach((cell) => {
    cell.classList.toggle('is-active', cell.dataset.mapRoom === room);
  });
  const [name, description] = roomCopy[room];
  sceneCaption.innerHTML = `<span class="caption-kicker">${name}</span><strong>${description}</strong>`;
}

function clearFocus() {
  delete sceneWrap.dataset.focus;
  document.querySelectorAll('[data-map-room]').forEach((cell) => cell.classList.remove('is-active'));
  sceneCaption.innerHTML = '<span class="caption-kicker">全屋总览</span><strong>哪里亮起感叹号，哪里就有一件待办。</strong>';
}

function detailRent() {
  return `
    <div class="progress">
      <div class="progress-track"><div class="progress-fill" style="width:66.67%"></div></div>
      <div class="progress-caption"><span>已收 ¥5,000</span><strong>67%</strong></div>
    </div>
    <div class="member-stack">
      <div class="member"><span class="member-left"><i class="avatar">昕</i>骆昕</span><span class="pay-state paid">已付 ¥2,500</span></div>
      <div class="member"><span class="member-left"><i class="avatar">王</i>小王</span><span class="pay-state paid">已付 ¥2,500</span></div>
      <div class="member"><span class="member-left"><i class="avatar">李</i>小李</span><span class="pay-state wait">待付 ¥2,500</span></div>
    </div>`;
}

function detailPaper(task) {
  if (task.purchased) {
    return `
      <div class="detail-row"><span>采购状态</span><strong>已购买</strong></div>
      <div class="detail-row"><span>金额</span><strong>¥29.90</strong></div>
      <div class="detail-row"><span>AA</span><strong>3 人 · ¥9.97 / 人</strong></div>`;
  }
  return `
    <div class="detail-row"><span>当前库存</span><strong>1 卷</strong></div>
    <div class="detail-row"><span>消耗速度</span><strong>≈ 0.5 卷 / 天</strong></div>
    <div class="detail-row"><span>预计耗尽</span><strong>2 天后</strong></div>
    <div class="detail-row"><span>建议采购</span><strong>12 卷装</strong></div>`;
}

function detailClean() {
  return `
    <div class="detail-row"><span>负责人</span><strong>小王</strong></div>
    <div class="detail-row"><span>区域</span><strong>厨房地面 + 灶台</strong></div>
    <div class="detail-row"><span>截止时间</span><strong>今晚 22:00</strong></div>
    <div class="detail-row"><span>本月完成</span><strong>3 / 4 次</strong></div>`;
}

function renderTask(taskId) {
  const task = tasks[taskId];
  if (!task || task.done) return;
  activeTaskId = taskId;
  focusRoom(task.room);
  drawerEmpty.classList.add('is-hidden');
  drawerContent.classList.remove('is-hidden');

  document.getElementById('taskLocation').textContent = task.location;
  document.getElementById('taskIcon').textContent = task.icon;
  document.getElementById('taskTitle').textContent = task.title;
  document.getElementById('taskDescription').textContent = task.description;

  const detail = document.getElementById('taskDetail');
  const actions = document.getElementById('drawerActions');
  const note = document.getElementById('linkNote');

  if (taskId === 'rent') {
    detail.innerHTML = detailRent();
    actions.innerHTML = `
      <button class="primary-btn" data-action="remind">生成友好提醒</button>
      <button class="secondary-btn" data-action="rent-paid">模拟小李已支付</button>`;
    note.innerHTML = '处理后，<strong>客厅存钱罐的感叹号会消失</strong>，House Health 同步上升。';
  }

  if (taskId === 'paper') {
    detail.innerHTML = detailPaper(task);
    if (task.purchased) {
      actions.innerHTML = `<button class="primary-btn" data-action="paper-finish">完成并生成 AA</button>`;
      note.innerHTML = '这里演示了核心联动：<strong>公共物品 → 采购 → 自动进入 AA 账单</strong>。';
    } else if (task.claimed) {
      actions.innerHTML = `
        <button class="primary-btn" data-action="paper-buy">模拟已购买 ¥29.90</button>
        <button class="secondary-btn" data-action="paper-release">取消认领</button>`;
      note.innerHTML = '购买后会直接形成公共支出，不需要再去另一个模块重复记账。';
    } else {
      actions.innerHTML = `
        <button class="primary-btn" data-action="paper-claim">我来买</button>
        <button class="secondary-btn" data-action="paper-list">加入采购清单</button>`;
      note.innerHTML = '物资状态不是一张库存表，而是<strong>直接挂在卫生间这个真实位置</strong>。';
    }
  }

  if (taskId === 'clean') {
    detail.innerHTML = detailClean();
    actions.innerHTML = `
      <button class="primary-btn" data-action="clean-done">标记完成</button>
      <button class="secondary-btn" data-action="swap">申请换班</button>`;
    note.innerHTML = '值日同样被空间化：<strong>任务发生在厨房，就从厨房处理</strong>。';
  }
}

function closeDrawer() {
  activeTaskId = null;
  drawerContent.classList.add('is-hidden');
  drawerEmpty.classList.remove('is-hidden');
}

function finishTask(taskId, message) {
  tasks[taskId].done = true;
  updateSummary();
  closeDrawer();
  clearFocus();
  showToast(message);
}

document.addEventListener('click', (event) => {
  const hotspot = event.target.closest('[data-hotspot]');
  if (hotspot) renderTask(hotspot.dataset.hotspot);

  const status = event.target.closest('[data-task-id]');
  if (status) renderTask(status.dataset.taskId);

  const mapRoom = event.target.closest('[data-map-room]');
  if (mapRoom) {
    const room = mapRoom.dataset.mapRoom;
    const roomTask = Object.values(tasks).find((task) => task.room === room && !task.done);
    if (roomTask) renderTask(roomTask.id);
    else {
      closeDrawer();
      focusRoom(room);
      showToast(`${roomCopy[room][0]}目前没有待处理事项`);
    }
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'remind') showToast('已生成：小李～9 月房租还有 ¥2,500 没结清，有空时处理一下就好。');
  if (action === 'rent-paid') finishTask('rent', '房租已收齐，客厅任务完成 ✓');
  if (action === 'paper-claim') { tasks.paper.claimed = true; renderTask('paper'); showToast('这次采购已由你认领'); }
  if (action === 'paper-list') showToast('已加入公共采购清单');
  if (action === 'paper-release') { tasks.paper.claimed = false; renderTask('paper'); showToast('已取消认领'); }
  if (action === 'paper-buy') { tasks.paper.purchased = true; renderTask('paper'); showToast('已记录 ¥29.90，准备生成 3 人 AA'); }
  if (action === 'paper-finish') finishTask('paper', '已生成公共账单：每人 ¥9.97 ✓');
  if (action === 'clean-done') finishTask('clean', '厨房清洁完成，House Health +8');
  if (action === 'swap') showToast('换班请求已生成：想和谁交换今天的厨房值日？');
});

document.addEventListener('keydown', (event) => {
  const node = event.target.closest?.('[data-hotspot]');
  if (node && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    renderTask(node.dataset.hotspot);
  }
});

document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
document.getElementById('homeViewBtn').addEventListener('click', () => { clearFocus(); closeDrawer(); });
document.getElementById('resetBtn').addEventListener('click', () => {
  tasks = structuredClone(initialTasks);
  activeTaskId = null;
  document.querySelectorAll('[data-hotspot]').forEach((node) => {
    node.classList.remove('is-done');
    const id = node.dataset.hotspot;
    const tone = id === 'rent' ? 'urgent' : id === 'detergent' ? 'calm' : 'warn';
    const core = node.querySelector('.hotspot-core');
    const ring = node.querySelector('.hotspot-ring');
    const text = node.querySelector('.hotspot-text');
    core?.classList.remove('urgent', 'warn', 'calm'); core?.classList.add(tone);
    ring?.classList.remove('urgent', 'warn', 'calm'); ring?.classList.add(tone);
    if (text) { text.textContent = id === 'detergent' ? '✓' : '!'; text.classList.toggle('check', id === 'detergent'); }
  });
  updateSummary(); clearFocus(); closeDrawer(); showToast('Demo 已重置');
});

updateSummary();
