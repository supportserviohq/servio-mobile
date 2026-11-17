const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'www', 'index.html');
const backupPath = path.join(__dirname, 'www', 'index.v1.21.backup.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ Could not find www/index.html. Run this inside servio-mobile-capacitor-v1.20');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('SERVIO_AUTH_GATE_V122_INSTALLED')) {
  fs.writeFileSync(backupPath, html, 'utf8');
  console.log('✅ Created backup at www/index.v1.21.backup.html');
} else {
  console.log('ℹ️ Updating existing Auth Gate installation...');
  html = html.replace(/<!-- ================= SERVIO_AUTH_GATE_V122_INSTALLED ================= -->[\s\S]*?<\/script>/, '');
}

const authGateSnippet = `<!-- ================= SERVIO_AUTH_GATE_V122_INSTALLED ================= -->
<div id="servio-auth-gate-overlay" class="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
  <div class="theme-card rounded-3xl max-w-md w-full p-6 space-y-5 border-2 border-amber-500/70 shadow-2xl my-auto">
    <!-- Brand Header -->
    <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div class="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shrink-0">⚡</div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-black text-white tracking-tight">Servio</h1>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">v1.22 Auth</span>
        </div>
        <p class="text-xs theme-text-muted">Field Service &amp; HQ Dispatch Portal</p>
      </div>
    </div>

    <!-- Mode Tabs: Sign In vs Create Account -->
    <div class="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
      <button type="button" id="ag-tab-signin" onclick="switchAuthGateMode('signin')" class="py-2 rounded-lg font-black bg-amber-500 text-slate-950 shadow">
        🔐 Sign In
      </button>
      <button type="button" id="ag-tab-signup" onclick="switchAuthGateMode('signup')" class="py-2 rounded-lg font-bold text-slate-300 hover:text-white">
        ➕ Create Account
      </button>
    </div>

    <!-- Error / Status Banner -->
    <div id="ag-status-msg" class="hidden rounded-xl p-3 text-xs font-mono border"></div>

    <!-- Login / Sign-Up Form -->
    <form onsubmit="handleAuthGateSubmit(event)" class="space-y-3 text-xs">
      <div id="ag-signup-extra-fields" class="hidden space-y-3">
        <div>
          <label class="block text-[10px] font-mono uppercase theme-text-muted mb-1">Full Name *</label>
          <input id="ag-fullname" type="text" placeholder="e.g., Julie Ivester or Mike R." class="theme-input w-full rounded-xl px-3 py-2.5 font-bold text-xs" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-mono uppercase theme-text-muted mb-1">Account Role *</label>
            <select id="ag-role" onchange="toggleAuthTechPicker(this.value)" class="theme-input w-full rounded-xl px-2.5 py-2.5 font-bold text-xs text-amber-300">
              <option value="admin">🖥️ Office Admin / HQ</option>
              <option value="tech">📱 Field Technician</option>
            </select>
          </div>
          <div id="ag-tech-picker-wrap" class="hidden">
            <label class="block text-[10px] font-mono uppercase theme-text-muted mb-1">Assigned Truck *</label>
            <select id="ag-tech-id" class="theme-input w-full rounded-xl px-2.5 py-2.5 font-bold text-xs text-cyan-300">
              <option value="tech-mike">Mike R. (Truck #14)</option>
              <option value="tech-sarah">Sarah L. (Truck #08)</option>
              <option value="tech-dave">Dave K. (Truck #21)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-mono uppercase theme-text-muted mb-1">Work Email *</label>
        <input id="ag-email" type="email" required placeholder="you@company.com" class="theme-input w-full rounded-xl px-3 py-2.5 font-mono text-xs" />
      </div>

      <div>
        <label class="block text-[10px] font-mono uppercase theme-text-muted mb-1">Password *</label>
        <input id="ag-password" type="password" required minlength="6" placeholder="••••••••" class="theme-input w-full rounded-xl px-3 py-2.5 font-mono text-xs" />
      </div>

      <button id="ag-submit-btn" type="submit" class="glove-btn w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3.5 shadow-xl">
        🔐 Sign In to Servio
      </button>
    </form>

    <!-- Quick Testing Bypass (For Instant Demo & Role Verification) -->
    <div class="pt-3 border-t border-slate-800 space-y-2">
      <div class="text-[10px] font-mono uppercase text-slate-400 text-center font-bold">⚡ Quick Role Preview (Instant Test Access)</div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" onclick="quickLoginRolePreview('admin', 'ALL', 'Office Admin')"
          class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold">
          🖥️ Preview Office HQ
        </button>
        <button type="button" onclick="quickLoginRolePreview('tech', 'tech-mike', 'Mike R. (Truck #14)')"
          class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-mono text-[11px] font-bold">
          📱 Preview Tech (#14)
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  (function() {
    const AUTH_SESSION_KEY = 'servio_active_role_session_v122';
    let authGateMode = 'signin';

    function getSbClient() {
      if (window.supabaseClient) return window.supabaseClient;
      const url = document.getElementById('sb-cfg-url')?.value || 'https://oowfquqrhqshthkryueb.supabase.co';
      const key = document.getElementById('sb-cfg-key')?.value || 'sb_publishable_KEAzhMN_puMXxhc3eamHYQ_Gwbdai3D';
      if (window.supabase && window.supabase.createClient) {
        window.supabaseClient = window.supabase.createClient(url, key);
        return window.supabaseClient;
      }
      return null;
    }

    function populateAuthTechDropdown() {
      const sel = document.getElementById('ag-tech-id');
      if (!sel || !window.state || !Array.isArray(state.technicians)) return;
      sel.innerHTML = state.technicians.map(t => \`<option value="\${t.id}">\${t.label}</option>\`).join('');
    }

    window.switchAuthGateMode = function(mode) {
      authGateMode = mode;
      const extra = document.getElementById('ag-signup-extra-fields');
      const btnIn = document.getElementById('ag-tab-signin');
      const btnUp = document.getElementById('ag-tab-signup');
      const submitBtn = document.getElementById('ag-submit-btn');
      populateAuthTechDropdown();

      if (mode === 'signup') {
        extra.classList.remove('hidden');
        btnUp.className = 'py-2 rounded-lg font-black bg-amber-500 text-slate-950 shadow';
        btnIn.className = 'py-2 rounded-lg font-bold text-slate-300 hover:text-white';
        submitBtn.textContent = '➕ Create Account & Sign In';
      } else {
        extra.classList.add('hidden');
        btnIn.className = 'py-2 rounded-lg font-black bg-amber-500 text-slate-950 shadow';
        btnUp.className = 'py-2 rounded-lg font-bold text-slate-300 hover:text-white';
        submitBtn.textContent = '🔐 Sign In to Servio';
      }
    };

    window.toggleAuthTechPicker = function(role) {
      const wrap = document.getElementById('ag-tech-picker-wrap');
      if (!wrap) return;
      if (role === 'tech') wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    };

    function showAuthStatus(msg, isError) {
      const box = document.getElementById('ag-status-msg');
      if (!box) return;
      box.classList.remove('hidden');
      box.textContent = msg;
      box.className = isError
        ? 'rounded-xl p-3 text-xs font-mono border bg-rose-950/90 text-rose-200 border-rose-500'
        : 'rounded-xl p-3 text-xs font-mono border bg-emerald-950/90 text-emerald-200 border-emerald-500';
    }

    window.handleAuthGateSubmit = async function(e) {
      e.preventDefault();
      const client = getSbClient();
      if (!client) return showAuthStatus('Supabase client not initialized.', true);

      const email = document.getElementById('ag-email').value.trim().toLowerCase();
      const password = document.getElementById('ag-password').value;
      const fullName = document.getElementById('ag-fullname')?.value.trim() || email.split('@')[0];
      const selectedRole = document.getElementById('ag-role')?.value || 'admin';
      const assignedTechId = selectedRole === 'tech' ? (document.getElementById('ag-tech-id')?.value || 'tech-mike') : 'ALL';

      showAuthStatus(authGateMode === 'signup' ? 'Creating account in Supabase...' : 'Verifying credentials...', false);

      try {
        let userId = null;
        if (authGateMode === 'signup') {
          const { data, error } = await client.auth.signUp({ email, password });
          if (error) throw error;
          userId = data?.user?.id || null;

          await client.from('user_profiles').upsert([{
            user_id: userId,
            email,
            full_name: fullName,
            role: selectedRole,
            assigned_tech_id: assignedTechId
          }], { onConflict: 'email' });

          applyAuthenticatedSession({
            email,
            fullName,
            role: selectedRole,
            assignedTechId
          });
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          userId = data?.user?.id || null;

          // Fetch role profile from user_profiles table
          const { data: prof } = await client
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          applyAuthenticatedSession({
            email,
            fullName: prof?.full_name || email.split('@')[0],
            role: prof?.role || 'admin',
            assignedTechId: prof?.assigned_tech_id || 'ALL'
          });
        }
      } catch (err) {
        showAuthStatus(err.message || 'Authentication failed. Check email/password.', true);
      }
    };

    window.quickLoginRolePreview = function(role, assignedTechId, label) {
      applyAuthenticatedSession({
        email: role === 'admin' ? 'office@serviohq.com' : 'tech@serviohq.com',
        fullName: label,
        role,
        assignedTechId
      });
    };

    function applyAuthenticatedSession(sessionObj) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
      const gate = document.getElementById('servio-auth-gate-overlay');
      if (gate) gate.classList.add('hidden');

      const officeBtn = document.getElementById('mode-btn-office');
      const techSel = document.getElementById('global-tech-selector');

      if (sessionObj.role === 'tech') {
        // Lock field technicians to Tech Mode & their assigned truck
        if (officeBtn) officeBtn.classList.add('hidden');
        if (window.switchAppMode) switchAppMode('tech');
        if (window.state) {
          state.selectedTechId = sessionObj.assignedTechId || 'tech-mike';
          state.vanStockTechId = sessionObj.assignedTechId || 'tech-mike';
          const firstTechJob = (state.jobs || []).find(j => j.techId === state.selectedTechId);
          if (firstTechJob) state.activeJobId = firstTechJob.id;
        }
        if (techSel) {
          techSel.value = sessionObj.assignedTechId || 'tech-mike';
          techSel.disabled = true;
        }
      } else {
        // Office Admin gets full access to both Office and Tech modes
        if (officeBtn) officeBtn.classList.remove('hidden');
        if (techSel) techSel.disabled = false;
      }

      injectHeaderUserBadge(sessionObj);
      if (window.saveState) saveState();
      if (window.showToast) {
        showToast('✅ Signed in as ' + sessionObj.fullName + ' (' + (sessionObj.role === 'admin' ? 'Office HQ' : 'Field Tech') + ')');
      }
    }

    function injectHeaderUserBadge(sessionObj) {
      let badge = document.getElementById('servio-header-user-pill');
      const cloudBtn = document.querySelector('button[onclick="openSupabaseCloudModal()"]');
      if (!badge && cloudBtn && cloudBtn.parentNode) {
        badge = document.createElement('button');
        badge.id = 'servio-header-user-pill';
        badge.type = 'button';
        badge.onclick = window.signOutServioUser;
        badge.title = 'Tap to Sign Out / Switch User Role';
        cloudBtn.parentNode.insertBefore(badge, cloudBtn);
      }
      if (badge) {
        const isTech = sessionObj.role === 'tech';
        badge.className = 'px-2 py-1 rounded-lg text-[11px] font-mono font-extrabold flex items-center gap-1 whitespace-nowrap border ' +
          (isTech ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40');
        badge.innerHTML = \`<span>\${isTech ? '👷' : '👑'}</span><span class="hidden sm:inline">\${sessionObj.fullName}</span><span>• Exit</span>\`;
      }
    }

    window.signOutServioUser = async function() {
      localStorage.removeItem(AUTH_SESSION_KEY);
      const client = getSbClient();
      if (client) {
        try { await client.auth.signOut(); } catch (e) {}
      }
      const gate = document.getElementById('servio-auth-gate-overlay');
      if (gate) gate.classList.remove('hidden');
      const statusBox = document.getElementById('ag-status-msg');
      if (statusBox) statusBox.classList.add('hidden');
      if (window.showToast) showToast('🔒 Signed out of Servio');
    };

    window.addEventListener('DOMContentLoaded', () => {
      populateAuthTechDropdown();
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.role) {
            applyAuthenticatedSession(parsed);
          }
        } catch (e) {}
      }
    });
  })();
</script>`;

html = html.replace(/<\/body>/i, authGateSnippet + '\n</body>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Successfully installed Servio Login Gate & Role-Based Access Control in www/index.html!');