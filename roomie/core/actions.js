import { store } from './store.js';

function eventId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function memberName(state, memberId) {
  if (memberId === 'system') return 'Roomie';
  return state.members.find((member) => member.id === memberId)?.name ?? memberId;
}

function pushHistory(state, event) {
  state.history.unshift({
    id: eventId('history'),
    at: nowIso(),
    ...event,
  });
}

export function reportItemIssue(itemId, reportedState = 'low') {
  store.setState((state) => {
    const item = state.items.find((entry) => entry.id === itemId);
    if (!item) return;
    item.status = 'reported';
    item.reportedState = reportedState;
    item.lastEventAt = nowIso();

    const existing = state.tasks.find((task) => task.sourceItemId === itemId && task.status !== 'resolved');
    if (!existing) {
      state.tasks.push({
        id: eventId('restock'),
        type: 'restock',
        source: 'human',
        sourceItemId: itemId,
        title: `${item.name}${reportedState === 'empty' ? '已经没有了' : '快用完了'}`,
        roomId: item.roomId,
        anchorId: item.anchorId,
        assigneeId: null,
        status: 'unclaimed',
        createdBy: state.currentUserId,
        createdAt: nowIso(),
      });
    }

    pushHistory(state, {
      type: 'item.reported',
      entityType: 'item',
      entityId: itemId,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}报告：${item.name}${reportedState === 'empty' ? '已经没有了' : '快用完了'}`,
    });
  });
}

export function claimRestockTask(taskId) {
  store.setState((state) => {
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task || task.status !== 'unclaimed') return;
    task.status = 'claimed';
    task.assigneeId = state.currentUserId;
    task.claimedAt = nowIso();
    pushHistory(state, {
      type: 'task.claimed',
      entityType: 'task',
      entityId: task.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}认领了“${task.title}”`,
    });
  });
}

export function completeRestockPurchase(taskId, amount = 29.9) {
  let createdExpenseId = null;
  store.setState((state) => {
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task || task.type !== 'restock') return;
    const item = state.items.find((entry) => entry.id === task.sourceItemId);
    if (!item) return;

    task.status = 'resolved';
    task.resolvedAt = nowIso();
    item.status = 'normal';
    item.reportedState = null;
    item.lastEventAt = nowIso();

    const share = Math.round((amount / state.members.length) * 100) / 100;
    const payerId = task.assigneeId || state.currentUserId;
    const expense = {
      id: eventId('expense'),
      type: 'ad-hoc',
      title: `${item.name}补货`,
      sourceId: task.id,
      payerId,
      amount,
      status: 'collecting',
      createdAt: nowIso(),
      splits: state.members.map((member) => ({
        memberId: member.id,
        amount: member.id === payerId ? 0 : share,
        status: member.id === payerId ? 'paid' : 'unpaid',
      })),
    };
    createdExpenseId = expense.id;
    state.expenses.unshift(expense);

    pushHistory(state, {
      type: 'item.purchased',
      entityType: 'item',
      entityId: item.id,
      actorId: payerId,
      text: `${memberName(state, payerId)}完成${item.name}补货 · ¥${amount.toFixed(2)}`,
    });
    pushHistory(state, {
      type: 'expense.created',
      entityType: 'expense',
      entityId: expense.id,
      actorId: 'system',
      text: `Roomie 自动生成 ${item.name} AA`,
    });
  });
  return createdExpenseId;
}

export function paySplit(expenseId, memberId) {
  let settled = false;
  store.setState((state) => {
    const expense = state.expenses.find((entry) => entry.id === expenseId);
    if (!expense) return;
    const split = expense.splits.find((entry) => entry.memberId === memberId);
    if (!split || split.status === 'paid') return;
    split.status = 'paid';
    split.paidAt = nowIso();
    pushHistory(state, {
      type: 'split.paid',
      entityType: 'expense',
      entityId: expense.id,
      actorId: memberId,
      text: `${memberName(state, memberId)}完成“${expense.title}”付款`,
    });
    if (expense.splits.every((entry) => entry.status === 'paid')) {
      expense.status = 'settled';
      expense.settledAt = nowIso();
      settled = true;
      pushHistory(state, {
        type: 'expense.settled',
        entityType: 'expense',
        entityId: expense.id,
        actorId: 'system',
        text: `${expense.title}已全部结清`,
      });
    }
  });
  return settled;
}

export function pokeMember(expenseId, memberId, actorId = null) {
  store.setState((state) => {
    const expense = state.expenses.find((entry) => entry.id === expenseId);
    if (!expense) return;
    const actor = actorId || state.currentUserId;
    pushHistory(state, {
      type: 'poke.sent',
      entityType: 'expense',
      entityId: expense.id,
      actorId: actor,
      targetMemberId: memberId,
      text: `${memberName(state, actor)}戳了戳${memberName(state, memberId)}：${expense.title}还没结清`,
    });
  });
}

