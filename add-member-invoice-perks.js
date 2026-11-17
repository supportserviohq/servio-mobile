const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'www', 'index.html');
const backupPath = path.join(__dirname, 'www', 'index.v1.22.backup.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ Could not find www/index.html. Run this inside servio-mobile-capacitor-v1.20');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('SERVIO_MEMBER_INVOICE_PERKS_V123_INSTALLED')) {
  fs.writeFileSync(backupPath, html, 'utf8');
  console.log('✅ Created backup at www/index.v1.22.backup.html');
} else {
  console.log('ℹ️ Updating existing Member Invoice Perks installation...');
  html = html.replace(/<!-- ================= SERVIO_MEMBER_INVOICE_PERKS_V123_INSTALLED ================= -->[\s\S]*?<\/script>/, '');
}

// 1. Inject Membership Perks Banner inside Modal 4 (Estimate & Invoice Studio)
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

if (modalDiscountHeaderRegex.test(html) && !html.includes('id="inv-modal-membership-perks-bar"')) {
  html = html.replace(modalDiscountHeaderRegex, modalMemberPerksBannerHtml);
  console.log('✅ Added Member Perks Bar to Estimate & Invoice Studio Modal');
}

// 2. Inject Membership Perks Status Strip inside the Office Dispatch Form Invoice Drawer
const officeDispatchInvDrawerRegex = /(<div id="of-inv-fields-drawer"[^>]*>)/;
const officeDispatchMemberStripHtml = `$1
                <div id="of-inv-member-perks-strip" class="hidden rounded-xl p-2.5 bg-purple-950/60 border border-purple-500/50 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                  <span id="of-inv-member-perks-text" class="text-purple-200 font-bold">👑 Active Member Perks Applied</span>
                  <button type="button" onclick="applyOfficeDispatchMemberPerks(true)" class="px-2 py-0.5 rounded bg-purple-500 text-slate-950 font-black">Re-Apply Perks</button>
                </div>`;

if (officeDispatchInvDrawerRegex.test(html) && !html.includes('id="of-inv-member-perks-strip"')) {
  html = html.replace(officeDispatchInvDrawerRegex, officeDispatchMemberStripHtml);
  console.log('✅ Added Member Perks Strip to Office Dispatch Form');
}

