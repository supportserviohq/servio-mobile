const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'www', 'index.html');
const backupPath = path.join(__dirname, 'www', 'index.v1.20.backup.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ Could not find www/index.html. Make sure you run this inside servio-mobile-capacitor-v1.20');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('SERVIO_MEMBERSHIP_V121_INSTALLED')) {
  console.log('ℹ️ Membership module is already installed in www/index.html. Restoring from backup to apply fresh...');
  if (fs.existsSync(backupPath)) {
    html = fs.readFileSync(backupPath, 'utf8');
  }
} else {
  fs.writeFileSync(backupPath, html, 'utf8');
  console.log('✅ Created backup at www/index.v1.20.backup.html');
}

// 1. Inject Membership Badge into Field Tech Active Job Context Bar
const warrantyBadgeRegex = /(<span id="mobile-active-warranty-badge"[^>]*>[\s\S]*?<\/span>)/;
const techMembershipBadgeHtml = `$1
          <span id="mobile-active-membership-badge" onclick="openTechMembershipDrawer()" class="cursor-pointer text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40" title="Tap to view or log customer PM membership visit">👑 NO PLAN</span>`;

if (warrantyBadgeRegex.test(html)) {
  html = html.replace(warrantyBadgeRegex, techMembershipBadgeHtml);
  console.log('✅ Added Membership Badge to Field Tech Active Job Bar');
}

// 2. Inject Collapsible Tech Membership Drawer inside Active Job Card
const quickWarrantyDrawerRegex = /(<div id="quick-warranty-drawer"[\s\S]*?<\/div>\s*<\/div>)/;
const techMembershipDrawerHtml = `$1
      <!-- Collapsible Quick Membership Perks & Visit Counter Drawer -->
      <div id="quick-membership-drawer" class="hidden mt-3 pt-3 border-t border-slate-700/80 text-xs space-y-2">
        <div id="quick-membership-drawer-content"></div>
      </div>`;

if (quickWarrantyDrawerRegex.test(html)) {
  html = html.replace(quickWarrantyDrawerRegex, techMembershipDrawerHtml);
}

// 3. Inject Full-Width Company Membership Plan Builder at the top of Office Sub-Tab 2 (Customers CRM)
const officeCustomersTabRegex = /(<div id="office-subtab-customers"[^>]*>)/;
const companyPlanBuilderHtml = `$1
      <!-- FULL-WIDTH COMPANY MEMBERSHIP PLAN BUILDER & TIER SETTINGS -->
      <div class="lg:col-span-12 theme-card rounded-3xl p-5 space-y-4 border-t-4 border-t-purple-500 shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div>
            <span class="text-[10px] font-mono uppercase text-purple-400 font-black">Recurring Revenue &amp; Preventative Maintenance Contracts</span>
            <h3 class="text-lg font-black">👑 Company Membership Plan Builder &amp; Pricing Tiers</h3>
            <p class="text-xs theme-text-muted mt-0.5">Define custom membership plans, billing cycles, included annual PM visits, and automatic member discounts for your company.</p>
          </div>
          <div class="flex items-center gap-2">
            <span id="membership-active-count-pill" class="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-xs font-black">0 Active Members</span>
            <button type="button" onclick="syncMembershipPlansWithSupabase(true)" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold">
              ☁️ Sync Plans
            </button>
          </div>
        </div>

        <!-- Create / Edit Company Plan Form -->
        <div class="theme-subcard rounded-2xl p-4 space-y-3 border border-purple-500/40 text-xs">
          <div class="flex items-center justify-between">
            <span id="mplan-form-label" class="text-[10px] font-mono uppercase text-purple-300 font-black">➕ Add or Update Company Membership Tier</span>
            <button type="button" onclick="resetCompanyPlanForm()" class="text-[10px] font-mono text-slate-400 underline">Clear Form</button>
          </div>
          <input type="hidden" id="mplan-edit-id" value="" />
          <div class="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-mono theme-text-muted mb-1">Plan Name *</label>
              <input id="mplan-name" type="text" placeholder="e.g., Gold Bi-Annual PM" class="theme-input w-full rounded-xl px-3 py-2 font-bold" />
            </div>
            <div>
              <label class="block text-[10px] font-mono theme-text-muted mb-1">Price ($) *</label>
              <input id="mplan-price" type="number" step="0.01" min="0" placeholder="349.00" class="theme-input w-full rounded-xl px-3 py-2 font-mono font-black text-emerald-400" />
            </div>
            <div>
              <label class="block text-[10px] font-mono theme-text-muted mb-1">Billing Cycle</label>
              <select id="mplan-cycle" class="theme-input w-full rounded-xl px-2.5 py-2 font-bold">
                <option value="Annual">Annual</option>
                <option value="Bi-Annual">Bi-Annual</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-mono theme-text-muted mb-1">PM Visits / Yr</label>
              <input id="mplan-visits" type="number" min="1" max="12" value="2" class="theme-input w-full rounded-xl px-3 py-2 font-mono font-black text-amber-300 text-center" />
            </div>
            <div>
              <label class="block text-[10px] font-mono theme-text-muted mb-1">Parts Discount (%)</label>
              <input id="mplan-discount" type="number" min="0" max="100" value="10" class="theme-input w-full rounded-xl px-3 py-2 font-mono font-black text-cyan-300 text-center" />
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div class="flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-1.5 font-bold text-slate-200 cursor-pointer">
                <input id="mplan-priority" type="checkbox" checked class="rounded border-slate-600 accent-purple-500 w-4 h-4" />
                <span>⚡ Priority Storm Outage Dispatch</span>
              </label>
              <label class="flex items-center gap-1.5 font-bold text-slate-200 cursor-pointer">
                <input id="mplan-waive-diag" type="checkbox" class="rounded border-slate-600 accent-emerald-500 w-4 h-4" />
                <span>🛡️ Waive Emergency Diagnostic Fee</span>
              </label>
            </div>
            <button type="button" onclick="saveCompanyMembershipPlan()" class="glove-btn px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs shadow-lg">
              💾 Save Membership Plan Tier
            </button>
          </div>
        </div>

        <!-- Active Company Plans Grid -->
        <div id="company-membership-plans-grid" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
      </div>`;

