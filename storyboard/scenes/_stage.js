// Storyboard helper: ?shot=N shows only that shot. No motion; stills only.
const shot = new URLSearchParams(location.search).get('shot') || '1'
for (const s of document.querySelectorAll('.shot')) s.hidden = s.dataset.shot !== shot
