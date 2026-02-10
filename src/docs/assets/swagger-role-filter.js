// Redesigned Role Switcher - Buttons
window.onload = function () {
    const checkUi = setInterval(() => {
        if (window.ui && window.ui.specSelectors && window.ui.specSelectors.isOAS3()) {
            clearInterval(checkUi);
            initRoleFilter();
        }
    }, 100);
};

function initRoleFilter() {
    const roles = ['ALL', 'ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT'];
    let currentRole = 'ALL';

    // Create Container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'role-filter-container';
    filterContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.1); flex-wrap: wrap; gap: 8px;';

    const label = document.createElement('span');
    label.innerText = 'Switch Role Context: ';
    label.style.marginRight = '10px';
    label.style.fontWeight = 'bold';
    label.style.color = '#333';
    filterContainer.appendChild(label);

    roles.forEach(role => {
        const btn = document.createElement('button');
        btn.innerText = role === 'ALL' ? 'Show All' : role;
        btn.className = 'role-btn';
        btn.setAttribute('data-role', role);

        // Base Button Style
        btn.style.cssText = `
            padding: 6px 14px;
            border: 1px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s ease;
        `;

        if (role === 'ALL') {
            btn.style.background = '#667eea';
            btn.style.color = 'white';
        }

        btn.onclick = () => {
            // Update Active State
            document.querySelectorAll('.role-btn').forEach(b => {
                b.style.background = 'white';
                b.style.color = '#667eea';
            });
            btn.style.background = '#667eea';
            btn.style.color = 'white';

            filterOperations(role);
        };

        filterContainer.appendChild(btn);
    });

    // Insert below the top bar
    const topbar = document.querySelector('.swagger-ui .topbar');
    if (topbar) {
        topbar.parentNode.insertBefore(filterContainer, topbar.nextSibling);
    }
}

function filterOperations(role) {
    const operations = document.querySelectorAll('.opblock');
    const spec = window.ui.specSelectors.specJson().toJS();

    operations.forEach(op => {
        // Reset Style
        op.style.display = 'block'; // Use display none instead of opacity for cleaner look? 
        // Let's stick to opacity/grayscale per user request context but users usually prefer hiding irrelevant stuff.
        // User asked "others become disable".

        op.style.opacity = '1';
        op.style.pointerEvents = 'auto';
        op.style.filter = 'none';

        const tryOutButton = op.querySelector('.try-out__btn');
        if (tryOutButton) tryOutButton.style.display = 'block';

        if (role === 'ALL') return;

        // Extract Method and Path
        const method = op.className.split(' ').find(c => c.startsWith('opblock-') && c !== 'opblock-control' && c !== 'opblock-summary').replace('opblock-', '').toLowerCase();
        const summaryPathEl = op.querySelector('.opblock-summary-path');
        if (!summaryPathEl) return;

        const pathText = summaryPathEl.getAttribute('data-path');

        // Lookup in Spec
        const pathItem = spec.paths[pathText];
        if (pathItem && pathItem[method]) {
            const operationSpec = pathItem[method];
            const allowedRoles = operationSpec['x-roles'] || [];

            if (!allowedRoles.includes(role)) {
                // Disable visuals
                op.style.opacity = '0.3';
                op.style.pointerEvents = 'none';
                op.style.filter = 'grayscale(100%)';
                if (tryOutButton) tryOutButton.style.display = 'none';
            }
        }
    });
}
