
    function scaleTable() {
      const wrapper = document.querySelector('.table-wrapper');
      if (!wrapper) return;
      const table = wrapper.querySelector('table');
      const scale = Math.min(wrapper.clientWidth / table.scrollWidth, 1);
      table.style.transform = `scale(${scale})`;
    }

    window.addEventListener('load', scaleTable);
    window.addEventListener('resize', scaleTable);
  