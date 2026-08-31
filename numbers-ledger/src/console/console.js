/* eslint-env browser */
(function () {
  'use strict';

  /**
   * The operator console's browser half.
   *
   * Deliberately thin. Anything that could be wrong about money - parsing an
   * amount, formatting one, deciding whether the book is healthy, holding an
   * idempotency key across a retry - lives in console-core.js, which the test
   * suite loads in Node. What is left here is fetching and painting, and it is
   * written so that a mistake here shows the wrong text rather than moves the
   * wrong money.
   *
   * No inline handlers and no inline styles anywhere, so the page runs under a
   * content security policy that allows only its own two scripts.
   */

  var core = window.ANConsole;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };

  var TOKEN_KEY = 'an.operator.token';
  var keys = new core.KeyHolder();
  var currency = { symbol: '', minorUnits: 2 };
  var state = { overview: null, draws: [] };

  function token() {
    try { return window.sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function setToken(value) {
    try {
      if (value === null) window.sessionStorage.removeItem(TOKEN_KEY);
      else window.sessionStorage.setItem(TOKEN_KEY, value);
    } catch (e) { /* a locked-down browser still works, just not across reloads */ }
  }

  var money = function (minor) { return core.formatMinor(minor || 0, currency); };

  // ------------------------------------------------------------------ fetch

  /**
   * One call. `action` names the button that started it, so a retry of the
   * same button reuses its idempotency key rather than paying twice.
   */
  function api(method, path, options) {
    var opts = options || {};
    var headers = { accept: 'application/json' };
    var current = token();
    if (current) headers.authorization = 'Bearer ' + current;
    if (opts.body) headers['content-type'] = 'application/json';
    if (opts.action) headers['idempotency-key'] = keys.keyFor(opts.action);

    return window.fetch(path, {
      method: method,
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (response) {
      // The server answered. Whatever it said, this attempt is over and the
      // next press is a new one - only a request that never got an answer
      // keeps its key.
      if (opts.action) keys.settled(opts.action);
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var error = new Error(core.describeError(response.status, body));
          error.status = response.status;
          throw error;
        }
        return body;
      });
    });
  }

  function say(message, good) {
    var banner = $('banner');
    banner.textContent = message;
    banner.className = 'banner ' + (good ? 'good' : 'bad');
    banner.hidden = false;
    if (good) window.setTimeout(function () { banner.hidden = true; }, 6000);
  }

  function fail(error) {
    if (error && error.status === 401) return signOut();
    say(error && error.message ? error.message : 'Something went wrong.', false);
  }

  // ------------------------------------------------------------------ forms

  /** Read an amount field, refusing anything that is not exact. */
  function minorFrom(form, name) {
    var raw = form.elements[name] ? form.elements[name].value : '';
    var parsed = core.toMinor(raw, currency);
    if (!parsed.ok) throw new Error(name + ': ' + parsed.message);
    return parsed.minor;
  }

  function optionalMinor(form, name) {
    var raw = form.elements[name] ? form.elements[name].value.trim() : '';
    if (raw === '') return null;
    return minorFrom(form, name);
  }

  function value(form, name) {
    var field = form.elements[name];
    return field ? field.value.trim() : '';
  }

  var handlers = {};

  function bindForms() {
    document.addEventListener('submit', function (event) {
      var form = event.target;
      var action = form.getAttribute('data-action');
      if (!action) return;
      event.preventDefault();
      var handler = handlers[action];
      if (!handler) return;
      try {
        var result = handler(form);
        if (result && result.then) result.catch(fail);
      } catch (error) {
        fail(error);
      }
    });
  }

  // --------------------------------------------------------------- painting

  function paintHealth(overview) {
    var rows = core.healthOf(overview);
    var pills = $('healthPills');
    pills.textContent = '';
    var body = $('healthTable').tBodies[0];
    body.textContent = '';

    rows.forEach(function (row) {
      var pill = el('span', row.label.split(' ')[0], 'pill ' + (row.ok ? 'ok' : 'bad'));
      pill.title = row.label + ' - ' + row.detail;
      pills.appendChild(pill);

      var tr = document.createElement('tr');
      tr.appendChild(el('td', row.ok ? 'ok' : 'FAILED', row.ok ? 'ok' : 'bad'));
      tr.appendChild(el('td', row.label));
      tr.appendChild(el('td', row.ok ? row.detail : row.detail + ' - ' + row.severity, 'muted'));
      body.appendChild(tr);
    });
  }

  function paintFigures(overview) {
    var s = overview.solvency;
    var figures = [
      ['Settlement funds', money(s.assets)],
      ['Callable liabilities', money(s.callable)],
      ['Headroom', money(s.headroom)],
      ['Player wallets', money(s.liabilities.PLAYER_WALLET || 0)],
      ['Runner float', money(s.liabilities.AGENT_FLOAT || 0)],
      ['Unsettled stakes', money(s.liabilities.UNSETTLED_STAKES || 0)],
      ['Jackpot pool', money(overview.jackpot.poolMinor)],
      ['Transactions', String(overview.journalSize)]
    ];
    var list = $('figures');
    list.textContent = '';
    figures.forEach(function (pair) {
      list.appendChild(el('dt', pair[0]));
      list.appendChild(el('dd', pair[1]));
    });
  }

  function pairs(table, rows) {
    var body = table.tBodies[0];
    body.textContent = '';
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', row[0], 'key'));
      tr.appendChild(el('td', row[1], row[2] || ''));
      body.appendChild(tr);
    });
  }

  function loadOverview() {
    return api('GET', '/operator/overview').then(function (overview) {
      currency = overview.currency || currency;
      state.overview = overview;
      paintHealth(overview);
      paintFigures(overview);
      paintProtection(overview.protection);
      return Promise.all([
        api('GET', '/operator/snapshot').then(function (data) {
          pairs($('snapshotTable'), data.accounts.map(function (row) {
            return [row.account, row.formatted, 'num'];
          }));
        }),
        api('GET', '/operator/journal?limit=40').then(paintJournal)
      ]);
    });
  }

  function paintJournal(data) {
    var body = $('journalTable').tBodies[0];
    body.textContent = '';
    data.transactions.forEach(function (tx) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', tx.at, 'muted'));
      tr.appendChild(el('td', tx.kind));
      tr.appendChild(el('td', tx.id, 'muted'));
      tr.appendChild(el('td', (tx.entries || []).map(function (e) {
        return e.account + ' ' + (e.debit ? 'dr ' + money(e.debit) : 'cr ' + money(e.credit));
      }).join('  |  '), 'small'));
      body.appendChild(tr);
    });
  }

  // ---------------------------------------------------------------- runners

  function loadAgents(below) {
    var path = '/operator/agents' + (below === null || below === undefined ? '' : '?below=' + below);
    return api('GET', path).then(function (data) {
      var body = $('agentsTable').tBodies[0];
      body.textContent = '';
      data.agents.forEach(function (agent) {
        var tr = document.createElement('tr');
        tr.appendChild(el('td', agent.agentId));
        tr.appendChild(el('td', money(agent.floatMinor), 'num'));
        tr.appendChild(el('td', agent.suspended ? 'suspended' + (agent.reason ? ' - ' + agent.reason : '') : 'active',
          agent.suspended ? 'bad' : 'ok'));

        var actions = document.createElement('td');
        var toggle = el('button', agent.suspended ? 'Reinstate' : 'Suspend', 'link');
        toggle.type = 'button';
        toggle.addEventListener('click', function () {
          var verb = agent.suspended ? 'reinstate' : 'suspend';
          api('POST', '/operator/agents/' + encodeURIComponent(agent.agentId) + '/' + verb, {
            action: verb + ':' + agent.agentId,
            body: agent.suspended ? {} : { reason: 'suspended from the console' }
          }).then(function () {
            say(agent.agentId + ' ' + verb + 'd.', true);
            return loadAgents(below);
          }).catch(fail);
        });
        actions.appendChild(toggle);
        tr.appendChild(actions);
        body.appendChild(tr);
      });
    });
  }

  handlers.buyFloat = function (form) {
    var agentId = value(form, 'agentId');
    return api('POST', '/operator/agents/' + encodeURIComponent(agentId) + '/float', {
      action: 'float:' + agentId,
      body: { paidMinor: minorFrom(form, 'paid'), floatMinor: minorFrom(form, 'float'), memo: 'console' }
    }).then(function (statement) {
      say('Float sold. ' + agentId + ' now holds ' + money(statement.closingMinor) + '.', true);
      form.reset();
      return Promise.all([loadAgents(null), loadOverview()]);
    });
  };

  handlers.sellFloatBack = function (form) {
    var agentId = value(form, 'agentId');
    return api('POST', '/operator/agents/' + encodeURIComponent(agentId) + '/float-back', {
      action: 'floatback:' + agentId,
      body: { amountMinor: minorFrom(form, 'amount'), memo: 'console' }
    }).then(function () {
      say('Float bought back from ' + agentId + '.', true);
      form.reset();
      return Promise.all([loadAgents(null), loadOverview()]);
    });
  };

  handlers.agentToken = function (form) {
    var agentId = value(form, 'agentId');
    return api('POST', '/operator/agents/' + encodeURIComponent(agentId) + '/tokens', {
      action: 'token:' + agentId, body: {}
    }).then(function (data) {
      var out = $('tokenOut');
      out.textContent = '';
      out.appendChild(el('strong', 'Token for ' + agentId + ' - shown once.'));
      out.appendChild(el('code', data.token));
      out.appendChild(el('p', 'Nothing stores the plaintext, so nothing can show it again.', 'small'));
      out.hidden = false;
    });
  };

  handlers.agentStatement = function (form) {
    var agentId = value(form, 'agentId');
    var query = [];
    if (value(form, 'from')) query.push('from=' + encodeURIComponent(value(form, 'from')));
    if (value(form, 'to')) query.push('to=' + encodeURIComponent(value(form, 'to')));
    var path = '/operator/agents/' + encodeURIComponent(agentId) + '/statement' +
      (query.length ? '?' + query.join('&') : '');
    return api('GET', path).then(function (s) {
      var m = s.movements;
      pairs($('statementTable'), [
        ['Opening float', money(s.openingMinor), 'num'],
        ['Float purchased', money(m.purchases), 'num'],
        ['Sold to players', money(m.sales), 'num'],
        ['Vouchers issued', money(m.vouchers), 'num'],
        ['Payouts handled', money(m.payouts), 'num'],
        ['Redemptions', money(m.redemptions), 'num'],
        ['Other', money(m.other), 'num'],
        ['Commission earned', money(s.commissionMinor), 'num'],
        ['Closing float', money(s.closingMinor), 'num'],
        // The one line that matters: a statement whose closing figure is not
        // the balance the ledger holds is a statement about nothing.
        ['Reconciles with the ledger', s.reconciles ? 'yes' : 'NO', s.reconciles ? 'ok' : 'bad']
      ]);
    });
  };

  // ------------------------------------------------------------------ draws

  function loadDraws() {
    return api('GET', '/operator/draws').then(function (data) {
      state.draws = data.draws;
      var body = $('drawsTable').tBodies[0];
      body.textContent = '';
      data.draws.forEach(function (draw) {
        var tr = document.createElement('tr');
        tr.appendChild(el('td', draw.drawKey));
        tr.appendChild(el('td', draw.opensAt, 'muted small'));
        tr.appendChild(el('td', draw.cutoffAt, 'muted small'));
        tr.appendChild(el('td', draw.drawAt, 'muted small'));
        tr.appendChild(el('td', String(draw.bets), 'num'));
        tr.appendChild(el('td', draw.result || '-', 'num'));
        var verified = draw.verification ? (draw.verification.ok ? ' verified' : ' FAILS VERIFICATION') : '';
        tr.appendChild(el('td', (draw.settled ? 'settled' : draw.status) + verified,
          draw.verification && !draw.verification.ok ? 'bad' : ''));
        body.appendChild(tr);
      });
    });
  }

  /**
   * Generate a seed in the browser and show it once.
   *
   * The seed must not reach the server before the reveal: an operator who can
   * read tomorrow's seed out of their own database can bet on it. So it is
   * made here, displayed once, and only the commitment is sent.
   */
  function generateSeed() {
    var bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    var seed = Array.prototype.map.call(bytes, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');

    var drawKey = value($('dKey').form, 'drawKey');
    if (!drawKey) return say('Give the draw a key first - the commitment is bound to it.', false);

    var data = new TextEncoder().encode(drawKey + '|' + seed);
    return window.crypto.subtle.digest('SHA-256', data).then(function (digest) {
      var commitment = Array.prototype.map.call(new Uint8Array(digest), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
      $('dCommit').value = commitment;
      $('seedValue').textContent = seed;
      $('seedBox').hidden = false;
      $('seedSaved').checked = false;
      $('openDrawBtn').disabled = true;
    });
  }

  handlers.openDraw = function (form) {
    var commitment = value(form, 'commitment');
    if (!core.isHex64(commitment)) throw new Error('A commitment is 64 hex characters.');
    var drawAt = value(form, 'drawAt');
    var lead = Number(value(form, 'lead') || 5);
    if (!Number.isInteger(lead) || lead < 0) throw new Error('Cutoff lead must be a whole number of minutes.');
    var draw = Date.parse(drawAt);
    if (Number.isNaN(draw)) throw new Error('Draw time must be an ISO timestamp, e.g. 2026-09-01T19:00:00Z.');

    var cutoff = new Date(draw - lead * 60000).toISOString();
    var opens = new Date(Date.parse(cutoff) - 24 * 3600 * 1000).toISOString();

    return api('POST', '/operator/draws', {
      action: 'draw:' + value(form, 'drawKey'),
      body: {
        drawKey: value(form, 'drawKey'), commitment: commitment,
        opensAt: opens, cutoffAt: cutoff, drawAt: new Date(draw).toISOString()
      }
    }).then(function (receipt) {
      say('Draw ' + receipt.drawKey + ' is committed. Betting opens ' + receipt.opensAt + '.', true);
      $('seedBox').hidden = true;
      $('seedValue').textContent = '';
      form.reset();
      $('openDrawBtn').disabled = false;
      return loadDraws();
    });
  };

  handlers.revealDraw = function (form) {
    var drawKey = value(form, 'drawKey');
    var seed = value(form, 'seed');
    if (!core.isHex64(seed)) throw new Error('A seed is 64 hex characters.');
    return api('POST', '/operator/draws/' + encodeURIComponent(drawKey) + '/reveal', {
      action: 'reveal:' + drawKey, body: { seed: seed }
    }).then(function (data) {
      say('Draw ' + drawKey + ' drew ' + data.result + '.', true);
      form.reset();
      return loadDraws();
    });
  };

  handlers.settleDraw = function (form) {
    var drawKey = value(form, 'drawKey');
    return api('POST', '/operator/draws/' + encodeURIComponent(drawKey) + '/settle', {
      action: 'settle:' + drawKey, body: {}
    }).then(function (s) {
      $('settleOut').textContent = s.betsSettled + ' bet(s) settled, ' + s.winners + ' winner(s), ' +
        money(s.totalStakes) + ' staked, ' + money(s.totalPayout) + ' paid.';
      say('Draw ' + drawKey + ' settled.', true);
      return Promise.all([loadDraws(), loadOverview()]);
    });
  };

  // ---------------------------------------------------------------- players

  function showPlayer(statement) {
    pairs($('playerTable'), [
      ['Player', statement.playerId],
      ['Wallet', statement.walletFormatted, 'num'],
      ['Staked today', money(statement.stakedTodayMinor), 'num'],
      ['Won today', money(statement.wonTodayMinor), 'num'],
      ['Net today', money(statement.netTodayMinor), 'num'],
      ['Excluded', statement.excluded ? 'yes' + (statement.excludedUntil ? ' until ' + statement.excludedUntil : ' (indefinite)') : 'no',
        statement.excluded ? 'bad' : ''],
      ['Limits in force', statement.limits
        ? 'stake ' + (statement.limits.dailyStakeMinor === null ? 'none' : money(statement.limits.dailyStakeMinor)) +
          ', loss ' + (statement.limits.dailyLossMinor === null ? 'none' : money(statement.limits.dailyLossMinor))
        : 'none']
    ]);
  }

  handlers.player = function (form) {
    return api('GET', '/operator/players/' + encodeURIComponent(value(form, 'playerId'))).then(showPlayer);
  };

  handlers.setPin = function (form) {
    var playerId = value(form, 'playerId');
    return api('POST', '/operator/players/' + encodeURIComponent(playerId) + '/pin', {
      action: 'pin:' + playerId, body: { pin: value(form, 'pin') }
    }).then(function () {
      say('PIN set for ' + playerId + '.', true);
      form.reset();
    });
  };

  handlers.unlockPlayer = function (form) {
    var playerId = value(form, 'playerId');
    return api('POST', '/operator/players/' + encodeURIComponent(playerId) + '/unlock', {
      action: 'unlock:' + playerId, body: {}
    }).then(function () { say(playerId + ' unlocked.', true); });
  };

  handlers.playerLimits = function (form) {
    var playerId = value(form, 'playerId');
    return api('POST', '/operator/players/' + encodeURIComponent(playerId) + '/limits', {
      action: 'limits:' + playerId,
      body: { dailyStakeMinor: optionalMinor(form, 'stake'), dailyLossMinor: optionalMinor(form, 'loss') }
    }).then(function (statement) {
      say('Limits set for ' + playerId + '.', true);
      showPlayer(statement);
    });
  };

  handlers.excludePlayer = function (form) {
    var playerId = value(form, 'playerId');
    return api('POST', '/operator/players/' + encodeURIComponent(playerId) + '/exclude', {
      action: 'exclude:' + playerId,
      body: { until: value(form, 'until') || null, reason: value(form, 'reason') || null }
    }).then(function (statement) {
      say(playerId + ' is excluded.', true);
      showPlayer(statement);
    });
  };

  handlers.reinstatePlayer = function (form) {
    var playerId = value(form, 'playerId');
    return api('POST', '/operator/players/' + encodeURIComponent(playerId) + '/reinstate', {
      action: 'reinstate:' + playerId, body: {}
    }).then(function (statement) {
      say(playerId + ' is reinstated.', true);
      showPlayer(statement);
    });
  };

  // ------------------------------------------------------------- protection

  function paintProtection(status) {
    pairs($('protectionTable'), [
      ['Global limits', status.active ? 'on since ' + status.since : 'off', status.active ? 'ok' : 'warn'],
      ['Daily stake cap', status.dailyStakeMinor === null ? 'none' : money(status.dailyStakeMinor), 'num'],
      ['Daily loss cap', status.dailyLossMinor === null ? 'none' : money(status.dailyLossMinor), 'num'],
      ['Players with their own limits', String(status.playerLimits), 'num'],
      ['Players excluded', String(status.excluded), 'num']
    ]);
  }

  handlers.setProtection = function (form) {
    return api('POST', '/operator/protection', {
      action: 'protection',
      body: { dailyStakeMinor: optionalMinor(form, 'stake'), dailyLossMinor: optionalMinor(form, 'loss') }
    }).then(function (status) {
      say('Player protection is on.', true);
      paintProtection(status);
    });
  };

  handlers.clearProtection = function () {
    return api('DELETE', '/operator/protection', { action: 'protection-off' }).then(function (status) {
      say('Player protection is off. Per-player limits and exclusions are unaffected.', true);
      paintProtection(status);
    });
  };

  // -------------------------------------------------------- money in flight

  function loadMoney() {
    return api('GET', '/operator/mobile-money').then(function (data) {
      var pending = $('pendingTable').tBodies[0];
      pending.textContent = '';
      data.pending.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.appendChild(el('td', row.ref, 'mono'));
        tr.appendChild(el('td', row.type));
        tr.appendChild(el('td', money(row.amountMinor), 'num'));
        tr.appendChild(el('td', row.openedAt || row.at || '', 'muted small'));
        pending.appendChild(tr);
      });

      var anomalies = $('anomalyTable').tBodies[0];
      anomalies.textContent = '';
      data.anomalies.forEach(function (row) {
        var rest = {};
        Object.keys(row).forEach(function (k) {
          if (k !== 'ref' && k !== 'reason') rest[k] = row[k];
        });
        var tr = document.createElement('tr');
        tr.appendChild(el('td', row.ref, 'mono'));
        tr.appendChild(el('td', row.reason, 'bad'));
        tr.appendChild(el('td', JSON.stringify(rest), 'small muted'));
        anomalies.appendChild(tr);
      });
    });
  }

  handlers.reconcile = function () {
    return api('POST', '/operator/mobile-money/reconcile', { body: {} }).then(function (result) {
      say('Swept: ' + JSON.stringify(result), true);
      return Promise.all([loadMoney(), loadOverview()]);
    });
  };

  // ------------------------------------------------------------- promotions

  function loadJackpot() {
    return api('GET', '/operator/jackpot').then(function (j) {
      pairs($('jackpotTable'), [
        ['Pool', j.poolFormatted, 'num'],
        ['Covered by settlement funds', j.funded ? 'yes' : 'NO', j.funded ? 'ok' : 'bad']
      ]);
    });
  }

  handlers.fundJackpot = function (form) {
    return api('POST', '/operator/jackpot/fund', {
      action: 'jackpot-fund:' + value(form, 'drawKey'),
      body: { drawKey: value(form, 'drawKey'), amountMinor: minorFrom(form, 'amount') }
    }).then(function () {
      say('Jackpot funded.', true);
      form.reset();
      return Promise.all([loadJackpot(), loadOverview()]);
    });
  };

  handlers.payJackpot = function (form) {
    return api('POST', '/operator/jackpot/pay', {
      action: 'jackpot-pay:' + value(form, 'drawKey') + ':' + value(form, 'playerId'),
      body: {
        drawKey: value(form, 'drawKey'), playerId: value(form, 'playerId'),
        amountMinor: minorFrom(form, 'amount')
      }
    }).then(function () {
      say('Jackpot paid into the wallet.', true);
      form.reset();
      return Promise.all([loadJackpot(), loadOverview()]);
    });
  };

  handlers.campaign = function (form) {
    return api('GET', '/operator/promotions/' + encodeURIComponent(value(form, 'campaignId'))).then(function (c) {
      pairs($('campaignTable'), [
        ['Campaign', c.campaignId],
        ['Spent', c.spentFormatted, 'num'],
        ['Outstanding vouchers', c.outstandingFormatted, 'num']
      ]);
    });
  };

  handlers.freeTicket = function (form) {
    return api('POST', '/operator/promotions/free-tickets', {
      action: 'ticket:' + value(form, 'ticketId'),
      body: {
        campaignId: value(form, 'campaignId'), ticketId: value(form, 'ticketId'),
        playerId: value(form, 'playerId'), faceMinor: minorFrom(form, 'face')
      }
    }).then(function () {
      say('Free ticket issued.', true);
      form.reset();
      return loadOverview();
    });
  };

  // -------------------------------------------------------------- treasury

  handlers.capital = function (form) {
    return api('POST', '/operator/capital', {
      action: 'capital', body: { amountMinor: minorFrom(form, 'amount'), memo: value(form, 'memo') || null }
    }).then(function () {
      say('Capital injected.', true);
      form.reset();
      return loadOverview();
    });
  };

  handlers.tax = function (form) {
    return api('POST', '/operator/tax', {
      action: 'tax', body: { amountMinor: minorFrom(form, 'amount'), memo: value(form, 'memo') || null }
    }).then(function () {
      say('Tax accrued.', true);
      form.reset();
      return loadOverview();
    });
  };

  // ---------------------------------------------------------------- reports

  var lastReport = null;

  /**
   * Build the query for the chosen report. A day and an explicit window are
   * alternatives, not a blend: sending both would let the label on the page
   * disagree with the span the server actually used.
   */
  function reportQuery(kind) {
    var params = [];
    var day = $('reportDay').value.trim();
    var from = $('reportFrom').value.trim();
    var to = $('reportTo').value.trim();
    var rate = $('reportRate').value.trim();

    if (kind === 'liabilities') {
      if (to) params.push('at=' + encodeURIComponent(to));
    } else if (day) {
      params.push('day=' + encodeURIComponent(day));
    } else {
      if (from) params.push('from=' + encodeURIComponent(from));
      if (to) params.push('to=' + encodeURIComponent(to));
    }
    if (kind === 'tax' && rate) params.push('rate=' + encodeURIComponent(rate));
    return params.length ? '?' + params.join('&') : '';
  }

  var REPORT_TITLES = {
    'daily-close': 'Daily close',
    close: 'Close',
    revenue: 'Revenue and hold',
    'tax-base': 'Tax base',
    promotions: 'Promotions',
    liabilities: 'Liabilities'
  };

  function reportPeriod(report) {
    if (report.day) return report.day;
    if (report.report === 'liabilities') return 'as at ' + (report.at || 'now');
    return (report.from || 'the beginning') + ' to ' + (report.to || 'now');
  }

  function paintReport(report) {
    lastReport = report;
    $('downloadCsv').disabled = false;
    $('reportOut').hidden = false;
    $('reportTitle').textContent =
      (REPORT_TITLES[report.report] || report.report) + '  -  ' + reportPeriod(report);

    var lines = $('reportLines').tBodies[0];
    lines.textContent = '';
    (report.lines || []).forEach(function (line) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', line.label, 'key'));
      tr.appendChild(el('td', line.formatted, 'num'));
      tr.appendChild(el('td', line.note || '', 'note'));
      lines.appendChild(tr);
    });

    var host = $('reportTables');
    host.textContent = '';
    (report.tables || []).forEach(function (table) {
      var wrap = el('div', null, 'report-table');
      wrap.appendChild(el('h3', table.name));
      if (!table.rows.length) {
        wrap.appendChild(el('p', 'Nothing in this window.', 'muted small'));
        host.appendChild(wrap);
        return;
      }
      var scroll = el('div', null, 'scroll');
      var node = document.createElement('table');
      node.className = 'grid';
      var head = document.createElement('thead');
      var headRow = document.createElement('tr');
      table.columns.forEach(function (column, i) {
        headRow.appendChild(el('th', column, (table.numeric || []).indexOf(i) === -1 ? '' : 'num'));
      });
      head.appendChild(headRow);
      node.appendChild(head);
      var body = document.createElement('tbody');
      // Only the columns the report calls numeric are right-aligned. A note
      // in a column of money reads as a number that lost its decimal point.
      var numeric = table.numeric || [];
      table.rows.forEach(function (row) {
        var tr = document.createElement('tr');
        row.forEach(function (cell, i) {
          tr.appendChild(el('td', cell, numeric.indexOf(i) === -1 ? '' : 'num'));
        });
        body.appendChild(tr);
      });
      node.appendChild(body);
      scroll.appendChild(node);
      wrap.appendChild(scroll);
      host.appendChild(wrap);
    });

    var checks = $('reportChecks').tBodies[0];
    checks.textContent = '';
    (report.checks || []).forEach(function (item) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', item.ok ? 'ok' : 'FAILED', item.ok ? 'ok' : 'bad'));
      tr.appendChild(el('td', item.label));
      tr.appendChild(el('td', item.detail, 'muted'));
      checks.appendChild(tr);
    });
  }

  function runReport() {
    var kind = $('reportKind').value;
    return api('GET', '/operator/reports/' + kind + reportQuery(kind)).then(paintReport);
  }

  /**
   * Fetch the CSV and hand it to the browser as a file.
   *
   * A plain link cannot do this: the token travels as a header, not a cookie,
   * so the download has to be an authenticated request whose body is then
   * saved.
   */
  function downloadReport() {
    var kind = $('reportKind').value;
    var query = reportQuery(kind);
    var url = '/operator/reports/' + kind + query + (query ? '&' : '?') + 'format=csv';
    var headers = { accept: 'text/csv' };
    var current = token();
    if (current) headers.authorization = 'Bearer ' + current;

    return window.fetch(url, { headers: headers }).then(function (response) {
      if (!response.ok) throw new Error(core.describeError(response.status, {}));
      return response.text();
    }).then(function (text) {
      var blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      var href = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = href;
      link.download = (lastReport ? lastReport.report : kind) + '-' +
        (lastReport && lastReport.day ? lastReport.day : new Date().toISOString().slice(0, 10)) + '.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    });
  }

  // ------------------------------------------------------------------ shell

  var LOADERS = {
    overview: loadOverview,
    runners: function () { return loadAgents(null); },
    draws: loadDraws,
    players: function () { return Promise.resolve(); },
    protection: function () { return loadOverview(); },
    money: loadMoney,
    promotions: loadJackpot,
    // A report is run on demand: the window matters, so guessing one and
    // painting it would be answering a question nobody asked.
    reports: function () { return Promise.resolve(); }
  };

  function show(name) {
    var tabs = document.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.setAttribute('aria-selected', String(tab.getAttribute('data-tab') === name));
    });
    var panels = document.querySelectorAll('.panel');
    Array.prototype.forEach.call(panels, function (panel) {
      panel.hidden = panel.getAttribute('data-panel') !== name;
    });
    var load = LOADERS[name];
    if (load) load().catch(fail);
  }

  function signIn(value) {
    setToken(value);
    return loadOverview().then(function () {
      $('signin').hidden = true;
      $('app').hidden = false;
      $('signOut').hidden = false;
      show('overview');
    });
  }

  function signOut() {
    setToken(null);
    $('app').hidden = true;
    $('signOut').hidden = true;
    $('signin').hidden = false;
    $('healthPills').textContent = '';
    $('tokenInput').value = '';
  }

  function start() {
    bindForms();

    $('signinForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var error = $('signinError');
      error.hidden = true;
      signIn($('tokenInput').value.trim()).catch(function (e) {
        setToken(null);
        error.textContent = e.message;
        error.hidden = false;
      });
    });

    $('signOut').addEventListener('click', signOut);
    $('refresh').addEventListener('click', function () { loadOverview().catch(fail); });
    $('genSeed').addEventListener('click', function () {
      var result = generateSeed();
      if (result && result.catch) result.catch(fail);
    });
    $('seedSaved').addEventListener('change', function (event) {
      $('openDrawBtn').disabled = !event.target.checked;
    });

    $('reportForm').addEventListener('submit', function (event) {
      event.preventDefault();
      runReport().catch(fail);
    });
    $('downloadCsv').addEventListener('click', function () { downloadReport().catch(fail); });
    var fieldsFor = function () {
      var kind = $('reportKind').value;
      // A field that does nothing on the chosen report is disabled rather
      // than ignored, so the form cannot promise a window it will not use.
      $('reportDay').disabled = kind === 'liabilities';
      $('reportFrom').disabled = kind === 'liabilities' || $('reportDay').value.trim() !== '';
      $('reportRate').disabled = kind !== 'tax';
      $('reportTo').disabled = kind !== 'liabilities' && $('reportDay').value.trim() !== '';
    };
    $('reportKind').addEventListener('change', function () {
      $('downloadCsv').disabled = true;
      $('reportOut').hidden = true;
      fieldsFor();
    });
    $('reportDay').addEventListener('input', fieldsFor);
    fieldsFor();

    $('floatFilter').addEventListener('submit', function (event) {
      event.preventDefault();
      var parsed = core.toMinor($('belowInput').value, currency);
      if (!parsed.ok) return say(parsed.message, false);
      loadAgents(parsed.minor).catch(fail);
    });
    $('clearFilter').addEventListener('click', function () { loadAgents(null).catch(fail); });

    document.getElementById('tabs').addEventListener('click', function (event) {
      var name = event.target.getAttribute && event.target.getAttribute('data-tab');
      if (name) show(name);
    });

    if (token()) signIn(token()).catch(function () { signOut(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
