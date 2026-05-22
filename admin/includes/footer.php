    </main>
  </div><!-- .admin-main -->
</div><!-- .admin-wrap -->

<script>
const burgerBtn  = document.getElementById('burgerBtn');
const sidebar    = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
if (burgerBtn && sidebar) {
  burgerBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  sidebarClose?.addEventListener('click', () => sidebar.classList.remove('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== burgerBtn) {
      sidebar.classList.remove('open');
    }
  });
}
</script>
</body>
</html>
