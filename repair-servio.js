const fs = require('fs');
const path = require('path');

const wwwIndexPath = path.join(__dirname, 'www', 'index.html');
const rootIndexPath = path.join(__dirname, 'index.html');
const backupPath = path.join(__dirname, 'www', 'index.v1.20.backup.html');

if (!fs.existsSync( backupPath ) && !fs.existsSync( wwwIndexPath )) {
  console.error('❌ Could not find www/index.html. Make sure you are in servio-mobile-capacitor-v1.20');
  process.exit(1);
}

// 1. Start from the pristine v1.20 backup so all previous patch scripts are wiped clean
let html = fs.existsSync(backupPath)
  ? fs.readFileSync(backupPath, 'utf8')
  : fs.readFileSync(wwwIndexPath, 'utf8');

console.log('✅ Loaded clean base index.html');

// Update version badge so you can visually confirm both phones are on v1.26
html = html.replace(/by ServioHQ • v1\.20/g, 'by ServioHQ • v1.26');

// 2. Add Membership Badge & Drawer to Field Tech Active Job Bar
const warrantyBadgeRegex = /(<span id="mobile-active-warranty-badge"[^>]*>[\s\S]*?<\/span>)/;
const techMembershipBadgeHtml = `$1
          <span id="mobile-active-membership-badge" onclick="openTechMembershipDrawer()" class="cursor-pointer text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40" title="Tap to view or log customer PM membership visit">👑 NO PLAN</span>`;

if (warrantyBadgeRegex.test(html)) {
  html = html.replace(warrantyBadgeRegex, techMembershipBadgeHtml);
}

const quickWarrantyDrawerRegex = /(<div id="quick-warranty-drawer"[\s\S]*?<\/div>\s*<\/div>)/;
const techMembershipDrawerHtml = `$1
      <div id="quick-membership-drawer" class="hidden mt-3 pt-3 border-t border-slate-700/80 text-xs space-y-2">
        <div id="quick-membership-drawer-content"></div>
      </div>`;

if (quickWarrantyDrawerRegex.test(html)) {
  html = html.replace(quickWarrantyDrawerRegex, techMembershipDrawerHtml);
}

// 3. Inject Customer Membership Fields inside the Add/Edit Customer Form
const crmSmsBlockRegex = /(<div class="theme-subcard rounded-2xl p-3 border border-cyan-500\/40">\s*<label[^>]*>\s*<input id="crm-sms-optin")/;
const crmMembershipFieldsHtml = `<!-- Customer Membership Plan & Visit Allowance Tracker -->
          <div class="theme-subcard rounded-2xl p-3.5 space-y-2.5 border-2 border-purple-500/50">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase text-purple-300 font-black">👑 Customer Membership Plan &amp; PM Visits</span>
              <span id="crm-member-badge-preview" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">No Active Plan</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-1">Select Company Plan Tier</label>
                <select id="crm-membership-plan" onchange="handleCrmPlanDropdownChange(this.value)" class="theme-input w-full rounded-xl px-2.5 py-2 font-bold text-xs text-purple-300">
                  <option value="">-- No Membership Plan --</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-1">Membership Status</label>
                <select id="crm-membership-status" class="theme-input w-full rounded-xl px-2.5 py-2 font-mono font-bold text-xs">
                  <option value="None">None</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired / Past Due</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 font-mono">
              <div>
                <label class="block text-[10px] theme-text-muted mb-1">Visits Used / Total</label>
                <div class="flex items-center gap-1">
                  <input id="crm-visits-used" type="number" min="0" value="0" class="theme-input w-full rounded-lg px-2 py-1.5 text-center font-black text-amber-300 text-xs" />
                  <span class="text-slate-400">/</span>
                  <input id="crm-visits-total" type="number" min="0" value="0" class="theme-input w-full rounded-lg px-2 py-1.5 text-center font-black text-emerald-400 text-xs" />
                </div>
              </div>
              <div>
                <label class="block text-[10px] theme-text-muted mb-1">Parts Disc (%)</label>
                <input id="crm-member-discount" type="number" min="0" max="100" value="0" class="theme-input w-full rounded-lg px-2 py-1.5 text-center font-black text-cyan-300 text-xs" />
              </div>
              <div>
                <label class="block text-[10px] theme-text-muted mb-1">Renewal Date</label>
                <input id="crm-membership-renewal" type="date" class="theme-input w-full rounded-lg px-2 py-1.5 font-bold text-emerald-300 text-[11px]" />
              </div>
            </div>
          </div>

          $1`;