// 3. Append the Automatic Membership Invoice Perks Engine before </body>
const memberPerksScript = `<!-- ================= SERVIO_MEMBER_INVOICE_PERKS_V123_INSTALLED ================= -->
<script>
  (function() {
    let autoApplyMemberPerks = true;

    function findPlanForCustomer(cust) {
      if (!cust || !window.state || !Array.isArray(state.membershipPlans)) return null;
      return state.membershipPlans.find(p =>
        (cust.membershipPlanId && String(p.id) === String(cust.membershipPlanId)) ||
        (cust.membershipPlanName && p.name.toLowerCase() === cust.membershipPlanName.toLowerCase())
      ) || null;
    }

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
      const jobId = document.getElementById('inv-modal-job-id')?.value || document.getElementById('inv-modal-job-switcher')?.value || '';
      const job = (state.jobs || []).find(j => j.id === jobId);
      if (job) {
        return state.customers.find(c =>
          (c.serial && job.serial && c.serial.toLowerCase() === job.serial.toLowerCase()) ||
          (c.name && job.customer && c.name.toLowerCase() === job.customer.toLowerCase())
        ) || null;
      }
      return null;
    }

    window.toggleAutoApplyMemberPerks = function(checked) {
      autoApplyMemberPerks = !!checked;
      if (autoApplyMemberPerks) {
        applyActiveCustomerMembershipPerksToModal(true);
      }
    };

    window.waiveModalDiagnosticFeeForMember = function() {
      const cust = getActiveModalCustomerRecord();
      const planName = (cust && cust.membershipPlanName && cust.membershipPlanName !== 'None') ? cust.membershipPlanName : 'Membership';
      const container = document.getElementById('inv-modal-line-items-container');
      let waivedCount = 0;

      // Check inputs inside the modal line items container for Diagnostic rows
      if (container) {
        const rows = container.querySelectorAll('div, tr');
        rows.forEach(row => {
          const textInputs = row.querySelectorAll('input[type="text"]');
          const numInputs = row.querySelectorAll('input[type="number"]');
          textInputs.forEach(ti => {
            if (/diag|callout|trip fee/i.test(ti.value || '')) {
              numInputs.forEach(ni => {
                if (Number(ni.value) > 0 && Number(ni.value) !== 1) {
                  ni.value = '0.00';
                  ni.dispatchEvent(new Event('input', { bubbles: true }));
                  ni.dispatchEvent(new Event('change', { bubbles: true }));
                  waivedCount++;
                }
              });
              if (!ti.value.includes('(Waived')) {
                ti.value = ti.value + ' (Waived - ' + planName + ')';
                ti.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          });
        });
      }

      if (typeof window.recalcModalInvoiceSummary === 'function') {
        recalcModalInvoiceSummary();
      }
      if (window.showToast) {
        showToast(waivedCount > 0 ? '🛡️ Waived Diagnostic Callout Fee ($0.00) for ' + planName + '!' : '🛡️ Diagnostic fee waiver active for ' + planName);
      }
    };

    window.applyActiveCustomerMembershipPerksToModal = function(showFeedback) {
      const bar = document.getElementById('inv-modal-membership-perks-bar');
      const titleEl = document.getElementById('inv-modal-member-plan-title');
      const subEl = document.getElementById('inv-modal-member-plan-sub');
      const waiveBtn = document.getElementById('inv-modal-waive-diag-btn');

      const cust = getActiveModalCustomerRecord();
      const isActive = cust && cust.membershipStatus === 'Active';

      if (!cust || !isActive) {
        if (bar) bar.classList.add('hidden');
        return;
      }

      const plan = findPlanForCustomer(cust);
      const discPct = Number(cust.memberDiscount ?? (plan ? plan.discount_percent : 0));
      const waiveDiag = !!(cust.waiveDiagnostic ?? (plan ? plan.waive_diagnostic : false));
      const priority = !!(cust.priorityService ?? (plan ? plan.priority_service : true));

      if (bar) bar.classList.remove('hidden');
      if (titleEl) titleEl.textContent = '👑 ACTIVE MEMBER: ' + (cust.membershipPlanName || 'PM Contract') + ' (' + (cust.visitsUsed || 0) + '/' + (cust.visitsTotal || 1) + ' Visits Used)';
      if (subEl) {
        subEl.innerHTML = 'Perks: <span class="text-emerald-400">' + discPct + '% Discount</span>' +
          (waiveDiag ? ' • <span class="text-cyan-300">🛡️ $0 Waived Diagnostic Fee</span>' : '') +
          (priority ? ' • <span class="text-amber-300">⚡ Priority Dispatch</span>' : '');
      }
      if (waiveBtn) {
        waiveBtn.style.display = waiveDiag ? 'inline-flex' : 'none';
      }

      if (!autoApplyMemberPerks && !showFeedback) return;

      // Apply percentage discount to Modal Discount Controls
      if (discPct > 0) {
        const reason = '👑 ' + (cust.membershipPlanName || 'Member') + ' (' + discPct + '% Member Discount)';
        if (typeof window.setModalQuickDiscount === 'function') {
          setModalQuickDiscount('PCT', discPct, reason);
        } else {
          const typeEl = document.getElementById('inv-modal-disc-type');
          const valEl = document.getElementById('inv-modal-disc-val');
          const reasonEl = document.getElementById('inv-modal-disc-reason');
          if (typeEl) typeEl.value = 'PCT';
          if (valEl) valEl.value = discPct;
          if (reasonEl) reasonEl.value = reason;
          if (typeof window.recalcModalInvoiceSummary === 'function') recalcModalInvoiceSummary();
        }
      }

      if (waiveDiag) {
        waiveModalDiagnosticFeeForMember();
      }

      if (showFeedback && window.showToast) {
        showToast('👑 Applied ' + (cust.membershipPlanName || 'Member') + ' perks (' + discPct + '% off' + (waiveDiag ? ' + $0 Diag' : '') + ')');
      }
    };

    // Office Dispatch Form Member Perks Helper
    let lastOfficePresetType = '';
    window.applyOfficeDispatchMemberPerks = function(showFeedback) {
      const custId = document.getElementById('of-customer-select')?.value || '';
      const custName = (document.getElementById('of-customer')?.value || '').trim().toLowerCase();
      const strip = document.getElementById('of-inv-member-perks-strip');
      const stripText = document.getElementById('of-inv-member-perks-text');

      if (!window.state || !Array.isArray(state.customers)) return;
      const cust = state.customers.find(c => c.id === custId || (custName && (c.name || '').toLowerCase() === custName));
      const isActive = cust && cust.membershipStatus === 'Active';

      if (!cust || !isActive) {
        if (strip) strip.classList.add('hidden');
        return;
      }

      const plan = findPlanForCustomer(cust);
      const discPct = Number(cust.memberDiscount ?? (plan ? plan.discount_percent : 0));
      const waiveDiag = !!(cust.waiveDiagnostic ?? (plan ? plan.waive_diagnostic : false));

      if (strip) strip.classList.remove('hidden');
      if (stripText) {
        stripText.textContent = '👑 ' + cust.membershipPlanName + ': ' + discPct + '% Parts Disc' + (waiveDiag ? ' • $0 Diag Callout' : '');
      }

      const partsEl = document.getElementById('of-inv-parts');
      const laborEl = document.getElementById('of-inv-labor');
      const notesEl = document.getElementById('of-inv-notes');

      if (partsEl && discPct > 0) {
        const rawParts = parseFloat(partsEl.getAttribute('data-base-parts') || partsEl.value) || 0;
        partsEl.setAttribute('data-base-parts', rawParts);
        const discounted = (rawParts * (1 - discPct / 100)).toFixed(2);
        partsEl.value = discounted;
      }

      if (laborEl && waiveDiag && lastOfficePresetType === 'diag') {
        laborEl.value = '0.00';
      }

      if (notesEl) {
        const prefix = '[👑 ' + cust.membershipPlanName + ': ' + discPct + '% Parts Disc' + (waiveDiag ? ', Waived Diag Fee' : '') + '] ';
        if (!notesEl.value.includes('👑')) {
          notesEl.value = prefix + notesEl.value;
        }
      }

      if (typeof window.recalcOfficeFormInvoicePreview === 'function') {
        recalcOfficeFormInvoicePreview();
      }
      if (showFeedback && window.showToast) {
        showToast('👑 Applied ' + cust.membershipPlanName + ' pricing to Work Order!');
      }
    };

    window.addEventListener('DOMContentLoaded', () => {
      // Wrap Estimate & Invoice Modal functions so perks auto-apply on open/switch
      ['openCreateEstimateModal', 'openUniversalNewEstimateStudio', 'handleModalJobSwitcherChange', 'handleModalCrmCustomerSelect', 'handleModalCustomerNameInput'].forEach(fnName => {
        const origFn = window[fnName];
        if (typeof origFn === 'function') {
          window[fnName] = function() {
            const res = origFn.apply(this, arguments);
            setTimeout(() => applyActiveCustomerMembershipPerksToModal(false), 40);
            return res;
          };
        }
      });

      const origModalPreset = window.applyModalInvoicePreset;
      if (typeof origModalPreset === 'function') {
        window.applyModalInvoicePreset = function(presetType) {
          const res = origModalPreset.apply(this, arguments);
          setTimeout(() => {
            applyActiveCustomerMembershipPerksToModal(false);
            if (presetType === 'diag') {
              const cust = getActiveModalCustomerRecord();
              const plan = findPlanForCustomer(cust);
              const waiveDiag = cust && cust.membershipStatus === 'Active' && !!(cust.waiveDiagnostic ?? (plan ? plan.waive_diagnostic : false));
              if (waiveDiag) waiveModalDiagnosticFeeForMember();
            }
          }, 40);
          return res;
        };
      }

      const origOfficeCustSelect = window.handleOfficeCustomerSelect;
      if (typeof origOfficeCustSelect === 'function') {
        window.handleOfficeCustomerSelect = function(custId) {
          const res = origOfficeCustSelect.apply(this, arguments);
          const partsEl = document.getElementById('of-inv-parts');
          if (partsEl) partsEl.removeAttribute('data-base-parts');
          setTimeout(() => applyOfficeDispatchMemberPerks(true), 40);
          return res;
        };
      }

      const origOfficePreset = window.applyOfficeFormInvoicePreset;
      if (typeof origOfficePreset === 'function') {
        window.applyOfficeFormInvoicePreset = function(presetType) {
          lastOfficePresetType = presetType;
          const res = origOfficePreset.apply(this, arguments);
          const partsEl = document.getElementById('of-inv-parts');
          if (partsEl) partsEl.setAttribute('data-base-parts', partsEl.value);
          setTimeout(() => applyOfficeDispatchMemberPerks(false), 40);
          return res;
        };
      }
    });
  })();
</script>`;

html = html.replace(/<\/body>/i, memberPerksScript + '\n</body>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Successfully wired automatic Membership Discounts & Waived Diagnostic Fees into Estimate & Invoice Studio!');