export function completeChore(taskId) {
  store.setState((state) => {
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task || task.type !== 'cleaning') return;
    task.status = 'completed';
    task.completedAt = nowIso();
    pushHistory(state, {
      type: 'task.completed',
      entityType: 'task',
      entityId: task.id,
      actorId: task.assigneeId,
      text: `${memberName(state, task.assigneeId)}完成厨房值日`,
    });
  });
}

export function createSpatialTask({ title, roomId, anchorId = null, assigneeId = null, category = 'custom', itemLabel = null, icon = '•' }) {
  let createdId = null;
  store.setState((state) => {
    const task = {
      id: eventId('task'),
      type: category,
      source: 'human',
      title,
      roomId,
      anchorId,
      itemLabel,
      icon,
      assigneeId,
      status: assigneeId ? 'claimed' : 'unclaimed',
      createdBy: state.currentUserId,
      createdAt: nowIso(),
    };
    createdId = task.id;
    state.tasks.unshift(task);
    pushHistory(state, {
      type: 'task.created',
      entityType: 'task',
      entityId: task.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}新增了“${title}”`,
    });
  });
  return createdId;
}

export function claimSpatialTask(taskId) {
  store.setState((state) => {
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task || task.status !== 'unclaimed') return;
    task.status = 'claimed';
    task.assigneeId = state.currentUserId;
    task.claimedAt = nowIso();
    pushHistory(state, {
      type: 'task.claimed',
      entityType: 'task',
      entityId: task.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}认领了“${task.title}”`,
    });
  });
}

export function completeSpatialTask(taskId) {
  store.setState((state) => {
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task || ['resolved', 'completed'].includes(task.status)) return;
    task.status = 'completed';
    task.completedAt = nowIso();
    pushHistory(state, {
      type: 'task.completed',
      entityType: 'task',
      entityId: task.id,
      actorId: task.assigneeId || state.currentUserId,
      text: `${memberName(state, task.assigneeId || state.currentUserId)}完成了“${task.title}”`,
    });
  });
}

export function createAdHocExpense({ title, amount, payerId = null, participantIds = null }) {
  let createdId = null;
  store.setState((state) => {
    const payer = payerId || state.currentUserId;
    const members = participantIds?.length
      ? state.members.filter((member) => participantIds.includes(member.id))
      : state.members;
    const share = Math.round((Number(amount) / members.length) * 100) / 100;
    const expense = {
      id: eventId('expense'),
      type: 'ad-hoc',
      title,
      payerId: payer,
      amount: Number(amount),
      status: 'collecting',
      createdAt: nowIso(),
      splits: members.map((member) => ({
        memberId: member.id,
        amount: member.id === payer ? 0 : share,
        status: member.id === payer ? 'paid' : 'unpaid',
      })),
    };
    createdId = expense.id;
    state.expenses.unshift(expense);
    pushHistory(state, {
      type: 'expense.created',
      entityType: 'expense',
      entityId: expense.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}新增公共支出“${title}” · ¥${Number(amount).toFixed(2)}`,
    });
  });
  return createdId;
}

export function createRuleProposal(title) {
  let createdId = null;
  store.setState((state) => {
    const rule = {
      id: eventId('rule'),
      title,
      status: 'discussion',
      approvals: [state.currentUserId],
      comments: [],
      createdAt: nowIso(),
    };
    createdId = rule.id;
    state.rules.unshift(rule);
    pushHistory(state, {
      type: 'rule.proposed',
      entityType: 'rule',
      entityId: rule.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}发起提案“${title}”`,
    });
  });
  return createdId;
}

export function approveRule(ruleId, memberId = null) {
  let becameActive = false;
  store.setState((state) => {
    const rule = state.rules.find((entry) => entry.id === ruleId);
    if (!rule || rule.status === 'active') return;
    const actorId = memberId || state.currentUserId;
    if (!rule.approvals.includes(actorId)) rule.approvals.push(actorId);
    pushHistory(state, {
      type: 'rule.approved',
      entityType: 'rule',
      entityId: rule.id,
      actorId,
      text: `${memberName(state, actorId)}同意“${rule.title}”`,
    });
    if (rule.approvals.length >= state.members.length) {
      rule.status = 'active';
      becameActive = true;
      pushHistory(state, {
        type: 'rule.activated',
        entityType: 'rule',
        entityId: rule.id,
        actorId: 'system',
        text: `“${rule.title}”已全员确认并生效`,
      });
    }
  });
  return becameActive;
}

export function commentRule(ruleId, text) {
  store.setState((state) => {
    const rule = state.rules.find((entry) => entry.id === ruleId);
    if (!rule || !text?.trim()) return;
    rule.comments.push({ memberId: state.currentUserId, text: text.trim() });
    pushHistory(state, {
      type: 'rule.commented',
      entityType: 'rule',
      entityId: rule.id,
      actorId: state.currentUserId,
      text: `${memberName(state, state.currentUserId)}在“${rule.title}”下留言`,
    });
  });
}

export function resetDemo() {
  store.reset();
}