if (officeCustomersTabRegex.test(html)) {
  html = html.replace(officeCustomersTabRegex, companyPlanBuilderHtml);
  console.log('✅ Added Company Membership Plan Builder to Office Customers Tab');
}

// 4. Inject Customer Membership Assignment Fields inside the Add/Edit Customer Form
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
  console.log('✅ Added Membership Assignment Fields to CRM Add/Edit Customer Form');
}

// 5. Append the Membership JavaScript Engine before </body>
const membershipEngineScript = `
<!-- ================= SERVIO_MEMBERSHIP_V121_INSTALLED ================= -->
<script>
  (function() {
    const DEFAULT_COMPANY_PLANS = [
      {
        id: 'plan-silver-annual',
        name: 'Silver Annual PM',
        price: 249.00,
        billing_cycle: 'Annual',
        visits_included: 1,
        discount_percent: 5,
        priority_service: true,
        waive_diagnostic: false
      },
      {
        id: 'plan-gold-biannual',
        name: 'Gold Bi-Annual PM',
        price: 399.00,
        billing_cycle: 'Bi-Annual',
        visits_included: 2,
        discount_percent: 10,
        priority_service: true,
        waive_diagnostic: true
      },
      {
        id: 'plan-platinum-comm',
        name: 'Commercial Quarterly PM',
        price: 895.00,
        billing_cycle: 'Quarterly',
        visits_included: 4,
        discount_percent: 15,
        priority_service: true,
        waive_diagnostic: true
      }
    ];

    function ensureMembershipState() {
      if (!window.state) return;
      if (!Array.isArray(state.membershipPlans) || state.membershipPlans.length === 0) {
        state.membershipPlans = JSON.parse(JSON.stringify(DEFAULT_COMPANY_PLANS));
      }
      // Seed demo memberships onto initial customers if not set yet
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

    function getSupabaseClientInstance() {
      if (window.supabaseClient) return window.supabaseClient;
      const url = document.getElementById('sb-cfg-url')?.value || 'https://oowfquqrhqshthkryueb.supabase.co';
      const key = document.getElementById('sb-cfg-key')?.value || 'sb_publishable_KEAzhMN_puMXxhc3eamHYQ_Gwbdai3D';
      if (window.supabase && window.supabase.createClient) {
        window.supabaseClient = window.supabase.createClient(url, key);
        return window.supabaseClient;
      }
      return null;
    }

    window.syncMembershipPlansWithSupabase = async function(showNotification) {
      ensureMembershipState();
      const client = getSupabaseClientInstance();
      if (!client) return;
      try {
        const { data, error } = await client.from('membership_plans').select('*').order('price', { ascending: true });
        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
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
          } else {
            // Push starter plans to Supabase if table is empty
            for (const plan of state.membershipPlans) {
              await client.from('membership_plans').insert([{
                name: plan.name,
                price: plan.price,
                billing_cycle: plan.billing_cycle,
                visits_included: plan.visits_included,
                discount_percent: plan.discount_percent,
                priority_service: plan.priority_service,
                waive_diagnostic: plan.waive_diagnostic
              }]);
            }
          }
          renderMembershipBuilderAndBadges();
          if (showNotification && window.showToast) {
            showToast('☁️ Synced Company Membership Plans with Supabase!');
          }
        }
      } catch (err) {
        console.warn('Supabase membership sync notice:', err);
      }
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
      if (lbl) lbl.textContent = '➕ Add or Update Company Membership Tier';
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
      if (lbl) lbl.textContent = '✏️ Editing Plan Tier: ' + plan.name;
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

      if (!name) {
        if (window.showToast) showToast('⚠️ Please enter a Membership Plan name.');
        return;
      }

      const planObj = {
        id: editId || ('plan-' + Date.now()),
        name,
        price,
        billing_cycle,
        visits_included,
        discount_percent,
        priority_service,
        waive_diagnostic
      };

      const existingIdx = state.membershipPlans.findIndex(p => String(p.id) === String(editId));
      if (existingIdx >= 0) {
        state.membershipPlans[existingIdx] = planObj;
      } else {
        state.membershipPlans.push(planObj);
      }

      const client = getSupabaseClientInstance();
      if (client) {
        try {
          await client.from('membership_plans').insert([{
            name, price, billing_cycle, visits_included, discount_percent, priority_service, waive_diagnostic
          }]);
        } catch (e) {}
      }

      resetCompanyPlanForm();
      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('👑 Saved Company Membership Plan: ' + name);
    };

    window.deleteCompanyMembershipPlan = async function(planId) {
      ensureMembershipState();
      state.membershipPlans = state.membershipPlans.filter(p => String(p.id) !== String(planId));
      const client = getSupabaseClientInstance();
      if (client) {
        try { await client.from('membership_plans').delete().eq('id', planId); } catch (e) {}
      }
      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('🗑️ Removed membership plan tier');
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
      if (usedEl && Number(usedEl.value) === 0) usedEl.value = 0;
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
      const nextUsed = Math.max(0, Number(cust.visitsUsed || 0) + Number(delta));
      cust.visitsUsed = nextUsed;

      const client = getSupabaseClientInstance();
      if (client) {
        try {
          await client.from('customers').update({ visits_used: nextUsed }).eq('name', cust.name);
        } catch (e) {}
      }

      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) {
        showToast('👑 ' + cust.name + ': PM Visits Used updated to ' + cust.visitsUsed + ' of ' + (cust.visitsTotal || 1));
      }
    };

    window.openTechMembershipDrawer = function() {
      const drawer = document.getElementById('quick-membership-drawer');
      if (!drawer) return;
      drawer.classList.toggle('hidden');
      renderTechHeaderMembership();
    };

    function renderTechHeaderMembership() {
      ensureMembershipState();
      const job = window.getActiveJob ? getActiveJob() : null;
      if (!job) return;
      const cust = getCustomerForJob(job);
      const badge = document.getElementById('mobile-active-membership-badge');
      const drawerContent = document.getElementById('quick-membership-drawer-content');

      const isActive = cust && cust.membershipStatus === 'Active';
      if (badge) {
        if (isActive) {
          badge.textContent = '👑 ' + (cust.membershipPlanName || 'MEMBER') + ' (' + (cust.visitsUsed || 0) + '/' + (cust.visitsTotal || 1) + ')';
          badge.className = 'cursor-pointer text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50';
        } else {
          badge.textContent = '👑 NO PLAN';
          badge.className = 'cursor-pointer text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
        }
      }

      if (drawerContent) {
        if (!cust || !isActive) {
          drawerContent.innerHTML = \`
            <div class="theme-subcard rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-xs font-black text-slate-200">No Active PM Membership on File</div>
                <div class="text-[11px] theme-text-muted">Enroll \${job.customer} in a Company PM Plan to unlock automatic parts discounts &amp; visit tracking.</div>
              </div>
              <select onchange="quickEnrollJobCustomerInPlan('\${job.id}', this.value)" class="theme-input rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-300">
                <option value="">+ Quick-Enroll in Plan...</option>
                \${state.membershipPlans.map(p => \`<option value="\${p.id}">\${p.name} ($\${Number(p.price).toFixed(0)}/\${p.billing_cycle})</option>\`).join('')}
              </select>
            </div>
          \`;
        } else {
          drawerContent.innerHTML = \`
            <div class="theme-subcard rounded-xl p-3 space-y-2 border border-purple-500/40 font-mono">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-[10px] uppercase text-purple-300 font-black">👑 Active Plan: \${cust.membershipPlanName}</span>
                  <div class="text-xs font-bold text-white mt-0.5">
                    PM Visits Used: <strong class="text-amber-300">\${cust.visitsUsed || 0} of \${cust.visitsTotal || 1}</strong> •
                    Parts Discount: <strong class="text-emerald-400">\${cust.memberDiscount || 0}% OFF</strong> •
                    Renews: <strong class="text-cyan-300">\${cust.membershipRenewalDate || 'Annual'}</strong>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="adjustCustomerMembershipVisit('\${cust.id}', -1)" class="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold">−1</button>
                  <button type="button" onclick="adjustCustomerMembershipVisit('\${cust.id}', 1)" class="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-black shadow">+1 Log PM Visit</button>
                </div>
              </div>
            </div>
          \`;
        }
      }
    }

    window.quickEnrollJobCustomerInPlan = function(jobId, planId) {
      if (!planId) return;
      ensureMembershipState();
      const job = state.jobs.find(j => j.id === jobId) || getActiveJob();
      const plan = state.membershipPlans.find(p => String(p.id) === String(planId));
      if (!job || !plan) return;

      let cust = getCustomerForJob(job);
      if (!cust) {
        cust = {
          id: 'cust-' + Date.now(),
          name: job.customer,
          phone: job.phone || '',
          address: job.address || '',
          gate: job.gateCode || '',
          tier: job.tier || 'Residential',
          model: job.model || 'Generac Guardian 24kW',
          serial: job.serial || '',
          engineSn: job.engineSn || '',
          atsSn: job.atsSn || '',
          warrantyStatus: job.warrantyStatus || 'ACTIVE - PARTS & LABOR'
        };
        state.customers.unshift(cust);
      }

      const renewal = new Date();
      renewal.setFullYear(renewal.getFullYear() + 1);
      cust.membershipPlanId = plan.id;
      cust.membershipPlanName = plan.name;
      cust.membershipStatus = 'Active';
      cust.membershipRenewalDate = renewal.toISOString().split('T')[0];
      cust.visitsUsed = 1;
      cust.visitsTotal = plan.visits_included;
      cust.memberDiscount = plan.discount_percent;
      cust.priorityService = !!plan.priority_service;
      cust.waiveDiagnostic = !!plan.waive_diagnostic;

      if (window.saveState) saveState();
      renderMembershipBuilderAndBadges();
      if (window.showToast) showToast('👑 Enrolled ' + cust.name + ' in ' + plan.name + '!');
    };

    function renderMembershipBuilderAndBadges() {
      ensureMembershipState();

      // 1. Render Company Plans Grid in Office Customers Tab
      const gridEl = document.getElementById('company-membership-plans-grid');
      if (gridEl) {
        gridEl.innerHTML = state.membershipPlans.map(p => \`
          <div class="theme-subcard rounded-2xl p-3.5 space-y-2 border border-purple-500/40 flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">\${p.billing_cycle.toUpperCase()}</span>
                  <h4 class="text-sm font-black text-white mt-1">\${p.name}</h4>
                </div>
                <div class="text-right font-mono">
                  <div class="text-base font-black text-emerald-400">$\${Number(p.price).toFixed(2)}</div>
                  <div class="text-[10px] theme-text-muted">per \${p.billing_cycle.toLowerCase()}</div>
                </div>
              </div>
              <div class="text-[11px] font-mono text-slate-300 space-y-0.5 mt-2 pt-2 border-t border-slate-800">
                <div>✅ <strong>\${p.visits_included}</strong> Preventative Maintenance Visit(s)/Yr</div>
                <div>🏷️ <strong>\${p.discount_percent}% OFF</strong> Replacement Parts &amp; Accessories</div>
                <div>\${p.priority_service ? '⚡ Priority Storm Outage Dispatch' : '📋 Standard Dispatch Queue'}</div>
                <div>\${p.waive_diagnostic ? '🛡️ $0 Waived Emergency Diagnostic Callout' : '🔧 Standard Diagnostic Callout'}</div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/80 font-mono text-[10px]">
              <button type="button" onclick="editCompanyMembershipPlan('\${p.id}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold">✏️ Edit Tier</button>
              <button type="button" onclick="deleteCompanyMembershipPlan('\${p.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold">🗑️ Remove</button>
            </div>
          </div>
        \`).join('');
      }

      // 2. Populate Plan Dropdown in CRM Customer Form
      const crmPlanSel = document.getElementById('crm-membership-plan');
      if (crmPlanSel) {
        const currentVal = crmPlanSel.value;
        crmPlanSel.innerHTML = '<option value="">-- No Membership Plan --</option>' +
          state.membershipPlans.map(p =>
            \`<option value="\${p.id}" \${String(currentVal) === String(p.id) ? 'selected' : ''}>\${p.name} ($\${Number(p.price).toFixed(2)}/\${p.billing_cycle} • \${p.visits_included} Visits • \${p.discount_percent}% Off)</option>\`
          ).join('');
      }

      // 3. Update Active Member Counter Pill
      const activeCount = (state.customers || []).filter(c => c.membershipStatus === 'Active').length;
      const countPill = document.getElementById('membership-active-count-pill');
      if (countPill) countPill.textContent = activeCount + ' Active Member' + (activeCount === 1 ? '' : 's');

      // 4. Inject Interactive Membership Controls into Rendered CRM Customer Cards
      const crmList = document.getElementById('crm-customers-list');
      if (crmList && Array.isArray(state.customers)) {
        state.customers.forEach(c => {
          const existingStrip = document.getElementById('crm-mem-strip-' + c.id);
          if (existingStrip) existingStrip.remove();
        });

        const cards = crmList.querySelectorAll('.theme-subcard, .theme-card');
        cards.forEach(card => {
          const htmlText = card.innerHTML;
          const matchedCustomer = state.customers.find(c => htmlText.includes(c.serial) || htmlText.includes(c.name));
          if (!matchedCustomer || card.querySelector('.crm-membership-injected')) return;

          const isAct = matchedCustomer.membershipStatus === 'Active';
          const strip = document.createElement('div');
          strip.id = 'crm-mem-strip-' + matchedCustomer.id;
          strip.className = 'crm-membership-injected mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]';
          strip.innerHTML = isAct ? \`
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black">👑 \${matchedCustomer.membershipPlanName}</span>
              <span class="text-slate-300">Visits: <strong class="text-amber-300">\${matchedCustomer.visitsUsed || 0}/\${matchedCustomer.visitsTotal || 1}</strong></span>
              <span class="text-emerald-400 font-bold">\${matchedCustomer.memberDiscount || 0}% Parts Disc</span>
              <span class="text-slate-400">Renews: \${matchedCustomer.membershipRenewalDate || 'N/A'}</span>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" onclick="adjustCustomerMembershipVisit('\${matchedCustomer.id}', -1)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">−1</button>
              <button type="button" onclick="adjustCustomerMembershipVisit('\${matchedCustomer.id}', 1)" class="px-2 py-0.5 rounded bg-purple-500 hover:bg-purple-400 text-slate-950 font-black">+1 Visit Used</button>
            </div>
          \` : \`
            <span class="text-slate-400">👑 Membership: <strong>None</strong></span>
            <button type="button" onclick="editCrmCustomer('\${matchedCustomer.id}')" class="text-purple-300 underline font-bold">+ Assign Plan Tier</button>
          \`;
          card.appendChild(strip);
        });
      }

      renderTechHeaderMembership();
    }

    // Hook into existing Servio lifecycle functions without altering their core behavior
    window.addEventListener('DOMContentLoaded', () => {
      ensureMembershipState();

      const origRenderOffice = window.renderOfficeConsole;
      if (typeof origRenderOffice === 'function') {
        window.renderOfficeConsole = function() {
          origRenderOffice.apply(this, arguments);
          renderMembershipBuilderAndBadges();
        };
      }

      const origRenderHeader = window.renderActiveJobHeader;
      if (typeof origRenderHeader === 'function') {
        window.renderActiveJobHeader = function() {
          origRenderHeader.apply(this, arguments);
          renderTechHeaderMembership();
        };
      }

      const origEditCrm = window.editCrmCustomer;
      if (typeof origEditCrm === 'function') {
        window.editCrmCustomer = function(custId) {
          origEditCrm.apply(this, arguments);
          const cust = (state.customers || []).find(c => c.id === custId);
          if (!cust) return;
          renderMembershipBuilderAndBadges();
          const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
          setVal('crm-membership-plan', cust.membershipPlanId || '');
          setVal('crm-membership-status', cust.membershipStatus || 'None');
          setVal('crm-visits-used', cust.visitsUsed || 0);
          setVal('crm-visits-total', cust.visitsTotal || 0);
          setVal('crm-member-discount', cust.memberDiscount || 0);
          setVal('crm-membership-renewal', cust.membershipRenewalDate || '');
        };
      }

      const origResetCrm = window.resetCrmCustomerForm;
      if (typeof origResetCrm === 'function') {
        window.resetCrmCustomerForm = function() {
          origResetCrm.apply(this, arguments);
          handleCrmPlanDropdownChange('');
        };
      }

      const origSaveCrm = window.saveCrmCustomer;
      if (typeof origSaveCrm === 'function') {
        window.saveCrmCustomer = async function(event) {
          const planId = document.getElementById('crm-membership-plan')?.value || '';
          const plan = (state.membershipPlans || []).find(p => String(p.id) === String(planId));
          const status = document.getElementById('crm-membership-status')?.value || (plan ? 'Active' : 'None');
          const visitsUsed = parseInt(document.getElementById('crm-visits-used')?.value) || 0;
          const visitsTotal = parseInt(document.getElementById('crm-visits-total')?.value) || (plan ? plan.visits_included : 0);
          const memberDiscount = parseInt(document.getElementById('crm-member-discount')?.value) || (plan ? plan.discount_percent : 0);
          const renewalDate = document.getElementById('crm-membership-renewal')?.value || '';
          const custName = document.getElementById('crm-name')?.value.trim();

          origSaveCrm.apply(this, arguments);

          const savedCust = (state.customers || []).find(c => c.name === custName);
          if (savedCust) {
            savedCust.membershipPlanId = plan ? plan.id : '';
            savedCust.membershipPlanName = plan ? plan.name : 'None';
            savedCust.membershipStatus = status;
            savedCust.membershipRenewalDate = renewalDate;
            savedCust.visitsUsed = visitsUsed;
            savedCust.visitsTotal = visitsTotal;
            savedCust.memberDiscount = memberDiscount;
            savedCust.priorityService = plan ? !!plan.priority_service : false;
            savedCust.waiveDiagnostic = plan ? !!plan.waive_diagnostic : false;

            const client = getSupabaseClientInstance();
            if (client) {
              try {
                await client.from('customers').update({
                  membership_plan_name: savedCust.membershipPlanName,
                  membership_status: savedCust.membershipStatus,
                  membership_renewal_date: savedCust.membershipRenewalDate || null,
                  visits_used: savedCust.visitsUsed,
                  visits_total: savedCust.visitsTotal,
                  member_discount: savedCust.memberDiscount
                }).eq('name', savedCust.name);
              } catch (e) {}
            }
            if (window.saveState) saveState();
          }
          renderMembershipBuilderAndBadges();
        };
      }

      renderMembershipBuilderAndBadges();
      syncMembershipPlansWithSupabase(false);
    });
  })();
</script>
`;

html = html.replace(/<\/body>/i, membershipEngineScript + '\n</body>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Successfully upgraded www/index.html with Company Membership Plan Builder & CRM Tracker!');