if (crmSmsBlockRegex.test(html)) {
  html = html.replace(crmSmsBlockRegex, crmMembershipFieldsHtml);
}

// 4. Place the Company Membership Plan Builder DIRECTLY inside the Add/Edit Customer Card
//    (Right below the Save Customer form so Add/Edit and Directory stay in their exact original 2-column layout)
const crmFormEndRegex = /(<button type="submit"[^>]*>\s*💾 Save Customer &amp; SMS Preference to CRM\s*<\/button>\s*<\/form>)/;
const companyPlanBuilderHtml = `$1

        <!-- COMPANY MEMBERSHIP PLAN BUILDER (INSIDE ADD/EDIT SUBCATEGORY) -->
        <div class="pt-4 mt-4 border-t-2 border-slate-700/80 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono uppercase text-purple-400 font-black">Company PM Tiers &amp; Pricing</span>
              <h4 class="text-sm font-black">👑 Company Membership Plan Builder</h4>
            </div>
            <div class="flex items-center gap-1.5">
              <span id="membership-active-count-pill" class="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-black">0 Active</span>
              <button type="button" onclick="syncMembershipPlansWithSupabase(true)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">
                ☁️ Sync
              </button>
            </div>
          </div>

          <div class="theme-subcard rounded-2xl p-3.5 space-y-2.5 border border-purple-500/40 text-xs">
            <div class="flex items-center justify-between">
              <span id="mplan-form-label" class="text-[10px] font-mono uppercase text-purple-300 font-black">➕ Create / Edit Plan Tier</span>
              <button type="button" onclick="resetCompanyPlanForm()" class="text-[10px] font-mono text-slate-400 underline">Clear</button>
            </div>
            <input type="hidden" id="mplan-edit-id" value="" />
            <div class="grid grid-cols-2 gap-2">
              <div class="col-span-2">
                <label class="block text-[10px] font-mono theme-text-muted mb-0.5">Plan Name *</label>
                <input id="mplan-name" type="text" placeholder="e.g., Gold Bi-Annual PM" class="theme-input w-full rounded-xl px-2.5 py-1.5 font-bold text-xs" />
              </div>
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-0.5">Price ($) *</label>
                <input id="mplan-price" type="number" step="0.01" min="0" placeholder="349.00" class="theme-input w-full rounded-xl px-2.5 py-1.5 font-mono font-black text-emerald-400 text-xs" />
              </div>
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-0.5">Billing Cycle</label>
                <select id="mplan-cycle" class="theme-input w-full rounded-xl px-2 py-1.5 font-bold text-xs">
                  <option value="Annual">Annual</option>
                  <option value="Bi-Annual">Bi-Annual</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-0.5">PM Visits / Yr</label>
                <input id="mplan-visits" type="number" min="1" max="12" value="2" class="theme-input w-full rounded-xl px-2.5 py-1.5 font-mono font-black text-amber-300 text-center text-xs" />
              </div>
              <div>
                <label class="block text-[10px] font-mono theme-text-muted mb-0.5">Parts Disc (%)</label>
                <input id="mplan-discount" type="number" min="0" max="100" value="10" class="theme-input w-full rounded-xl px-2.5 py-1.5 font-mono font-black text-cyan-300 text-center text-xs" />
              </div>
            </div>
            <div class="space-y-1.5 pt-1">
              <label class="flex items-center gap-1.5 font-bold text-slate-200 cursor-pointer">
                <input id="mplan-priority" type="checkbox" checked class="rounded border-slate-600 accent-purple-500 w-3.5 h-3.5" />
                <span>⚡ Priority Storm Outage Dispatch</span>
              </label>
              <label class="flex items-center gap-1.5 font-bold text-slate-200 cursor-pointer">
                <input id="mplan-waive-diag" type="checkbox" class="rounded border-slate-600 accent-emerald-500 w-3.5 h-3.5" />
                <span>🛡️ Waive Emergency Diagnostic Fee</span>
              </label>
            </div>
            <button type="button" onclick="saveCompanyMembershipPlan()" class="glove-btn w-full rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs py-2.5 shadow">
              💾 Save Membership Plan Tier
            </button>
          </div>

          <div id="company-membership-plans-grid" class="grid grid-cols-1 gap-2.5"></div>
        </div>`;

