const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'www', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Could not find www/index.html. Run this inside servio-mobile-capacitor-v1.20');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Remove previous fix block if re-running
html = html.replace(/<!-- ================= SERVIO_CUSTOMER_PANE_FIX_V124 ================= -->[\s\S]*?<\/script>/, '');

// Also inject the Member Perks Banner into Modal 4 if not yet present
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
}

const paneFixAndPerksScript = `<!-- ================= SERVIO_CUSTOMER_PANE_FIX_V124 ================= -->
<script>
  (function() {
    // 1. Group Add/Edit Customer Form and Membership Plan Builder into the First Column (Add/Edit Subcategory)
    //    and keep Saved Customers Directory strictly in the Second Column (Directory Subcategory)
    function fixCustomerSubtabMobilePanes() {
      const custTab = document.getElementById('office-subtab-customers');
      if (!custTab) return;

      const addEditCard = document.getElementById('crm-form-title')?.closest('.theme-card');
      const directoryCard = document.getElementById('crm-customers-list')?.closest('.theme-card');
      const planBuilderCard = document.getElementById('company-membership-plans-grid')?.closest('.theme-card');

      if (!addEditCard || !directoryCard) return;

      let leftAddEditCol = document.getElementById('crm-left-add-edit-pane');
      if (!leftAddEditCol) {
        leftAddEditCol = document.createElement('div');
        leftAddEditCol.id = 'crm-left-add-edit-pane';
        leftAddEditCol.className = 'lg:col-span-5 space-y-6';
        custTab.insertBefore(leftAddEditCol, custTab.firstChild);
      }

      if (addEditCard.parentElement !== leftAddEditCol) {
        addEditCard.classList.remove('lg:col-span-5', 'office-mobile-hidden-pane');
        leftAddEditCol.appendChild(addEditCard);
      }

      if (planBuilderCard && planBuilderCard.parentElement !== leftAddEditCol) {
        planBuilderCard.classList.remove('lg:col-span-12', 'office-mobile-hidden-pane');
        const plansGrid = document.getElementById('company-membership-plans-grid');
        if (plansGrid) plansGrid.className = 'grid grid-cols-1 gap-3';
        leftAddEditCol.appendChild(planBuilderCard);
      }

      if (directoryCard.parentElement === custTab && custTab.children[1] !== directoryCard) {
        custTab.appendChild(directoryCard);
      }
    }

    // Automatically run before and after Office Console renders
    fixCustomerSubtabMobilePanes();

    window.addEventListener('DOMContentLoaded', () => {
      fixCustomerSubtabMobilePanes();

      const origRenderOffice = window.renderOfficeConsole;
      if (typeof origRenderOffice === 'function') {
        window.renderOfficeConsole = function() {
          fixCustomerSubtabMobilePanes();
          return origRenderOffice.apply(this, arguments);
        };
      }

      // When clicking Edit or + Assign Plan Tier on a customer in Directory, switch to the Add/Edit subcategory
      const origEditCrm = window.editCrmCustomer;
      if (typeof origEditCrm === 'function') {
        window.editCrmCustomer = function(custId) {
          const res = origEditCrm.apply(this, arguments);
          const switcher = document.getElementById('office-mobile-pane-switcher');
          if (switcher && !switcher.classList.contains('hidden')) {
            const buttons = switcher.querySelectorAll('button');
            buttons.forEach(btn => {
              if (/add|edit|form|profile/i.test(btn.textContent || '')) {
                btn.click();
              }
            });
          }
          return res;
        };
      }
    });
  })();
</script>`;

html = html.replace(/<\/body>/i, paneFixAndPerksScript + '\n</body>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Fixed Customers Subcategory panes: Add/Edit Customer is now strictly under Add/Edit!');