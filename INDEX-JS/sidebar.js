// Load the supplied shared sidebar before Wrapper.js binds its controls.
// Keep the existing sidebar as a fallback if the partial cannot be loaded.
window.schedulerSidebarReady = (async function () {
    const scriptUrl = document.currentScript.src;
    try {
        const response = await fetch(new URL('../partials/sidebar.html', scriptUrl));
        if (!response.ok) throw new Error('Sidebar request failed: ' + response.status);
        const template = document.createElement('template');
        template.innerHTML = await response.text();
        const sidebar = template.content.querySelector('#sidebar');
        const overlay = template.content.querySelector('#overlay');
        if (!sidebar || !overlay) throw new Error('Sidebar partial is incomplete');
        const currentSidebar = document.getElementById('sidebar');
        const currentOverlay = document.getElementById('overlay');
        if (!currentSidebar || !currentOverlay) throw new Error('Sidebar containers are missing');
        const logo = sidebar.querySelector('#sidebarLogo');
        if (logo) logo.src = new URL('../ASSETS/logo-Black&White.png', scriptUrl).href;
        if (localStorage.getItem('scheduler-demo:sidebarCollapsed') === 'true') sidebar.classList.add('collapsed');
        currentSidebar.replaceWith(sidebar);
        currentOverlay.replaceWith(overlay);
        window.bindSchedulerActions(sidebar);
    } catch (error) {
        console.error('Could not load the shared sidebar; using the existing sidebar.', error);
    }
})();