if (crmFormEndRegex.test(html)) {
  html = html.replace(crmFormEndRegex, companyPlanBuilderHtml);
  console.log('✅ Nested Company Membership Plan Builder inside Add/Edit Customer card');
}

// 5. Inject Member Perks Bar into Estimate & Invoice Studio Modal
const modalDiscountHeaderRegex = /(<span class="text-\[10px\] font-mono uppercase text-purple-300 font-bold">3\. Office Discount, Courtesy Credit &amp; Tax Controls:<\/span>)/;
const modalMemberPerksBannerHtml = `<div id="inv-modal-membership-perks-bar" class="hidden rounded-xl p-3 mb-2 bg-purple-950/60 border border-purple-500/60 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span id="inv-modal-member-plan-title" class="text-[10px] font-mono uppercase text-purple-300 font-black block">👑 Active Membership Perks Detected</span>
              <div id="inv-modal-member-plan-sub" class="text-xs font-bold text-white mt-0.5"></div>
            </div>
            <label class="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 cursor-pointer bg-slate-900/90 px-2.5 py-1 rounded-lg border border-emerald-500/40">
              <input id="inv-modal-auto-member-perks" type="checkbox" checked onchange="toggleAutoApplyMemberPerks(this.checked)" class="rounded border-slate-600 accent-emerald-500" />
              <span>Auto-Apply Perks</span>
            </label>
          </div>
          <div class="flex flex-wrap gap-1.5 font-mono text-[10px]">
            <button type="button" onclick="applyActiveCustomerMembershipPerksToModal(true)" class="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-black shadow">
              🏷️ Apply Member % Discount
            </button>
            <button type="button" id="inv-modal-waive-diag-btn" onclick="waiveModalDiagnosticFeeForMember()" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-black">
              🛡️ Waive Diagnostic Fee ($0.00)
            </button>
          </div>
        </div>
        $1`;

if (modalDiscountHeaderRegex.test(html)) {
  html = html.replace(modalDiscountHeaderRegex, modalMemberPerksBannerHtml);
}

