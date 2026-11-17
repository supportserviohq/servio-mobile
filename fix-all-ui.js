const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'www', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Could not find www/index.html. Make sure you are in servio-mobile-capacitor-v1.20');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Remove previous v1.24 fix block if present
html = html.replace(/<!-- ================= SERVIO_CUSTOMER_PANE_FIX_V124 ================= -->[\s\S]*?<\/script>/g, '');
html = html.replace(/<!-- ================= SERVIO_UI_SYNC_FIX_V125 ================= -->[\s\S]*?<\/script>/g, '');

const uiFixScript = `<!-- ================= SERVIO_UI_SYNC_FIX_V125 ================= -->
<script>
  (function() {
    // 1. Place the Company Membership Plan Builder INSIDE the Add/Edit Customer card
    //    so #office-subtab-customers has its exact original 2-card structure:
    //    Child 0 = Add/Edit Customer (+ Membership Plan Builder)
    //    Child 1 = Saved Customers Directory
    function restoreTwoCardCustomerStructure() {
      const custTab = document.getElementById('office-subtab-customers');
      if (!custTab) return;

      const addEditCard = document.getElementById('crm-form-title')?.closest('.theme-card');
      const directoryCard = document.getElementById('crm-customers-list')?.closest('.theme-card');
      const planBuilderCard = document.getElementById('company-membership-plans-grid')?.closest('.theme-card');

      if (!addEditCard || !directoryCard) return;

      // Unwrap #crm-left-add-edit-pane if created by earlier script
      const oldWrapper = document.getElementById('crm-left-add-edit-pane');
      if (oldWrapper) {
        custTab.insertBefore(addEditCard, oldWrapper);
        if (planBuilderCard) addEditCard.appendChild(planBuilderCard);
        oldWrapper.remove();
      }

      // Ensure addEditCard has its original lg:col-span-5 class and sits as Child 0
      addEditCard.classList.add('lg:col-span-5');
      if (custTab.children[0] !== addEditCard) {
        custTab.insertBefore(addEditCard, custTab.firstChild);
      }

      // Nest the Plan Builder neatly inside the bottom of the Add/Edit Customer card
      if (planBuilderCard && planBuilderCard.parentElement !== addEditCard) {
        planBuilderCard.classList.remove('lg:col-span-12', 'theme-card', 'rounded-3xl', 'shadow-xl');
        planBuilderCard.classList.add('theme-subcard', 'rounded-2xl', 'mt-6', 'pt-4');
        const plansGrid = document.getElementById('company-membership-plans-grid');
        if (plansGrid) plansGrid.className = 'grid grid-cols-1 gap-3';
        addEditCard.appendChild(planBuilderCard);
      }

      // Ensure directoryCard sits as Child 1
      if (custTab.children[1] !== directoryCard) {
        custTab.appendChild(directoryCard);
      }
    }

    // 2. Keep the Role Switcher / Exit button right next to the Tech/Office toggle on the left
    //    so it is always visible on mobile screens without horizontal scrolling
    function pinRoleSwitcherNextToModeButtons() {
      const userPill = document.getElementById('servio-header-user-pill');
      const techBtn = document.getElementById('mode-btn-tech');
      if (userPill && techBtn && techBtn.parentElement && techBtn.parentElement.parentElement) {
        const modeGroupParent = techBtn.parentElement.parentElement;
        if (userPill.parentElement !== modeGroupParent) {
          modeGroupParent.appendChild(userPill);
        }
      }
    }

    // 3. Make the Reset button also clear any locked Tech Preview role
    const origReset = window.resetDemoData;
    if (typeof origReset === 'function') {
      window.resetDemoData = function() {
        localStorage.removeItem('servio_active_role_session_v122');
        const officeBtn = document.getElementById('mode-btn-office');
        if (officeBtn) officeBtn.classList.remove('hidden');
        const techSel = document.getElementById('global-tech-selector');
        if (techSel) techSel.disabled = false;
        return origReset.apply(this, arguments);
      };
    }

    restoreTwoCardCustomerStructure();

    window.addEventListener('DOMContentLoaded', () => {
      restoreTwoCardCustomerStructure();
      setTimeout(pinRoleSwitcherNextToModeButtons, 100);

      const origRenderOffice = window.renderOfficeConsole;
      if (typeof origRenderOffice === 'function') {
        window.renderOfficeConsole = function() {
          restoreTwoCardCustomerStructure();
          return origRenderOffice.apply(this, arguments);
        };
      }
    });
  })();
</script>`;

html = html.replace(/<\/body>/i, uiFixScript + '\n</body>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Restored 2-card Customers layout and pinned Role Switcher to left header!');