// Video rows: the videos in one row play in sync, only while the row is on screen.
// The first video leads; when it ends, the whole row restarts together.
// Clicking any video in a row pauses or resumes the whole row.
document.addEventListener('DOMContentLoaded', function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('.video-row'));

  rows.forEach(function (row) {
    var vids = Array.prototype.slice.call(row.querySelectorAll('video'));
    if (!vids.length) return;
    var lead = vids[0];
    row._userPaused = false;

    function playAll() {
      vids.forEach(function (v) {
        if (v.preload !== 'auto') v.preload = 'auto';
        var p = v.play();
        if (p && p.catch) p.catch(function () { row.classList.add('needs-click'); });
      });
    }
    function pauseAll() { vids.forEach(function (v) { v.pause(); }); }
    row._play = playAll;
    row._pause = pauseAll;

    // Keep the other videos close to the first one (one frame at 6 fps is ~0.17 s).
    lead.addEventListener('timeupdate', function () {
      vids.forEach(function (v) {
        if (v !== lead && !v.ended && Math.abs(v.currentTime - lead.currentTime) > 0.25) v.currentTime = lead.currentTime;
      });
    });
    // Restart the whole row when the lead finishes.
    lead.addEventListener('ended', function () {
      vids.forEach(function (v) { v.currentTime = 0; });
      if (!row._userPaused) playAll();
    });

    vids.forEach(function (v) {
      v.addEventListener('click', function () {
        row.classList.remove('needs-click');
        if (lead.paused) { row._userPaused = false; playAll(); }
        else { row._userPaused = true; pauseAll(); }
      });
    });
  });

  if (!('IntersectionObserver' in window)) {
    rows.forEach(function (r) { if (r._play) r._play(); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var row = e.target;
      if (!row._play) return;
      if (e.isIntersecting && !row._userPaused) row._play();
      else if (!e.isIntersecting) row._pause();
    });
  }, { threshold: 0.2 });
  rows.forEach(function (r) { io.observe(r); });
});