// 6. Add Unified Membership, Invoice Perks & Fixed Auth Gate Engine
const unifiedEngine = `
<!-- ================= SERVIO_UNIFIED_V126_ENGINE ================= -->
<div id="servio-auth-gate-overlay" class="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
  <div class="theme-card rounded-3xl max-w-md w-full p-6 space-y-5 border-2 border-amber-500/70 shadow-2xl my-auto">
    <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div class="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shrink-0">⚡</div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-black text-white tracking-tight">Servio</h1>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">v1.26 Live</span>
        </div>
        <p class="text-xs theme-text-muted">Field Service &amp; HQ Dispatch Portal</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
      <button type="button" id="ag-tab-signin" onclick="switchAuthGateMode('signin')" class="py-2 rounded-lg font-black bg-amber-500 text-slate-950 shadow">
        🔐 Sign In
      </button>
      <button type="button" id="ag-tab-signup" onclick="switchAuthGateMode('signup')" class="py-2 rounded-lg font-bold text-slate-300 hover:text-white">
        ➕ Create Account
      </button>
    </div>

    <div id="ag-status-msg" class="hidden rounded-xl p-3 text-xs font-mono border"></div>

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

    <div class="pt-3 border-t border-slate-800 space-y-2">
      <div class="text-[10px] font-mono uppercase text-slate-400 text-center font-bold">⚡ Quick Role Switcher (Instant Access)</div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" onclick="quickLoginRolePreview('admin', 'ALL', 'Office Admin')"
          class="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black shadow">
          🖥️ Open Office HQ
        </button>
        <button type="button" onclick="quickLoginRolePreview('tech', 'tech-mike', 'Mike R. (#14)')"
          class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold">
          📱 Open Tech (#14)
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  (function() {
    const AUTH_SESSION_KEY = 'servio_active_role_session_v126';
    let authGateMode = 'signin';
    let autoApplyMemberPerks = true;

    const DEFAULT_COMPANY_PLANS = [
      { id: 'plan-silver-annual', name: 'Silver Annual PM', price: 249.00, billing_cycle: 'Annual', visits_included: 1, discount_percent: 5, priority_service: true, waive_diagnostic: false },
      { id: 'plan-gold-biannual', name: 'Gold Bi-Annual PM', price: 399.00, billing_cycle: 'Bi-Annual', visits_included: 2, discount_percent: 10, priority_service: true, waive_diagnostic: true },
      { id: 'plan-platinum-comm', name: 'Commercial Quarterly PM', price: 895.00, billing_cycle: 'Quarterly', visits_included: 4, discount_percent: 15, priority_service: true, waive_diagnostic: true }
    ];

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

    function ensureMembershipState() {
      if (!window.state) return;
      if (!Array.isArray(state.membershipPlans) || state.membershipPlans.length === 0) {
        state.membershipPlans = JSON.parse(JSON.stringify(DEFAULT_COMPANY_PLANS));
      }
      if (Array.isArray(state.customers)) {
        state.customers.forEach((c, idx) => {
          if (typeof c.membershipStatus === 'undefined') {
            if (idx === 0) {
              c.membershipPlanId = 'plan-gold-biannual';
              c.membershipPlanName = 'Gold Bi-Annual PM';
              c.membershipStatus = 'Active';
              c.membershipRenewalDate = '2027-05-15';
              c.visitsUsed = 1;
              c.visitsTotal = 2;
              c.memberDiscount = 10;
              c.priorityService = true;
              c.waiveDiagnostic = true;
            } else if (idx === 1) {
              c.membershipPlanId = 'plan-platinum-comm';
              c.membershipPlanName = 'Commercial Quarterly PM';
              c.membershipStatus = 'Active';
              c.membershipRenewalDate = '2027-03-01';
              c.visitsUsed = 2;
              c.visitsTotal = 4;
              c.memberDiscount = 15;
              c.priorityService = true;
              c.waiveDiagnostic = true;
            } else {
              c.membershipPlanId = '';
              c.membershipPlanName = 'None';
              c.membershipStatus = 'None';
              c.membershipRenewalDate = '';
              c.visitsUsed = 0;
              c.visitsTotal = 0;
              c.memberDiscount = 0;
              c.priorityService = false;
              c.waiveDiagnostic = false;
            }
          }
        });
      }
    }

    function getCustomerForJob(job) {
      if (!job || !Array.isArray(state.customers)) return null;
      return state.customers.find(c =>
        (c.serial && job.serial && c.serial.toLowerCase() === job.serial.toLowerCase()) ||
        (c.name && job.customer && c.name.toLowerCase() === job.customer.toLowerCase())
      ) || null;
    }

    window.syncMembershipPlansWithSupabase = async function(showNotification) {
      ensureMembershipState();
      const client = getSbClient();
      if (!client) return;
      try {
        const { data, error } = await client.from('membership_plans').select('*').order('price', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          state.membershipPlans = data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            billing_cycle: p.billing_cycle || 'Annual',
            visits_included: Number(p.visits_included || 1),
            discount_percent: Number(p.discount_percent || 0),
            priority_service: !!p.priority_service,
            waive_diagnostic: !!p.waive_diagnostic
          }));
          renderMembershipBuilderAndBadges();
          if (showNotification && window.showToast) showToast('☁️ Synced Membership Plans with Supabase!');
        }
      } catch (e) {}
    };

    window.resetCompanyPlanForm = function() {
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      setVal('mplan-edit-id', '');
      setVal('mplan-name', '');
      setVal('mplan-price', '');
      setVal('mplan-cycle', 'Annual');
      setVal('mplan-visits', 2);
      setVal('mplan-discount', 10);
      const prio = document.getElementById('mplan-priority'); if (prio) prio.checked = true;
      const waive = document.getElementById('mplan-waive-diag'); if (waive) waive.checked = false;
      const lbl = document.getElementById('mplan-form-label');
      if (lbl) lbl.textContent = '➕ Create / Edit Plan Tier';
    };

    window.editCompanyMembershipPlan = function(planId) {
      ensureMembershipState();
      const plan = state.membershipPlans.find(p => String(p.id) === String(planId));
      if (!plan) return;
      document.getElementById('mplan-edit-id').value = plan.id;
      document.getElementById('mplan-name').value = plan.name;
      document.getElementById('mplan-price').value = plan.price;
      document.getElementById('mplan-cycle').value = plan.billing_cycle || 'Annual';
      document.getElementById('mplan-visits').value = plan.visits_included || 1;
      document.getElementById('mplan-discount').value = plan.discount_percent || 0;
      document.getElementById('mplan-priority').checked = !!plan.priority_service;
      document.getElementById('mplan-waive-diag').checked = !!plan.waive_diagnostic;
      const lbl = document.getElementById('mplan-form-label');
      if (lbl) lbl.textContent = '✏️ Editing: ' + plan.name;
    };

    window.saveCompanyMembershipPlan = async function() {
      ensureMembershipState();
      const editId = document.getElementById('mplan-edit-id')?.value.trim();
      const name = document.getElementById('mplan-name')?.value.trim();
      const price = parseFloat(document.getElementById('mplan-price')?.value) || 0;
      const billing_cycle = document.getElementById('mplan-cycle')?.value || 'Annual';
      const visits_included = parseInt(document.getElementById('mplan-visits')?.value) || 1;
      const discount_percent = parseInt(document.getElementById('mplan-discount')?.value) || 0;
      const priority_service = !!document.getElementById('mplan-priority')?.checked;
      const waive_diagnostic = !!document.getElementById('mplan-waive-diag')?.checked;

      if (!name) return window.showToast && showToast('⚠️ Enter a Membership Plan name.');

      const planObj = { id: editId || ('plan-' + Date.now()), name, price, billing_cycle, visits_included, discount_percent, priority_service, waive_diagnostic };
      const idx = state.membershipPlans.findIndex(p => String(p.id) === String(editId));
      if (idx >= 0) state.membershipPlans[idx] = planObj;
      else state.membershipPlans.push(planObj);

      const client = getSbClient();
      if (client) {
        try { await client.from('membership_plans').insert([{ name, price, billing_cycle, visits_included, discount_percent, priority_service, waive_diagnostic }]); } catch (e) {}
      }
      resetCompanyPlanForm();
      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('👑 Saved Membership Plan: ' + name);
    };

    window.deleteCompanyMembershipPlan = async function(planId) {
      ensureMembershipState();
      state.membershipPlans = state.membershipPlans.filter(p => String(p.id) !== String(planId));
      const client = getSbClient();
      if (client) {
        try { await client.from('membership_plans').delete().eq('id', planId); } catch (e) {}
      }
      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('🗑️ Removed membership plan');
    };

    window.handleCrmPlanDropdownChange = function(planId) {
      ensureMembershipState();
      const plan = state.membershipPlans.find(p => String(p.id) === String(planId));
      const statusEl = document.getElementById('crm-membership-status');
      const usedEl = document.getElementById('crm-visits-used');
      const totalEl = document.getElementById('crm-visits-total');
      const discEl = document.getElementById('crm-member-discount');
      const renEl = document.getElementById('crm-membership-renewal');
      const badgeEl = document.getElementById('crm-member-badge-preview');

      if (!plan) {
        if (statusEl) statusEl.value = 'None';
        if (usedEl) usedEl.value = 0;
        if (totalEl) totalEl.value = 0;
        if (discEl) discEl.value = 0;
        if (renEl) renEl.value = '';
        if (badgeEl) {
          badgeEl.textContent = 'No Active Plan';
          badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400';
        }
        return;
      }

      const renewal = new Date();
      if (plan.billing_cycle === 'Monthly') renewal.setMonth(renewal.getMonth() + 1);
      else if (plan.billing_cycle === 'Quarterly') renewal.setMonth(renewal.getMonth() + 3);
      else if (plan.billing_cycle === 'Bi-Annual') renewal.setMonth(renewal.getMonth() + 6);
      else renewal.setFullYear(renewal.getFullYear() + 1);

      if (statusEl) statusEl.value = 'Active';
      if (totalEl) totalEl.value = plan.visits_included;
      if (discEl) discEl.value = plan.discount_percent;
      if (renEl && !renEl.value) renEl.value = renewal.toISOString().split('T')[0];
      if (badgeEl) {
        badgeEl.textContent = '👑 ' + plan.name + ' ($' + Number(plan.price).toFixed(2) + ')';
        badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40';
      }
    };

    window.adjustCustomerMembershipVisit = async function(custId, delta) {
      ensureMembershipState();
      const cust = state.customers.find(c => c.id === custId);
      if (!cust) return;
      cust.visitsUsed = Math.max(0, Number(cust.visitsUsed || 0) + Number(delta));
      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('👑 ' + cust.name + ': Visits Used ' + cust.visitsUsed + '/' + (cust.visitsTotal || 1));
    };

    window.openTechMembershipDrawer = function() {
      const drawer = document.getElementById('quick-membership-drawer');
      if (drawer) drawer.classList.toggle('hidden');
      renderMembershipBuilderAndBadges();
    };

    function renderMembershipBuilderAndBadges() {
      ensureMembershipState();
      const gridEl = document.getElementById('company-membership-plans-grid');
      if (gridEl) {
        gridEl.innerHTML = state.membershipPlans.map(p => \`
          <div class="theme-subcard rounded-xl p-3 space-y-1.5 border border-purple-500/40">
            <div class="flex items-center justify-between gap-2">
              <strong class="text-xs font-black text-white">👑 \${p.name}</strong>
              <span class="font-mono text-xs font-black text-emerald-400">$\${Number(p.price).toFixed(2)} / \${p.billing_cycle}</span>
            </div>
            <div class="text-[11px] font-mono text-slate-300">
              \${p.visits_included} Visits/Yr • \${p.discount_percent}% Parts Disc \${p.priority_service ? '• ⚡ Priority' : ''} \${p.waive_diagnostic ? '• 🛡️ $0 Diag' : ''}
            </div>
            <div class="flex justify-end gap-1.5 pt-1">
              <button type="button" onclick="editCompanyMembershipPlan('\${p.id}')" class="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold">✏️ Edit</button>
              <button type="button" onclick="deleteCompanyMembershipPlan('\${p.id}')" class="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-[10px] font-bold">🗑️ Delete</button>
            </div>
          </div>
        \`).join('');
      }

      const crmPlanSel = document.getElementById('crm-membership-plan');
      if (crmPlanSel) {
        const cur = crmPlanSel.value;
        crmPlanSel.innerHTML = '<option value="">-- No Membership Plan --</option>' +
          state.membershipPlans.map(p => \`<option value="\${p.id}" \${String(cur) === String(p.id) ? 'selected' : ''}>\${p.name} ($\${Number(p.price).toFixed(2)}/\${p.billing_cycle})</option>\`).join('');
      }

      const activeCount = (state.customers || []).filter(c => c.membershipStatus === 'Active').length;
      const countPill = document.getElementById('membership-active-count-pill');
      if (countPill) countPill.textContent = activeCount + ' Active';

      // Tech Active Job Badge
      const job = window.getActiveJob ? getActiveJob() : null;
      if (job) {
        const cust = getCustomerForJob(job);
        const badge = document.getElementById('mobile-active-membership-badge');
        const isAct = cust && cust.membershipStatus === 'Active';
        if (badge) {
          badge.textContent = isAct ? ('👑 ' + cust.membershipPlanName + ' (' + (cust.visitsUsed || 0) + '/' + (cust.visitsTotal || 1) + ')') : '👑 NO PLAN';
          badge.className = isAct
            ? 'cursor-pointer text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50'
            : 'cursor-pointer text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
        }
      }
    }

    // Invoice Member Perks
    function getActiveModalCustomerRecord() {
      if (!window.state || !Array.isArray(state.customers)) return null;
      const crmId = document.getElementById('inv-modal-crm-switcher')?.value || '';
      if (crmId) {
        const byId = state.customers.find(c => c.id === crmId);
        if (byId) return byId;
      }
      const custName = (document.getElementById('inv-modal-cust-name')?.value || '').trim().toLowerCase();
      if (custName) {
        const byName = state.customers.find(c => (c.name || '').toLowerCase() === custName);
        if (byName) return byName;
      }
      const jobId = document.getElementById('inv-modal-job-id')?.value || '';
      const job = (state.jobs || []).find(j => j.id === jobId);
      return job ? getCustomerForJob(job) : null;
    }

    window.toggleAutoApplyMemberPerks = function(checked) {
      autoApplyMemberPerks = !!checked;
      if (autoApplyMemberPerks) applyActiveCustomerMembershipPerksToModal(true);
    };

    window.waiveModalDiagnosticFeeForMember = function() {
      const cust = getActiveModalCustomerRecord();
      const planName = (cust && cust.membershipPlanName) ? cust.membershipPlanName : 'Member';
      const container = document.getElementById('inv-modal-line-items-container');
      if (container) {
        container.querySelectorAll('div, tr').forEach(row => {
          const tInputs = row.querySelectorAll('input[type="text"]');
          const nInputs = row.querySelectorAll('input[type="number"]');
          tInputs.forEach(ti => {
            if (/diag|callout/i.test(ti.value || '')) {
              nInputs.forEach(ni => {
                if (Number(ni.value) > 1) {
                  ni.value = '0.00';
                  ni.dispatchEvent(new Event('input', { bubbles: true }));
                }
              });
            }
          });
        });
      }
      if (typeof window.recalcModalInvoiceSummary === 'function') recalcModalInvoiceSummary();
      if (window.showToast) showToast('🛡️ Waived Diagnostic Fee ($0.00) for ' + planName);
    };

    window.applyActiveCustomerMembershipPerksToModal = function(showFeedback) {
      const bar = document.getElementById('inv-modal-membership-perks-bar');
      const titleEl = document.getElementById('inv-modal-member-plan-title');
      const subEl = document.getElementById('inv-modal-member-plan-sub');
      const cust = getActiveModalCustomerRecord();
      if (!cust || cust.membershipStatus !== 'Active') {
        if (bar) bar.classList.add('hidden');
        return;
      }
      const discPct = Number(cust.memberDiscount || 0);
      const waiveDiag = !!cust.waiveDiagnostic;
      if (bar) bar.classList.remove('hidden');
      if (titleEl) titleEl.textContent = '👑 ACTIVE MEMBER: ' + cust.membershipPlanName;
      if (subEl) subEl.textContent = discPct + '% Member Discount' + (waiveDiag ? ' • $0 Waived Diag Callout' : '');

      if ((autoApplyMemberPerks || showFeedback) && discPct > 0 && typeof window.setModalQuickDiscount === 'function') {
        setModalQuickDiscount('PCT', discPct, '👑 ' + cust.membershipPlanName + ' (' + discPct + '% Off)');
      }
      if ((autoApplyMemberPerks || showFeedback) && waiveDiag) {
        waiveModalDiagnosticFeeForMember();
      }
    };

    // Auth Gate & Role Switcher
    window.switchAuthGateMode = function(mode) {
      authGateMode = mode;
      const extra = document.getElementById('ag-signup-extra-fields');
      const btnIn = document.getElementById('ag-tab-signin');
      const btnUp = document.getElementById('ag-tab-signup');
      const submitBtn = document.getElementById('ag-submit-btn');
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
      if (wrap) wrap.classList.toggle('hidden', role !== 'tech');
    };

    window.quickLoginRolePreview = function(role, assignedTechId, label) {
      applyAuthenticatedSession({
        email: role === 'admin' ? 'office@serviohq.com' : 'tech@serviohq.com',
        fullName: label,
        role,
        assignedTechId
      }, true);
    };

    window.handleAuthGateSubmit = async function(e) {
      e.preventDefault();
      const client = getSbClient();
      const email = document.getElementById('ag-email').value.trim().toLowerCase();
      const password = document.getElementById('ag-password').value;
      const fullName = document.getElementById('ag-fullname')?.value.trim() || email.split('@')[0];
      const selectedRole = document.getElementById('ag-role')?.value || 'admin';
      const assignedTechId = selectedRole === 'tech' ? (document.getElementById('ag-tech-id')?.value || 'tech-mike') : 'ALL';

      try {
        if (authGateMode === 'signup') {
          const { data, error } = await client.auth.signUp({ email, password });
          if (error) throw error;
          await client.from('user_profiles').upsert([{ user_id: data?.user?.id || null, email, full_name: fullName, role: selectedRole, assigned_tech_id: assignedTechId }], { onConflict: 'email' });
          applyAuthenticatedSession({ email, fullName, role: selectedRole, assignedTechId }, true);
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const { data: prof } = await client.from('user_profiles').select('*').eq('email', email).maybeSingle();
          applyAuthenticatedSession({
            email,
            fullName: prof?.full_name || email.split('@')[0],
            role: prof?.role || 'admin',
            assignedTechId: prof?.assigned_tech_id || 'ALL'
          }, true);
        }
      } catch (err) {
        const box = document.getElementById('ag-status-msg');
        if (box) {
          box.classList.remove('hidden');
          box.className = 'rounded-xl p-3 text-xs font-mono border bg-rose-950/90 text-rose-200 border-rose-500';
          box.textContent = err.message || 'Login failed';
        }
      }
    };

    function applyAuthenticatedSession(sessionObj, switchScreenNow) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
      const gate = document.getElementById('servio-auth-gate-overlay');
      if (gate) gate.classList.add('hidden');

      const officeBtn = document.getElementById('mode-btn-office');
      const techSel = document.getElementById('global-tech-selector');

      if (sessionObj.role === 'tech') {
        if (officeBtn) officeBtn.classList.add('hidden');
        if (window.state) {
          state.selectedTechId = sessionObj.assignedTechId || 'tech-mike';
          state.vanStockTechId = sessionObj.assignedTechId || 'tech-mike';
        }
        if (techSel) {
          techSel.value = sessionObj.assignedTechId || 'tech-mike';
          techSel.disabled = true;
        }
        if (typeof window.switchAppMode === 'function') {
          switchAppMode('tech');
        }
      } else {
        // Admin role: ALWAYS unhide Office button and open Office mode when logging in
        if (officeBtn) officeBtn.classList.remove('hidden');
        if (techSel) techSel.disabled = false;
        if (window.state) state.selectedTechId = 'ALL';
        if (switchScreenNow && typeof window.switchAppMode === 'function') {
          switchAppMode('office');
        }
      }

      injectHeaderUserBadge(sessionObj);
      if (window.saveState) saveState();
      if (switchScreenNow && window.showToast) {
        showToast('✅ Signed in as ' + sessionObj.fullName + ' (' + (sessionObj.role === 'admin' ? 'Office HQ' : 'Field Tech') + ')');
      }
    }

    function injectHeaderUserBadge(sessionObj) {
      let badge = document.getElementById('servio-header-user-pill');
      const modeBtnOffice = document.getElementById('mode-btn-office');
      if (!badge && modeBtnOffice && modeBtnOffice.parentElement && modeBtnOffice.parentElement.parentElement) {
        badge = document.createElement('button');
        badge.id = 'servio-header-user-pill';
        badge.type = 'button';
        badge.onclick = window.signOutServioUser;
        modeBtnOffice.parentElement.parentElement.appendChild(badge);
      }
      if (badge) {
        const isTech = sessionObj.role === 'tech';
        badge.className = 'px-2 py-1 rounded-lg text-[11px] font-mono font-extrabold flex items-center gap-1 whitespace-nowrap border shrink-0 ' +
          (isTech ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40');
        badge.innerHTML = \`<span>\${isTech ? '👷' : '👑'}</span><span>Switch Role</span>\`;
      }
    }

    window.signOutServioUser = async function() {
      localStorage.removeItem(AUTH_SESSION_KEY);
      const officeBtn = document.getElementById('mode-btn-office');
      if (officeBtn) officeBtn.classList.remove('hidden');
      const gate = document.getElementById('servio-auth-gate-overlay');
      if (gate) gate.classList.remove('hidden');
    };

    window.addEventListener('DOMContentLoaded', () => {
      ensureMembershipState();

      const origRenderOffice = window.renderOfficeConsole;
      if (typeof origRenderOffice === 'function') {
        window.renderOfficeConsole = function() {
          const res = origRenderOffice.apply(this, arguments);
          renderMembershipBuilderAndBadges();
          return res;
        };
      }

      const origRenderHeader = window.renderActiveJobHeader;
      if (typeof origRenderHeader === 'function') {
        window.renderActiveJobHeader = function() {
          const res = origRenderHeader.apply(this, arguments);
          renderMembershipBuilderAndBadges();
          return res;
        };
      }

      ['openCreateEstimateModal', 'openUniversalNewEstimateStudio', 'handleModalJobSwitcherChange', 'handleModalCrmCustomerSelect'].forEach(fnName => {
        const origFn = window[fnName];
        if (typeof origFn === 'function') {
          window[fnName] = function() {
            const res = origFn.apply(this, arguments);
            setTimeout(() => applyActiveCustomerMembershipPerksToModal(false), 40);
            return res;
          };
        }
      });

      renderMembershipBuilderAndBadges();
      syncMembershipPlansWithSupabase(false);

      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.role) applyAuthenticatedSession(parsed, false);
        } catch (e) {}
      }
    });
  })();
</script>`;

html = html.replace(/<\/body>/i, unifiedEngine + '\n</body>');

// Save to www/index.html AND root index.html (if root exists) so both URLs match 100%
fs.writeFileSync(wwwIndexPath, html, 'utf8');
fs.writeFileSync(rootIndexPath, html, 'utf8');
console.log('🎉 Repaired www/index.html and root index.html to v1.26!');